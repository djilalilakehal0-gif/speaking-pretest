package com.ecoleeyes.ai

import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

/** Rolling conversation memory (text only: photos are dropped after the turn to avoid keeping images). */
class ConversationMemory(private val maxMessages: Int = 24) {
    private val items = ArrayList<JsonObject>()

    @Synchronized fun snapshot(): List<JsonObject> = items.toList()

    @Synchronized fun addTurn(userText: String, assistantText: String) {
        items += Blocks.userText(userText.take(MAX_CHARS))
        items += Blocks.assistantText(assistantText.take(MAX_CHARS))
        while (items.size > maxMessages) { items.removeAt(0); items.removeAt(0) }
    }

    @Synchronized fun clear() = items.clear()
    @Synchronized fun size() = items.size

    private companion object { const val MAX_CHARS = 4000 }
}

/**
 * The AI "brain": sends the user's request with the conversation so far, executes the tools the model
 * asks for (camera, documents, navigation...), and returns the final spoken answer.
 */
class AssistantBrain(
    private val client: AiClient,
    val memory: ConversationMemory = ConversationMemory(),
    private val maxSteps: Int = 6,
) {
    data class Reply(val text: String, val toolsUsed: List<String>)

    suspend fun respond(
        userText: String,
        context: BrainContext,
        executor: ToolExecutor,
        onTool: (String) -> Unit = {},
    ): Reply {
        val system = Prompt.system(context)
        val turn = ArrayList<JsonObject>()
        turn += Blocks.userText(userText)
        val used = ArrayList<String>()

        repeat(maxSteps) {
            val res = client.complete(AiRequest(system, memory.snapshot() + turn, Tools.all))
            val toolUses = res.toolUses
            if (res.stopReason != "tool_use" || toolUses.isEmpty()) {
                val text = res.text.ifBlank { throw AiException.BadResponse("empty answer") }
                memory.addTurn(userText, text)
                return Reply(text, used)
            }
            turn += Blocks.message("assistant", res.content)
            val results = ArrayList<JsonObject>()
            for (use in toolUses) {
                val id = use["id"]?.jsonPrimitive?.contentOrNull.orEmpty()
                val name = use["name"]?.jsonPrimitive?.contentOrNull.orEmpty()
                val input = (use["input"] as? JsonObject) ?: buildJsonObject {}
                used += name
                onTool(name)
                val out = try {
                    executor.execute(name, input)
                } catch (e: AiException) {
                    throw e
                } catch (e: kotlinx.coroutines.CancellationException) {
                    throw e
                } catch (e: Exception) {
                    ToolOutput("Tool failed: ${e.message ?: e::class.simpleName}", isError = true)
                }
                val blocks = ArrayList<JsonObject>()
                out.jpeg?.let { blocks += Blocks.image(it) }
                blocks += Blocks.text(out.text)
                results += Blocks.toolResult(id, blocks, out.isError)
            }
            turn += Blocks.message("user", results)
        }
        // Too many tool rounds: ask for a final answer without tools.
        val res = client.complete(AiRequest(system, memory.snapshot() + turn + Blocks.userText("Answer now in a short spoken reply with what you know."), emptyList()))
        val text = res.text.ifBlank { throw AiException.BadResponse("empty answer") }
        memory.addTurn(userText, text)
        return Reply(text, used)
    }

    /** Stateless one-shot vision call (continuous description, cloud OCR). Does not touch memory. */
    suspend fun oneShot(system: String, prompt: String, jpeg: ByteArray, maxTokens: Int = 400): String {
        val msg = Blocks.message("user", listOf(Blocks.image(jpeg), Blocks.text(prompt)))
        return client.complete(AiRequest(system, listOf(msg), emptyList(), maxTokens)).text
    }

    /** Stateless text-only call. */
    suspend fun oneShotText(system: String, prompt: String, maxTokens: Int = 500): String =
        client.complete(AiRequest(system, listOf(Blocks.userText(prompt)), emptyList(), maxTokens)).text
}

internal fun JsonObject.str(key: String): String? = this[key]?.let { (it as? JsonPrimitive)?.contentOrNull }
internal fun JsonObject.int(key: String): Int? = this[key]?.let { (it as? JsonPrimitive)?.contentOrNull?.toIntOrNull() }
internal fun JsonObject.bool(key: String): Boolean? = this[key]?.let { (it as? JsonPrimitive)?.contentOrNull?.toBooleanStrictOrNull() }
