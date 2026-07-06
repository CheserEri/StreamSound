package com.streamsound.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.moriafly.salt.ui.TitleBar
import com.moriafly.salt.ui.UnstableSaltUiApi
import com.moriafly.salt.ui.ext.safeMainCompat
import com.moriafly.salt.ui.rememberScrollState
import com.moriafly.salt.ui.verticalScroll
import com.streamsound.navigation.LocalNavBackStack

@OptIn(UnstableSaltUiApi::class)
@Composable
fun BasicScreenColumn(
    title: String,
    showBackBtn: Boolean = true,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize()
            .windowInsetsPadding(WindowInsets.safeMainCompat.only(WindowInsetsSides.Horizontal + WindowInsetsSides.Top))
    ) {
        val navBackStack = LocalNavBackStack.current
        TitleBar(
            onBack = { navBackStack.removeLastOrNull() },
            text = title,
            showBackBtn = showBackBtn
        )
        Column(
            modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState())
        ) {
            content()
            Spacer(Modifier.windowInsetsBottomHeight(WindowInsets.safeMainCompat))
        }
    }
}

@OptIn(UnstableSaltUiApi::class)
@Composable
fun BasicScreenBox(
    title: String,
    showBackBtn: Boolean = true,
    content: @Composable BoxScope.() -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize()
            .windowInsetsPadding(WindowInsets.safeMainCompat.only(WindowInsetsSides.Horizontal + WindowInsetsSides.Top))
    ) {
        val navBackStack = LocalNavBackStack.current
        TitleBar(
            onBack = { navBackStack.removeLastOrNull() },
            text = title,
            showBackBtn = showBackBtn
        )
        Box(modifier = Modifier.fillMaxSize()) { content() }
    }
}
