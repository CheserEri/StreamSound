package com.streamsound.util

import kotlin.math.floor

fun formatDuration(seconds: Double?): String {
    if (seconds == null || seconds.isNaN() || seconds < 0) return "0:00"
    val totalSeconds = floor(seconds).toInt()
    val mins = totalSeconds / 60
    val secs = totalSeconds % 60
    return "$mins:${secs.toString().padStart(2, '0')}"
}
