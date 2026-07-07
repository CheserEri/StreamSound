package com.streamsound.store

import com.streamsound.model.*
import com.streamsound.network.ApiClient
import com.streamsound.service.StorageService
import io.ktor.client.call.*
import io.ktor.client.request.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

object AuthStateFlow {

    private val _isAuthenticated = MutableStateFlow(false)
    val isAuthenticated: StateFlow<Boolean> = _isAuthenticated.asStateFlow()

    private val _user = MutableStateFlow<User?>(null)
    val user: StateFlow<User?> = _user.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    init {
        loadFromStorage()
    }

    fun loadFromStorage() {
        if (StorageService.isLoggedIn()) {
            val userId = StorageService.getUserId()
            val username = StorageService.getUsername()
            val role = try {
                UserRole.valueOf(StorageService.getUserRole().uppercase())
            } catch (_: Exception) { UserRole.USER }
            _user.value = User(userId, username, role)
            _isAuthenticated.value = true
        }
    }

    suspend fun login(serverUrl: String, username: String, password: String): Boolean {
        _isLoading.value = true
        _error.value = null
        return try {
            ApiClient.setServerUrl(serverUrl)
            val response = ApiClient.client.post("/auth/login") {
                setBody(LoginRequest(username, password))
            }.body<ApiResponse<LoginResponse>>().data
            StorageService.setAccessToken(response.accessToken)
            StorageService.setRefreshToken(response.refreshToken)
            StorageService.setUserId(response.user.id)
            StorageService.setUsername(response.user.username)
            StorageService.setUserRole(response.user.role.name.lowercase())
            _user.value = response.user
            _isAuthenticated.value = true
            _isLoading.value = false
            true
        } catch (e: Exception) {
            _error.value = e.message ?: "登录失败"
            _isLoading.value = false
            false
        }
    }

    suspend fun register(serverUrl: String, username: String, password: String): String? {
        _isLoading.value = true
        _error.value = null
        return try {
            ApiClient.setServerUrl(serverUrl)
            val response = ApiClient.client.post("/auth/register") {
                setBody(RegisterRequest(username, password))
            }.body<ApiResponse<RegisterResponse>>().data
            _isLoading.value = false
            response.message
        } catch (e: Exception) {
            _error.value = e.message ?: "注册失败"
            _isLoading.value = false
            null
        }
    }

    fun logout() {
        StorageService.clearAuth()
        _user.value = null
        _isAuthenticated.value = false
    }
}
