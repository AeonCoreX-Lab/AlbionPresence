package io.github.aeoncorexlab.albionpresence.session

import io.github.aeoncorexlab.albionpresence.monitoring.ActivityEvent
import io.github.aeoncorexlab.albionpresence.monitoring.ActivityEventKind
import io.github.aeoncorexlab.albionpresence.monitoring.ForegroundTracker
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Scripted end-to-end flows through the real [ForegroundTracker] and
 * [SessionEngine] with a fake clock. This exercises the pure logic only. It
 * does not replace testing UsageStatsManager, screen lock, or a reboot on a real
 * device.
 */
class ScenarioTest {
    private val game = "example.game"

    /** Wires tracker -> engine the way the Android monitor will. */
    private class Harness(game: String, graceMs: Long = 30_000) {
        var elapsed = 100_000L
        var wall = 1_700_000_000_000L
        val store = FakeStore()
        val boot = FakeBoot("boot-1")
        val tracker = ForegroundTracker(game)
        val engine = newEngine(store = store, boot = boot, graceMs = graceMs)
        val log = mutableListOf<SessionEvent>()

        fun advance(ms: Long) {
            elapsed += ms
            wall += ms
            // The scheduled wake-up fires on time in these scenarios.
            engine.nextDeadlineElapsedMs()?.let { if (elapsed >= it) log += engine.onTick(elapsed) }
        }

        fun send(kind: ActivityEventKind, cls: String = "Main", pkg: String = "example.game") {
            val change = tracker.accept(ActivityEvent(pkg, cls, kind, wall)) ?: return
            log += if (change.foreground) engine.onForeground(elapsed, wall) else engine.onBackground(elapsed)
        }

        fun screenOff() {
            val change = tracker.forceBackground(wall) ?: return
            if (!change.foreground) log += engine.onBackground(elapsed)
        }
    }

    @Test
    fun launchPlayAndLeaveForLongerThanGraceEndsTheSession() {
        val h = Harness(game)
        h.send(ActivityEventKind.RESUMED)
        h.advance(120_000)
        assertEquals(120_000, h.engine.snapshot(h.elapsed).elapsedMs)

        h.send(ActivityEventKind.PAUSED)
        h.advance(29_999)
        assertEquals(SessionPhase.GRACE, h.engine.snapshot(h.elapsed).phase)
        h.advance(1)

        assertEquals(SessionPhase.INACTIVE, h.engine.snapshot(h.elapsed).phase)
        assertEquals(
            listOf("Started", "GraceStarted", "Ended"),
            h.log.map { it::class.simpleName },
        )
        assertEquals(EndReason.GRACE_EXPIRED, (h.log.last() as SessionEvent.Ended).reason)
        assertNull(h.store.value)
    }

    @Test
    fun checkingAnotherAppBrieflyKeepsTheSameSessionAndTimer() {
        val h = Harness(game)
        h.send(ActivityEventKind.RESUMED)
        h.advance(60_000)
        val startedWall = h.engine.snapshot(h.elapsed).session!!.startedAtWallMs

        h.send(ActivityEventKind.PAUSED)
        h.send(ActivityEventKind.RESUMED, pkg = "com.chat.app") // other app: ignored
        h.advance(10_000)
        h.send(ActivityEventKind.RESUMED)
        h.advance(5_000)

        val snap = h.engine.snapshot(h.elapsed)
        assertEquals(SessionPhase.ACTIVE, snap.phase)
        assertEquals("s1", snap.session?.id)
        assertEquals(startedWall, snap.session?.startedAtWallMs)
        assertEquals(75_000, snap.elapsedMs)
        assertEquals(1, h.log.count { it is SessionEvent.Started })
        assertTrue(h.log.any { it is SessionEvent.Resumed })
    }

