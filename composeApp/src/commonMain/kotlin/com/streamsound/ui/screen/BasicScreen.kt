package com.streamsound.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.streamsound.navigation.LocalNavBackStack
import com.streamsound.ui.component.AppBackground
import com.streamsound.ui.component.AppTopBar

/**
 * 液态玻璃页面脚手架：全局氛围背景 + 状态栏避让 + 可选顶栏。
 * 底部空间（MiniPlayer + TabBar）由各页面按需预留 [chromeBottomSpace]。
 */

/** 底部悬浮层（MiniPlayer + TabBar）需要预留的空间 */
val chromeBottomSpace = 168.dp

@Composable
fun GlassScreen(
    title: String? = null,
    subtitle: String? = null,
    showBack: Boolean = false,
    actions: @Composable RowScope.() -> Unit = {},
    content: @Composable BoxScope.() -> Unit
) {
    AppBackground {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .windowInsetsPadding(
                    WindowInsets.safeDrawing.only(WindowInsetsSides.Horizontal + WindowInsetsSides.Top)
                )
        ) {
            if (title != null) {
                val navBackStack = LocalNavBackStack.current
                AppTopBar(
                    title = title,
                    subtitle = subtitle,
                    onBack = if (showBack) {
                        { navBackStack.removeLastOrNull() }
                    } else null,
                    actions = actions
                )
            }
            Box(modifier = Modifier.fillMaxSize()) {
                content()
            }
        }
    }
}

/** 可垂直滚动的页面脚手架（设置、管理、登录等表单类页面） */
@Composable
fun GlassScrollScreen(
    title: String? = null,
    subtitle: String? = null,
    showBack: Boolean = false,
    content: @Composable ColumnScope.() -> Unit
) {
    GlassScreen(title = title, subtitle = subtitle, showBack = showBack) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp)
        ) {
            content()
            Spacer(Modifier.height(chromeBottomSpace))
        }
    }
}
