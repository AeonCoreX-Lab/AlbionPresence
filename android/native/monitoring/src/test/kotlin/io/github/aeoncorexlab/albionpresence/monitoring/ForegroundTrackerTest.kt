package io.github.aeoncorexlab.albionpresence.monitoring

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test

class ForegroundTrackerTest {
    private val game = "example.game"
    private val tracker = ForegroundTracker(game)

    private fun ev(kind: ActivityEventKind, cls: String? = "Main", pkg: String = game, t: Long = 0) =
        ActivityEvent(pkg, cls, kind, t)

    @Test
    fun resumedMakesTheGameForegroundAndPausedMakesItBackground() {
        assertEquals(ForegroundChange(true, 10), tracker.accept(ev(ActivityEventKind.RESUMED, t = 10)))
        assertTrue(tracker.isForeground)
        assertEquals(ForegroundChange(false, 20), tracker.accept(ev(ActivityEventKind.PAUSED, t = 20)))
        assertFalse(tracker.isForeground)
    }

    @Test
    fun otherPackagesAreIgnoredCompletely() {
        assertNull(tracker.accept(ev(ActivityEventKind.RESUMED, pkg = "com.other.app")))
        assertFalse(tracker.isForeground)

        tracker.accept(ev(ActivityEventKind.RESUMED))
        assertNull(tracker.accept(ev(ActivityEventKind.PAUSED, pkg = "com.other.app")))
        assertTrue(tracker.isForeground)
    }

    @Test
    fun switchingBetweenTheGamesOwnActivitiesIsNotLeavingTheApp() {
        assertEquals(ForegroundChange(true, 1), tracker.accept(ev(ActivityEventKind.RESUMED, "A", t = 1)))
        // B resumes while A is still resumed, or A pauses first: either order must hold.
        assertNull(tracker.accept(ev(ActivityEventKind.RESUMED, "B", t = 2)))
        assertNull(tracker.accept(ev(ActivityEventKind.PAUSED, "A", t = 2)))
        assertTrue(tracker.isForeground)
        assertEquals(ForegroundChange(false, 3), tracker.accept(ev(ActivityEventKind.PAUSED, "B", t = 3)))

        assertNull(tracker.accept(ev(ActivityEventKind.PAUSED, "B", t = 4)))
        assertNull(tracker.accept(ev(ActivityEventKind.PAUSED, "A", t = 4)))
    }

    @Test
    fun pausedBeforeResumedOnTheNextScreenStillEndsUpForeground() {
        tracker.accept(ev(ActivityEventKind.RESUMED, "A", t = 1))
        assertEquals(ForegroundChange(false, 2), tracker.accept(ev(ActivityEventKind.PAUSED, "A", t = 2)))
        assertEquals(ForegroundChange(true, 2), tracker.accept(ev(ActivityEventKind.RESUMED, "B", t = 2)))
    }

    @Test
    fun stoppedAlsoRemovesTheActivity() {
        tracker.accept(ev(ActivityEventKind.RESUMED))
        assertEquals(ForegroundChange(false, 5), tracker.accept(ev(ActivityEventKind.STOPPED, t = 5)))
    }

    @Test
    fun duplicateOrUnmatchedEventsDoNotChangeState() {
        assertNull(tracker.accept(ev(ActivityEventKind.PAUSED)))
        tracker.accept(ev(ActivityEventKind.RESUMED))
        assertNull(tracker.accept(ev(ActivityEventKind.RESUMED)))
        assertTrue(tracker.isForeground)
    }

    @Test
    fun activitiesWithoutAClassNameAreTracked() {
        assertEquals(ForegroundChange(true, 1), tracker.accept(ev(ActivityEventKind.RESUMED, cls = null, t = 1)))
        assertEquals(ForegroundChange(false, 2), tracker.accept(ev(ActivityEventKind.PAUSED, cls = null, t = 2)))
    }

    @Test
    fun forceBackgroundCoversScreenOffEvenWhenNoPauseArrives() {
        tracker.accept(ev(ActivityEventKind.RESUMED, "A"))
        tracker.accept(ev(ActivityEventKind.RESUMED, "B"))

        assertEquals(ForegroundChange(false, 9), tracker.forceBackground(9))
        assertFalse(tracker.isForeground)
        assertNull(tracker.forceBackground(10))
    }

    @Test
    fun rebuildReplaysEventsAndIgnoresOtherPackages() {
        val events = listOf(
            ev(ActivityEventKind.RESUMED, "A", t = 1),
            ev(ActivityEventKind.RESUMED, "X", pkg = "com.other.app", t = 2),
            ev(ActivityEventKind.PAUSED, "A", t = 3),
            ev(ActivityEventKind.RESUMED, "B", t = 4),
        )
        assertTrue(tracker.rebuild(events))
        assertEquals(ForegroundChange(false, 5), tracker.accept(ev(ActivityEventKind.PAUSED, "B", t = 5)))

        assertFalse(tracker.rebuild(events.take(3)))
    }

    @Test
    fun changingTheTargetForgetsPreviousState() {
        tracker.accept(ev(ActivityEventKind.RESUMED))
        tracker.changeTarget("example.other")
        assertFalse(tracker.isForeground)
        assertNull(tracker.accept(ev(ActivityEventKind.RESUMED)))
        assertEquals("example.other", tracker.targetPackage)
    }

    @Test
    fun blankPackagesAreRejected() {
        for (bad in listOf("", "   ")) {
            try {
                ForegroundTracker(bad)
                fail("expected IllegalArgumentException")
            } catch (expected: IllegalArgumentException) {
                // ok
            }
        }
        try {
            tracker.changeTarget(" ")
            fail("expected IllegalArgumentException")
        } catch (expected: IllegalArgumentException) {
            // ok
        }
        assertEquals(game, tracker.targetPackage)
    }
}
