package com.streamsound.ui.theme

import androidx.compose.ui.graphics.Color

/**
 * StreamSound 设计系统 —— 液态玻璃深蓝（Liquid Glass Deep Blue）
 *
 * 与应用 Logo（assets/icon.svg）同源：深夜蓝底 + 天蓝玻璃高光。
 * 全部界面统一使用本套 token，禁止在页面内硬编码颜色。
 */
object StreamSoundColors {

    // ---- 品牌色 ----
    /** 主强调色：天蓝（取自 Logo 玻璃高光） */
    val accent = Color(0xFF38BDF8)
    /** 深一号强调色，用于渐变末端 */
    val accentDeep = Color(0xFF0EA5E9)
    /** 强调色渐变（主按钮、播放键、进度条） */
    val accentGradient = listOf(Color(0xFF38BDF8), Color(0xFF0EA5E9))

    // ---- 背景 ----
    /** 全局背景三段渐变（自上而下） */
    val appBackgroundGradient = listOf(
        Color(0xFF16293F),
        Color(0xFF0E1C30),
        Color(0xFF0A1524)
    )
    /** 顶部氛围光（径向，低透明叠加） */
    val ambientGlowTop = Color(0xFF38BDF8)
    val ambientGlowBottom = Color(0xFF0EA5E9)

    // ---- 玻璃表面 ----
    /** 玻璃卡片底色 */
    val glassSurface = Color(0x0FFFFFFF)
    /** 更实一档的玻璃（悬浮条、TabBar） */
    val glassSurfaceStrong = Color(0xF2142136)
    /** 输入框底色 */
    val glassSurfaceInput = Color(0x12FFFFFF)
    /** 玻璃描边 */
    val glassBorder = Color(0x1FFFFFFF)
    /** 玻璃高亮描边（卡片顶部受光边） */
    val glassBorderLight = Color(0x33FFFFFF)

    // ---- 文字 ----
    val textPrimary = Color(0xFFF0F6FC)
    val textSecondary = Color(0xFF93A8C4)
    val textMuted = Color(0xFF5E7290)

    // ---- 语义色 ----
    val heart = Color(0xFFFB7185)
    val error = Color(0xFFF87171)
    val errorSurface = Color(0x26F87171)
    val success = Color(0xFF34D399)
    val successSurface = Color(0x2634D399)
    val warning = Color(0xFFFBBF24)
    val warningSurface = Color(0x26FBBF24)

    // ---- 列表态 ----
    /** 正在播放行背景 */
    val activeSurface = Color(0x1F38BDF8)

    // ---- 歌词 ----
    val lyricsActive = textPrimary
    val lyricsPast = Color(0xFF3D5470)
    val lyricsFuture = Color(0xFF7A90AC)

    // ---- 进度条 ----
    val sliderInactive = Color(0xFF27394F)

    // ---- 播放器控制 ----
    val playerText = textPrimary
    val playerTextSecondary = textSecondary
    val playerTextMuted = textMuted
    val playerHeaderSubtitle = Color(0xFF9DB2CC)

    // ---- 播放键 ----
    val playButtonPaused = Color(0xFF22364E)

    // ---- 占位（封面缺省） ----
    val coverPlaceholder = Color(0xFF1B2C42)
    val coverPlaceholderIcon = Color(0xFF44607F)
}
