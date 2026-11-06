package io.github.aeoncorexlab.albionpresence.session

/**
 * Why a session ended.
 *
 * Android gives no direct signal that a game process was killed, so "the game
 * was terminated" looks exactly like "the game left the foreground and did not
 * come back". Both end with [GRACE_EXPIRED].
 */
enum class EndReason {
    /** The game left the foreground and did not return within the grace period. */
    GRACE_EXPIRED,

    /** Detection was switched off. */
    MONITORING_STOPPED,

    /** Usage Access was revoked, so foreground state can no longer be known. */
    PERMISSION_REVOKED,

    /**
     * After a restart (process or device) continuity could not be proven, so the
     * session was closed instead of guessed. Elapsed time is never invented.
     */
    UNVERIFIABLE_RECOVERY,
}

/**
 * One continuous game-app session.
 *
 * [startedAtWallMs] is the wall-clock start (epoch ms), used for Discord's start
 * timestamp. [startedAtElapsedMs] is the `SystemClock.elapsedRealtime()` value at
 * the start and is the basis for all duration maths within one boot.
 */
data class Session(
    val id: String,
    val startedAtWallMs: Long,
    val startedAtElapsedMs: Long,
)

enum class SessionPhase {
    INACTIVE,

    /** The game app is in the foreground. */
    ACTIVE,

    /** The game app left the foreground; the same session is held open until the grace deadline. */
    GRACE,
}

/** What the engine tells its listeners (UI bridge, Discord layer). */
sealed interface SessionEvent {
    val session: Session

    /** A new session began: publish presence with [Session.startedAtWallMs]. */
    data class Started(override val session: Session) : SessionEvent

    /** The same session continues (returned within grace, or restored after a restart). */
    data class Resumed(override val session: Session, val fromRecovery: Boolean) : SessionEvent

    /** The game left the foreground. The session stays open until [deadlineElapsedMs]. */
    data class GraceStarted(override val session: Session, val deadlineElapsedMs: Long) : SessionEvent

    /** The session is over: clear presence. */
    data class Ended(override val session: Session, val reason: EndReason) : SessionEvent
}

/** Read-only view for the UI. [elapsedMs] is 0 when there is no session. */
data class SessionSnapshot(
    val phase: SessionPhase,
    val session: Session?,
    val elapsedMs: Long,
)
