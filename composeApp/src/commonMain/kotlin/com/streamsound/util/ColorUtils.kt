package com.streamsound.util

import androidx.compose.ui.graphics.Color

val DEFAULT_PLAYER_GRADIENT = listOf(
    Color(0xFF2A2A3A),
    Color(0xFF1A1A28),
    Color(0xFF0E0E18)
)

fun hexToRgb(hex: String): Triple<Int, Int, Int> {
    val h = hex.removePrefix("#")
    return Triple(
        h.substring(0, 2).toInt(16),
        h.substring(2, 4).toInt(16),
        h.substring(4, 6).toInt(16)
    )
}

fun rgbToHsl(r: Int, g: Int, b: Int): Triple<Float, Float, Float> {
    val rf = r / 255f
    val gf = g / 255f
    val bf = b / 255f
    val max = maxOf(rf, gf, bf)
    val min = minOf(rf, gf, bf)
    val l = (max + min) / 2f
    if (max == min) return Triple(0f, 0f, l)
    val d = max - min
    val s = if (l > 0.5f) d / (2f - max - min) else d / (max + min)
    var h = when (max) {
        rf -> ((gf - bf) / d + if (gf < bf) 6f else 0f) / 6f
        gf -> ((bf - rf) / d + 2f) / 6f
        else -> ((rf - gf) / d + 4f) / 6f
    }
    return Triple(h * 360f, s, l)
}

fun hslToColor(h: Float, s: Float, l: Float): Color {
    val hNorm = ((h % 360f) + 360f) % 360f
    val sNorm = s.coerceIn(0f, 1f)
    val lNorm = l.coerceIn(0f, 1f)
    val c = (1f - Math.abs(2f * lNorm - 1f)) * sNorm
    val x = c * (1f - Math.abs(((hNorm / 60f) % 2f) - 1f))
    val m = lNorm - c / 2f
    val (r, g, b) = when {
        hNorm < 60f -> Triple(c, x, 0f)
        hNorm < 120f -> Triple(x, c, 0f)
        hNorm < 180f -> Triple(0f, c, x)
        hNorm < 240f -> Triple(0f, x, c)
        hNorm < 300f -> Triple(x, 0f, c)
        else -> Triple(c, 0f, x)
    }
    return Color(
        red = (r + m).coerceIn(0f, 1f),
        green = (g + m).coerceIn(0f, 1f),
        blue = (b + m).coerceIn(0f, 1f)
    )
}

fun generatePlayerGradient(hexColor: String?): List<Color> {
    if (hexColor == null || hexColor.length < 7) return DEFAULT_PLAYER_GRADIENT
    return try {
        val (r, g, b) = hexToRgb(hexColor)
        var (h, s, l) = rgbToHsl(r, g, b)
        if (s < 0.08f) { h = 220f; s = 0.08f }
        val targetSat = (0.15f + s * 0.2f).coerceAtMost(0.32f)
        s = targetSat
        listOf(
            hslToColor(h, s, 0.22f),
            hslToColor(h, s, 0.16f),
            hslToColor(h, s, 0.10f)
        )
    } catch (_: Exception) {
        DEFAULT_PLAYER_GRADIENT
    }
}

data class DiscColors(
    val ring: Color,
    val ringBorder: Color,
    val center: Color,
    val centerBorder: Color
)

fun generateDiscColors(hexColor: String?): DiscColors {
    if (hexColor == null || hexColor.length < 7) {
        return DiscColors(
            ring = Color(0xFF1A1A1A),
            ringBorder = Color(0xFF333333),
            center = Color(0xFF0A0A0A),
            centerBorder = Color(0xFF333333)
        )
    }
    return try {
        val (r, g, b) = hexToRgb(hexColor)
        var (h, s, _) = rgbToHsl(r, g, b)
        if (s < 0.08f) { h = 220f; s = 0.08f }
        s = (s * 0.5f).coerceAtMost(0.2f)
        DiscColors(
            ring = hslToColor(h, s, 0.10f),
            ringBorder = hslToColor(h, s, 0.18f),
            center = hslToColor(h, s, 0.04f),
            centerBorder = hslToColor(h, s, 0.15f)
        )
    } catch (_: Exception) {
        DiscColors(
            ring = Color(0xFF1A1A1A),
            ringBorder = Color(0xFF333333),
            center = Color(0xFF0A0A0A),
            centerBorder = Color(0xFF333333)
        )
    }
}
