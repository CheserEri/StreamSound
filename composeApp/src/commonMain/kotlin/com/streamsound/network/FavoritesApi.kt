package com.streamsound.network

import com.streamsound.model.*
import io.ktor.client.call.*
import io.ktor.client.request.*

object FavoritesApi {
    suspend fun getFavorites(limit: Int = 100): List<FavoriteTrack> {
        return ApiClient.client.get("/favorites") {
            parameter("limit", limit)
        }.body<ApiResponse<List<FavoriteTrack>>>().data
    }

    suspend fun addFavorite(trackId: Int) {
        ApiClient.client.post("/favorites/$trackId")
    }

    suspend fun removeFavorite(trackId: Int) {
        ApiClient.client.delete("/favorites/$trackId")
    }
}
