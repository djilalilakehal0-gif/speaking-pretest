package com.ecoleeyes.data

import com.ecoleeyes.core.TextCipher
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.security.MessageDigest

data class Note(val id: Long, val ts: Long, val text: String)

data class ChatLine(val id: Long, val ts: Long, val fromUser: Boolean, val text: String)

@Serializable
data class SavedPosition(val uri: String, val title: String, val page: Int, val paragraph: Int)

/** Encrypted storage for the visible conversation, reading positions and dictated notes. */
class HistoryRepository(private val db: AppDatabase, private val cipher: TextCipher, private val maxLines: Int = 200) {

    val transcript: Flow<List<ChatLine>> = db.messages().observeAll().map { list ->
        list.mapNotNull { m ->
            runCatching { ChatLine(m.id, m.ts, m.role == "user", cipher.decrypt(m.body)) }.getOrNull()
        }
    }

    suspend fun add(fromUser: Boolean, text: String, now: Long = System.currentTimeMillis()) {
        db.messages().insert(MessageEntity(ts = now, role = if (fromUser) "user" else "assistant", body = cipher.encrypt(text)))
        db.messages().trim(maxLines)
    }

    suspend fun clearConversation() = db.messages().clear()

    suspend fun savePosition(uri: String, title: String, page: Int, paragraph: Int, now: Long = System.currentTimeMillis()) {
        val body = Json.encodeToString(SavedPosition(uri, title, page, paragraph))
        db.positions().upsert(PositionEntity(keyOf(uri), now, cipher.encrypt(body)))
    }

    suspend fun loadPosition(uri: String): SavedPosition? =
        db.positions().get(keyOf(uri))?.let { runCatching { Json.decodeFromString<SavedPosition>(cipher.decrypt(it.body)) }.getOrNull() }

    suspend fun clearPositions() = db.positions().clear()

    suspend fun clearAll() { clearConversation(); clearPositions() }

    // ---- notes (kept separately: "clear my history" does not delete the user's notes) ----
    suspend fun addNote(text: String, now: Long = System.currentTimeMillis()) =
        db.notes().insert(NoteEntity(ts = now, body = cipher.encrypt(text)))

    /** Newest first. */
    suspend fun notes(): List<Note> =
        db.notes().all().mapNotNull { n -> runCatching { Note(n.id, n.ts, cipher.decrypt(n.body)) }.getOrNull() }

    suspend fun clearNotes() = db.notes().clear()

    companion object {
        fun keyOf(uri: String): String =
            MessageDigest.getInstance("SHA-256").digest(uri.toByteArray()).joinToString("") { "%02x".format(it) }
    }
}
