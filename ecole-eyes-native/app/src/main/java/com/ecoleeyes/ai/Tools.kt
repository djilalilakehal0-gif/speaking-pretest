package com.ecoleeyes.ai

import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlinx.serialization.json.putJsonArray
import kotlinx.serialization.json.putJsonObject

/** Result of running a tool on the phone. [jpeg] is attached as an image for the model to look at. */
data class ToolOutput(val text: String, val jpeg: ByteArray? = null, val isError: Boolean = false)

/** Runs the actions the AI asks for (camera, documents, navigation...). Implemented by the controller. */
fun interface ToolExecutor {
    suspend fun execute(name: String, input: JsonObject): ToolOutput
}

/** The actions the AI may take. Each is authorized by the app; the AI cannot do anything not listed here. */
object Tools {
    private fun kotlinx.serialization.json.JsonObjectBuilder.str(name: String, desc: String, enum: List<String>? = null) =
        putJsonObject(name) {
            put("type", "string"); put("description", desc)
            if (enum != null) putJsonArray("enum") { enum.forEach { add(kotlinx.serialization.json.JsonPrimitive(it)) } }
        }

    private fun kotlinx.serialization.json.JsonObjectBuilder.int(name: String, desc: String) =
        putJsonObject(name) { put("type", "integer"); put("description", desc) }

    private fun kotlinx.serialization.json.JsonObjectBuilder.bool(name: String, desc: String) =
        putJsonObject(name) { put("type", "boolean"); put("description", desc) }

    private fun def(name: String, description: String, required: List<String> = emptyList(), props: (kotlinx.serialization.json.JsonObjectBuilder.() -> Unit)? = null): JsonObject =
        buildJsonObject {
            put("name", name)
            put("description", description)
            putJsonObject("input_schema") {
                put("type", "object")
                putJsonObject("properties") { props?.invoke(this) }
                if (required.isNotEmpty()) putJsonArray("required") { required.forEach { add(kotlinx.serialization.json.JsonPrimitive(it)) } }
            }
        }

    const val CAPTURE_VIEW = "capture_view"
    const val START_LIVE = "start_continuous_description"
    const val STOP_LIVE = "stop_continuous_description"
    const val SEARCH_DOCS = "search_documents"
    const val OPEN_DOC = "open_document"
    const val READ_DOC_ALOUD = "read_document_aloud"
    const val GET_DOC_TEXT = "get_document_text"
    const val READER_CONTROL = "reader_control"
    const val NAVIGATE = "navigate"
    const val SET_LANGUAGE = "set_language"
    const val ADJUST_SPEECH = "adjust_speech"
    const val CLEAR_HISTORY = "clear_history"
    const val OPEN_APP = "open_app"
    const val SET_ALARM = "set_alarm"
    const val SET_TIMER = "set_timer"
    const val PHONE_CALL = "phone_call"
    const val READ_NOTIFICATIONS = "read_notifications"
    const val DEVICE_STATUS = "device_status"
    const val OPEN_SYSTEM_SETTINGS = "open_system_settings"

    val all: List<JsonObject> = listOf(
        def(CAPTURE_VIEW,
            "Take a photo with the phone camera right now and look at it. Use for any question about what is in front of the user: objects, people, colors, doors, obstacles, rooms, products, or text on paper/signs. Opens the camera if needed. Returns the image (and, if ocr is true, on-device text recognition output as a hint).",
            props = { bool("ocr", "Set true when the user wants written text read.") }),
        def(START_LIVE, "Start continuous camera assistance: the app describes changes around the user every few seconds until stopped."),
        def(STOP_LIVE, "Stop continuous camera assistance."),
        def(SEARCH_DOCS,
            "Search the documents the user has authorized (by file name). Returns up to 8 matches with ids, newest first when query is empty.",
            props = {
                str("query", "Words likely in the file name, in any language (e.g. 'invoice', 'facture', 'electricity'). Empty = list the latest files.")
                str("type", "File type filter.", listOf("any", "pdf", "word", "text", "rtf", "image"))
            }),
        def(OPEN_DOC, "Open one of the documents returned by search_documents so it can be read or summarized.", listOf("id"),
            props = { str("id", "Document id from search_documents.") }),
        def(READ_DOC_ALOUD,
            "Start reading the open document aloud (or a given document id), from the saved position unless a page is given. Reading begins after your short reply is spoken.",
            props = {
                str("id", "Optional document id; omit to read the currently open document.")
                int("page", "Optional 1-based page to start from.")
            }),
        def(GET_DOC_TEXT,
            "Get the text of the open document so you can summarize it or answer questions about it. Do not read long text back verbatim; for reading aloud use read_document_aloud.",
            props = { int("page", "Optional 1-based page; omit for the beginning of the document (long documents are truncated).") }),
        def(READER_CONTROL, "Control document reading.", listOf("action"),
            props = {
                str("action", "What to do.", listOf("pause", "resume", "next_page", "previous_page", "go_to_page", "repeat_paragraph", "skip_paragraph", "stop"))
                int("page", "Page number for go_to_page.")
            }),
        def(NAVIGATE, "Move to a screen of the app.", listOf("screen"),
            props = { str("screen", "Destination.", listOf("home", "assistant", "camera", "documents", "files", "settings", "privacy", "back")) }),
        def(SET_LANGUAGE, "Change the language the assistant listens and speaks.", listOf("language"),
            props = { str("language", "Language code.", listOf("en", "fr", "ar")) }),
        def(ADJUST_SPEECH, "Change the speaking volume or speed.",
            props = {
                str("volume", "Louder or quieter.", listOf("up", "down"))
                str("speed", "Faster or slower.", listOf("faster", "slower"))
            }),
        def(CLEAR_HISTORY, "Erase the stored conversation history. Only when the user explicitly asks."),
        def(OPEN_APP, "Open another app installed on the phone, by its name (e.g. WhatsApp, YouTube, Maps). It opens after your reply.", listOf("name"),
            props = { str("name", "App name as the user said it, in any language.") }),
        def(SET_ALARM, "Set an alarm in the phone's clock app.", listOf("hour"),
            props = {
                int("hour", "Hour, 0-23 (24-hour clock).")
                int("minute", "Minute, 0-59.")
                str("label", "Optional short label.")
            }),
        def(SET_TIMER, "Start a countdown timer in the phone's clock app.", listOf("seconds"),
            props = {
                int("seconds", "Duration in seconds (1 to 86400).")
                str("label", "Optional short label.")
            }),
        def(PHONE_CALL, "Call a contact by name or a phone number. The app looks the contact up and asks the user to confirm aloud before calling; you never place the call yourself.", listOf("contact_or_number"),
            props = { str("contact_or_number", "Contact name as said by the user, or the digits of the number.") }),
        def(READ_NOTIFICATIONS, "Get the user's recent phone notifications (app, title, text) so you can read or summarize them. Only works if the user enabled notification access."),
        def(DEVICE_STATUS, "Get the battery level, charging state and current date and time."),
        def(OPEN_SYSTEM_SETTINGS, "Open a page of the phone's Android settings. Apps cannot switch Wi-Fi, Bluetooth etc. themselves; the user uses the switch on that page.",
            props = { str("page", "Settings page.", listOf("general", "wifi", "bluetooth", "accessibility", "sound", "display", "location")) }),
    )
}
