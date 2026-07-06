package com.streamsound.playback

import com.streamsound.model.TrackListItem

/**
 * Platform-specific player connector. On Android, this delegates to MediaController/MediaSession.
 */
expect object PlatformPlayer {
    fun play()
    fun pause()
    fun seekTo(positionSeconds: Double)
    fun skipToNext()
    fun skipToPrevious()
    fun setQueue(tracks: List<TrackListItem>, startIndex: Int)
    fun stop()
    fun setShuffleMode(enabled: Boolean)
    fun setRepeatMode(mode: Int)
}
