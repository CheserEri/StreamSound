package com.streamsound.ui.theme

import androidx.compose.ui.graphics.Color

// Extended colors beyond SaltUI's standard palette
object StreamSoundColors {
    // Accent (Spotify green)
    val accent = Color(0xFF1DB954)

    // Player (always dark)
    val playerText = Color.White
    val playerTextSecondary = Color(0xFF888888)
    val playerTextMuted = Color(0xFF777777)
    val playerHeaderSubtitle = Color(0xFFAAAAAA)

    // Slider
    val sliderActive = Color.White
    val sliderInactive = Color(0xFF333333)

    // Lyrics
    val lyricsActive = Color.White
    val lyricsPast = Color(0xFF4A4A4A)
    val lyricsFuture = Color(0xFF7A7A7A)
    val lyricsEmptyIcon = Color(0xFF444444)
    val lyricsEmptyText = Color(0xFF666666)
    val lyricsEmptyHint = Color(0xFF444444)

    // Heart
    val heartFilled = Color(0xFFFF4757)
    val heartOutline = Color(0xFFAAAAAA)

    // Active state
    val activeBg = Color(0xFF1A1A2E)
}
