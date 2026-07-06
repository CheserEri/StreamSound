package com.streamsound.service

import com.russhwolf.settings.Settings
import com.streamsound.model.Theme
import com.streamsound.model.LyricsSize

object StorageService {
    private val settings: Settings = Settings()

    object Keys {
        const val SERVER_URL = "server_url"
        const val ACCESS_TOKEN = "access_token"
        const val REFRESH_TOKEN = "refresh_token"
        const val USER_ID = "user_id"
        const val USERNAME = "username"
        const val USER_ROLE = "user_role"
        const val THEME = "theme"
        const val LYRICS_SIZE = "lyrics_size"
        const val AUDIO_CACHE_ENABLED = "audio_cache_enabled"
        const val AUDIO_CACHE_MAX_MB = "audio_cache_max_mb"
    }

    // Server URL
    fun getServerUrl(): String = settings.getString(Keys.SERVER_URL, "")
    fun setServerUrl(url: String) = settings.putString(Keys.SERVER_URL, url)

    // Tokens
    fun getAccessToken(): String = settings.getString(Keys.ACCESS_TOKEN, "")
    fun setAccessToken(token: String) = settings.putString(Keys.ACCESS_TOKEN, token)
    fun getRefreshToken(): String = settings.getString(Keys.REFRESH_TOKEN, "")
    fun setRefreshToken(token: String) = settings.putString(Keys.REFRESH_TOKEN, token)

    // User
    fun getUserId(): Int = settings.getInt(Keys.USER_ID, -1)
    fun setUserId(id: Int) = settings.putInt(Keys.USER_ID, id)
    fun getUsername(): String = settings.getString(Keys.USERNAME, "")
    fun setUsername(username: String) = settings.putString(Keys.USERNAME, username)
    fun getUserRole(): String = settings.getString(Keys.USER_ROLE, "user")
    fun setUserRole(role: String) = settings.putString(Keys.USER_ROLE, role)

    // Theme
    fun getTheme(): Theme {
        val value = settings.getString(Keys.THEME, "dark")
        return try { Theme.valueOf(value.uppercase()) } catch (_: Exception) { Theme.DARK }
    }
    fun setTheme(theme: Theme) = settings.putString(Keys.THEME, theme.name.lowercase())

    // Lyrics size
    fun getLyricsSize(): LyricsSize {
        val value = settings.getString(Keys.LYRICS_SIZE, "md")
        return try { LyricsSize.valueOf(value.uppercase()) } catch (_: Exception) { LyricsSize.MD }
    }
    fun setLyricsSize(size: LyricsSize) = settings.putString(Keys.LYRICS_SIZE, size.name.lowercase())

    // Audio cache
    fun isAudioCacheEnabled(): Boolean = settings.getBoolean(Keys.AUDIO_CACHE_ENABLED, true)
    fun setAudioCacheEnabled(enabled: Boolean) = settings.putBoolean(Keys.AUDIO_CACHE_ENABLED, enabled)
    fun getAudioCacheMaxMb(): Int = settings.getInt(Keys.AUDIO_CACHE_MAX_MB, 512)
    fun setAudioCacheMaxMb(mb: Int) = settings.putInt(Keys.AUDIO_CACHE_MAX_MB, mb)

    // Clear all auth data
    fun clearAuth() {
        settings.remove(Keys.ACCESS_TOKEN)
        settings.remove(Keys.REFRESH_TOKEN)
        settings.remove(Keys.USER_ID)
        settings.remove(Keys.USERNAME)
        settings.remove(Keys.USER_ROLE)
    }

    fun isLoggedIn(): Boolean = getAccessToken().isNotEmpty()
}
