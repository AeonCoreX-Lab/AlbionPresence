package io.github.aeoncorexlab.albionpresence.session

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test

class SessionEngineTest {

    // ---- creation -------------------------------------------------------------

    @Test
    fun foregroundStartsASessionAndPersistsIt() {
        val store = FakeStore()
        val engine = newEngine(store = store)

        val events = engine.onForeground(nowElapsedMs = 1_000, nowWallMs = 1_700_000_000_000)

        val session = Session("s1", 1_700_000_000_000, 1_000)
        assertEquals(listOf<SessionEvent>(SessionEvent.Started(session)), events)
        assertEquals(SessionPhase.ACTIVE, engine.snapshot(1_000).phase)
        assertEquals(PersistedSession(session, "boot-1", SessionPhase.ACTIVE, -1), store.value)
    }

    @Test
    fun duplicateForegroundDoesNotCreateASecondSession() {
        val store = FakeStore()
        val engine = newEngine(store = store)
        engine.onForeground(1_000, 5_000)
        val savesAfterStart = store.saveCount

        val again = engine.onForeground(2_000, 6_000)

        assertTrue(again.isEmpty())
        assertEquals("s1", engine.snapshot(2_000).session?.id)
        assertEquals(savesAfterStart, store.saveCount)
    }

    @Test
    fun backgroundWithoutASessionDoesNothing() {
        val engine = newEngine()
        assertTrue(engine.onBackground(1_000).isEmpty())
        assertEquals(SessionPhase.INACTIVE, engine.snapshot(1_000).phase)
        assertNull(engine.nextDeadlineElapsedMs())
    }

    // ---- elapsed time ---------------------------------------------------------

    @Test
    fun elapsedUsesTheElapsedClockNotTheWallClock() {
        val engine = newEngine()
        engine.onForeground(nowElapsedMs = 10_000, nowWallMs = 1_000_000)

        // 5 s of real time pass. The wall clock is not an input to snapshot() at all,
        // so a user changing the date cannot change the elapsed time.
        assertEquals(5_000, engine.snapshot(15_000).elapsedMs)
        assertEquals(1_000_000L, engine.snapshot(15_000).session?.startedAtWallMs)
    }

    @Test
    fun elapsedIsNeverNegativeAndZeroWithoutASession() {
        val engine = newEngine()
        assertEquals(0, engine.snapshot(99_000).elapsedMs)
        engine.onForeground(10_000, 1)
        assertEquals(0, engine.snapshot(9_000).elapsedMs)
    }

    // ---- grace period ---------------------------------------------------------

    @Test
    fun leavingTheForegroundStartsGraceAndKeepsCounting() {
        val engine = newEngine(graceMs = 30_000)
        engine.onForeground(1_000, 5_000)

        val events = engine.onBackground(11_000)

        val session = Session("s1", 5_000, 1_000)
        assertEquals(listOf<SessionEvent>(SessionEvent.GraceStarted(session, 41_000)), events)
        assertEquals(41_000L, engine.nextDeadlineElapsedMs())
        val snap = engine.snapshot(21_000)
        assertEquals(SessionPhase.GRACE, snap.phase)
        assertEquals(20_000, snap.elapsedMs)
    }

    @Test
    fun returningWithinGraceResumesTheSameSession() {
        val store = FakeStore()
        val engine = newEngine(store = store, graceMs = 30_000)
        engine.onForeground(1_000, 5_000)
        engine.onBackground(11_000)

        val events = engine.onForeground(31_000, 25_000)

        val session = Session("s1", 5_000, 1_000)
        assertEquals(listOf<SessionEvent>(SessionEvent.Resumed(session, fromRecovery = false)), events)
        assertEquals(SessionPhase.ACTIVE, engine.snapshot(31_000).phase)
        assertEquals(30_000, engine.snapshot(31_000).elapsedMs)
        assertNull(engine.nextDeadlineElapsedMs())
        assertEquals(SessionPhase.ACTIVE, store.value?.phase)
    }

