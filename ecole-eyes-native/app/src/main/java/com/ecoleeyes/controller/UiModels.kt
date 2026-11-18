package com.ecoleeyes.controller

import com.ecoleeyes.docs.DocFile
import com.ecoleeyes.docs.ReaderState
import com.ecoleeyes.voice.Screen

enum class Phase { IDLE, LISTENING, THINKING, SPEAKING }

data class ReaderUi(val title: String, val page: Int, val pageCount: Int, val state: ReaderState)

data class UiState(
    val screen: Screen = Screen.HOME,
    val phase: Phase = Phase.IDLE,
    /** Live partial transcription while the user speaks. */
    val partial: String = "",
    /** The last thing the assistant said (also shown large on screen for helpers and low-vision users). */
    val lastSaid: String = "",
    val reader: ReaderUi? = null,
    val live: Boolean = false,
    val searchQuery: String = "",
    val results: List<DocFile> = emptyList(),
    val handsFreeActive: Boolean = false,
)

/** One-shot requests from the controller to the Activity (things only an Activity can do). */
sealed interface UiEvent {
    data class RequestPermission(val permission: String) : UiEvent
    /** Several permissions in one system dialog (Android 12+ requires fine + coarse location together). */
    data class RequestPermissions(val permissions: List<String>) : UiEvent
    data object PickFolder : UiEvent
    data object PickFile : UiEvent
    data object CloseApp : UiEvent
}
