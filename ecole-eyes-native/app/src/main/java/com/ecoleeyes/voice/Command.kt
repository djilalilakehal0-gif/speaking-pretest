package com.ecoleeyes.voice

import com.ecoleeyes.core.Lang

enum class Screen { HOME, ASSISTANT, CAMERA, DOCUMENTS, FILES, EMERGENCY, SETTINGS, PRIVACY }

enum class DocType { ANY, PDF, WORD, TEXT, RTF, IMAGE }

/** Everything the assistant can do without asking the AI first. Anything else becomes [Ask]. */
sealed interface Command {
    data object Stop : Command
    data object RepeatLast : Command
    data object Back : Command
    data object Close : Command
    data class Open(val screen: Screen) : Command
    data object Time : Command
    data object Help : Command
    data object Greeting : Command
    data object VolumeUp : Command
    data object VolumeDown : Command
    data object SpeedUp : Command
    data object SpeedDown : Command
    data class SetLang(val lang: Lang) : Command
    data object ClearHistory : Command
    data object ReaderPause : Command
    data object ReaderResume : Command
    data object ReaderNextPage : Command
    data object ReaderPrevPage : Command
    data class ReaderGoToPage(val page: Int) : Command
    data object ReaderNextParagraph : Command
    data object ReaderRepeatParagraph : Command
    data object ReadCurrent : Command
    data class FindDocs(val query: String, val type: DocType) : Command
    data class ReadLatest(val type: DocType) : Command
    data class ReadNamed(val query: String) : Command
    data object Describe : Command
    data object ReadTextInView : Command
    data object LiveStart : Command
    data object LiveStop : Command
    data class SetCloud(val allowed: Boolean) : Command
    data object Yes : Command
    data object No : Command
    // emergency
    data object Emergency : Command
    data object CallEmergencyContact : Command
    data object CallEmergencyServices : Command
    data object ShareLocation : Command
    data class SetEmergencyContact(val name: String) : Command
    // phone
    /** [who] is a contact name or a spoken number. */
    data class Call(val who: String) : Command
    data class OpenApp(val name: String) : Command
    data class CreateNote(val text: String) : Command
    data object ReadNotes : Command
    data object ClearNotes : Command
    data class Remind(val minutes: Int, val text: String) : Command
    data object ReadNotifications : Command
    data object Battery : Command
    data object Date : Command
    data object Status : Command
    // on-device vision
    data object WhatColor : Command
    /** "Describe this thing", "what is this", "واش هذا": a detailed description of the object in front of the camera. */
    data object DescribeObject : Command
    data object People : Command
    /** "next" with no object: next search result or next page depending on context. */
    data object Next : Command
    /** Free-form request for the AI (tools may still be used). [wake] is true if it began with the wake phrase. */
    data class Ask(val text: String) : Command
}
