package com.streamsound.store

import com.streamsound.model.PlayMode
import com.streamsound.model.TrackListItem
import com.streamsound.playback.PlatformPlayer
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

object PlayerStateFlow {

    private val _queue = MutableStateFlow<List<TrackListItem>>(emptyList())
    val queue: StateFlow<List<TrackListItem>> = _queue.asStateFlow()

    private val _currentIndex = MutableStateFlow(-1)
    val currentIndex: StateFlow<Int> = _currentIndex.asStateFlow()

    private val _isPlaying = MutableStateFlow(false)
    val isPlaying: StateFlow<Boolean> = _isPlaying.asStateFlow()

    private val _progress = MutableStateFlow(0.0)
    val progress: StateFlow<Double> = _progress.asStateFlow()

    private val _duration = MutableStateFlow(0.0)
    val duration: StateFlow<Double> = _duration.asStateFlow()

    private val _mode = MutableStateFlow(PlayMode.SEQUENTIAL)
    val mode: StateFlow<PlayMode> = _mode.asStateFlow()

    val currentTrack: TrackListItem?
        get() = _queue.value.getOrNull(_currentIndex.value)

    // --- Public API (called from UI) ---

    fun setQueue(tracks: List<TrackListItem>, startIndex: Int) {
        _queue.value = tracks
        _currentIndex.value = startIndex.coerceIn(0, tracks.size - 1)
        _progress.value = 0.0
        _isPlaying.value = true
        PlatformPlayer.setQueue(tracks, startIndex)
    }

    fun play() {
        _isPlaying.value = true
        PlatformPlayer.play()
    }

    fun pause() {
        _isPlaying.value = false
        PlatformPlayer.pause()
    }

    fun skipToNext() {
        val q = _queue.value
        if (q.isEmpty()) return
        when (_mode.value) {
            PlayMode.SHUFFLE -> {
                val newIndex = (0 until q.size).random()
                _currentIndex.value = newIndex
            }
            PlayMode.REPEAT -> {
                // Stay on current
            }
            PlayMode.SEQUENTIAL -> {
                _currentIndex.value = (_currentIndex.value + 1).coerceAtMost(q.size - 1)
            }
        }
        _progress.value = 0.0
        _isPlaying.value = true
        PlatformPlayer.skipToNext()
    }

    fun skipToPrevious() {
        val q = _queue.value
        if (q.isEmpty()) return
        if (_progress.value > 3) {
            _progress.value = 0.0
            PlatformPlayer.seekTo(0.0)
            return
        }
        when (_mode.value) {
            PlayMode.SHUFFLE -> {
                _currentIndex.value = (0 until q.size).random()
            }
            else -> {
                _currentIndex.value = (_currentIndex.value - 1).coerceAtLeast(0)
            }
        }
        _progress.value = 0.0
        _isPlaying.value = true
        PlatformPlayer.skipToPrevious()
    }

    fun seekTo(position: Double) {
        val dur = _duration.value
        _progress.value = position.coerceIn(0.0, if (dur > 0) dur else Double.MAX_VALUE)
        PlatformPlayer.seekTo(position)
    }

    fun toggleMode() {
        val newMode = when (_mode.value) {
            PlayMode.SEQUENTIAL -> PlayMode.SHUFFLE
            PlayMode.SHUFFLE -> PlayMode.REPEAT
            PlayMode.REPEAT -> PlayMode.SEQUENTIAL
        }
        _mode.value = newMode
        // Sync to platform player (REPEAT_MODE_OFF=0, REPEAT_MODE_ONE=1)
        when (newMode) {
            PlayMode.SEQUENTIAL -> {
                PlatformPlayer.setShuffleMode(false)
                PlatformPlayer.setRepeatMode(0) // REPEAT_MODE_OFF
            }
            PlayMode.SHUFFLE -> {
                PlatformPlayer.setShuffleMode(true)
                PlatformPlayer.setRepeatMode(0) // REPEAT_MODE_OFF
            }
            PlayMode.REPEAT -> {
                PlatformPlayer.setShuffleMode(false)
                PlatformPlayer.setRepeatMode(1) // REPEAT_MODE_ONE
            }
        }
    }

    fun reorderQueue(fromIndex: Int, toIndex: Int) {
        val q = _queue.value.toMutableList()
        if (fromIndex !in q.indices || toIndex !in q.indices) return
        val item = q.removeAt(fromIndex)
        q.add(toIndex, item)
        _queue.value = q
        // Adjust current index
        val ci = _currentIndex.value
        _currentIndex.value = when {
            ci == fromIndex -> toIndex
            fromIndex < ci && toIndex >= ci -> ci - 1
            fromIndex > ci && toIndex <= ci -> ci + 1
            else -> ci
        }
    }

    fun removeFromQueue(index: Int) {
        val q = _queue.value.toMutableList()
        if (index !in q.indices) return
        q.removeAt(index)
        _queue.value = q
        val ci = _currentIndex.value
        _currentIndex.value = when {
            index < ci -> ci - 1
            index == ci -> ci.coerceAtMost(q.size - 1)
            else -> ci
        }
    }

    // --- External callbacks (called from platform player) ---

    fun onExternalIsPlayingChanged(isPlaying: Boolean) {
        _isPlaying.value = isPlaying
    }

    fun onExternalDurationChanged(durationSeconds: Double) {
        _duration.value = durationSeconds
    }

    fun onExternalProgressChanged(positionSeconds: Double) {
        _progress.value = positionSeconds
    }

    fun onExternalTrackChanged(mediaItemIndex: Int) {
        _currentIndex.value = mediaItemIndex
        _progress.value = 0.0
    }
}
