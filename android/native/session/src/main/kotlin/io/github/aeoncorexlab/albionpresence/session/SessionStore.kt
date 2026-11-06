package io.github.aeoncorexlab.albionpresence.session

/** What is saved so a session can be recovered after the process is recreated. */
data class PersistedSession(
    val session: Session,
    /** Identifies the boot the elapsed-time values belong to. */
    val bootId: String,
    /** Only [SessionPhase.ACTIVE] or [SessionPhase.GRACE]. */
    val phase: SessionPhase,
    /** Grace deadline on the elapsed clock, or -1 when not in grace. */
    val graceDeadlineElapsedMs: Long,
)

/**
 * Local persistence for the single current session. Implementations live in the
 * Android layer (SharedPreferences or DataStore). Data never leaves the device.
 */
interface SessionStore {
    fun load(): PersistedSession?
    fun save(value: PersistedSession)
    fun clear()
}

/**
 * Identifies the current boot. `SystemClock.elapsedRealtime()` restarts from zero
 * after a reboot, so values saved before a reboot must not be reused after it.
 * The Android implementation is not written yet; its source must be verified
 * against the platform docs when it is.
 */
fun interface BootIdProvider {
    fun current(): String
}
