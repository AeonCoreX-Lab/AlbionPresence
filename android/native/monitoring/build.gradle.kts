// Pure JVM module: foreground-tracking logic with no Android dependencies, so it
// can be unit-tested on a plain JVM. The Android adapter that reads
// UsageStatsManager is a separate piece and is not written yet.
//
// UNVERIFIED under Gradle: the Kotlin sources compile and pass their tests via
// scripts/verify-kotlin-core.sh, but this build file has not been run (no
// Maven/Google access in the authoring environment). The Kotlin plugin is applied
// without a version because the React Native Android template puts
// kotlin-gradle-plugin on the root build classpath; if your template differs,
// add the version here.
plugins {
    id("org.jetbrains.kotlin.jvm")
}

kotlin {
    jvmToolchain(17)
}

dependencies {
    testImplementation("junit:junit:4.13.2")
}
