import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.ksp)
}

val localProps = Properties().apply {
    val f = rootProject.file("local.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}
fun cfg(name: String, default: String = ""): String =
    (findProperty(name) as String?) ?: localProps.getProperty(name) ?: System.getenv(name) ?: default

android {
    namespace = "com.ecoleeyes.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.ecoleeyes.app"
        minSdk = 26
        targetSdk = 35
        versionCode = (findProperty("versionCode") as String?)?.toInt() ?: 100
        versionName = (findProperty("versionName") as String?) ?: "2.0.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        // Backend that holds the AI key. NEVER put an AI provider key here (see backend/README.md).
        buildConfigField("String", "BACKEND_URL", "\"${cfg("ecoleEyesBackendUrl")}\"")
        buildConfigField("String", "APP_TOKEN", "\"${cfg("ecoleEyesAppToken")}\"")
        // Google Cloud project number for Play Integrity (public, not a secret). Empty = integrity proofs are not sent.
        buildConfigField("String", "CLOUD_PROJECT_NUMBER", "\"${cfg("ecoleEyesCloudProjectNumber").filter { it.isDigit() }}\"")
        buildConfigField("String", "AI_MODEL", "\"${cfg("ecoleEyesModel", "claude-sonnet-5-5")}\"")
        resourceConfigurations += listOf("en", "fr", "ar")
    }

    // On-device ML (OCR, objects, labels, faces) ships native code per CPU type. One APK per CPU keeps downloads small:
    // app-arm64-v8a-*.apk fits nearly every phone since 2017. Google Play (AAB) does this split automatically.
    splits {
        abi {
            isEnable = true
            reset()
            include("arm64-v8a", "armeabi-v7a", "x86_64")
            isUniversalApk = false
        }
    }

    signingConfigs {
        val ksFile = cfg("ECOLE_EYES_KEYSTORE")
        if (ksFile.isNotEmpty()) {
            create("release") {
                storeFile = file(ksFile)
                storePassword = cfg("ECOLE_EYES_KEYSTORE_PASSWORD")
                keyAlias = cfg("ECOLE_EYES_KEY_ALIAS", "ecoleeyes")
                keyPassword = cfg("ECOLE_EYES_KEY_PASSWORD", cfg("ECOLE_EYES_KEYSTORE_PASSWORD"))
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfigs.findByName("release")?.let { signingConfig = it }
        }
        debug {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
    }

    // The app switches language itself (Arabic / French / English), so Play must ship every language's strings,
    // not only the phone's language: otherwise "speak Arabic" on a French phone would find no Arabic text.
    bundle {
        language { enableSplit = false }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    buildFeatures {
        compose = true
        buildConfig = true
    }
    packaging {
        // Compress native ML libraries inside the APK: roughly halves the download for people on limited mobile data.
        jniLibs.useLegacyPackaging = true
        resources.excludes += setOf("/META-INF/{AL2.0,LGPL2.1}", "META-INF/DEPENDENCIES", "META-INF/LICENSE*", "META-INF/NOTICE*")
    }
    testOptions {
        unitTests {
            isReturnDefaultValues = true
            isIncludeAndroidResources = true
            // Robolectric downloads Android framework jars at test time; allow a Maven Central mirror (-ProbolectricRepoUrl=...).
            all { test -> cfg("robolectricRepoUrl").takeIf { it.isNotEmpty() }?.let { test.systemProperty("robolectric.dependency.repo.url", it) } }
        }
    }
    lint {
        abortOnError = true
        warningsAsErrors = false
    }
}

ksp { arg("room.schemaLocation", "$projectDir/schemas") }

dependencies {
    // Security: pdfbox-android pulls BouncyCastle 1.72 (CVE-2024-29857, CVE-2024-30171, CVE-2024-30172, fixed in 1.78+).
    constraints {
        listOf("bcprov", "bcpkix", "bcutil").forEach { m ->
            implementation("org.bouncycastle:$m-jdk15to18:1.87") { because("security fixes; reached through encrypted PDFs") }
        }
    }
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.runtime)
    implementation(libs.androidx.lifecycle.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.icons)
    implementation(libs.androidx.camera.core)
    implementation(libs.androidx.camera.camera2)
    implementation(libs.androidx.camera.lifecycle)
    implementation(libs.androidx.camera.view)
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)
    implementation(libs.androidx.security.crypto)
    implementation(libs.androidx.exifinterface)
    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.kotlinx.coroutines.play)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.okhttp)
    implementation(libs.mlkit.text)
    implementation(libs.mlkit.objects)
    implementation(libs.mlkit.labels)
    implementation(libs.mlkit.faces)
    implementation(libs.androidx.work)
    implementation(libs.play.integrity)
    implementation(libs.pdfbox.android)
    debugImplementation(libs.androidx.compose.ui.test.manifest)

    testImplementation(libs.junit)
    testImplementation(libs.kotlinx.coroutines.test)
    testImplementation(libs.okhttp.mockwebserver)
    testImplementation(libs.robolectric)
    testImplementation(libs.androidx.test.core)
    testImplementation(libs.androidx.work.testing)
    testImplementation(platform(libs.androidx.compose.bom))
    testImplementation(libs.androidx.compose.ui.test)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test)
    androidTestImplementation(libs.androidx.test.ext.junit)
    androidTestImplementation(libs.androidx.test.runner)
}
