package com.ecoleeyes.docs

import android.content.ContentResolver
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.DocumentsContract
import android.provider.OpenableColumns
import com.ecoleeyes.voice.DocType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import java.security.MessageDigest

/** A folder (tree) or single file the user granted access to. */
data class Grant(val uri: Uri, val label: String, val isTree: Boolean)

/**
 * Authorized-file access through the Storage Access Framework. The app can only see what the user
 * picked in the system picker; the grants are Android's persisted URI permissions, which the user
 * can revoke here or in system settings. Nothing else on the phone is ever listed or read.
 */
class DocIndex(private val context: Context) {
    private val resolver: ContentResolver = context.contentResolver
    private val _files = MutableStateFlow<List<DocFile>>(emptyList())
    val files: StateFlow<List<DocFile>> = _files.asStateFlow()
    private val _grants = MutableStateFlow(readGrants())
    val grants: StateFlow<List<Grant>> = _grants.asStateFlow()

    fun hasAccess(): Boolean = _grants.value.isNotEmpty()

    /** Call with the URI returned by OpenDocumentTree / OpenDocument. */
    fun addGrant(uri: Uri): Boolean = try {
        resolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
        _grants.value = readGrants()
        true
    } catch (e: SecurityException) { false }

    fun removeGrant(uri: Uri) {
        runCatching { resolver.releasePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION) }
        _grants.value = readGrants()
        _files.value = _files.value.filterNot { it.uri.startsWith(uri.toString()) || it.folder == uri.toString() }
    }

    private fun readGrants(): List<Grant> =
        resolver.persistedUriPermissions.filter { it.isReadPermission }.map { p ->
            val tree = DocumentsContract.isTreeUri(p.uri)
            Grant(p.uri, labelOf(p.uri, tree), tree)
        }

    private fun labelOf(uri: Uri, tree: Boolean): String = try {
        if (tree) DocumentsContract.getTreeDocumentId(uri).substringAfter(':').ifEmpty { "Storage" }.substringAfterLast('/')
        else resolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { c -> if (c.moveToFirst()) c.getString(0) else null } ?: "File"
    } catch (e: Exception) { "Folder" }

    /** Scans every granted folder (depth <= 5, <= 5000 files). Safe to call often. */
    suspend fun refresh(): List<DocFile> = withContext(Dispatchers.IO) {
        _grants.value = readGrants()
        val out = ArrayList<DocFile>()
        for (g in _grants.value) {
            if (out.size >= MAX_FILES) break
            if (g.isTree) scanTree(g, out) else single(g)?.let { out += it }
        }
        out.sortByDescending { it.modified }
        _files.value = out
        out
    }

    private fun single(g: Grant): DocFile? = try {
        resolver.query(g.uri, arrayOf(OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE, DocumentsContract.Document.COLUMN_LAST_MODIFIED, DocumentsContract.Document.COLUMN_MIME_TYPE), null, null, null)?.use { c ->
            if (!c.moveToFirst()) return@use null
            val name = c.getString(0) ?: return@use null
            val type = DocKinds.detect(name, c.getString(3)) ?: return@use null
            DocFile(idOf(g.uri.toString()), g.uri.toString(), name, type, if (c.isNull(2)) 0 else c.getLong(2), if (c.isNull(1)) 0 else c.getLong(1), "")
        }
    } catch (e: Exception) { null }

    private fun scanTree(g: Grant, out: MutableList<DocFile>) {
        val rootId = DocumentsContract.getTreeDocumentId(g.uri)
        val queue = ArrayDeque<Pair<String, Int>>()
        queue.add(rootId to 0)
        val proj = arrayOf(
            DocumentsContract.Document.COLUMN_DOCUMENT_ID, DocumentsContract.Document.COLUMN_DISPLAY_NAME,
            DocumentsContract.Document.COLUMN_MIME_TYPE, DocumentsContract.Document.COLUMN_LAST_MODIFIED, DocumentsContract.Document.COLUMN_SIZE,
        )
        while (queue.isNotEmpty() && out.size < MAX_FILES) {
            val (docId, depth) = queue.removeFirst()
            val children = DocumentsContract.buildChildDocumentsUriUsingTree(g.uri, docId)
            try {
                resolver.query(children, proj, null, null, null)?.use { c ->
                    while (c.moveToNext() && out.size < MAX_FILES) {
                        val id = c.getString(0); val name = c.getString(1) ?: continue; val mime = c.getString(2)
                        if (mime == DocumentsContract.Document.MIME_TYPE_DIR) {
                            if (depth < MAX_DEPTH) queue.add(id to depth + 1)
                        } else {
                            val type = DocKinds.detect(name, mime) ?: continue
                            val uri = DocumentsContract.buildDocumentUriUsingTree(g.uri, id).toString()
                            out += DocFile(idOf(uri), uri, name, type, if (c.isNull(3)) 0 else c.getLong(3), if (c.isNull(4)) 0 else c.getLong(4), g.label)
                        }
                    }
                }
            } catch (e: Exception) { /* unreadable subfolder: skip it, keep the rest */ }
        }
    }

    fun search(query: String, type: DocType = DocType.ANY, limit: Int = 8): List<DocFile> =
        DocSearch.rank(_files.value, query, type, limit)

    fun byId(id: String): DocFile? = _files.value.firstOrNull { it.id == id }

    fun clearAll() {
        _grants.value.forEach { runCatching { resolver.releasePersistableUriPermission(it.uri, Intent.FLAG_GRANT_READ_URI_PERMISSION) } }
        _grants.value = readGrants()
        _files.value = emptyList()
    }

    private fun idOf(uri: String) = MessageDigest.getInstance("SHA-256").digest(uri.toByteArray()).joinToString("") { "%02x".format(it) }.take(10)

    private companion object { const val MAX_FILES = 5000; const val MAX_DEPTH = 5 }
}
