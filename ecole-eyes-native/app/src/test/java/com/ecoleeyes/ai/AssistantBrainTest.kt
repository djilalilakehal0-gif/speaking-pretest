package com.ecoleeyes.ai

import com.ecoleeyes.core.Lang
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test

class AssistantBrainTest {

    private class FakeAi(private val script: List<AiResponse>) : AiClient {
        val requests = ArrayList<AiRequest>()
        private var i = 0
        override suspend fun complete(request: AiRequest): AiResponse { requests += request; return script[minOf(i++, script.lastIndex)] }
    }

    private fun text(s: String) = AiResponse(listOf(Blocks.text(s)), "end_turn")
    private fun toolUse(id: String, name: String, input: JsonObject = buildJsonObject {}) =
        AiResponse(listOf(Blocks.text("one moment"), buildJsonObject { put("type", "tool_use"); put("id", id); put("name", name); put("input", input) }), "tool_use")

    private val ctx = BrainContext(Lang.EN, "home", "Monday", null, null, false)
    private val noTools = ToolExecutor { _, _ -> ToolOutput("n/a") }

    @Test fun plain_answer() = runBlocking {
        val ai = FakeAi(listOf(text("It is sunny.")))
        val r = AssistantBrain(ai).respond("weather?", ctx, noTools)
        assertEquals("It is sunny.", r.text)
        assertEquals(1, ai.requests.size)
        assertTrue(ai.requests[0].system.contains("ÉCOLE EYES"))
        assertTrue(ai.requests[0].tools.isNotEmpty())
    }

    @Test fun tool_call_returns_the_photo_to_the_model_as_an_image_block() = runBlocking {
        val ai = FakeAi(listOf(toolUse("t1", Tools.CAPTURE_VIEW), text("I can see a wooden table, a black laptop and a white cup.")))
        var executed: String? = null
        val exec = ToolExecutor { name, _ -> executed = name; ToolOutput("Photo taken just now.", jpeg = byteArrayOf(1, 2, 3)) }
        val r = AssistantBrain(ai).respond("What is in front of me?", ctx, exec)
        assertEquals(Tools.CAPTURE_VIEW, executed)
        assertEquals(listOf(Tools.CAPTURE_VIEW), r.toolsUsed)
        assertEquals("I can see a wooden table, a black laptop and a white cup.", r.text)
        // second request contains: user, assistant(tool_use), user(tool_result with image + text)
        val msgs = ai.requests[1].messages
        assertEquals(3, msgs.size)
        val result = msgs[2]["content"]!!.jsonArray[0].jsonObject
        assertEquals("tool_result", result["type"]!!.jsonPrimitive.content)
        assertEquals("t1", result["tool_use_id"]!!.jsonPrimitive.content)
        val inner = result["content"]!!.jsonArray.map { it.jsonObject["type"]!!.jsonPrimitive.content }
        assertEquals(listOf("image", "text"), inner)
    }

    @Test fun follow_up_question_sees_the_previous_answer_and_photos_are_not_kept() = runBlocking {
        val ai = FakeAi(listOf(
            toolUse("t1", Tools.CAPTURE_VIEW),
            text("I can see a wooden table, a black laptop, a white cup, and a window on your right."),
            text("There is a white cup next to the laptop."),
        ))
        val brain = AssistantBrain(ai)
        brain.respond("What is in front of me?", ctx, ToolExecutor { _, _ -> ToolOutput("Photo", jpeg = byteArrayOf(9)) })
        val r2 = brain.respond("What is next to the laptop?", ctx, noTools)
        assertEquals("There is a white cup next to the laptop.", r2.text)
        val third = ai.requests.last().messages
        // history: user, assistant, new user
        assertEquals(3, third.size)
        assertTrue(third[1]["content"]!!.jsonArray[0].jsonObject["text"]!!.jsonPrimitive.content.contains("white cup"))
        assertFalse("images must not be kept in memory", third.toString().contains("\"image\""))
        assertEquals(4, brain.memory.size())
    }

    @Test fun memory_is_bounded_and_clearable() {
        val m = ConversationMemory(maxMessages = 6)
        repeat(10) { m.addTurn("q$it", "a$it") }
        assertEquals(6, m.size())
        assertTrue(m.snapshot().first()["content"]!!.jsonArray[0].jsonObject["text"]!!.jsonPrimitive.content == "q7")
        m.clear(); assertEquals(0, m.size())
    }

