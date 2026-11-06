package io.github.aeoncorexlab.albionpresence.session

/**
 * What the monitor could establish about the game app when the process was
 * recreated.
 *
 * [continuouslyForegroundSinceLastSave] must be `true` only if the monitor can
 * show, for example from `UsageEvents` history, that the game app did not leave
 * the foreground since the session was last saved. When unsure, pass `false`.
 */
data class RecoveryObservation(
    val gameForegroundNow: Boolean,
    val continuouslyForegroundSinceLastSave: Boolean,
)

/**
 * Deterministic session state machine.
 *
 * It owns no threads, timers or Android types. Callers pass the current time on
 * every call (`SystemClock.elapsedRealtime()` and `System.currentTimeMillis()`
 * in production), and schedule one wake-up at [nextDeadlineElapsedMs] that calls
 * [onTick]. Because time is an input, every behaviour below is unit-testable.
 *
 * Duration maths use only the elapsed clock. The wall clock is recorded once, at
 * session start, for Discord's start timestamp.
 *
 * Methods are synchronised, but callers should still serialise events on one
 * thread so they are applied in the order they happened.
 */
class SessionEngine(
    private val store: SessionStore,
    private val bootId: BootIdProvider,
    private val newSessionId: () -> String,
    graceMs: Long = DEFAULT_GRACE_MS,
    private val onStoreError: (Exception) -> Unit = {},
) {
    private sealed interface State {
        object Inactive : State
        data class Active(val session: Session) : State
        data class Grace(val session: Session, val deadlineElapsedMs: Long) : State
    }

    private var state: State = State.Inactive

    var graceMs: Long = validateGrace(graceMs)
        private set

    /** Changes the grace period for future background transitions. */
    @Synchronized
    fun setGraceMs(value: Long) {
        graceMs = validateGrace(value)
    }

    /** The game app is in the foreground. Duplicate calls are ignored. */
    @Synchronized
    fun onForeground(nowElapsedMs: Long, nowWallMs: Long): List<SessionEvent> {
        val events = mutableListOf<SessionEvent>()
        expireIfDue(nowElapsedMs, events)
        when (val current = state) {
            State.Inactive -> {
                val session = Session(newSessionId(), nowWallMs, nowElapsedMs)
                state = State.Active(session)
                persist(session, SessionPhase.ACTIVE, NO_DEADLINE)
                events += SessionEvent.Started(session)
            }
            is State.Active -> Unit
            is State.Grace -> {
                state = State.Active(current.session)
                persist(current.session, SessionPhase.ACTIVE, NO_DEADLINE)
                events += SessionEvent.Resumed(current.session, fromRecovery = false)
            }
        }
        return events
    }

    /** The game app left the foreground (another app, screen off, or the game closed). */
    @Synchronized
    fun onBackground(nowElapsedMs: Long): List<SessionEvent> {
        val events = mutableListOf<SessionEvent>()
        expireIfDue(nowElapsedMs, events)
        val current = state
        if (current is State.Active) {
            if (graceMs == 0L) {
                events += end(current.session, EndReason.GRACE_EXPIRED)
            } else {
                val deadline = nowElapsedMs + graceMs
                state = State.Grace(current.session, deadline)
                persist(current.session, SessionPhase.GRACE, deadline)
                events += SessionEvent.GraceStarted(current.session, deadline)
            }
        }
        return events
    }

    /** Wake-up at [nextDeadlineElapsedMs]. Ends the session if the grace period is over. */
    @Synchronized
    fun onTick(nowElapsedMs: Long): List<SessionEvent> {
        val events = mutableListOf<SessionEvent>()
        expireIfDue(nowElapsedMs, events)
        return events
    }

    /**
     * Ends the session immediately because foreground state can no longer be known
     * (detection switched off, permission revoked).
     */
    @Synchronized
    fun stop(reason: EndReason): List<SessionEvent> {
        val session = currentSession() ?: return emptyList()
        return listOf(end(session, reason))
    }

    /**
     * Restores or closes a persisted session after the process was recreated. Call
     * it once, before any other event. It does nothing if a session already exists.
     *
     * A session is restored only if it can be proven continuous. Otherwise it is
     * closed, never guessed, so elapsed time is not invented.
     */
    @Synchronized
    fun recover(nowElapsedMs: Long, observation: RecoveryObservation): List<SessionEvent> {
        if (state != State.Inactive) return emptyList()
        val persisted = load() ?: return emptyList()
        val session = persisted.session

        val sameBoot = persisted.bootId == bootId.current()
        if (!sameBoot || nowElapsedMs < session.startedAtElapsedMs) {
            return listOf(end(session, EndReason.UNVERIFIABLE_RECOVERY))
        }

        return when (persisted.phase) {
            SessionPhase.ACTIVE ->
                if (observation.gameForegroundNow && observation.continuouslyForegroundSinceLastSave) {
                    state = State.Active(session)
                    listOf(SessionEvent.Resumed(session, fromRecovery = true))
                } else {
                    listOf(end(session, EndReason.UNVERIFIABLE_RECOVERY))
                }

            SessionPhase.GRACE -> {
                val deadline = persisted.graceDeadlineElapsedMs
                when {
                    nowElapsedMs >= deadline -> listOf(end(session, EndReason.GRACE_EXPIRED))
                    observation.gameForegroundNow -> {
                        state = State.Active(session)
                        persist(session, SessionPhase.ACTIVE, NO_DEADLINE)
                        listOf(SessionEvent.Resumed(session, fromRecovery = true))
                    }
                    else -> {
                        state = State.Grace(session, deadline)
                        listOf(SessionEvent.GraceStarted(session, deadline))
                    }
                }
            }

            SessionPhase.INACTIVE -> {
                clear()
                emptyList()
            }
        }
    }

    /** Elapsed-clock time at which the grace period ends, or `null` if no wake-up is needed. */
    @Synchronized
    fun nextDeadlineElapsedMs(): Long? = (state as? State.Grace)?.deadlineElapsedMs

    /** Current view for the UI. Elapsed time is derived from the elapsed clock and never negative. */
    @Synchronized
    fun snapshot(nowElapsedMs: Long): SessionSnapshot {
        val current = state
        val session = currentSession()
        val phase = when (current) {
            State.Inactive -> SessionPhase.INACTIVE
            is State.Active -> SessionPhase.ACTIVE
            is State.Grace -> SessionPhase.GRACE
        }
        val elapsed = session?.let { (nowElapsedMs - it.startedAtElapsedMs).coerceAtLeast(0L) } ?: 0L
        return SessionSnapshot(phase, session, elapsed)
    }

    private fun currentSession(): Session? = when (val current = state) {
        State.Inactive -> null
        is State.Active -> current.session
        is State.Grace -> current.session
    }

    private fun expireIfDue(nowElapsedMs: Long, events: MutableList<SessionEvent>) {
        val current = state
        if (current is State.Grace && nowElapsedMs >= current.deadlineElapsedMs) {
            events += end(current.session, EndReason.GRACE_EXPIRED)
        }
    }

    private fun end(session: Session, reason: EndReason): SessionEvent {
        state = State.Inactive
        clear()
        return SessionEvent.Ended(session, reason)
    }

    private fun persist(session: Session, phase: SessionPhase, deadline: Long) {
        try {
            store.save(PersistedSession(session, bootId.current(), phase, deadline))
        } catch (e: Exception) {
            onStoreError(e)
        }
    }

    private fun load(): PersistedSession? = try {
        store.load()
    } catch (e: Exception) {
        onStoreError(e)
        null
    }

    private fun clear() {
        try {
            store.clear()
        } catch (e: Exception) {
            onStoreError(e)
        }
    }

    companion object {
        const val DEFAULT_GRACE_MS: Long = 30_000L
        const val MAX_GRACE_MS: Long = 10 * 60_000L
        private const val NO_DEADLINE: Long = -1L

        private fun validateGrace(value: Long): Long {
            require(value in 0..MAX_GRACE_MS) { "graceMs must be in 0..$MAX_GRACE_MS, was $value" }
            return value
        }
    }
}
