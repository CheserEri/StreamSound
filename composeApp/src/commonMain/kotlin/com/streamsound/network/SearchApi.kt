package com.streamsound.network

import com.streamsound.model.SearchResult
import io.ktor.client.call.*
import io.ktor.client.request.*

object SearchApi {
    suspend fun search(query: String, limit: Int = 20): SearchResult {
        return ApiClient.client.get("/search") {
            parameter("q", query)
            parameter("limit", limit)
        }.body()
    }
}
