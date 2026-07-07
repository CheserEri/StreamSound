package com.streamsound.playback

import android.content.ComponentName
import android.content.Context
import android.net.Uri
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.google.common.util.concurrent.ListenableFuture
import com.streamsound.model.TrackListItem
import com.streamsound.network.ApiClient
import com.streamsound.service.StorageService

/**
 * Manages the connection between UI (PlayerStateFlow) and the PlaybackService via MediaController.
 */
object PlayerConnector {

    private var mediaController: MediaController? = null
    private var controllerFuture: ListenableFuture<MediaController>? = null
    private var progressCallback: Runnable? = null
    private val handler = android.os.Handler(android.os.Looper.getMainLooper())

    fun connect(context: Context) {
        if (mediaController != null) return

        val sessionToken = SessionToken(
            context,
            ComponentName(context, PlaybackService::class.java)
        )
        controllerFuture = MediaController.Builder(context, sessionToken).buildAsync()
        controllerFuture?.addListener({
            mediaController = controllerFuture?.get()
            mediaController?.addListener(PlayerListener())
            startProgressSync()
        }, MoreExecutors.directExecutor())
    }

    fun disconnect() {
        stopProgressSync()
        mediaController?.release()
        mediaController = null
        controllerFuture?.cancel(true)
        controllerFuture = null
    }

    fun play() {
        mediaController?.play()
    }

    fun pause() {
        mediaController?.pause()
    }

    fun seekTo(positionSeconds: Double) {
        mediaController?.seekTo((positionSeconds * 1000).toLong())
    }

    fun skipToNext() {
        mediaController?.seekToNext()
    }

    fun skipToPrevious() {
        mediaController?.seekToPrevious()
    }

    fun stop() {
        mediaController?.stop()
    }

    fun setQueue(tracks: List<TrackListItem>, startIndex: Int) {
        val controller = mediaController ?: return
        val serverUrl = ApiClient.getServerUrl()
        val token = StorageService.getAccessToken()

        val mediaItems = tracks.map { track ->
            val streamUrl = "${serverUrl.removeSuffix("/")}/stream/${track.id}"
            val coverUrl = "${serverUrl.removeSuffix("/")}/covers/${track.id}"
            MediaItem.Builder()
                .setMediaId(track.id.toString())
                .setUri(streamUrl)
                .setMediaMetadata(
                    MediaMetadata.Builder()
                        .setTitle(track.title)
                        .setArtist(track.artist)
                        .setAlbumTitle(track.album)
                        .setArtworkUri(
                            if (track.hasCover)
                                Uri.parse(coverUrl)
                            else null
                        )
                        .build()
                )
                .setCustomCacheKey("stream_${track.id}")
                .build()
        }

        controller.setMediaItems(mediaItems, startIndex, 0)
        controller.prepare()
        controller.play()
    }

    fun setShuffleMode(enabled: Boolean) {
        mediaController?.shuffleModeEnabled = enabled
    }

    fun setRepeatMode(mode: Int) {
        mediaController?.repeatMode = mode
    }

    fun getCurrentPosition(): Double {
        return (mediaController?.currentPosition ?: 0) / 1000.0
    }

    fun getDuration(): Double {
        return (mediaController?.duration ?: 0) / 1000.0
    }

    fun isPlaying(): Boolean {
        return mediaController?.isPlaying == true
    }

    private fun startProgressSync() {
        progressCallback = object : Runnable {
            override fun run() {
                val controller = mediaController ?: return
                if (controller.isPlaying) {
                    com.streamsound.store.PlayerStateFlow.onExternalProgressChanged(
                        controller.currentPosition / 1000.0
                    )
                }
                handler.postDelayed(this, 250)
            }
        }
        handler.post(progressCallback!!)
    }

    private fun stopProgressSync() {
        progressCallback?.let { handler.removeCallbacks(it) }
        progressCallback = null
    }

    private class PlayerListener : Player.Listener {
        override fun onIsPlayingChanged(isPlaying: Boolean) {
            com.streamsound.store.PlayerStateFlow.onExternalIsPlayingChanged(isPlaying)
        }

        override fun onPlaybackStateChanged(playbackState: Int) {
            if (playbackState == Player.STATE_READY) {
                val duration = (mediaController?.duration ?: 0) / 1000.0
                com.streamsound.store.PlayerStateFlow.onExternalDurationChanged(duration)
            }
        }

        override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
            val index = mediaController?.currentMediaItemIndex ?: 0
            com.streamsound.store.PlayerStateFlow.onExternalTrackChanged(index)
        }

        override fun onPlayerError(error: androidx.media3.common.PlaybackException) {
            mediaController?.let {
                if (it.hasNextMediaItem()) it.seekToNext()
                else it.stop()
            }
        }
    }
}

private object MoreExecutors {
    fun directExecutor(): java.util.concurrent.Executor = java.util.concurrent.Executor { it.run() }
}