    @Test
    fun tickBeforeTheDeadlineKeepsTheSession() {
        val engine = newEngine(graceMs = 30_000)
        engine.onForeground(1_000, 5_000)
        engine.onBackground(11_000)

        assertTrue(engine.onTick(40_999).isEmpty())
        assertEquals(SessionPhase.GRACE, engine.snapshot(40_999).phase)
    }

    @Test
    fun tickAtTheDeadlineEndsTheSessionAndClearsStorage() {
        val store = FakeStore()
        val engine = newEngine(store = store, graceMs = 30_000)
        engine.onForeground(1_000, 5_000)
        engine.onBackground(11_000)

        val events = engine.onTick(41_000)

        assertEquals(
            listOf<SessionEvent>(SessionEvent.Ended(Session("s1", 5_000, 1_000), EndReason.GRACE_EXPIRED)),
            events,
        )
        assertEquals(SessionPhase.INACTIVE, engine.snapshot(41_000).phase)
        assertEquals(0, engine.snapshot(41_000).elapsedMs)
        assertNull(store.value)
        assertNull(engine.nextDeadlineElapsedMs())
    }

    @Test
    fun lateForegroundAfterTheDeadlineEndsTheOldSessionThenStartsANewOne() {
        // The wake-up may be delayed (Doze). A return after the deadline must not
        // silently extend the expired session.
        val engine = newEngine(graceMs = 30_000)
        engine.onForeground(1_000, 5_000)
        engine.onBackground(11_000)

        val events = engine.onForeground(nowElapsedMs = 100_000, nowWallMs = 94_000)

        assertEquals(2, events.size)
        val ended = events[0] as SessionEvent.Ended
        assertEquals("s1", ended.session.id)
        assertEquals(EndReason.GRACE_EXPIRED, ended.reason)
        val started = events[1] as SessionEvent.Started
        assertEquals("s2", started.session.id)
        assertEquals(100_000, started.session.startedAtElapsedMs)
        assertEquals(0, engine.snapshot(100_000).elapsedMs)
    }

    @Test
    fun backgroundWhileAlreadyInGraceDoesNotExtendTheDeadline() {
        val engine = newEngine(graceMs = 30_000)
        engine.onForeground(1_000, 5_000)
        engine.onBackground(11_000)

        assertTrue(engine.onBackground(20_000).isEmpty())
        assertEquals(41_000L, engine.nextDeadlineElapsedMs())
    }

    @Test
    fun zeroGraceEndsImmediately() {
        val engine = newEngine(graceMs = 0)
        engine.onForeground(1_000, 5_000)

        val events = engine.onBackground(2_000)

        assertEquals(1, events.size)
        assertEquals(EndReason.GRACE_EXPIRED, (events[0] as SessionEvent.Ended).reason)
        assertEquals(SessionPhase.INACTIVE, engine.snapshot(2_000).phase)
    }

    @Test
    fun graceChangeAppliesToTheNextBackgroundTransition() {
        val engine = newEngine(graceMs = 30_000)
        engine.onForeground(1_000, 5_000)
        engine.setGraceMs(5_000)
        engine.onBackground(10_000)
        assertEquals(15_000L, engine.nextDeadlineElapsedMs())
    }

    @Test
    fun invalidGraceIsRejected() {
        val engine = newEngine()
        for (bad in listOf(-1L, SessionEngine.MAX_GRACE_MS + 1)) {
            try {
                engine.setGraceMs(bad)
                fail("expected IllegalArgumentException for $bad")
            } catch (expected: IllegalArgumentException) {
                // ok
            }
        }
        assertEquals(SessionEngine.DEFAULT_GRACE_MS, engine.graceMs)
    }

    // ---- stop (permission revoked, detection off) -----------------------------

    @Test
    fun stopEndsAnActiveSessionWithTheGivenReason() {
        val store = FakeStore()
        val engine = newEngine(store = store)
        engine.onForeground(1_000, 5_000)

        val events = engine.stop(EndReason.PERMISSION_REVOKED)

        assertEquals(EndReason.PERMISSION_REVOKED, (events.single() as SessionEvent.Ended).reason)
        assertNull(store.value)
        assertEquals(SessionPhase.INACTIVE, engine.snapshot(2_000).phase)
    }

