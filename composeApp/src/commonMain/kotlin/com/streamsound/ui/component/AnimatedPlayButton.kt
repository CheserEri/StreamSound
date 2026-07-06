package com.streamsound.ui.component

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.moriafly.salt.ui.Icon
import com.moriafly.salt.ui.noRippleClickable

@Composable
fun AnimatedPlayButton(
    isPlaying: Boolean,
    onClick: () -> Unit,
    size: Dp = 68.dp,
    modifier: Modifier = Modifier
) {
    val progress by animateFloatAsState(
        targetValue = if (isPlaying) 1f else 0f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessLow
        )
    )

    val scale by animateFloatAsState(
        targetValue = 1f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessMedium
        )
    )

    val cornerRadius = lerp(22f, 50f, progress)
    val bgColor = lerp(Color(0xFF333333), Color(0xFF1DB954), progress)

    Box(
        modifier = modifier
            .size(size)
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
            }
            .clip(RoundedCornerShape(cornerRadius.dp))
            .background(bgColor)
            .border(2.dp, Color.White.copy(alpha = 0.2f), RoundedCornerShape(cornerRadius.dp))
            .noRippleClickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Box {
            Icon(
                painter = rememberVectorPainter(AppIcons.Play),
                contentDescription = "Play",
                tint = Color.White,
                modifier = Modifier
                    .size(size / 2)
                    .graphicsLayer {
                        alpha = 1f - progress
                        scaleX = 1f - progress * 0.2f
                        scaleY = 1f - progress * 0.2f
                    }
            )
            Icon(
                painter = rememberVectorPainter(AppIcons.Pause),
                contentDescription = "Pause",
                tint = Color.White,
                modifier = Modifier
                    .size(size / 2)
                    .graphicsLayer {
                        alpha = progress
                        scaleX = 0.8f + progress * 0.2f
                        scaleY = 0.8f + progress * 0.2f
                    }
            )
        }
    }
}

private fun lerp(a: Float, b: Float, t: Float): Float = a + (b - a) * t
private fun lerp(a: Color, b: Color, t: Float): Color = Color(
    red = lerp(a.red, b.red, t),
    green = lerp(a.green, b.green, t),
    blue = lerp(a.blue, b.blue, t),
    alpha = lerp(a.alpha, b.alpha, t)
)
