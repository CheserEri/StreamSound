package com.streamsound.model

import kotlinx.serialization.Serializable

@Serializable
data class SearchResult(
    val tracks: List<SearchTrack> = emptyList(),
    val artists: List<SearchArtist> = emptyList(),
    val albums: List<SearchAlbum> = emptyList()
)

@Serializable
data class SearchTrack(
    val id: Int,
    val title: String,
    val artist: String,
    val album: String? = null,
    val duration: Double? = null,
    val hasCover: Boolean = false,
    val hasLyrics: Boolean = false,
    val folderId: Int? = null,
    val highlight: SearchTrackHighlight? = null,
    val titleHighlight: String? = null,
    val artistHighlight: String? = null
)

@Serializable
data class SearchTrackHighlight(
    val title: String? = null,
    val artist: String? = null,
    val album: String? = null
)

@Serializable
data class SearchArtist(
    val name: String,
    val trackCount: Int = 0,
    val highlight: SearchNameHighlight? = null,
    val nameHighlight: String? = null
)

@Serializable
data class SearchAlbum(
    val name: String,
    val artist: String? = null,
    val trackCount: Int = 0,
    val highlight: SearchNameHighlight? = null,
    val nameHighlight: String? = null
)

@Serializable
data class SearchNameHighlight(
    val name: String? = null
)