    @Test
    fun movingBetweenTheGamesOwnScreensDoesNotTouchTheSession() {
        val h = Harness(game)
        h.send(ActivityEventKind.RESUMED, "Login")
        h.send(ActivityEventKind.RESUMED, "World")
        h.send(ActivityEventKind.PAUSED, "Login")
        h.advance(10_000)

        assertEquals(listOf("Started"), h.log.map { it::class.simpleName })
        assertEquals(SessionPhase.ACTIVE, h.engine.snapshot(h.elapsed).phase)
    }

    @Test
    fun screenLockStartsGraceAndALongLockEndsTheSession() {
        val h = Harness(game)
        h.send(ActivityEventKind.RESUMED)
        h.advance(30_000)

        h.screenOff() // no PAUSED event needed
        assertEquals(SessionPhase.GRACE, h.engine.snapshot(h.elapsed).phase)
        h.advance(60_000)

        assertEquals(SessionPhase.INACTIVE, h.engine.snapshot(h.elapsed).phase)
    }

    @Test
    fun aShortScreenLockKeepsTheSameSession() {
        val h = Harness(game)
        h.send(ActivityEventKind.RESUMED)
        h.advance(30_000)
        h.screenOff()
        h.advance(5_000)
        h.send(ActivityEventKind.RESUMED) // unlocked, game resumes

        assertEquals("s1", h.engine.snapshot(h.elapsed).session?.id)
        assertEquals(35_000, h.engine.snapshot(h.elapsed).elapsedMs)
    }

    @Test
    fun aKilledGameLooksLikeLeavingTheForegroundAndEndsAfterGrace() {
        val h = Harness(game)
        h.send(ActivityEventKind.RESUMED)
        h.advance(10_000)
        h.send(ActivityEventKind.PAUSED)
        h.send(ActivityEventKind.STOPPED) // then the process dies; nothing else is reported
        h.advance(31_000)

        assertEquals(SessionPhase.INACTIVE, h.engine.snapshot(h.elapsed).phase)
    }

    @Test
    fun permissionRevokedWhilePlayingEndsTheSessionImmediately() {
        val h = Harness(game)
        h.send(ActivityEventKind.RESUMED)
        h.advance(10_000)

        h.log += h.engine.stop(EndReason.PERMISSION_REVOKED)

        assertEquals(EndReason.PERMISSION_REVOKED, (h.log.last() as SessionEvent.Ended).reason)
        assertNull(h.store.value)
    }

    @Test
    fun processRecreationWhilePlayingResumesTheSameSession() {
        val h = Harness(game)
        h.send(ActivityEventKind.RESUMED)
        h.advance(90_000)
        val original = h.engine.snapshot(h.elapsed).session!!

        // The process dies. A new engine reads the same store on the same boot.
        h.advance(20_000)
        val revived = newEngine(store = h.store, boot = h.boot)
        val events = revived.recover(h.elapsed, RecoveryObservation(true, true))

        assertTrue((events.single() as SessionEvent.Resumed).fromRecovery)
        val snap = revived.snapshot(h.elapsed)
        assertEquals(original, snap.session)
        assertEquals(110_000, snap.elapsedMs)
    }

    @Test
    fun deviceRestartWhilePlayingDoesNotInventElapsedTime() {
        val h = Harness(game)
        h.send(ActivityEventKind.RESUMED)
        h.advance(90_000)

        // Reboot: new boot id, elapsed clock back near zero, game launched again later.
        val afterReboot = newEngine(store = h.store, boot = FakeBoot("boot-2"))
        val recovery = afterReboot.recover(45_000, RecoveryObservation(true, true))
        assertEquals(EndReason.UNVERIFIABLE_RECOVERY, (recovery.single() as SessionEvent.Ended).reason)
        assertEquals(0, afterReboot.snapshot(45_000).elapsedMs)

        val started = afterReboot.onForeground(nowElapsedMs = 50_000, nowWallMs = h.wall + 3_600_000)
        assertEquals(0, afterReboot.snapshot(50_000).elapsedMs)
        assertEquals(h.wall + 3_600_000, (started.single() as SessionEvent.Started).session.startedAtWallMs)
    }
}
