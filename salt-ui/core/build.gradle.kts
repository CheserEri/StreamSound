import com.android.build.api.dsl.androidLibrary
import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.android.kotlin.multiplatform.library)
}

kotlin {
    compilerOptions {
        freeCompilerArgs.add("-Xexpect-actual-classes")
    }

    @Suppress("UnstableApiUsage")
    androidLibrary {
        namespace = "com.moriafly.salt.core"
        compileSdk = 36
        minSdk = 23

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
        }

        androidMain.dependencies {
            implementation(libs.core.ktx)
            implementation(libs.hiddenapibypass)
        }
    }
}
