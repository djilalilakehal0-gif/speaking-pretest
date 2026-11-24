package com.ecoleeyes.vision

import com.ecoleeyes.core.Lang
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class LocalVisionLogicTest {

    private fun solid(rgb: Int, w: Int = 64, h: Int = 64) = IntArray(w * h) { (0xFF shl 24) or rgb }

    private fun named(rgb: Int) = ColorNamer.analyze(solid(rgb), 64, 64).main

    @Test fun basic_colours_are_named() {
        assertEquals(ColorNamer.Name.RED, named(0xD01010).name)
        assertEquals(ColorNamer.Name.GREEN, named(0x20A030).name)
        assertEquals(ColorNamer.Name.BLUE, named(0x1040D0).name)
        assertEquals(ColorNamer.Name.YELLOW, named(0xF0D020).name)
        assertEquals(ColorNamer.Name.ORANGE, named(0xF08010).name)
        assertEquals(ColorNamer.Name.PURPLE, named(0x7020B0).name)
        assertEquals(ColorNamer.Name.WHITE, named(0xF5F5F5).name)
        assertEquals(ColorNamer.Name.BLACK, named(0x202020).name)
        assertEquals(ColorNamer.Name.GRAY, named(0x808080).name)
    }

    @Test fun brown_is_not_called_orange_or_dark_orange() {
        val c = named(0x6B3E1F)       // chocolate / dark wood
        assertEquals(ColorNamer.Name.BROWN, c.name)
        assertEquals(ColorNamer.Shade.NORMAL, c.shade)
    }

    @Test fun shades_are_spoken_naturally_in_each_language() {
        val darkBlue = named(0x0A1E5A)
        assertEquals(ColorNamer.Shade.DARK, darkBlue.shade)
        assertEquals("dark blue", ColorNamer.phrase(darkBlue, Lang.EN))
        assertEquals("bleu foncé", ColorNamer.phrase(darkBlue, Lang.FR))
        assertEquals("أزرق داكن", ColorNamer.phrase(darkBlue, Lang.AR))
    }

    @Test fun only_the_centre_counts_and_a_clear_second_colour_is_mentioned() {
        val w = 64; val h = 64
        // Red frame everywhere, centre half split between blue (left) and white (right).
        val px = IntArray(w * h) { i ->
            val x = i % w; val y = i / w
            val inCentre = x in 16 until 48 && y in 16 until 48
            (0xFF shl 24) or when { !inCentre -> 0xD01010; x < 32 -> 0x1040D0; else -> 0xF5F5F5 }
        }
        val r = ColorNamer.analyze(px, w, h)
        assertTrue(r.main.name in setOf(ColorNamer.Name.BLUE, ColorNamer.Name.WHITE))
        assertTrue(r.second != null && r.second!!.name in setOf(ColorNamer.Name.BLUE, ColorNamer.Name.WHITE))
        assertFalse(r.main.name == ColorNamer.Name.RED || r.second!!.name == ColorNamer.Name.RED)
    }

    @Test fun a_black_picture_is_reported_as_too_dark_with_advice() {
        val r = ColorNamer.analyze(solid(0x050505), 64, 64)
        assertTrue(r.tooDark)
        assertTrue(r.spoken(Lang.EN).contains("too dark"))
        assertTrue(r.spoken(Lang.AR).contains("مظلمة"))
    }

    @Test fun colour_answers_always_admit_lighting_uncertainty() {
        val r = ColorNamer.analyze(solid(0xD01010), 64, 64)
        for (l in Lang.entries) assertTrue(r.spoken(l), r.spoken(l).contains(Regex("appears|semble|يبدو")))
        assertNull(r.second)
    }

    // ---- scene composition ----------------------------------------------------------------------------------------------

    private fun box(cx: Float, size: Float = 0.2f) = NBox(cx - size / 2, 0.4f, cx + size / 2, 0.4f + size)

    @Test fun objects_are_placed_left_ahead_right_from_the_users_view() {
        assertEquals(Zone.LEFT, SceneComposer.zoneOf(box(0.15f)))
        assertEquals(Zone.AHEAD, SceneComposer.zoneOf(box(0.5f)))
        assertEquals(Zone.RIGHT, SceneComposer.zoneOf(box(0.85f)))
    }

    @Test fun scene_is_described_with_positions_in_three_languages_and_marked_as_an_estimate() {
        val scene = LocalScene(
            objects = listOf(LocalObject("Table", 0.8f, box(0.5f, 0.6f)), LocalObject("Chair", 0.7f, box(0.85f))),
            labels = listOf("Room" to 0.9f), faces = emptyList(),
        )
        val en = SceneComposer.compose(scene, Lang.EN)
        assertTrue(en, en.startsWith("Offline estimate"))
        assertTrue(en, en.contains("In front of you: table, quite close."))
        assertTrue(en, en.contains("On your right: chair."))
        assertTrue(en, en.contains("cane"))                       // never a safety claim
        assertFalse(en, en.contains("room"))                      // scene-only labels are not listed as objects
        val fr = SceneComposer.compose(scene, Lang.FR)
        assertTrue(fr, fr.contains("Devant vous : table") && fr.contains("À votre droite : chaise"))
        val ar = SceneComposer.compose(scene, Lang.AR)
        assertTrue(ar, ar.contains("أمامك: طاولة") && ar.contains("على يمينك: كرسي"))
    }

    @Test fun people_are_counted_and_placed_but_never_identified() {
        val one = LocalScene(emptyList(), emptyList(), listOf(box(0.2f)))
        assertEquals("I can see one person on your left.", SceneComposer.peopleAnswer(one, Lang.EN))
        val two = LocalScene(emptyList(), emptyList(), listOf(box(0.2f), box(0.8f)))
        assertEquals("I can see 2 people, on your left and on your right.", SceneComposer.peopleAnswer(two, Lang.EN))
        assertTrue(SceneComposer.peopleAnswer(two, Lang.AR).contains("شخصين"))
        val none = LocalScene(emptyList(), emptyList(), emptyList())
        assertTrue(SceneComposer.peopleAnswer(none, Lang.EN).contains("Someone could still be there"))
    }

    @Test fun low_confidence_and_unnamed_things_are_not_invented() {
        val scene = LocalScene(listOf(LocalObject("Chair", 0.3f, box(0.5f)), LocalObject(null, 0f, box(0.5f))), emptyList(), emptyList())
        val en = SceneComposer.compose(scene, Lang.EN)
        assertFalse(en, en.contains("chair"))
        assertTrue(en, en.contains("cannot name"))
    }

    @Test fun empty_and_dark_scenes_get_helpful_advice() {
        assertTrue(SceneComposer.compose(LocalScene(emptyList(), emptyList(), emptyList()), Lang.EN).contains("connect to the internet"))
        assertTrue(SceneComposer.compose(LocalScene(emptyList(), emptyList(), emptyList(), tooDark = true), Lang.FR).contains("trop sombre"))
    }

    @Test fun unknown_labels_fall_back_to_english_words() {
        assertEquals("porte", LabelDictionary.translate("Door", Lang.FR))
        assertEquals("باب", LabelDictionary.translate("Door", Lang.AR))
        assertEquals("skateboard", LabelDictionary.translate("Skateboard", Lang.FR))
    }

    @Test fun lists_are_joined_naturally() {
        assertEquals("a, b and c", SceneComposer.joinAnd(listOf("a", "b", "c"), Lang.EN))
        assertEquals("a et b", SceneComposer.joinAnd(listOf("a", "b"), Lang.FR))
        assertEquals("أ وب", SceneComposer.joinAnd(listOf("أ", "ب"), Lang.AR))
    }
}
