package com.ecoleeyes.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.NavigateBefore
import androidx.compose.material.icons.automirrored.filled.NavigateNext
import androidx.compose.material.icons.filled.CreateNewFolder
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.FileOpen
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Replay
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.ecoleeyes.AppGraph
import com.ecoleeyes.app.R
import com.ecoleeyes.docs.ReaderState
import com.ecoleeyes.voice.Screen

/** Used for both "Document reader" and "File search": same data, different heading. */
@Composable
fun DocumentsScreen(graph: AppGraph, files: Boolean, onPickFolder: () -> Unit, onPickFile: () -> Unit) {
    val c = graph.controller
    val ui by c.state.collectAsState()
    val grants by graph.docs.grants.collectAsState()
    val title = stringResource(if (files) R.string.screen_files else R.string.screen_documents)

    ScreenFrame(title, onBack = { c.navigate(Screen.HOME) }) {
        LazyColumn(Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            ui.reader?.let { r ->
                item {
                    Column(Modifier.fillMaxWidth().background(EeColors.Surface, RoundedCornerShape(20.dp)).padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(stringResource(R.string.docs_current, r.title), style = MaterialTheme.typography.titleMedium, color = EeColors.OnDark)
                        Text(stringResource(R.string.docs_page_of, r.page, r.pageCount), style = MaterialTheme.typography.bodyLarge, color = EeColors.Muted)
                        val reading = r.state == ReaderState.READING
                        BigButton(
                            stringResource(if (reading) R.string.docs_pause else R.string.docs_resume), c::readerPauseResume, Modifier.fillMaxWidth(),
                            if (reading) Icons.Filled.Pause else Icons.Filled.PlayArrow,
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            BigButton(stringResource(R.string.docs_prev_page), c::readerPrev, Modifier.weight(1f), Icons.AutoMirrored.Filled.NavigateBefore, emphasized = false)
                            BigButton(stringResource(R.string.docs_next_page), c::readerNext, Modifier.weight(1f), Icons.AutoMirrored.Filled.NavigateNext, emphasized = false)
                        }
                        BigButton(stringResource(R.string.docs_repeat_paragraph), c::readerRepeat, Modifier.fillMaxWidth(), Icons.Filled.Replay, emphasized = false)
                    }
                }
            }
            item {
                val searchDesc = stringResource(R.string.docs_search_cd)
                OutlinedTextField(
                    value = ui.searchQuery, onValueChange = c::searchDocs,
                    label = { Text(stringResource(R.string.docs_search_hint)) },
                    singleLine = true,
                    textStyle = MaterialTheme.typography.bodyLarge,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = EeColors.OnDark, unfocusedTextColor = EeColors.OnDark,
                        focusedBorderColor = EeColors.Electric, unfocusedBorderColor = EeColors.Electric,
                        focusedLabelColor = EeColors.Electric, unfocusedLabelColor = EeColors.Muted, cursorColor = EeColors.OnDark,
                    ),
                    modifier = Modifier.fillMaxWidth().semantics { contentDescription = searchDesc },
                )
            }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    BigButton(stringResource(R.string.docs_add_folder), onPickFolder, Modifier.weight(1f), Icons.Filled.CreateNewFolder)
                    BigButton(stringResource(R.string.docs_add_file), onPickFile, Modifier.weight(1f), Icons.Filled.FileOpen, emphasized = false)
                }
            }
            item { BigButton(stringResource(R.string.docs_refresh), c::refreshDocs, Modifier.fillMaxWidth(), Icons.Filled.Refresh, emphasized = false) }

            item { Text(stringResource(R.string.docs_folders), style = MaterialTheme.typography.titleMedium, color = EeColors.Electric) }
            if (grants.isEmpty()) {
                item { Text(stringResource(R.string.docs_no_folders), style = MaterialTheme.typography.bodyLarge, color = EeColors.Muted) }
            }
            items(grants, key = { it.uri.toString() }) { g ->
                BigButton(stringResource(R.string.docs_remove_folder, g.label), { c.removeGrant(g.uri) }, Modifier.fillMaxWidth(), Icons.Filled.Delete, emphasized = false)
            }

            item { Text(stringResource(R.string.docs_recent), style = MaterialTheme.typography.titleMedium, color = EeColors.Electric) }
            if (ui.results.isEmpty() && grants.isNotEmpty()) item { Text(stringResource(R.string.docs_none_found), style = MaterialTheme.typography.bodyLarge, color = EeColors.Muted) }
            items(ui.results, key = { it.id }) { f ->
                BigButton(stringResource(R.string.docs_read, f.spokenName), { c.readFileFromUi(f) }, Modifier.fillMaxWidth(), Icons.Filled.PlayArrow, emphasized = false)
            }
        }
    }
}