    @Test
    fun stopEndsASessionThatIsInGraceAndIsIdempotent() {
        val engine = newEngine()
        engine.onForeground(1_000, 5_000)
        engine.onBackground(2_000)

        assertEquals(1, engine.stop(EndReason.MONITORING_STOPPED).size)
        assertTrue(engine.stop(EndReason.MONITORING_STOPPED).isEmpty())
        assertNull(engine.nextDeadlineElapsedMs())
    }

    // ---- recovery -------------------------------------------------------------

    private fun persisted(
        phase: SessionPhase,
        deadline: Long = -1,
        boot: String = "boot-1",
        startedElapsed: Long = 1_000,
    ) = PersistedSession(Session("old", 5_000, startedElapsed), boot, phase, deadline)

    @Test
    fun recoveryWithNothingSavedDoesNothing() {
        val engine = newEngine()
        assertTrue(engine.recover(9_000, RecoveryObservation(true, true)).isEmpty())
        assertEquals(SessionPhase.INACTIVE, engine.snapshot(9_000).phase)
    }

    @Test
    fun recoveryResumesAnActiveSessionOnlyWhenContinuityIsProven() {
        val store = FakeStore().apply { value = persisted(SessionPhase.ACTIVE) }
        val engine = newEngine(store = store)

        val events = engine.recover(61_000, RecoveryObservation(gameForegroundNow = true, continuouslyForegroundSinceLastSave = true))

        val resumed = events.single() as SessionEvent.Resumed
        assertTrue(resumed.fromRecovery)
        assertEquals("old", resumed.session.id)
        assertEquals(SessionPhase.ACTIVE, engine.snapshot(61_000).phase)
        // Elapsed continues from the ORIGINAL start, so nothing is invented or lost.
        assertEquals(60_000, engine.snapshot(61_000).elapsedMs)
        assertEquals(5_000L, engine.snapshot(61_000).session?.startedAtWallMs)
    }

    @Test
    fun recoveryClosesAnActiveSessionWhenContinuityCannotBeProven() {
        val store = FakeStore().apply { value = persisted(SessionPhase.ACTIVE) }
        val engine = newEngine(store = store)

        val events = engine.recover(61_000, RecoveryObservation(gameForegroundNow = true, continuouslyForegroundSinceLastSave = false))

        assertEquals(EndReason.UNVERIFIABLE_RECOVERY, (events.single() as SessionEvent.Ended).reason)
        assertEquals(SessionPhase.INACTIVE, engine.snapshot(61_000).phase)
        assertNull(store.value)
    }

    @Test
    fun recoveryClosesASessionWhenTheGameIsNotForegroundNow() {
        val store = FakeStore().apply { value = persisted(SessionPhase.ACTIVE) }
        val engine = newEngine(store = store)

        val events = engine.recover(61_000, RecoveryObservation(gameForegroundNow = false, continuouslyForegroundSinceLastSave = true))

        assertEquals(EndReason.UNVERIFIABLE_RECOVERY, (events.single() as SessionEvent.Ended).reason)
    }

    @Test
    fun recoveryAfterARebootNeverReusesTheOldElapsedValues() {
        // Elapsed realtime restarts at zero on reboot. Even if the new value looks
        // plausible, a different boot id means the old session cannot be continued.
        val store = FakeStore().apply { value = persisted(SessionPhase.ACTIVE, boot = "boot-1", startedElapsed = 1_000) }
        val engine = newEngine(store = store, boot = FakeBoot("boot-2"))

        val events = engine.recover(500_000, RecoveryObservation(true, true))

        assertEquals(EndReason.UNVERIFIABLE_RECOVERY, (events.single() as SessionEvent.Ended).reason)
        assertEquals(SessionPhase.INACTIVE, engine.snapshot(500_000).phase)
        assertEquals(0, engine.snapshot(500_000).elapsedMs)
        assertNull(store.value)
    }

    @Test
    fun recoveryRejectsASavedStartInTheFutureOfTheElapsedClock() {
        val store = FakeStore().apply { value = persisted(SessionPhase.ACTIVE, startedElapsed = 900_000) }
        val engine = newEngine(store = store)

        val events = engine.recover(1_000, RecoveryObservation(true, true))

        assertEquals(EndReason.UNVERIFIABLE_RECOVERY, (events.single() as SessionEvent.Ended).reason)
    }

