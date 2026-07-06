package com.streamsound.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import com.moriafly.salt.ui.*
import com.streamsound.model.LyricsSize
import com.streamsound.model.Theme
import com.streamsound.model.UserRole
import com.streamsound.navigation.LocalNavBackStack
import com.streamsound.navigation.ScreenRoute
import com.streamsound.store.AuthStateFlow
import com.streamsound.store.SettingsStateFlow

@OptIn(UnstableSaltUiApi::class)
@Composable
fun SettingsScreen() {
    val navBackStack = LocalNavBackStack.current
    val theme by SettingsStateFlow.theme.collectAsState()
    val serverUrl by SettingsStateFlow.serverUrl.collectAsState()
    val lyricsSize by SettingsStateFlow.lyricsSize.collectAsState()
    val audioCacheEnabled by SettingsStateFlow.audioCacheEnabled.collectAsState()
    val audioCacheMaxMb by SettingsStateFlow.audioCacheMaxMb.collectAsState()
    val user by AuthStateFlow.user.collectAsState()

    var editingUrl by remember { mutableStateOf(false) }
    var urlInput by remember { mutableStateOf(serverUrl) }

    BasicScreenColumn(title = "设置") {
        ItemOuterLargeTitle(text = "设置", sub = "应用配置")

        // 外观
        RoundedColumn {
            ItemSwitcher(
                state = theme == Theme.DARK,
                onChange = { isDark ->
                    SettingsStateFlow.setTheme(if (isDark) Theme.DARK else Theme.LIGHT)
                },
                text = "深色模式"
            )
        }

        // 歌词
        ItemOuterTitle(text = "歌词")
        RoundedColumn {
            Item(
                onClick = {
                    val next = when (lyricsSize) {
                        LyricsSize.SM -> LyricsSize.MD
                        LyricsSize.MD -> LyricsSize.LG
                        LyricsSize.LG -> LyricsSize.SM
                    }
                    SettingsStateFlow.setLyricsSize(next)
                },
                text = "歌词字号",
                sub = when (lyricsSize) {
                    LyricsSize.SM -> "小"
                    LyricsSize.MD -> "中"
                    LyricsSize.LG -> "大"
                }
            )
        }

        // 缓存
        ItemOuterTitle(text = "缓存")
        RoundedColumn {
            ItemSwitcher(
                state = audioCacheEnabled,
                onChange = { SettingsStateFlow.setAudioCacheEnabled(it) },
                text = "音频缓存"
            )
            if (audioCacheEnabled) {
                Item(
                    onClick = {
                        val next = when {
                            audioCacheMaxMb < 256 -> 256
                            audioCacheMaxMb < 512 -> 512
                            audioCacheMaxMb < 1024 -> 1024
                            else -> 128
                        }
                        SettingsStateFlow.setAudioCacheMaxMb(next)
                    },
                    text = "缓存上限",
                    sub = "${audioCacheMaxMb} MB"
                )
            }
        }

        // 服务器
        ItemOuterTitle(text = "服务器")
        RoundedColumn {
            if (editingUrl) {
                ItemEdit(
                    text = urlInput,
                    onChange = { urlInput = it },
                    hint = "http://192.168.1.100:3000"
                )
                ItemButton(
                    onClick = {
                        if (urlInput.isNotBlank()) {
                            SettingsStateFlow.setServerUrl(urlInput.trim())
                            editingUrl = false
                        }
                    },
                    text = "保存"
                )
                Item(
                    onClick = { editingUrl = false; urlInput = serverUrl },
                    text = "取消"
                )
            } else {
                Item(
                    onClick = { editingUrl = true; urlInput = serverUrl },
                    text = "服务器地址",
                    sub = serverUrl.ifEmpty { "未配置" }
                )
            }
        }

        // 账号
        user?.let { u ->
            ItemOuterTitle(text = "账号")
            RoundedColumn {
                Item(text = "用户名", sub = u.username, onClick = {})
                Item(text = "角色", sub = if (u.role == UserRole.ADMIN) "管理员" else "普通用户", onClick = {})
            }

            if (u.role == UserRole.ADMIN) {
                RoundedColumn {
                    ItemButton(
                        onClick = { navBackStack.add(ScreenRoute.Admin) },
                        text = "管理面板"
                    )
                }
            }

            RoundedColumn {
                ItemButton(
                    onClick = {
                        AuthStateFlow.logout()
                        navBackStack.clear()
                        navBackStack.add(ScreenRoute.Login)
                    },
                    text = "退出登录",
                    primary = false
                )
            }
        }
    }
}
