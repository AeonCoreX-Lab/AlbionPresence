// Pure JVM module: session state machine with no Android dependencies. Time and
// storage are injected, so everything is unit-testable on a plain JVM.
//
// UNVERIFIED under Gradle: see the note in ../monitoring/build.gradle.kts. The
// Kotlin sources and tests were verified with scripts/verify-kotlin-core.sh.
plugins {
    id("org.jetbrains.kotlin.jvm")
}

kotlin {
    jvmToolchain(17)
}

dependencies {
    // Only the scenario tests use the tracker; production code does not depend on it.
    testImplementation(project(":native:monitoring"))
    testImplementation("junit:junit:4.13.2")
}
