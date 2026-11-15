package com.ecoleeyes.app

import android.app.Application
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import com.ecoleeyes.core.AppSettings
import com.ecoleeyes.core.Consent
import com.ecoleeyes.core.L10n
import com.ecoleeyes.core.Lang
import com.ecoleeyes.core.SettingsStore
import com.ecoleeyes.core.TextCipher
import com.ecoleeyes.data.AppDatabase
import com.ecoleeyes.data.HistoryRepository
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class StringsAndStorageTest {
    private val ctx: Application get() = ApplicationProvider.getApplicationContext()

    // ---- localization ---------------------------------------------------------------------------------------------------

    private val placeholder = Regex("%(\\d+)\\$([sd])")

    @Test fun every_string_exists_in_all_three_languages_with_the_same_placeholders() {
        val l10n = L10n(ctx)
        val fields = R.string::class.java.fields.filter { it.type == Int::class.javaPrimitiveType }
        assertTrue("expected many strings", fields.size > 150)
        for (f in fields) {
            val id = f.getInt(null)
            val raw = Lang.entries.associateWith { l10n.context(it).resources.getString(id) }
            val holders = raw.mapValues { (_, v) -> placeholder.findAll(v).map { it.value }.sorted().toList() }
            assertEquals("placeholders differ for ${f.name}: $holders", 1, holders.values.toSet().size)
            for ((lang, v) in raw) assertTrue("${f.name} empty in $lang", v.isNotBlank())
            val args = holders.getValue(Lang.EN).map { if (it.endsWith("d")) 3 else "x" }
            for (lang in Lang.entries) l10n.str(lang, id, *args.toTypedArray())     // must format without throwing
        }
    }

    @Test fun arabic_and_french_are_really_translated() {
        val l10n = L10n(ctx)
        for (id in listOf(R.string.say_welcome, R.string.say_help, R.string.err_offline, R.string.say_consent, R.string.privacy_body)) {
            val en = l10n.str(Lang.EN, id); val fr = l10n.str(Lang.FR, id); val ar = l10n.str(Lang.AR, id)
            assertTrue(en != fr && en != ar && fr != ar)
            assertTrue("Arabic text expected: $ar", ar.any { it in '؀'..'ۿ' })
        }
    }

    @Test fun layout_direction_follows_the_assistant_language() {
        val l10n = L10n(ctx)
        assertEquals(android.view.View.LAYOUT_DIRECTION_RTL, l10n.context(Lang.AR).resources.configuration.layoutDirection)
        assertEquals(android.view.View.LAYOUT_DIRECTION_LTR, l10n.context(Lang.FR).resources.configuration.layoutDirection)
    }

    @Test fun privacy_policy_states_the_key_commitments_in_every_language() {
        val l10n = L10n(ctx)
        for (lang in Lang.entries) {
            val p = l10n.str(lang, R.string.privacy_body)
            assertTrue(p.length > 800)
        }
        val en = l10n.str(Lang.EN, R.string.privacy_body)
        for (k in listOf("microphone", "camera", "photo", "folders", "encrypted", "clear", "not a safety device", "cane")) assertTrue("missing '$k'", en.contains(k, ignoreCase = true))
    }

    // ---- settings -------------------------------------------------------------------------------------------------------

    @Test fun settings_persist_across_instances_and_are_sanitized() {
        val a = SettingsStore(ctx)
        a.update { it.copy(lang = Lang.AR, speechRate = 9f, speechVolume = 0f, consent = Consent.GRANTED, backendUrl = "  https://x.test/  ", liveIntervalSec = 1, appToken = " t ") }
        val b = SettingsStore(ctx).value
        assertEquals(Lang.AR, b.lang)
        assertEquals(2.0f, b.speechRate, 0.001f)
        assertEquals(0.2f, b.speechVolume, 0.001f)
        assertEquals(Consent.GRANTED, b.consent)
        assertEquals("https://x.test", b.backendUrl)
        assertEquals("t", b.appToken)
        assertEquals(4, b.liveIntervalSec)
        assertTrue(b.cloudAllowed && b.backendConfigured)
    }

    @Test fun consent_defaults_to_unknown_and_cloud_is_off_until_granted() {
        val d = AppSettings()
        assertEquals(Consent.UNKNOWN, d.consent)
        assertFalse(d.cloudAllowed)
        assertFalse(AppSettings(backendUrl = "http://insecure.test").backendConfigured)
    }

    // ---- encrypted history ----------------------------------------------------------------------------------------------

    /** Stand-in cipher that visibly scrambles text, to prove the repository never stores plaintext. */
    private object Scramble : TextCipher {
        override fun encrypt(plain: String) = "enc:" + plain.reversed()
        override fun decrypt(encoded: String) = encoded.removePrefix("enc:").reversed()
    }

    private fun repo(max: Int = 200): Pair<HistoryRepository, AppDatabase> {
        val db = Room.inMemoryDatabaseBuilder(ctx, AppDatabase::class.java).allowMainThreadQueries()
            .setQueryExecutor(Runnable::run).setTransactionExecutor(Runnable::run).build()
        return HistoryRepository(db, Scramble, max) to db
    }

    @Test fun messages_are_stored_encrypted_and_read_back() = runBlocking {
        val (r, db) = repo()
        r.add(true, "my bank PIN question", now = 1); r.add(false, "an answer", now = 2)
        val raw = db.messages().observeAll().first()
        assertTrue(raw.none { it.body.contains("PIN") || it.body.contains("answer") })
        assertEquals(listOf("my bank PIN question", "an answer"), r.transcript.first().map { it.text })
        assertEquals(listOf(true, false), r.transcript.first().map { it.fromUser })
        db.close()
    }

    @Test fun history_is_capped_and_clearable() = runBlocking {
        val (r, db) = repo(max = 5)
        repeat(12) { r.add(true, "m$it") }
        assertEquals(listOf("m7", "m8", "m9", "m10", "m11"), r.transcript.first().map { it.text })
        r.clearConversation()
        assertTrue(r.transcript.first().isEmpty())
        db.close()
    }

    @Test fun reading_positions_never_store_the_file_path_in_clear() = runBlocking {
        val (r, db) = repo()
        val uri = "content://com.android.providers.downloads/document/secret-medical-report.pdf"
        r.savePosition(uri, "medical report", 3, 2)
        val row = db.positions().get(HistoryRepository.keyOf(uri))!!
        assertFalse(row.key.contains("medical")); assertFalse(row.body.contains("medical")); assertFalse(row.body.contains("secret"))
        val p = r.loadPosition(uri)!!
        assertEquals(3, p.page); assertEquals(2, p.paragraph); assertEquals("medical report", p.title)
        assertNull(r.loadPosition("content://other"))
        r.savePosition(uri, "medical report", 4, 0)
        assertEquals(4, r.loadPosition(uri)!!.page)          // updates in place
        r.clearAll(); assertNull(r.loadPosition(uri))
        db.close()
    }

    @Test fun corrupt_rows_are_skipped_not_fatal() = runBlocking {
        val (r, db) = repo()
        db.messages().insert(com.ecoleeyes.data.MessageEntity(ts = 1, role = "user", body = "not-decryptable"))
        r.add(true, "fine")
        assertNotNull(r.transcript.first().firstOrNull { it.text == "fine" })
        db.close()
    }
}
