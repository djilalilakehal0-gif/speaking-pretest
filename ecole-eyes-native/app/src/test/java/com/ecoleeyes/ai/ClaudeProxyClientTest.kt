package com.ecoleeyes.ai

import com.ecoleeyes.core.AppSettings
import com.ecoleeyes.core.Connectivity
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.OkHttpClient
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import okhttp3.mockwebserver.SocketPolicy
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Before
import org.junit.Test
import java.util.concurrent.TimeUnit

class ClaudeProxyClientTest {
    private lateinit var server: MockWebServer
    private var online = true

    @Before fun setUp() { server = MockWebServer().apply { start() } }
    @After fun tearDown() { server.shutdown() }

    private fun client(
        url: String = server.url("/").toString().trimEnd('/'),
        token: String = "tok",
        http: OkHttpClient = OkHttpClient.Builder().callTimeout(2, TimeUnit.SECONDS).build(),
        requireHttps: Boolean = false,
    ): ClaudeProxyClient {
        val st = AppSettings(backendUrl = url, appToken = token)
        return ClaudeProxyClient({ st }, Connectivity { online }, "test-model", http, maxAttempts = 3, backoffMs = 1, requireHttps = requireHttps)
    }

    private val req = AiRequest("sys", listOf(Blocks.userText("hi")))
    private val ok = """{"content":[{"type":"text","text":"Hello there"}],"stop_reason":"end_turn"}"""

    private inline fun <reified T : AiException> expectFailure(block: () -> Unit) {
        try { block(); fail("expected ${T::class.simpleName}") } catch (e: AiException) { assertTrue("got $e", e is T) }
    }

    @Test fun sends_model_system_messages_tools_and_headers_to_the_backend_not_the_provider() = runBlocking {
        server.enqueue(MockResponse().setBody(ok))
        val res = client().complete(AiRequest("be brief", listOf(Blocks.userText("hello")), Tools.all, 321))
        assertEquals("Hello there", res.text)
        val recorded = server.takeRequest()
        assertEquals("/v1/messages", recorded.path)
        assertEquals("tok", recorded.getHeader("x-app-token"))
        assertEquals("2023-06-01", recorded.getHeader("anthropic-version"))
        assertEquals(null, recorded.getHeader("x-api-key"))   // the app never holds the provider key
        val body = Json.parseToJsonElement(recorded.body.readUtf8()).jsonObject
        assertEquals("test-model", body["model"]!!.jsonPrimitive.content)
        assertEquals("be brief", body["system"]!!.jsonPrimitive.content)
        assertEquals(321, body["max_tokens"]!!.jsonPrimitive.content.toInt())
        assertEquals(Tools.all.size, body["tools"]!!.jsonArray.size)
        assertEquals("user", body["messages"]!!.jsonArray[0].jsonObject["role"]!!.jsonPrimitive.content)
    }

    @Test fun no_token_header_when_token_is_empty() = runBlocking {
        server.enqueue(MockResponse().setBody(ok))
        client(token = "").complete(req)
        assertEquals(null, server.takeRequest().getHeader("x-app-token"))
    }

    @Test fun retries_server_errors_then_succeeds() = runBlocking {
        server.enqueue(MockResponse().setResponseCode(503))
        server.enqueue(MockResponse().setResponseCode(529))
        server.enqueue(MockResponse().setBody(ok))
        assertEquals("Hello there", client().complete(req).text)
        assertEquals(3, server.requestCount)
    }

    @Test fun gives_up_after_max_attempts_with_server_error() {
        repeat(3) { server.enqueue(MockResponse().setResponseCode(500)) }
        expectFailure<AiException.Server> { runBlocking { client().complete(req) } }
        assertEquals(3, server.requestCount)
    }

    @Test fun rate_limit_is_retried_and_reported() {
        repeat(3) { server.enqueue(MockResponse().setResponseCode(429).setHeader("retry-after", "0")) }
        expectFailure<AiException.RateLimited> { runBlocking { client().complete(req) } }
    }

    @Test fun auth_failure_is_not_retried() {
        server.enqueue(MockResponse().setResponseCode(401).setBody("""{"error":{"message":"bad token"}}"""))
        expectFailure<AiException.Unauthorized> { runBlocking { client().complete(req) } }
        assertEquals(1, server.requestCount)
    }

    @Test fun client_errors_are_bad_response_and_not_retried() {
        server.enqueue(MockResponse().setResponseCode(400).setBody("""{"error":{"message":"bad request"}}"""))
        try { runBlocking { client().complete(req) }; fail() } catch (e: AiException.BadResponse) { assertTrue(e.message!!.contains("bad request")) }
        assertEquals(1, server.requestCount)
    }

    @Test fun malformed_json_is_bad_response() {
        server.enqueue(MockResponse().setBody("not json"))
        expectFailure<AiException.BadResponse> { runBlocking { client().complete(req) } }
    }

    @Test fun missing_content_is_bad_response() {
        server.enqueue(MockResponse().setBody("""{"id":"x"}"""))
        expectFailure<AiException.BadResponse> { runBlocking { client().complete(req) } }
    }

    @Test fun slow_server_times_out_and_retries() {
        repeat(3) { server.enqueue(MockResponse().setBody(ok).setSocketPolicy(SocketPolicy.NO_RESPONSE)) }
        val fast = OkHttpClient.Builder().callTimeout(300, TimeUnit.MILLISECONDS).build()
        expectFailure<AiException.Timeout> { runBlocking { client(http = fast).complete(req) } }
        assertEquals(3, server.requestCount)
    }

    @Test fun offline_fails_fast_without_touching_the_network() {
        online = false
        expectFailure<AiException.Offline> { runBlocking { client().complete(req) } }
        assertEquals(0, server.requestCount)
    }

    @Test fun unreachable_host_is_reported_as_offline() {
        val url = server.url("/").toString().trimEnd('/')
        server.shutdown()
        expectFailure<AiException.Offline> { runBlocking { client(url = url).complete(req) } }
        server = MockWebServer().apply { start() }
    }

    @Test fun missing_backend_address_is_a_clear_error() {
        expectFailure<AiException.NotConfigured> { runBlocking { client(url = "").complete(req) } }
        expectFailure<AiException.NotConfigured> { runBlocking { client(url = "http://insecure.example", requireHttps = true).complete(req) } }  // https only
    }

    @Test fun parses_tool_use_blocks() = runBlocking {
        server.enqueue(MockResponse().setBody("""{"content":[{"type":"text","text":"Looking"},{"type":"tool_use","id":"t1","name":"capture_view","input":{"ocr":true}}],"stop_reason":"tool_use"}"""))
        val r = client().complete(req)
        assertEquals("tool_use", r.stopReason)
        assertEquals(1, r.toolUses.size)
        assertEquals("capture_view", r.toolUses[0]["name"]!!.jsonPrimitive.content)
    }
}
