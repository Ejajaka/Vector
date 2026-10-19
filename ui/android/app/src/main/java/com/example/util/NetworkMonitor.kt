package com.example.util

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class NetworkMonitor(context: Context) {

    private val connectivityManager =
        context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager

    private val _isOnline = MutableStateFlow(checkInitialConnectivity())
    val isOnline: StateFlow<Boolean> = _isOnline.asStateFlow()

    // Optional manual simulation mode for demonstration purposes
    private var simulatedOffline: Boolean? = null

    init {
        try {
            val request = NetworkRequest.Builder()
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                .build()

            connectivityManager?.registerNetworkCallback(
                request,
                object : ConnectivityManager.NetworkCallback() {
                    override fun onAvailable(network: Network) {
                        if (simulatedOffline == null) {
                            _isOnline.value = true
                        }
                    }

                    override fun onLost(network: Network) {
                        if (simulatedOffline == null) {
                            _isOnline.value = false
                        }
                    }
                }
            )
        } catch (_: Exception) {
            // Fallback gracefully if permission or callback registration fails
        }
    }

    private fun checkInitialConnectivity(): Boolean {
        return try {
            val network = connectivityManager?.activeNetwork ?: return false
            val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
            capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        } catch (_: Exception) {
            true // Default optimistic
        }
    }

    fun setSimulatedOffline(offline: Boolean?) {
        simulatedOffline = offline
        if (offline != null) {
            _isOnline.value = !offline
        } else {
            _isOnline.value = checkInitialConnectivity()
        }
    }

    fun isSimulated(): Boolean = simulatedOffline != null
}
