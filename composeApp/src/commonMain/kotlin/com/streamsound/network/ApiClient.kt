package com.streamsound.network

import com.streamsound.model.ApiResponse
import com.streamsound.model.RefreshTokenResponse
import com.streamsound.service.StorageService
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.plugins.*
import io.ktor.client.plugins.auth.*
import io.ktor.client.plugins.auth.providers.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json

object ApiClient {
    private var _serverUrl: String = ""

    val client: HttpClient = HttpClient {
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
                isLenient = true
                encodeDefaults = true
            })
        }

        defaultRequest {
            url {
                val serverUrl = _serverUrl.ifEmpty { StorageService.getServerUrl() }
                if (serverUrl.isNotEmpty()) {
                    val cleanUrl = serverUrl.removeSuffix("/")
                    protocol = if (cleanUrl.startsWith("https")) URLProtocol.HTTPS else URLProtocol.HTTP
                    val hostPort = cleanUrl.removePrefix("http://").removePrefix("https://")
                    val parts = hostPort.split(":")
                    host = parts[0]
                    if (parts.size > 1) port = parts[1].toIntOrNull() ?: 80 else port = if (protocol == URLProtocol.HTTPS) 443 else 80
                }
            }
            contentType(ContentType.Application.Json)
        }

        install(Auth) {
            bearer {
                loadTokens {
                    val access = StorageService.getAccessToken()
                    val refresh = StorageService.getRefreshToken()
                    if (access.isNotEmpty()) BearerTokens(access, refresh) else null
                }
                refreshTokens {
                    val refreshToken = StorageService.getRefreshToken()
                    if (refreshToken.isEmpty()) return@refreshTokens null
                    try {
                        val response = client.post("/auth/refresh") {
                            setBody(mapOf("refreshToken" to refreshToken))
                            markAsRefreshTokenRequest()
                        }
                        val body = response.call.body<ApiResponse<RefreshTokenResponse>>().data
                        StorageService.setAccessToken(body.accessToken)
                        BearerTokens(body.accessToken, refreshToken)
                    } catch (_: Exception) {
                        StorageService.clearAuth()
                        null
                    }
                }
            }
        }

        install(HttpRequestRetry) {
            retryOnServerErrors(maxRetries = 3)
            retryOnException(maxRetries = 3, retryOnTimeout = true)
            exponentialDelay()
        }
    }

    fun setServerUrl(url: String) {
        _serverUrl = url
        StorageService.setServerUrl(url)
    }

    fun getServerUrl(): String = _serverUrl.ifEmpty { StorageService.getServerUrl() }
}
