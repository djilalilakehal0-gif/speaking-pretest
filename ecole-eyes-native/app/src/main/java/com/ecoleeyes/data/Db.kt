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

@Database(entities = [MessageEntity::class, PositionEntity::class], version = 1, exportSchema = true)
abstract class AppDatabase : RoomDatabase() {
    abstract fun messages(): MessageDao
    abstract fun positions(): PositionDao

    companion object {
        fun create(context: Context): AppDatabase =
            Room.databaseBuilder(context, AppDatabase::class.java, "ecoleeyes.db").build()
    }
}
