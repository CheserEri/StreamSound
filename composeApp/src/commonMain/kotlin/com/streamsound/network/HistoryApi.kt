package com.streamsound.network

import com.streamsound.model.*
import io.ktor.client.call.*
import io.ktor.client.request.*

object HistoryApi {
    suspend fun getHistory(limit: Int = 50): List<HistoryTrack> {
        return ApiClient.client.get("/history") {
            parameter("limit", limit)
        }.body<ApiResponse<List<HistoryTrack>>>().data
    }
}
