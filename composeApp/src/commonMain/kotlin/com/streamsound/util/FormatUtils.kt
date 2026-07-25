package com.streamsound.util

import kotlin.math.floor
import kotlin.time.ExperimentalTime
import kotlin.time.Clock

fun formatDuration(seconds: Double?): String {
    if (seconds == null || seconds.isNaN() || seconds < 0) return "0:00"
    val totalSeconds = floor(seconds).toInt()
    val mins = totalSeconds / 60
    val secs = totalSeconds % 60
    return "$mins:${secs.toString().padStart(2, '0')}"
}

/**
 * 将秒级时间戳格式化为相对时间（如 "3 分钟前"、"昨天"）。
 * 服务器 played_at / favorited_at 均为秒级 Unix 时间戳。
 */
@OptIn(ExperimentalTime::class)
fun formatRelativeTime(epochSeconds: Long?): String {
    if (epochSeconds == null || epochSeconds <= 0) return ""
    val nowSeconds = Clock.System.now().epochSeconds
    val diff = nowSeconds - epochSeconds
    if (diff < 0) return ""
    val minutes = diff / 60
    val hours = diff / 3600
    val days = diff / 86400
    return when {
        diff < 60 -> "刚刚"
        minutes < 60 -> "$minutes 分钟前"
        hours < 24 -> "$hours 小时前"
        days < 2 -> "昨天"
        days < 30 -> "$days 天前"
        days < 365 -> "${days / 30} 个月前"
        else -> "${days / 365} 年前"
    }
}
