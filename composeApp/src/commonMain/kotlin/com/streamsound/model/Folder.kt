package com.streamsound.model

import kotlinx.serialization.Serializable

@Serializable
data class Folder(
    val id: Int,
    val name: String,
    val path: String,
    val parentId: Int? = null,
    val trackCount: Int = 0
)
