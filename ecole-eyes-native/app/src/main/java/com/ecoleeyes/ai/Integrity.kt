package com.ecoleeyes.ai

import android.content.Context
import com.google.android.play.core.integrity.IntegrityManagerFactory
import com.google.android.play.core.integrity.StandardIntegrityManager.PrepareIntegrityTokenRequest
import com.google.android.play.core.integrity.StandardIntegrityManager.StandardIntegrityTokenProvider
import com.google.android.play.core.integrity.StandardIntegrityManager.StandardIntegrityTokenRequest
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withTimeoutOrNull
import java.security.MessageDigest
import java.util.Base64

/**
 * Proves to the backend that a request comes from the genuine app on a genuine device (Google Play Integrity).
 * The token is bound to the exact request body through [requestHash], so it cannot be replayed for another request.
 * Returns null when integrity is unavailable (not configured, no Play services, offline): the backend decides.
 */
fun interface IntegrityProvider {
    suspend fun token(requestHash: String): String?

    companion object {
        /** base64url(SHA-256(body)) without padding; the backend computes the same over the bytes it receives. */
        fun requestHash(body: String): String =
            Base64.getUrlEncoder().withoutPadding().encodeToString(MessageDigest.getInstance("SHA-256").digest(body.toByteArray(Charsets.UTF_8)))
    }
}

/** Standard Play Integrity API. [cloudProjectNumber] is public (not a secret): Play Console > App integrity. */
class PlayIntegrityProvider(context: Context, private val cloudProjectNumber: Long) : IntegrityProvider {
    private val manager = IntegrityManagerFactory.createStandard(context.applicationContext)
    private val lock = Mutex()
    @Volatile private var provider: StandardIntegrityTokenProvider? = null

    private suspend fun provider(): StandardIntegrityTokenProvider? = provider ?: lock.withLock {
        provider ?: runCatching {
            manager.prepareIntegrityToken(PrepareIntegrityTokenRequest.builder().setCloudProjectNumber(cloudProjectNumber).build()).await()
        }.getOrNull()?.also { provider = it }
    }

    override suspend fun token(requestHash: String): String? = withTimeoutOrNull(4000) {
        val p = provider() ?: return@withTimeoutOrNull null
        runCatching { p.request(StandardIntegrityTokenRequest.builder().setRequestHash(requestHash).build()).await().token() }
            .getOrElse { provider = null; null }   // the provider can expire; prepare again next time
    }
}
