package com.streamsound.ui.component

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.streamsound.util.generateDiscColors

@Composable
fun DiscCover(
    trackId: Int,
    hasCover: Boolean,
    size: Dp = 280.dp,
    isPlaying: Boolean = false,
    dominantColor: String? = null,
    modifier: Modifier = Modifier
) {
    val discColors = remember(dominantColor) { generateDiscColors(dominantColor) }
    val infiniteTransition = rememberInfiniteTransition()

    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(25000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        )
    )

    val grooveRadii = listOf(0.85f, 0.70f, 0.55f)

    Box(
        modifier = modifier.size(size),
        contentAlignment = Alignment.Center
    ) {
        // Outer ring
        Canvas(modifier = Modifier.size(size)) {
            drawCircle(color = discColors.ring)
            drawCircle(
                color = discColors.ringBorder,
                radius = this.size.minDimension / 2 - 3.dp.toPx()
            )
            drawCircle(
                color = discColors.ring,
                radius = this.size.minDimension / 2 - 6.dp.toPx()
            )
        }

        // Grooves
        grooveRadii.forEach { ratio ->
            Canvas(modifier = Modifier.size(size * ratio)) {
                drawCircle(
                    color = discColors.ringBorder.copy(alpha = 0.3f),
                    radius = this.size.minDimension / 2 - 1.dp.toPx()
                )
            }
        }

        // Rotating cover
        Box(
            modifier = Modifier
                .size(size * 0.8f)
                .rotate(if (isPlaying) rotation else 0f)
        ) {
            CoverImage(
                trackId = trackId,
                hasCover = hasCover,
                size = size * 0.8f,
                borderRadius = size * 0.4f
            )
        }

        // Center hole
        Box(
            modifier = Modifier
                .size(12.dp)
                .clip(CircleShape)
                .background(discColors.center)
        )
    }
}
