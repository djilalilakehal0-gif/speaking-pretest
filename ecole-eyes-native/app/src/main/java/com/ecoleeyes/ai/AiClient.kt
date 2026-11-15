package com.ecoleeyes.ai

import com.ecoleeyes.core.AppSettings
import com.ecoleeyes.core.Connectivity
import kotlinx.coroutines.delay
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import java.io.IOException
import java.net.ConnectException
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import java.util.concurrent.TimeUnit
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/** Every way the AI service can fail, so the assistant can explain each one clearly. */
sealed class AiException(message: String) : Exception(message) {
    class NotConfigured : AiException("backend url not set")
    class Offline : AiException("offline")
    class Timeout : AiException("timeout")
    class Unauthorized : AiException("unauthorized")
    class RateLimited(val retryAfterSec: Int?) : AiException("rate limited")
    class Server(val code: Int) : AiException("server error $code")
    class BadResponse(detail: String) : AiException("bad response: $detail")
}

data class AiRequest(
    val system: String,
    val messages: List<JsonObject>,
    val tools: List<JsonObject> = emptyList(),
    val maxTokens: Int = 700,
)

data class AiResponse(val content: List<JsonObject>, val stopReason: String?) {
    val text: String
        get() = content.filter { it["type"]?.jsonPrimitive?.contentOrNull == "text" }
            .joinToString("\n") { it["text"]?.jsonPrimitive?.contentOrNull.orEmpty() }.trim()
    val toolUses: List<JsonObject>
        get() = content.filter { it["type"]?.jsonPrimitive?.contentOrNull == "tool_use" }
}

/** Provider abstraction: swap the implementation to use another multimodal model. */
interface AiClient {
    suspend fun complete(request: AiRequest): AiResponse
}

/** Content-block builders for the Messages API. */
object Blocks {
    fun text(s: String) = buildJsonObject { put("type", "text"); put("text", s) }
    fun image(jpeg: ByteArray) = buildJsonObject {
        put("type", "image")
        put("source", buildJsonObject {
            put("type", "base64"); put("media_type", "image/jpeg")
            put("data", java.util.Base64.getEncoder().encodeToString(jpeg))
        })
    }
    fun toolResult(id: String, content: List<JsonObject>, isError: Boolean = false) = buildJsonObject {
        put("type", "tool_result"); put("tool_use_id", id)
        put("content", JsonArray(content))
        if (isError) put("is_error", true)
    }
    fun message(role: String, content: List<JsonObject>) = buildJsonObject {
        put("role", role); put("content", JsonArray(content))
    }
    fun userText(s: String) = message("user", listOf(text(s)))
    fun assistantText(s: String) = message("assistant", listOf(text(s)))
}

/**
 * Talks to the secure backend (which holds the real API key and forwards to the model provider).
 * The app never contains a provider key; at most it holds a revocable app token.
 */
class ClaudeProxyClient(
    private val settings: () -> AppSettings,
    private val connectivity: Connectivity,
    private val model: String,
    private val http: OkHttpClient = defaultHttp(),
    private val maxAttempts: Int = 3,
    private val backoffMs: Long = 600,
    /** Always true in the app (cleartext traffic is also disabled in the manifest). Tests use a local HTTP server. */
    private val requireHttps: Boolean = true,
) : AiClient {

    override suspend fun complete(request: AiRequest): AiResponse {
        val s = settings()
        if (s.backendUrl.isBlank() || (requireHttps && !s.backendUrl.startsWith("https://"))) throw AiException.NotConfigured()
        if (!connectivity.isOnline()) throw AiException.Offline()

        val body = buildJsonObject {
            put("model", model)
            put("max_tokens", request.maxTokens)
            put("system", request.system)
            if (request.tools.isNotEmpty()) put("tools", JsonArray(request.tools))
            put("messages", JsonArray(request.messages))
        }.toString()

        var lastError: AiException? = null
        for (attempt in 0 until maxAttempts) {
            try {
                return parse(send(s, body))
            } catch (e: AiException) {
                lastError = e
                val retryable = e is AiException.Server || e is AiException.RateLimited || e is AiException.Timeout
                if (!retryable || attempt == maxAttempts - 1) throw e
                val wait = (e as? AiException.RateLimited)?.retryAfterSec?.coerceAtMost(5)?.times(1000L)
                delay(wait ?: (backoffMs shl attempt))
            }
        }
        throw lastError ?: AiException.BadResponse("no attempt made")
    }

    private suspend fun send(s: AppSettings, body: String): String {
        val req = Request.Builder()
            .url(s.backendUrl + "/v1/messages")
            .post(body.toRequestBody("application/json".toMediaType()))
            .header("anthropic-version", "2023-06-01")
            .apply { if (s.appToken.isNotEmpty()) header("x-app-token", s.appToken) }
            .build()
        val call = http.newCall(req)
        val response = try {
            call.await()
        } catch (e: UnknownHostException) { throw AiException.Offline() }
        catch (e: ConnectException) { throw AiException.Offline() }
        catch (e: SocketTimeoutException) { throw AiException.Timeout() }
        catch (e: IOException) {
            if (!connectivity.isOnline()) throw AiException.Offline() else throw AiException.Timeout()
        }
        response.use { r ->
            val text = r.body?.string().orEmpty()
            when {
                r.isSuccessful -> return text
                r.code == 401 || r.code == 403 -> throw AiException.Unauthorized()
                r.code == 429 -> throw AiException.RateLimited(r.header("retry-after")?.toIntOrNull())
                r.code >= 500 || r.code == 529 -> throw AiException.Server(r.code)
                else -> throw AiException.BadResponse("http ${r.code}: ${errorMessage(text)}")
            }
        }
    }

    private fun errorMessage(body: String): String = runCatching {
        Json.parseToJsonElement(body).jsonObject["error"]?.jsonObject?.get("message")?.jsonPrimitive?.contentOrNull
    }.getOrNull() ?: body.take(120)

    private fun parse(text: String): AiResponse {
        val root = try { Json.parseToJsonElement(text).jsonObject } catch (e: Exception) { throw AiException.BadResponse("not json") }
        val content = root["content"]?.jsonArray?.map { it.jsonObject } ?: throw AiException.BadResponse("no content")
        return AiResponse(content, root["stop_reason"]?.jsonPrimitive?.contentOrNull)
    }

    companion object {
        fun defaultHttp(): OkHttpClient = OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(40, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .callTimeout(55, TimeUnit.SECONDS)
            .build()
    }
}

private suspend fun Call.await(): Response = suspendCancellableCoroutine { cont ->
    cont.invokeOnCancellation { cancel() }
    enqueue(object : Callback {
        override fun onFailure(call: Call, e: IOException) { if (cont.isActive) cont.resumeWithException(e) }
        override fun onResponse(call: Call, response: Response) { cont.resume(response) }
    })
}
