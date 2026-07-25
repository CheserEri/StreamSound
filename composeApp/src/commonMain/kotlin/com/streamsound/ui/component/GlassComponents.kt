package com.streamsound.ui.component

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.CircularProgressIndicator
import androidx.compose.material.Icon
import androidx.compose.material.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.streamsound.ui.theme.StreamSoundColors

// ---------------------------------------------------------------------------
// 基础修饰
// ---------------------------------------------------------------------------

/** 无水波纹点击（图标类小控件使用） */
fun Modifier.noRippleClickable(
    enabled: Boolean = true,
    onClick: () -> Unit
): Modifier = this.clickable(
    interactionSource = MutableInteractionSource(),
    indication = null,
    enabled = enabled,
    onClick = onClick
)

// ---------------------------------------------------------------------------
// 全局背景：深夜蓝渐变 + 液态氛围光
// ---------------------------------------------------------------------------

@Composable
fun AppBackground(
    modifier: Modifier = Modifier,
    content: @Composable BoxScope.() -> Unit
) {
    Box(modifier = modifier.fillMaxSize()) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            drawRect(
                brush = Brush.verticalGradient(StreamSoundColors.appBackgroundGradient)
            )
            // 右上角天蓝氛围光
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        StreamSoundColors.ambientGlowTop.copy(alpha = 0.13f),
                        Color.Transparent
                    ),
                    center = Offset(size.width * 0.85f, -size.height * 0.04f),
                    radius = size.width * 0.95f
                )
            )
            // 左下角深蓝光晕
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        StreamSoundColors.ambientGlowBottom.copy(alpha = 0.08f),
                        Color.Transparent
                    ),
                    center = Offset(size.width * 0.08f, size.height * 1.06f),
                    radius = size.width * 0.85f
                )
            )
        }
        content()
    }
}

// ---------------------------------------------------------------------------
// 玻璃容器
// ---------------------------------------------------------------------------

@Composable
fun GlassCard(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 20.dp,
    onClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit
) {
    val shape = RoundedCornerShape(cornerRadius)
    var m = modifier
        .fillMaxWidth()
        .clip(shape)
        .background(StreamSoundColors.glassSurface)
        .border(1.dp, StreamSoundColors.glassBorder, shape)
    if (onClick != null) {
        m = m.clickable(onClick = onClick)
    }
    Column(modifier = m, content = content)
}

/** 图标 +  tinted 圆形底（列表行左侧视觉锚点） */
@Composable
fun GlassIconCircle(
    icon: ImageVector,
    modifier: Modifier = Modifier,
    size: Dp = 40.dp,
    tint: Color = StreamSoundColors.accent,
    background: Color = StreamSoundColors.accent.copy(alpha = 0.14f)
) {
    Box(
        modifier = modifier
            .size(size)
            .clip(CircleShape)
            .background(background),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = tint,
            modifier = Modifier.size(size * 0.55f)
        )
    }
}

// ---------------------------------------------------------------------------
// 标题体系
// ---------------------------------------------------------------------------

@Composable
fun LargeTitle(
    title: String,
    subtitle: String? = null,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier.padding(horizontal = 20.dp)) {
        Text(
            text = title,
            color = StreamSoundColors.textPrimary,
            fontSize = 30.sp,
            fontWeight = FontWeight.Bold
        )
        if (subtitle != null) {
            Spacer(Modifier.height(4.dp))
            Text(
                text = subtitle,
                color = StreamSoundColors.textSecondary,
                fontSize = 14.sp
            )
        }
    }
}

@Composable
fun SectionTitle(
    text: String,
    modifier: Modifier = Modifier
) {
    Text(
        text = text,
        color = StreamSoundColors.textMuted,
        fontSize = 13.sp,
        fontWeight = FontWeight.SemiBold,
        letterSpacing = 1.sp,
        modifier = modifier.padding(start = 22.dp, top = 24.dp, bottom = 10.dp, end = 20.dp)
    )
}

// ---------------------------------------------------------------------------
// 顶栏
// ---------------------------------------------------------------------------

