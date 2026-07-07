package com.streamsound.model

import kotlinx.serialization.Serializable

@Serializable
data class ApiResponse<T>(
    val data: T
)

@Serializable
data class PaginatedResponse<T>(
    val data: List<T>,
    val pagination: Pagination
)

@Serializable
data class Pagination(
    val total: Int,
    val limit: Int,
    val offset: Int,
    val hasMore: Boolean = false
)

@Serializable
data class ApiError(
    val error: String,
    val code: String? = null
)

@Serializable
data class LoginRequest(
    val username: String,
    val password: String
)

@Serializable
data class LoginResponse(
    val accessToken: String,
    val refreshToken: String,
    val user: User
)

@Serializable
data class RefreshTokenResponse(
    val accessToken: String
)

@Serializable
data class RegisterRequest(
    val username: String,
    val password: String
)

@Serializable
data class RegisterResponse(
    val message: String,
    val id: Int? = null,
    val username: String? = null,
    val role: UserRole? = null,
    val approved: Boolean? = null
)

@Serializable
data class ScanStatus(
    val isScanning: Boolean = false,
    val scannedCount: Int = 0,
    val addedCount: Int = 0,
    val updatedCount: Int = 0,
    val removedCount: Int = 0,
    val error: String? = null,
    val lastFinishedAt: Long? = null
)

@Serializable
data class AdminUser(
    val id: Int,
    val username: String,
    val role: UserRole,
    val approved: Boolean = false
)
