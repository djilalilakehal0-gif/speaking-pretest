package com.ecoleeyes.app

import android.app.Application
import androidx.test.core.app.ApplicationProvider
import com.ecoleeyes.core.L10n
import com.ecoleeyes.core.Lang
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/** Counted phrases are spoken with correct grammar: "1 page" not "1 pages"; Arabic's six plural forms. */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class PluralsTest {
    private val l10n = L10n(ApplicationProvider.getApplicationContext<Application>())
    private fun p(lang: Lang, id: Int, n: Int, vararg a: Any) = l10n.plural(lang, id, n, *a)

    @Test fun english_and_french_singular_and_plural() {
        assertEquals("Reading Bill, 1 page.", p(Lang.EN, R.plurals.say_reading_start, 1, "Bill", 1))
        assertEquals("Reading Bill, 12 pages.", p(Lang.EN, R.plurals.say_reading_start, 12, "Bill", 12))
        assertEquals("You have 1 note. x", p(Lang.EN, R.plurals.say_notes_list, 1, 1, "x"))
        assertEquals("Folder added. I found 1 document.", p(Lang.EN, R.plurals.say_folder_added, 1, 1))
        assertEquals("Folder added. I found 0 documents.", p(Lang.EN, R.plurals.say_folder_added, 0, 0))
        assertEquals("Lecture de Bill, 1 page.", p(Lang.FR, R.plurals.say_reading_start, 1, "Bill", 1))
        assertEquals("Dossier ajouté. J’ai trouvé 0 document.", p(Lang.FR, R.plurals.say_folder_added, 0, 0))   // French: 0 is singular
        assertEquals("3 heures", p(Lang.FR, R.plurals.duration_hours, 3, 3))
    }

    @Test fun arabic_uses_all_six_forms() {
        val m = { n: Int -> p(Lang.AR, R.plurals.duration_minutes, n, n) }
        assertEquals("دقيقة واحدة", m(1))
        assertEquals("دقيقتين", m(2))
        assertEquals("٣ دقائق", m(3))
        assertEquals("١٠ دقائق", m(10))
        assertEquals("١١ دقيقة", m(11))
        assertEquals("١٠٠ دقيقة", m(100))
        assertEquals("تمت إضافة المجلد. لم أجد أي مستند.", p(Lang.AR, R.plurals.say_folder_added, 0, 0))
        assertEquals("تمت إضافة المجلد. وجدت مستندين.", p(Lang.AR, R.plurals.say_folder_added, 2, 2))
        assertEquals("لديك إشعار واحد. س", p(Lang.AR, R.plurals.say_notif_list, 1, 1, "س"))
        assertEquals("أقرأ ملف، صفحتان.", p(Lang.AR, R.plurals.say_reading_start, 2, "ملف", 2))
    }

    @Test fun every_quantity_keeps_its_placeholders_in_every_language() {
        // A missing %2$s would silently drop the document name or the list being read.
        val ids = listOf(R.plurals.say_found_many to 2, R.plurals.say_reading_start to 1, R.plurals.say_notes_list to 2, R.plurals.say_notif_list to 2)
        for (lang in Lang.entries) for ((id, _) in ids) for (n in listOf(2, 3, 5, 11, 25, 100)) {
            val s = if (id == R.plurals.say_reading_start) p(lang, id, n, "MARK", n) else p(lang, id, n, n, "MARK")
            assert(s.contains("MARK")) { "$lang n=$n lost its text argument: $s" }
        }
    }
}
