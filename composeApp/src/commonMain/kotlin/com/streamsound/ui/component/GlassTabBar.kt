package com.streamsound.ui.component

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.Icon
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.streamsound.ui.theme.StreamSoundColors

/**
 * 底部玻璃 Tab 栏 —— 首页 / 搜索 / 收藏 / 设置
 */
data class TabItem(
    val key: String,
    val label: String,
    val icon: ImageVector
)

@Composable
fun GlassTabBar(
    tabs: List<TabItem>,
    activeKey: String,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier.fillMaxWidth()) {
        // 顶部受光细线
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(0.5.dp)
                .background(StreamSoundColors.glassBorder)
        )
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(StreamSoundColors.glassSurfaceStrong)
                .padding(horizontal = 8.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            tabs.forEach { tab ->
                val isActive = tab.key == activeKey
                val tint by animateColorAsState(
                    targetValue = if (isActive) StreamSoundColors.accent else StreamSoundColors.textMuted,
                    animationSpec = tween(160),
                    label = "tabTint"
                )
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .noRippleClickable { onSelect(tab.key) }
                        .padding(vertical = 4.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = tab.icon,
                        contentDescription = tab.label,
                        tint = tint,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = tab.label,
                        color = tint,
                        fontSize = 11.sp,
                        fontWeight = if (isActive) FontWeight.SemiBold else FontWeight.Normal
                    )
                }
            }
        }
        // 系统导航栏避让
        Spacer(Modifier.windowInsetsBottomHeight(WindowInsets.navigationBars))
    }
}
