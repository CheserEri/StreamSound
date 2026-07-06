package com.streamsound.model

import kotlinx.serialization.Serializable

@Serializable
enum class PlayMode { SEQUENTIAL, SHUFFLE, REPEAT }

@Serializable
enum class LyricsSize { SM, MD, LG }

@Serializable
enum class Theme { LIGHT, DARK }

@Serializable
enum class UserRole { USER, ADMIN }
