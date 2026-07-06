rootProject.name = "StreamSound"
enableFeaturePreview("TYPESAFE_PROJECT_ACCESSORS")

pluginManagement {
    repositories {
        maven("https://maven.pkg.jetbrains.space/public/p/compose/dev")
        google()
        gradlePluginPortal()
        mavenCentral()
        maven("https://jitpack.io")
        maven("https://packages.jetbrains.team/maven/p/kpm/public/")
    }
}

dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
        maven("https://maven.pkg.jetbrains.space/public/p/compose/dev")
        maven("https://jitpack.io")
        maven("https://packages.jetbrains.team/maven/p/kpm/public/")
    }
}

include(":composeApp")

// SaltUI as local project dependency
include(":salt-ui:ui2")
include(":salt-ui:core")
project(":salt-ui:ui2").projectDir = file("../Salt/SaltUI/ui2")
project(":salt-ui:core").projectDir = file("../Salt/SaltUI/core")
