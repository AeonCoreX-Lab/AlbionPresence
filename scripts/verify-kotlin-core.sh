#!/usr/bin/env bash
#
# Compiles and tests the pure-Kotlin core (android/native/session and
# android/native/monitoring) WITHOUT the Android SDK, Maven or network access.
#
# It borrows the Kotlin compiler, stdlib and JUnit 4 that ship inside a Gradle
# distribution. This is a convenience for environments that cannot reach Maven.
# The normal route is `./gradlew test` once the project is bootstrapped.
#
# Usage: scripts/verify-kotlin-core.sh [path-to-gradle-lib-dir]
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ "$#" -ge 1 ]; then
  LIB="$1"
else
  GRADLE_BIN="$(command -v gradle || true)"
  [ -n "$GRADLE_BIN" ] || { echo "gradle not found; pass its lib directory as an argument" >&2; exit 2; }
  LIB="$(dirname "$(readlink -f "$GRADLE_BIN")")/../lib"
fi

jar() { ls "$LIB"/$1 2>/dev/null | head -n1; }
KOTLINC_CP="$(jar 'kotlin-compiler-embeddable-*.jar'):$(jar 'kotlin-stdlib-[0-9]*.jar'):$(jar 'kotlin-script-runtime-*.jar'):$(jar 'kotlin-reflect-*.jar'):$(jar 'kotlin-daemon-embeddable-*.jar'):$(jar 'trove4j-*.jar'):$(jar 'annotations-[0-9]*.jar'):$(jar 'kotlinx-coroutines-core-jvm-*.jar')"
STDLIB="$(jar 'kotlin-stdlib-[0-9]*.jar')"
JUNIT="$(jar 'junit-4*.jar'):$(jar 'hamcrest-core-*.jar')"

OUT="$(mktemp -d)"
trap 'rm -rf "$OUT"' EXIT
NATIVE="$REPO_ROOT/android/native"

kotlinc() {
  java -cp "$KOTLINC_CP" org.jetbrains.kotlin.cli.jvm.K2JVMCompiler -no-stdlib -no-reflect -nowarn "$@"
}

echo "==> Compiling main sources (-Werror equivalent: warnings are shown below)"
kotlinc -Werror -d "$OUT/main" -cp "$STDLIB" \
  $(find "$NATIVE"/*/src/main -name '*.kt')

echo "==> Compiling tests"
kotlinc -d "$OUT/test" -cp "$STDLIB:$JUNIT:$OUT/main" \
  $(find "$NATIVE"/*/src/test -name '*.kt')

echo "==> Running JUnit"
CLASSES="$(cd "$OUT/test" && find . -name '*Test.class' | sed 's|^\./||; s|\.class$||; s|/|.|g' | sort | tr '\n' ' ')"
java -cp "$STDLIB:$JUNIT:$OUT/main:$OUT/test" org.junit.runner.JUnitCore $CLASSES
