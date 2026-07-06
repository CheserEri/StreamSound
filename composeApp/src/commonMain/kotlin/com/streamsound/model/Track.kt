package com.streamsound.model

import kotlinx.serialization.Serializable

@Serializable
data class TrackListItem(
    val id: Int,
    val title: String,
    val artist: String,
    val album: String? = null,
    val duration: Double? = null,
    val hasCover: Boolean = false,
    val hasLyrics: Boolean = false,
    val folderId: Int? = null
)

@Serializable
data class TrackDetail(
    val id: Int,
    val title: String,
    val artist: String,
    val album: String? = null,
    val duration: Double? = null,
    val hasCover: Boolean = false,
    val hasLyrics: Boolean = false,
    val folderId: Int? = null,
    val bitrate: Int? = null,
    val sampleRate: Int? = null,
    val mimeType: String? = null,
    val fileSize: Long? = null,
    val lyrics: String? = null,
    val isFavorited: Boolean = false,
    val coverDominantColor: String? = null
)

@Serializable
data class FavoriteTrack(
    val id: Int,
    val title: String,
    val artist: String,
    val album: String? = null,
    val duration: Double? = null,
    val hasCover: Boolean = false,
    val hasLyrics: Boolean = false,
    val folderId: Int? = null,
    val favoritedAt: Long? = null
)

@Serializable
data class HistoryTrack(
    val id: Int,
    val title: String,
    val artist: String,
    val album: String? = null,
    val duration: Double? = null,
    val hasCover: Boolean = false,
    val hasLyrics: Boolean = false,
    val folderId: Int? = null,
    val playedAt: Long? = null
)
