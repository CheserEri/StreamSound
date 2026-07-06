package com.streamsound.network

import com.streamsound.model.*
import io.ktor.client.call.*
import io.ktor.client.request.*

object LibraryApi {
    suspend fun getFolders(): List<Folder> {
        return ApiClient.client.get("/library/folders").body<ApiResponse<List<Folder>>>().data
    }

    suspend fun getTracks(
        folderId: Int,
        limit: Int = 50,
        offset: Int = 0,
        sort: String = "title"
    ): PaginatedResponse<TrackListItem> {
        return ApiClient.client.get("/library/folders/$folderId/tracks") {
            parameter("limit", limit)
            parameter("offset", offset)
            parameter("sort", sort)
        }.body()
    }

    suspend fun getTrackDetail(trackId: Int): TrackDetail {
        return ApiClient.client.get("/library/tracks/$trackId").body<ApiResponse<TrackDetail>>().data
    }

    suspend fun reportPlayHistory(trackId: Int) {
        try {
            ApiClient.client.post("/history/$trackId")
        } catch (_: Exception) {}
    }
}
