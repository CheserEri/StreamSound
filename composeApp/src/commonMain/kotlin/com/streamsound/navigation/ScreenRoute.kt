package com.streamsound.navigation

import androidx.navigation3.runtime.NavKey
import kotlinx.serialization.Serializable

sealed class ScreenRoute : NavKey {
    @Serializable
    data object Login : ScreenRoute()

    @Serializable
    data object Library : ScreenRoute()

    @Serializable
    data class Folder(
        val folderId: Int,
        val folderName: String
    ) : ScreenRoute()

    @Serializable
    data class Player(
        val trackId: Int
    ) : ScreenRoute()

    @Serializable
    data object Queue : ScreenRoute()

    @Serializable
    data object Search : ScreenRoute()

    @Serializable
    data object Favorites : ScreenRoute()

    @Serializable
    data object History : ScreenRoute()

    @Serializable
    data object Settings : ScreenRoute()

    @Serializable
    data object Admin : ScreenRoute()
}
