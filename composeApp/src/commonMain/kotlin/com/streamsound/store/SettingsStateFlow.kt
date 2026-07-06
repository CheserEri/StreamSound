package com.streamsound.store

import com.streamsound.model.LyricsSize
import com.streamsound.model.Theme
import com.streamsound.network.ApiClient
import com.streamsound.service.StorageService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

object SettingsStateFlow {
    private val _theme = MutableStateFlow(StorageService.getTheme())
    val theme: StateFlow<Theme> = _theme.asStateFlow()

    private val _serverUrl = MutableStateFlow(StorageService.getServerUrl())
    val serverUrl: StateFlow<String> = _serverUrl.asStateFlow()

    private val _lyricsSize = MutableStateFlow(StorageService.getLyricsSize())
    val lyricsSize: StateFlow<LyricsSize> = _lyricsSize.asStateFlow()

    private val _audioCacheEnabled = MutableStateFlow(StorageService.isAudioCacheEnabled())
    val audioCacheEnabled: StateFlow<Boolean> = _audioCacheEnabled.asStateFlow()

    private val _audioCacheMaxMb = MutableStateFlow(StorageService.getAudioCacheMaxMb())
    val audioCacheMaxMb: StateFlow<Int> = _audioCacheMaxMb.asStateFlow()

    fun setTheme(theme: Theme) {
        _theme.value = theme
        StorageService.setTheme(theme)
    }

    fun setServerUrl(url: String) {
        _serverUrl.value = url
        ApiClient.setServerUrl(url)
    }

    fun setLyricsSize(size: LyricsSize) {
        _lyricsSize.value = size
        StorageService.setLyricsSize(size)
    }

    fun setAudioCacheEnabled(enabled: Boolean) {
        _audioCacheEnabled.value = enabled
        StorageService.setAudioCacheEnabled(enabled)
    }

    fun setAudioCacheMaxMb(mb: Int) {
        _audioCacheMaxMb.value = mb
        StorageService.setAudioCacheMaxMb(mb)
    }

    fun loadFromStorage() {
        _theme.value = StorageService.getTheme()
        _serverUrl.value = StorageService.getServerUrl()
        _lyricsSize.value = StorageService.getLyricsSize()
        _audioCacheEnabled.value = StorageService.isAudioCacheEnabled()
        _audioCacheMaxMb.value = StorageService.getAudioCacheMaxMb()
    }
}
