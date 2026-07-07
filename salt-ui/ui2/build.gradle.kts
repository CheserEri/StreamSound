import com.android.build.api.dsl.androidLibrary
import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.kotlin.plugin.compose)
    alias(libs.plugins.android.kotlin.multiplatform.library)
    alias(libs.plugins.compose.multiplatform)
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll(
            "-Xexpect-actual-classes",
            "-Xallow-holdsin-contract"
        )
    }

    @Suppress("UnstableApiUsage")
    androidLibrary {
        namespace = "com.moriafly.salt.ui"
        compileSdk = 36
        minSdk = 23

        androidResources {
            enable = true
        }

        compilerOptions {
            jvmTarget.set(JvmTarget.JVM_21)
        }

        packaging {
            resources {
                excludes += "/META-INF/{AL2.0,LGPL2.1}"
            }
        }
    }

    androidTarget()

    sourceSets {
        commonMain.dependencies {
            api(project(":salt-ui:core"))
            implementation(libs.compose.runtime)
            implementation(libs.compose.foundation)
            implementation(libs.compose.ui)
            implementation(libs.compose.ui.tooling.preview)
            implementation(libs.compose.components.resources)
            implementation(libs.haze)
            implementation(libs.haze.materials)
            implementation(libs.collection)
        }

        androidMain.dependencies {
            implementation(libs.core.ktx)
            implementation(libs.material)
            implementation(libs.compose.material3)
            implementation(libs.activity.compose)
            implementation(libs.hiddenapibypass)
        }
    }
}