@Composable
fun AppTopBar(
    title: String,
    subtitle: String? = null,
    onBack: (() -> Unit)? = null,
    actions: @Composable RowScope.() -> Unit = {}
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 60.dp)
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (onBack != null) {
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .clip(CircleShape)
                    .background(StreamSoundColors.glassSurface)
                    .border(1.dp, StreamSoundColors.glassBorder, CircleShape)
                    .noRippleClickable(onClick = onBack),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = AppIcons.ArrowBack,
                    contentDescription = "返回",
                    tint = StreamSoundColors.textPrimary,
                    modifier = Modifier.size(20.dp)
                )
            }
            Spacer(Modifier.width(12.dp))
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                color = StreamSoundColors.textPrimary,
                fontSize = 18.sp,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            if (subtitle != null) {
                Text(
                    text = subtitle,
                    color = StreamSoundColors.textSecondary,
                    fontSize = 12.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
        actions()
    }
}

// ---------------------------------------------------------------------------
// 列表行
// ---------------------------------------------------------------------------

@Composable
fun GlassListItem(
    title: String,
    modifier: Modifier = Modifier,
    subtitle: String? = null,
    leadingIcon: ImageVector? = null,
    leading: (@Composable () -> Unit)? = null,
    trailing: (@Composable () -> Unit)? = null,
    showChevron: Boolean = false,
    onClick: (() -> Unit)? = null
) {
    var m = modifier.fillMaxWidth()
    if (onClick != null) {
        m = m.noRippleClickable(onClick = onClick)
    }
    Row(
        modifier = m.padding(horizontal = 16.dp, vertical = 13.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (leading != null) {
            leading()
            Spacer(Modifier.width(12.dp))
        } else if (leadingIcon != null) {
            GlassIconCircle(icon = leadingIcon)
            Spacer(Modifier.width(12.dp))
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                color = StreamSoundColors.textPrimary,
                fontSize = 15.sp,
                fontWeight = FontWeight.Medium,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            if (subtitle != null) {
                Spacer(Modifier.height(2.dp))
                Text(
                    text = subtitle,
                    color = StreamSoundColors.textSecondary,
                    fontSize = 13.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
        if (trailing != null) {
            Spacer(Modifier.width(8.dp))
            trailing()
        }
        if (showChevron) {
            Spacer(Modifier.width(4.dp))
            Icon(
                imageVector = AppIcons.ChevronRight,
                contentDescription = null,
                tint = StreamSoundColors.textMuted,
                modifier = Modifier.size(18.dp)
            )
        }
    }
}

/** 玻璃卡片内的分隔线 */
@Composable
fun GlassDivider(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .height(0.5.dp)
            .background(StreamSoundColors.glassBorder)
    )
}

// ---------------------------------------------------------------------------
// 按钮
// ---------------------------------------------------------------------------

enum class GlassButtonStyle { Primary, Glass, Danger }

@Composable
fun GlassButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    style: GlassButtonStyle = GlassButtonStyle.Primary,
    compact: Boolean = false
) {
    val shape = RoundedCornerShape(if (compact) 12.dp else 16.dp)
    val backgroundBrush = when (style) {
        GlassButtonStyle.Primary -> Brush.horizontalGradient(StreamSoundColors.accentGradient)
        else -> null
    }
    val backgroundColor = when (style) {
        GlassButtonStyle.Primary -> Color.Transparent
        GlassButtonStyle.Glass -> StreamSoundColors.glassSurfaceInput
        GlassButtonStyle.Danger -> StreamSoundColors.errorSurface
    }
    val borderColor = when (style) {
        GlassButtonStyle.Primary -> StreamSoundColors.accent.copy(alpha = 0.5f)
        GlassButtonStyle.Glass -> StreamSoundColors.glassBorder
        GlassButtonStyle.Danger -> StreamSoundColors.error.copy(alpha = 0.4f)
    }
    val textColor = when (style) {
        GlassButtonStyle.Primary -> Color(0xFF06202F)
        GlassButtonStyle.Glass -> StreamSoundColors.textPrimary
        GlassButtonStyle.Danger -> StreamSoundColors.error
    }

    var m = modifier
        .clip(shape)
        .alpha(if (enabled) 1f else 0.4f)
        .border(1.dp, borderColor, shape)
    m = if (backgroundBrush != null) {
        m.background(backgroundBrush)
    } else {
        m.background(backgroundColor)
    }
    if (enabled) {
        m = m.noRippleClickable(onClick = onClick)
    }
    Box(
        modifier = m.padding(
            horizontal = if (compact) 16.dp else 20.dp,
            vertical = if (compact) 9.dp else 14.dp
        ),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            color = textColor,
            fontSize = if (compact) 13.sp else 15.sp,
            fontWeight = FontWeight.SemiBold
        )
    }
}

// ---------------------------------------------------------------------------
// 输入框
// ---------------------------------------------------------------------------

@Composable
fun GlassTextField(
    value: String,
    onValueChange: (String) -> Unit,
    hint: String,
    modifier: Modifier = Modifier,
    isPassword: Boolean = false,
    leadingIcon: ImageVector? = null,
    singleLine: Boolean = true
) {
    var passwordVisible by remember { mutableStateOf(false) }
    val shape = RoundedCornerShape(14.dp)

    BasicTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier.fillMaxWidth(),
        singleLine = singleLine,
        textStyle = TextStyle(
            color = StreamSoundColors.textPrimary,
            fontSize = 15.sp
        ),
        cursorBrush = SolidColor(StreamSoundColors.accent),
        visualTransformation = if (isPassword && !passwordVisible) {
            PasswordVisualTransformation()
        } else {
            VisualTransformation.None
        },
        keyboardOptions = KeyboardOptions(
            keyboardType = if (isPassword) KeyboardType.Password else KeyboardType.Text
        ),
        decorationBox = { innerTextField ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(shape)
                    .background(StreamSoundColors.glassSurfaceInput)
                    .border(1.dp, StreamSoundColors.glassBorder, shape)
                    .padding(horizontal = 14.dp, vertical = 13.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (leadingIcon != null) {
                    Icon(
                        imageVector = leadingIcon,
                        contentDescription = null,
                        tint = StreamSoundColors.textMuted,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(Modifier.width(10.dp))
                }
                Box(modifier = Modifier.weight(1f)) {
                    if (value.isEmpty()) {
                        Text(
                            text = hint,
                            color = StreamSoundColors.textMuted,
                            fontSize = 15.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    innerTextField()
                }
                if (isPassword) {
                    Spacer(Modifier.width(8.dp))
                    Icon(
                        imageVector = if (passwordVisible) AppIcons.EyeOff else AppIcons.Eye,
                        contentDescription = if (passwordVisible) "隐藏密码" else "显示密码",
                        tint = StreamSoundColors.textMuted,
                        modifier = Modifier
                            .size(20.dp)
                            .noRippleClickable { passwordVisible = !passwordVisible }
                    )
                }
            }
        }
    )
}

// ---------------------------------------------------------------------------
// 开关
// ---------------------------------------------------------------------------

@Composable
fun GlassSwitch(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier
) {
    val fraction by animateFloatAsState(
        targetValue = if (checked) 1f else 0f,
        animationSpec = tween(180),
        label = "switchThumb"
    )
    val trackColor by animateColorAsState(
        targetValue = if (checked) StreamSoundColors.accent else StreamSoundColors.glassSurfaceInput,
        animationSpec = tween(180),
        label = "switchTrack"
    )
    Box(
        modifier = modifier
            .size(width = 46.dp, height = 28.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(trackColor)
            .border(
                1.dp,
                if (checked) StreamSoundColors.accentDeep else StreamSoundColors.glassBorder,
                RoundedCornerShape(14.dp)
            )
            .noRippleClickable { onCheckedChange(!checked) },
        contentAlignment = Alignment.CenterStart
    ) {
        Box(
            modifier = Modifier
                .padding(start = 3.dp)
                .offset(x = 18.dp * fraction)
                .size(22.dp)
                .clip(CircleShape)
                .background(Color.White)
        )
    }
}

// ---------------------------------------------------------------------------
// 分段选择器
// ---------------------------------------------------------------------------

@Composable
fun <T> GlassSegmented(
    options: List<Pair<T, String>>,
    selected: T,
    onSelect: (T) -> Unit,
    modifier: Modifier = Modifier
) {
    val shape = RoundedCornerShape(14.dp)
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(shape)
            .background(StreamSoundColors.glassSurfaceInput)
            .border(1.dp, StreamSoundColors.glassBorder, shape)
            .padding(3.dp)
    ) {
        options.forEach { (value, label) ->
            val isSelected = value == selected
            val bg by animateColorAsState(
                targetValue = if (isSelected) StreamSoundColors.accent else Color.Transparent,
                animationSpec = tween(160),
                label = "segmentBg"
            )
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(11.dp))
                    .background(bg)
                    .noRippleClickable { onSelect(value) }
                    .padding(vertical = 8.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = label,
                    color = if (isSelected) Color(0xFF06202F) else StreamSoundColors.textSecondary,
                    fontSize = 13.sp,
                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                )
            }
        }
    }
}

// ---------------------------------------------------------------------------
// 提示条
// ---------------------------------------------------------------------------

enum class GlassBannerType { Error, Success, Warning, Info }

@Composable
fun GlassBanner(
    text: String,
    type: GlassBannerType,
    modifier: Modifier = Modifier
) {
    val (color, surface) = when (type) {
        GlassBannerType.Error -> StreamSoundColors.error to StreamSoundColors.errorSurface
        GlassBannerType.Success -> StreamSoundColors.success to StreamSoundColors.successSurface
        GlassBannerType.Warning -> StreamSoundColors.warning to StreamSoundColors.warningSurface
        GlassBannerType.Info -> StreamSoundColors.accent to StreamSoundColors.accent.copy(alpha = 0.15f)
    }
    val shape = RoundedCornerShape(14.dp)
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(shape)
            .background(surface)
            .border(1.dp, color.copy(alpha = 0.35f), shape)
            .padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .clip(CircleShape)
                .background(color)
        )
        Spacer(Modifier.width(10.dp))
        Text(
            text = text,
            color = StreamSoundColors.textPrimary,
            fontSize = 13.sp
        )
    }
}

