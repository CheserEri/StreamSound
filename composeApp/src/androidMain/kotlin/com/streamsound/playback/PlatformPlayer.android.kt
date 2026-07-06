package com.streamsound.playback

import com.streamsound.model.TrackListItem

actual object PlatformPlayer {
    actual fun play() {
        PlayerConnector.play()
    }

    actual fun pause() {
        PlayerConnector.pause()
    }

    actual fun seekTo(positionSeconds: Double) {
        PlayerConnector.seekTo(positionSeconds)
    }

    actual fun skipToNext() {
        PlayerConnector.skipToNext()
    }

    actual fun skipToPrevious() {
        PlayerConnector.skipToPrevious()
    }

    actual fun setQueue(tracks: List<TrackListItem>, startIndex: Int) {
        PlayerConnector.setQueue(tracks, startIndex)
    }

    actual fun stop() {
        PlayerConnector.stop()
    }

    actual fun setShuffleMode(enabled: Boolean) {
        PlayerConnector.setShuffleMode(enabled)
    }

    actual fun setRepeatMode(mode: Int) {
        PlayerConnector.setRepeatMode(mode)
    }
}
