package com.ecoleeyes.core

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities

/** Cheap "is there a connection at all" check, used to give a clear spoken explanation. */
fun interface Connectivity {
    fun isOnline(): Boolean
}

class AndroidConnectivity(context: Context) : Connectivity {
    private val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    override fun isOnline(): Boolean {
        val caps = cm.getNetworkCapabilities(cm.activeNetwork) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
            caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
    }
}