// ---------------------------------------------------------------------------
// 徽章
// ---------------------------------------------------------------------------

@Composable
fun GlassBadge(
    text: String,
    modifier: Modifier = Modifier,
    color: Color = StreamSoundColors.accent
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(color.copy(alpha = 0.16f))
            .border(1.dp, color.copy(alpha = 0.35f), RoundedCornerShape(8.dp))
            .padding(horizontal = 8.dp, vertical = 3.dp)
    ) {
        Text(
            text = text,
            color = color,
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold
        )
    }
}

// ---------------------------------------------------------------------------
// 空态 / 加载态
// ---------------------------------------------------------------------------

@Composable
fun EmptyState(
    icon: ImageVector,
    title: String,
    hint: String? = null,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxSize().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        GlassIconCircle(
            icon = icon,
            size = 72.dp,
            tint = StreamSoundColors.textMuted,
            background = StreamSoundColors.glassSurface
        )
        Spacer(Modifier.height(18.dp))
        Text(
            text = title,
            color = StreamSoundColors.textSecondary,
            fontSize = 16.sp,
            fontWeight = FontWeight.Medium
        )
        if (hint != null) {
            Spacer(Modifier.height(6.dp))
            Text(
                text = hint,
                color = StreamSoundColors.textMuted,
                fontSize = 13.sp
            )
        }
    }
}

@Composable
fun LoadingState(
    modifier: Modifier = Modifier,
    text: String = "加载中..."
) {
    Column(
        modifier = modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        CircularProgressIndicator(
            color = StreamSoundColors.accent,
            strokeWidth = 3.dp,
            modifier = Modifier.size(36.dp)
        )
        Spacer(Modifier.height(14.dp))
        Text(
            text = text,
            color = StreamSoundColors.textMuted,
            fontSize = 13.sp
        )
    }
}
