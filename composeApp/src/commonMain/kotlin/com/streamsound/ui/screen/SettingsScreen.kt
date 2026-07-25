package com.streamsound.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.streamsound.model.LyricsSize
import com.streamsound.model.UserRole
import com.streamsound.navigation.LocalNavBackStack
import com.streamsound.navigation.ScreenRoute
import com.streamsound.store.AuthStateFlow
import com.streamsound.store.SettingsStateFlow
import com.streamsound.ui.component.*
import com.streamsound.ui.theme.StreamSoundColors

/**
 * 设置 Tab
 */
@Composable
fun SettingsScreen() {
    val navBackStack = LocalNavBackStack.current
    val serverUrl by SettingsStateFlow.serverUrl.collectAsState()
    val lyricsSize by SettingsStateFlow.lyricsSize.collectAsState()
    val audioCacheEnabled by SettingsStateFlow.audioCacheEnabled.collectAsState()
    val audioCacheMaxMb by SettingsStateFlow.audioCacheMaxMb.collectAsState()
    val user by AuthStateFlow.user.collectAsState()

    var editingUrl by remember { mutableStateOf(false) }
    var urlInput by remember { mutableStateOf(serverUrl) }

    GlassScreen {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
        ) {
            Spacer(Modifier.height(12.dp))
            LargeTitle(title = "设置", subtitle = "应用配置")

            // ---- 账号 ----
            user?.let { u ->
                SectionTitle(text = "账号")
                GlassCard(modifier = Modifier.padding(horizontal = 16.dp)) {
                    GlassListItem(
                        title = u.username,
                        subtitle = if (u.role == UserRole.ADMIN) "管理员" else "普通用户",
                        leading = {
                            GlassIconCircle(
                                icon = AppIcons.Person,
                                size = 44.dp
                            )
                        },
                        trailing = {
                            if (u.role == UserRole.ADMIN) {
                                GlassBadge(text = "ADMIN")
                            }
                        }
                    )
                    if (u.role == UserRole.ADMIN) {
                        GlassDivider()
                        GlassListItem(
                            title = "管理面板",
                            subtitle = "扫描音乐库 · 用户审批",
                            leadingIcon = AppIcons.Settings,
                            showChevron = true,
                            onClick = { navBackStack.add(ScreenRoute.Admin) }
                        )
                    }
                    GlassDivider()
                    GlassListItem(
                        title = "退出登录",
                        leading = {
                            GlassIconCircle(
                                icon = AppIcons.Logout,
                                tint = StreamSoundColors.error,
                                background = StreamSoundColors.errorSurface
                            )
                        },
                        onClick = {
                            AuthStateFlow.logout()
                            navBackStack.clear()
                            navBackStack.add(ScreenRoute.Login)
                        }
                    )
                }
            }

            // ---- 播放 ----
            SectionTitle(text = "播放")
            GlassCard(modifier = Modifier.padding(horizontal = 16.dp)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "歌词字号",
                        color = StreamSoundColors.textPrimary,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Medium
                    )
                    Spacer(Modifier.height(12.dp))
                    GlassSegmented(
                        options = listOf(
                            LyricsSize.SM to "小",
                            LyricsSize.MD to "中",
                            LyricsSize.LG to "大"
                        ),
                        selected = lyricsSize,
                        onSelect = { SettingsStateFlow.setLyricsSize(it) }
                    )
                }
                GlassDivider()
                GlassListItem(
                    title = "音频缓存",
                    subtitle = if (audioCacheEnabled) "已开启 · 上限 $audioCacheMaxMb MB" else "已关闭",
                    leadingIcon = AppIcons.MusicNote,
                    trailing = {
                        GlassSwitch(
                            checked = audioCacheEnabled,
                            onCheckedChange = { SettingsStateFlow.setAudioCacheEnabled(it) }
                        )
                    },
                    onClick = {
                        SettingsStateFlow.setAudioCacheEnabled(!audioCacheEnabled)
                    }
                )
                if (audioCacheEnabled) {
                    GlassDivider()
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "缓存上限",
                            color = StreamSoundColors.textPrimary,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Medium
                        )
                        Spacer(Modifier.height(12.dp))
                        GlassSegmented(
                            options = listOf(
                                128 to "128M",
                                256 to "256M",
                                512 to "512M",
                                1024 to "1G"
                            ),
                            selected = audioCacheMaxMb,
                            onSelect = { SettingsStateFlow.setAudioCacheMaxMb(it) }
                        )
                    }
                }
            }

            // ---- 服务器 ----
            SectionTitle(text = "服务器")
            GlassCard(modifier = Modifier.padding(horizontal = 16.dp)) {
                if (editingUrl) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        GlassTextField(
                            value = urlInput,
                            onValueChange = { urlInput = it },
                            hint = "http://192.168.1.100:3000",
                            leadingIcon = AppIcons.Home
                        )
                        Spacer(Modifier.height(12.dp))
                        Row(modifier = Modifier.align(Alignment.End)) {
                            GlassButton(
                                text = "取消",
                                style = GlassButtonStyle.Glass,
                                compact = true,
                                onClick = {
                                    editingUrl = false
                                    urlInput = serverUrl
                                }
                            )
                            Spacer(Modifier.width(10.dp))
                            GlassButton(
                                text = "保存",
                                compact = true,
                                onClick = {
                                    if (urlInput.isNotBlank()) {
                                        SettingsStateFlow.setServerUrl(urlInput.trim())
                                        editingUrl = false
                                    }
                                }
                            )
                        }
                    }
                } else {
                    GlassListItem(
                        title = "服务器地址",
                        subtitle = serverUrl.ifEmpty { "未配置" },
                        leadingIcon = AppIcons.Home,
                        showChevron = true,
                        onClick = {
                            editingUrl = true
                            urlInput = serverUrl
                        }
                    )
                }
            }

            // ---- 关于 ----
            SectionTitle(text = "关于")
            GlassCard(modifier = Modifier.padding(horizontal = 16.dp)) {
                GlassListItem(
                    title = "StreamSound 流声",
                    subtitle = "版本 0.3.0-alpha.1 · 液态玻璃主题",
                    leadingIcon = AppIcons.Album
                )
            }

            Spacer(Modifier.height(chromeBottomSpace))
        }
    }
}
