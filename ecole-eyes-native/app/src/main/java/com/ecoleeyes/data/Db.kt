package com.ecoleeyes.data

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import kotlinx.coroutines.flow.Flow

/** Message text is stored encrypted ([body] is ciphertext). */
@Entity(tableName = "messages")
data class MessageEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val ts: Long,
    val role: String,
    val body: String,
)

/** Reading position per document. [key] is a hash of the URI; the URI and title live encrypted in [body]. */
@Entity(tableName = "positions")
data class PositionEntity(
    @PrimaryKey val key: String,
    val updatedAt: Long,
    val body: String,
)

/** A note dictated by the user ("take a note ..."). [body] is ciphertext. */
@Entity(tableName = "notes")
data class NoteEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val ts: Long,
    val body: String,
)

@Dao
interface NoteDao {
    @Insert suspend fun insert(n: NoteEntity)
    @Query("SELECT * FROM notes ORDER BY id DESC") suspend fun all(): List<NoteEntity>
    @Query("DELETE FROM notes") suspend fun clear()
    @Query("DELETE FROM notes WHERE id = :id") suspend fun delete(id: Long)
}

@Dao
interface MessageDao {
    @Insert suspend fun insert(m: MessageEntity)
    @Query("SELECT * FROM messages ORDER BY id ASC") fun observeAll(): Flow<List<MessageEntity>>
    @Query("DELETE FROM messages") suspend fun clear()
    @Query("DELETE FROM messages WHERE id NOT IN (SELECT id FROM messages ORDER BY id DESC LIMIT :keep)") suspend fun trim(keep: Int)
}

@Dao
interface PositionDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun upsert(p: PositionEntity)
    @Query("SELECT * FROM positions WHERE `key` = :key") suspend fun get(key: String): PositionEntity?
    @Query("DELETE FROM positions") suspend fun clear()
    @Query("DELETE FROM positions WHERE `key` = :key") suspend fun delete(key: String)
}

@Database(entities = [MessageEntity::class, PositionEntity::class, NoteEntity::class], version = 2, exportSchema = true)
abstract class AppDatabase : RoomDatabase() {
    abstract fun messages(): MessageDao
    abstract fun positions(): PositionDao
    abstract fun notes(): NoteDao

    companion object {
        fun create(context: Context): AppDatabase =
            Room.databaseBuilder(context, AppDatabase::class.java, "ecoleeyes.db").addMigrations(MIGRATION_1_2).build()

        /** v2 adds dictated notes; existing conversation and reading positions are kept. */
        val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("CREATE TABLE IF NOT EXISTS `notes` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `ts` INTEGER NOT NULL, `body` TEXT NOT NULL)")
            }
        }
    }
}
