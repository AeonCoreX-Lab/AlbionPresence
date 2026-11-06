package io.github.aeoncorexlab.albionpresence.monitoring

/** Activity lifecycle events relevant to foreground tracking. */
enum class ActivityEventKind { RESUMED, PAUSED, STOPPED }

/**
 * One activity event, already converted from the platform's `UsageEvents.Event`
 * by the Android layer. Event types the tracker does not need are dropped there.
 */
data class ActivityEvent(
    val packageName: String,
    val className: String?,
    val kind: ActivityEventKind,
    val timestampMs: Long,
)

data class ForegroundChange(val foreground: Boolean, val timestampMs: Long)

/**
 * Decides whether the configured game app is in the foreground from a stream of
 * activity events.
 *
 * Privacy: events for any other package are discarded on arrival. Nothing about
 * them is stored, counted or logged.
 *
 * The game is foreground while at least one of its activities is resumed.
 * Tracking each activity separately keeps switching between the game's own
 * screens (one pauses as the next resumes) from looking like leaving the app.
 */
class ForegroundTracker(targetPackage: String) {
    var targetPackage: String = requirePackage(targetPackage)
        private set

    private val resumed = HashSet<String>()

    val isForeground: Boolean
        @Synchronized get() = resumed.isNotEmpty()

    /** Returns a [ForegroundChange] only when the foreground state flipped. */
    @Synchronized
    fun accept(event: ActivityEvent): ForegroundChange? {
        if (event.packageName != targetPackage) return null
        val before = resumed.isNotEmpty()
        val key = event.className ?: NO_CLASS
        when (event.kind) {
            ActivityEventKind.RESUMED -> resumed.add(key)
            ActivityEventKind.PAUSED, ActivityEventKind.STOPPED -> resumed.remove(key)
        }
        return changeFrom(before, event.timestampMs)
    }

    /**
     * Treats the game as backgrounded regardless of events, for example when the
     * screen turns off. Returns the change, or `null` if it was already background.
     */
    @Synchronized
    fun forceBackground(timestampMs: Long): ForegroundChange? {
        val before = resumed.isNotEmpty()
        resumed.clear()
        return changeFrom(before, timestampMs)
    }

    /** Discards all state and replays [events] in order (for example after a restart). */
    @Synchronized
    fun rebuild(events: List<ActivityEvent>): Boolean {
        resumed.clear()
        for (event in events) {
            if (event.packageName != targetPackage) continue
            val key = event.className ?: NO_CLASS
            when (event.kind) {
                ActivityEventKind.RESUMED -> resumed.add(key)
                ActivityEventKind.PAUSED, ActivityEventKind.STOPPED -> resumed.remove(key)
            }
        }
        return resumed.isNotEmpty()
    }

    /** Switches the monitored package and forgets all state. */
    @Synchronized
    fun changeTarget(newPackage: String) {
        targetPackage = requirePackage(newPackage)
        resumed.clear()
    }

    private fun changeFrom(before: Boolean, timestampMs: Long): ForegroundChange? {
        val after = resumed.isNotEmpty()
        return if (after != before) ForegroundChange(after, timestampMs) else null
    }

    private companion object {
        const val NO_CLASS = ""

        fun requirePackage(value: String): String {
            require(value.isNotBlank()) { "targetPackage must not be blank" }
            return value
        }
    }
}
