package com.streamsound.network

import com.streamsound.model.*
import io.ktor.client.call.*
import io.ktor.client.request.*

object AdminApi {
    suspend fun getUsers(): List<AdminUser> {
        return ApiClient.client.get("/admin/users").body<PaginatedResponse<AdminUser>>().data
    }

    suspend fun approveUser(userId: Int, approved: Boolean) {
        ApiClient.client.patch("/admin/users/$userId/approve") {
            setBody(mapOf("approved" to approved))
        }
    }

    suspend fun startScan(path: String) {
        ApiClient.client.post("/admin/scan") {
            setBody(mapOf("musicRoot" to path))
        }
    }

    suspend fun getScanStatus(): ScanStatus {
        return ApiClient.client.get("/admin/scan/status").body<ApiResponse<ScanStatus>>().data
    }

    suspend fun getMusicRoot(): String {
        return ApiClient.client.get("/admin/scan/music-root").body<ApiResponse<Map<String, String>>>().data["musicRoot"] ?: ""
    }
}
