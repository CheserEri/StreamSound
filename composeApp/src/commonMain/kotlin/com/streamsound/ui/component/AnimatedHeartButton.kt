package com.streamsound.ui.component

import androidx.compose.animation.core.*
import androidx.compose.foundation.layout.size
import androidx.compose.material.Icon
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.streamsound.network.FavoritesApi
import com.streamsound.ui.theme.StreamSoundColors
import kotlinx.coroutines.launch

@Composable
fun AnimatedHeartButton(
    trackId: Int,
    initialFavorited: Boolean = false,
    size: Dp = 28.dp,
    onToggle: ((Boolean) -> Unit)? = null
) {
    var isFavorited by remember { mutableStateOf(initialFavorited) }
    var isLoading by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    // 切换时的弹簧放大动画
    var animateToggle by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(
        targetValue = if (animateToggle) 1.3f else 1f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessHigh
        ),
        finishedListener = { animateToggle = false },
        label = "heartScale"
    )

    Icon(
        imageVector = if (isFavorited) AppIcons.HeartFilled else AppIcons.HeartOutline,
        contentDescription = if (isFavorited) "取消收藏" else "收藏",
        tint = if (isFavorited) StreamSoundColors.heart else StreamSoundColors.textMuted,
        modifier = Modifier
            .size(size)
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
            }
            .noRippleClickable {
                if (isLoading) return@noRippleClickable
                isLoading = true
                val newState = !isFavorited
                isFavorited = newState
                animateToggle = true
                scope.launch {
                    try {
                        if (newState) FavoritesApi.addFavorite(trackId)
                        else FavoritesApi.removeFavorite(trackId)
                        onToggle?.invoke(newState)
                    } catch (_: Exception) {
                        isFavorited = !newState
                    } finally {
                        isLoading = false
                    }
                }
            }
    )
}
