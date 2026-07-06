package com.streamsound.ui.component

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp

@Composable
fun GlowSlider(
    value: Double,
    maximumValue: Double,
    onSeek: (Double) -> Unit,
    activeColor: Color = Color.White,
    inactiveColor: Color = Color(0xFF333333),
    modifier: Modifier = Modifier
) {
    val density = LocalDensity.current
    val trackHeight = 5.dp
    val thumbRadius = 8.dp
    val trackHeightPx = with(density) { trackHeight.toPx() }
    val thumbRadiusPx = with(density) { thumbRadius.toPx() }

    var isDragging by remember { mutableStateOf(false) }
    var dragPosition by remember { mutableFloatStateOf(0f) }
    var canvasWidth by remember { mutableFloatStateOf(0f) }

    val progress = if (maximumValue > 0) (value / maximumValue).coerceIn(0.0, 1.0).toFloat() else 0f
    val displayProgress = if (isDragging) dragPosition else progress

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(44.dp)
            .pointerInput(maximumValue) {
                detectTapGestures { offset ->
                    val fraction = (offset.x / size.width).coerceIn(0f, 1f)
                    onSeek(fraction * maximumValue)
                }
            }
            .pointerInput(maximumValue) {
                detectDragGestures(
                    onDragStart = { offset ->
                        isDragging = true
                        dragPosition = (offset.x / size.width).coerceIn(0f, 1f)
                    },
                    onDrag = { change, _ ->
                        change.consume()
                        dragPosition = (change.position.x / size.width).coerceIn(0f, 1f)
                    },
                    onDragEnd = {
                        onSeek(dragPosition * maximumValue)
                        isDragging = false
                    },
                    onDragCancel = {
                        isDragging = false
                    }
                )
            }
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            canvasWidth = size.width
            val centerY = size.height / 2
            val trackY = centerY - trackHeightPx / 2

            // Background track
            drawRoundRect(
                color = inactiveColor,
                topLeft = Offset(0f, trackY),
                size = Size(size.width, trackHeightPx),
                cornerRadius = CornerRadius(trackHeightPx / 2)
            )

            // Glow behind active track
            val activeWidth = displayProgress * size.width
            if (activeWidth > 0) {
                drawRoundRect(
                    color = activeColor.copy(alpha = 0.3f),
                    topLeft = Offset(0f, trackY - 4.dp.toPx()),
                    size = Size(activeWidth, trackHeightPx + 8.dp.toPx()),
                    cornerRadius = CornerRadius(trackHeightPx / 2 + 4.dp.toPx())
                )
            }

            // Active track
            drawRoundRect(
                color = activeColor,
                topLeft = Offset(0f, trackY),
                size = Size(activeWidth, trackHeightPx),
                cornerRadius = CornerRadius(trackHeightPx / 2)
            )

            // Thumb
            val thumbX = activeWidth
            if (isDragging) {
                drawCircle(
                    color = activeColor.copy(alpha = 0.3f),
                    radius = thumbRadiusPx * 2.8f,
                    center = Offset(thumbX, centerY)
                )
            }
            drawCircle(
                color = activeColor,
                radius = thumbRadiusPx * (if (isDragging) 1.3f else 1f),
                center = Offset(thumbX, centerY)
            )
        }
    }
}