    @Test fun a_failing_tool_is_reported_to_the_model_not_crashed() = runBlocking {
        val ai = FakeAi(listOf(toolUse("t1", Tools.SEARCH_DOCS), text("I could not search your files.")))
        val r = AssistantBrain(ai).respond("find invoice", ctx, ToolExecutor { _, _ -> throw IllegalStateException("disk error") })
        assertEquals("I could not search your files.", r.text)
        val res = ai.requests[1].messages[2]["content"]!!.jsonArray[0].jsonObject
        assertEquals("true", res["is_error"]!!.jsonPrimitive.content)
    }

    @Test fun ai_service_errors_propagate_so_they_can_be_spoken() {
        val failing = object : AiClient { override suspend fun complete(request: AiRequest): AiResponse = throw AiException.Offline() }
        try { runBlocking { AssistantBrain(failing).respond("hi", ctx, noTools) }; fail() } catch (e: AiException.Offline) { /* ok */ }
    }

    @Test fun errors_inside_a_tool_that_are_ai_exceptions_propagate() {
        val ai = FakeAi(listOf(toolUse("t1", Tools.CAPTURE_VIEW)))
        try { runBlocking { AssistantBrain(ai).respond("x", ctx, ToolExecutor { _, _ -> throw AiException.Timeout() }) }; fail() } catch (e: AiException.Timeout) { /* ok */ }
    }

    @Test fun runaway_tool_loops_are_stopped() = runBlocking {
        val ai = FakeAi(listOf(toolUse("t", Tools.CAPTURE_VIEW)))
        // always asks for tools; the brain must stop after maxSteps and force a final answer
        val loop = object : AiClient {
            var n = 0
            override suspend fun complete(request: AiRequest): AiResponse = if (request.tools.isEmpty()) text("Final answer.") else toolUse("t${n++}", Tools.CAPTURE_VIEW)
        }
        val r = AssistantBrain(loop, maxSteps = 3).respond("x", ctx, ToolExecutor { _, _ -> ToolOutput("ok") })
        assertEquals("Final answer.", r.text)
        assertEquals(3, loop.n)
        Unit
    }

    @Test fun empty_model_answer_is_an_error() {
        val ai = FakeAi(listOf(AiResponse(emptyList(), "end_turn")))
        try { runBlocking { AssistantBrain(ai).respond("x", ctx, noTools) }; fail() } catch (e: AiException.BadResponse) { /* ok */ }
    }

    @Test fun system_prompt_states_language_safety_and_context() {
        val p = Prompt.system(BrainContext(Lang.AR, "camera", "Tuesday 10:00", "electricity bill", "page 2 of 5, paused", true))
        assertTrue(p.contains("Arabic"))
        assertTrue(p.contains("not a safety device"))
        assertTrue(p.contains("Never pretend"))
        assertTrue(p.contains("electricity bill") && p.contains("page 2 of 5"))
        assertTrue(p.contains("Continuous camera description: on"))
        assertTrue(Prompt.system(BrainContext(Lang.FR, "home", "x", null, null, false)).contains("French"))
    }

    @Test fun every_tool_has_a_name_description_and_schema() {
        val names = Tools.all.map { it["name"]!!.jsonPrimitive.content }
        assertEquals(names.size, names.toSet().size)
        for (t in Tools.all) {
            assertTrue(t["description"]!!.jsonPrimitive.content.length > 10)
            assertEquals("object", t["input_schema"]!!.jsonObject["type"]!!.jsonPrimitive.content)
        }
        assertTrue(names.containsAll(listOf(Tools.CAPTURE_VIEW, Tools.SEARCH_DOCS, Tools.OPEN_DOC, Tools.READ_DOC_ALOUD, Tools.GET_DOC_TEXT, Tools.NAVIGATE)))
    }

    @Test fun one_shot_vision_call_is_stateless() = runBlocking {
        val ai = FakeAi(listOf(text("NO_CHANGE")))
        val brain = AssistantBrain(ai)
        assertEquals("NO_CHANGE", brain.oneShot("sys", "what changed?", byteArrayOf(1)))
        assertEquals(0, brain.memory.size())
        assertEquals(emptyList<JsonObject>(), ai.requests[0].tools)
    }
}
