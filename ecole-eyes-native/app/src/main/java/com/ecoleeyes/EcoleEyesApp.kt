package com.ecoleeyes

import android.app.Application

class EcoleEyesApp : Application() {
    val graph: AppGraph by lazy { AppGraph(this) }
}