    @Test
    fun recoveryEndsAGraceSessionWhoseDeadlinePassedWhileDead() {
        val store = FakeStore().apply { value = persisted(SessionPhase.GRACE, deadline = 40_000) }
        val engine = newEngine(store = store)

        val events = engine.recover(40_000, RecoveryObservation(gameForegroundNow = true, continuouslyForegroundSinceLastSave = false))

        assertEquals(EndReason.GRACE_EXPIRED, (events.single() as SessionEvent.Ended).reason)
        assertNull(store.value)
    }

    @Test
    fun recoveryResumesAGraceSessionWhenTheGameIsBackInTime() {
        val store = FakeStore().apply { value = persisted(SessionPhase.GRACE, deadline = 40_000) }
        val engine = newEngine(store = store)

        val events = engine.recover(30_000, RecoveryObservation(gameForegroundNow = true, continuouslyForegroundSinceLastSave = false))

        assertTrue((events.single() as SessionEvent.Resumed).fromRecovery)
        assertEquals(SessionPhase.ACTIVE, engine.snapshot(30_000).phase)
        assertEquals(SessionPhase.ACTIVE, store.value?.phase)
    }

    @Test
    fun recoveryRestoresGraceWithTheOriginalDeadlineWhenTheGameIsStillAway() {
        val store = FakeStore().apply { value = persisted(SessionPhase.GRACE, deadline = 40_000) }
        val engine = newEngine(store = store)

        val events = engine.recover(30_000, RecoveryObservation(gameForegroundNow = false, continuouslyForegroundSinceLastSave = false))

        assertEquals(40_000L, (events.single() as SessionEvent.GraceStarted).deadlineElapsedMs)
        assertEquals(40_000L, engine.nextDeadlineElapsedMs())
        assertEquals(SessionPhase.GRACE, engine.snapshot(30_000).phase)
    }

    @Test
    fun recoveryIsIgnoredOnceASessionExists() {
        val store = FakeStore()
        val engine = newEngine(store = store)
        engine.onForeground(1_000, 5_000)
        store.value = persisted(SessionPhase.ACTIVE)

        assertTrue(engine.recover(2_000, RecoveryObservation(true, true)).isEmpty())
        assertEquals("s1", engine.snapshot(2_000).session?.id)
    }

    @Test
    fun afterAnUnverifiableRecoveryTheNextForegroundStartsAFreshSession() {
        val store = FakeStore().apply { value = persisted(SessionPhase.ACTIVE, boot = "boot-1") }
        val engine = newEngine(store = store, boot = FakeBoot("boot-2"))
        engine.recover(5_000, RecoveryObservation(true, true))

        val events = engine.onForeground(6_000, 77_000)

        val started = events.single() as SessionEvent.Started
        assertNotEquals("old", started.session.id)
        assertEquals(77_000, started.session.startedAtWallMs)
        assertEquals(0, engine.snapshot(6_000).elapsedMs)
    }

    // ---- error handling -------------------------------------------------------

    @Test
    fun storageFailuresAreReportedAndDoNotBreakTheEngine() {
        val store = FakeStore().apply { failSave = true; failClear = true; failLoad = true }
        val errors = mutableListOf<Exception>()
        val engine = newEngine(store = store, errors = errors)

        val started = engine.onForeground(1_000, 5_000)
        val graced = engine.onBackground(2_000)
        val ended = engine.onTick(40_000)

        assertTrue(started.single() is SessionEvent.Started)
        assertTrue(graced.single() is SessionEvent.GraceStarted)
        assertTrue(ended.single() is SessionEvent.Ended)
        assertEquals(3, errors.size) // save, save, clear
        assertEquals(SessionPhase.INACTIVE, engine.snapshot(40_000).phase)

        val fresh = newEngine(store = store, errors = errors)
        assertTrue(fresh.recover(1_000, RecoveryObservation(true, true)).isEmpty())
        assertEquals(4, errors.size) // load
        assertFalse(errors.isEmpty())
    }
}
