package com.ecoleeyes.ai

import com.ecoleeyes.core.AppSettings
import com.ecoleeyes.core.Connectivity
import kotlinx.coroutines.runBlocking
import okhttp3.OkHttpClient
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test
import java.security.MessageDigest
import java.util.Base64
import java.util.concurrent.TimeUnit

/** The Play Integrity proof is bound to the exact bytes the backend receives, and never blocks a request. */
class IntegrityHeaderTest {
    private lateinit var server: MockWebServer
    private val ok = """{"content":[{"type":"text","text":"ok"}],"stop_reason":"end_turn"}"""

    @Before fun setUp() { server = MockWebServer().apply { start() } }
    @After fun tearDown() { server.shutdown() }

    private fun client(integrity: IntegrityProvider?) = ClaudeProxyClient(
        { AppSettings(backendUrl = server.url("/").toString().trimEnd('/'), appToken = "tok") }, Connectivity { true }, "m",
        OkHttpClient.Builder().callTimeout(2, TimeUnit.SECONDS).build(), maxAttempts = 2, backoffMs = 1, requireHttps = false, integrity = integrity,
    )

    private fun sha256url(bytes: ByteArray) = Base64.getUrlEncoder().withoutPadding().encodeToString(MessageDigest.getInstance("SHA-256").digest(bytes))

    @Test fun token_is_sent_and_bound_to_the_received_body() = runBlocking {
        val hashes = ArrayList<String>()
        server.enqueue(MockResponse().setBody(ok))
        client { h -> hashes += h; "integrity-token-123" }.complete(AiRequest("sys", listOf(Blocks.userText("مرحبا, café"))))
        val rec = server.takeRequest()
        assertEquals("integrity-token-123", rec.getHeader("x-integrity-token"))
        assertEquals(sha256url(rec.body.readByteArray()), hashes.single())   // same hash the Worker computes
    }

    @Test fun retries_reuse_one_token() = runBlocking {
        var calls = 0
        server.enqueue(MockResponse().setResponseCode(503))
        server.enqueue(MockResponse().setBody(ok))
        client { calls++; "t" }.complete(AiRequest("sys", listOf(Blocks.userText("hi"))))
        assertEquals(1, calls)
        assertEquals("t", server.takeRequest().getHeader("x-integrity-token"))
        assertEquals("t", server.takeRequest().getHeader("x-integrity-token"))
    }

    @Test fun unavailable_or_failing_integrity_never_blocks_the_request() = runBlocking {
        server.enqueue(MockResponse().setBody(ok))
        server.enqueue(MockResponse().setBody(ok))
        server.enqueue(MockResponse().setBody(ok))
        client { null }.complete(AiRequest("s", listOf(Blocks.userText("a"))))
        client { throw IllegalStateException("no Play services") }.complete(AiRequest("s", listOf(Blocks.userText("b"))))
        client(null).complete(AiRequest("s", listOf(Blocks.userText("c"))))
        repeat(3) { assertNull(server.takeRequest().getHeader("x-integrity-token")) }
    }

    @Test fun hash_format_matches_the_backend() {
        // base64url without padding of SHA-256("abc"), as computed by the Worker
        assertEquals("ungWv48Bz-pBQUDeXa4iI7ADYaOWF3qctBD_YfIAFa0", IntegrityProvider.requestHash("abc"))
    }
}
