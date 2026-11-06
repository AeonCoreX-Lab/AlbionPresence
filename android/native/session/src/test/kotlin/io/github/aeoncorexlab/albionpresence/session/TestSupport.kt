package io.github.aeoncorexlab.albionpresence.session

class FakeStore : SessionStore {
    var value: PersistedSession? = null
    var failLoad = false
    var failSave = false
    var failClear = false
    var saveCount = 0

    override fun load(): PersistedSession? {
        if (failLoad) throw IllegalStateException("load failed")
        return value
    }

    override fun save(value: PersistedSession) {
        if (failSave) throw IllegalStateException("save failed")
        saveCount++
        this.value = value
    }

    override fun clear() {
        if (failClear) throw IllegalStateException("clear failed")
        value = null
    }
}

class FakeBoot(var id: String = "boot-1") : BootIdProvider {
    override fun current(): String = id
}

/** Sequential ids so tests can tell sessions apart. */
class Ids {
    private var next = 1
    fun generate(): String = "s${next++}"
}

fun newEngine(
    store: FakeStore = FakeStore(),
    boot: FakeBoot = FakeBoot(),
    ids: Ids = Ids(),
    graceMs: Long = 30_000L,
    errors: MutableList<Exception> = mutableListOf(),
): SessionEngine = SessionEngine(store, boot, ids::generate, graceMs) { errors += it }
