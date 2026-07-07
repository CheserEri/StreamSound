package com.streamsound.ui.component

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
import com.moriafly.salt.ui.Icon
import com.streamsound.network.ApiClient
import com.streamsound.service.StorageService

@Composable
fun CoverImage(
    trackId: Int,
    hasCover: Boolean,
    size: Dp = 48.dp,
    borderRadius: Dp = 6.dp,
    modifier: Modifier = Modifier
) {
    if (!hasCover) {
        Box(
            modifier = modifier
                .size(size)
                .clip(RoundedCornerShape(borderRadius))
                .background(Color(0xFF2A2A2A)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                painter = rememberVectorPainter(AppIcons.MusicNote),
                contentDescription = null,
                tint = Color(0xFF555555),
                modifier = Modifier.size(size / 2)
            )
        }
        return
    }

    var isLoading by remember { mutableStateOf(true) }
    var hasError by remember { mutableStateOf(false) }

    if (hasError) {
        Box(
            modifier = modifier
                .size(size)
                .clip(RoundedCornerShape(borderRadius))
                .background(Color(0xFF2A2A2A)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                painter = rememberVectorPainter(AppIcons.MusicNote),
                contentDescription = null,
                tint = Color(0xFF555555),
                modifier = Modifier.size(size / 2)
            )
        }
        return
    }

    Box(
        modifier = modifier.size(size),
        contentAlignment = Alignment.Center
    ) {
        val serverUrl = ApiClient.getServerUrl().removeSuffix("/")
        val token = StorageService.getAccessToken()
        AsyncImage(
            model = coil3.request.ImageRequest.Builder(coil3.PlatformContext)
                .data("$serverUrl/covers/$trackId")
                .header("Authorization", "Bearer $token")
                .build(),
            contentDescription = null,
            modifier = Modifier
                .size(size)
                .clip(RoundedCornerShape(borderRadius)),
            contentScale = ContentScale.Crop,
            onSuccess = { isLoading = false },
            onError = { isLoading = false; hasError = true }
        )
        if (isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.size(size / 3),
                strokeWidth = 2.dp,
                color = Color.White
            )
        }
    }
}
