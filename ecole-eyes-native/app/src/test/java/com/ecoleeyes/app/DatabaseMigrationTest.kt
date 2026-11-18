package com.ecoleeyes.app

import android.app.Application
import android.database.sqlite.SQLiteDatabase
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import com.ecoleeyes.core.NoopCipher
import com.ecoleeyes.data.AppDatabase
import com.ecoleeyes.data.HistoryRepository
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/** Updating the app must keep the user's conversation and reading positions (database v1 -> v2 adds notes). */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class DatabaseMigrationTest {

    @Test fun version_1_database_is_migrated_without_data_loss() = runBlocking {
        val ctx = ApplicationProvider.getApplicationContext<Application>()
        val file = ctx.getDatabasePath("migration-test.db").apply { parentFile?.mkdirs(); delete() }
        // Exactly what version 1 of the app created (schemas/com.ecoleeyes.data.AppDatabase/1.json).
        SQLiteDatabase.openOrCreateDatabase(file, null).use { db ->
            db.execSQL("CREATE TABLE IF NOT EXISTS `messages` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `ts` INTEGER NOT NULL, `role` TEXT NOT NULL, `body` TEXT NOT NULL)")
            db.execSQL("CREATE TABLE IF NOT EXISTS `positions` (`key` TEXT NOT NULL, `updatedAt` INTEGER NOT NULL, `body` TEXT NOT NULL, PRIMARY KEY(`key`))")
            db.execSQL("CREATE TABLE IF NOT EXISTS room_master_table (id INTEGER PRIMARY KEY,identity_hash TEXT)")
            db.execSQL("INSERT OR REPLACE INTO room_master_table (id,identity_hash) VALUES(42, '6dbda367afd92d49a96155881cf1dedc')")
            db.execSQL("INSERT INTO messages (ts, role, body) VALUES (1, 'user', 'hello from version 1')")
            db.version = 1
        }
        val room = Room.databaseBuilder(ctx, AppDatabase::class.java, file.absolutePath)
            .addMigrations(AppDatabase.MIGRATION_1_2).allowMainThreadQueries().build()
        val repo = HistoryRepository(room, NoopCipher)
        assertEquals(listOf("hello from version 1"), repo.transcript.first().map { it.text })
        repo.addNote("a note in version 2")
        assertEquals(listOf("a note in version 2"), repo.notes().map { it.text })
        room.close()
        file.delete()
        Unit
    }
}
