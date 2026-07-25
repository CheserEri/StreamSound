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
import com.streamsound.model.Folder
import com.streamsound.model.UserRole
import com.streamsound.navigation.LocalNavBackStack
import com.streamsound.navigation.ScreenRoute
import com.streamsound.network.LibraryApi
import com.streamsound.store.AuthStateFlow
import com.streamsound.ui.component.*
import com.streamsound.ui.theme.StreamSoundColors

/**
 * 首页 Tab：音乐库（文件夹浏览 + 快捷入口）
 */
@Composable
fun LibraryScreen() {
    val navBackStack = LocalNavBackStack.current
    val user by AuthStateFlow.user.collectAsState()
    var folders by remember { mutableStateOf<List<Folder>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        try {
            folders = LibraryApi.getFolders()
        } catch (e: Exception) {
            error = e.message
        } finally {
            isLoading = false
        }
    }

    GlassScreen {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
        ) {
            Spacer(Modifier.height(12.dp))

            val totalTracks = folders.sumOf { it.trackCount }
            LargeTitle(
                title = "音乐库",
                subtitle = if (folders.isNotEmpty()) "${folders.size} 个文件夹 · $totalTracks 首歌曲" else "StreamSound"
            )

            // 快捷入口
            SectionTitle(text = "快捷入口")
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
            ) {
                QuickEntryCard(
                    title = "播放历史",
                    icon = AppIcons.Clock,
                    modifier = Modifier.weight(1f),
                    onClick = { navBackStack.add(ScreenRoute.History) }
                )
                if (user?.role == UserRole.ADMIN) {
                    Spacer(Modifier.width(12.dp))
                    QuickEntryCard(
                        title = "管理面板",
                        icon = AppIcons.Settings,
                        modifier = Modifier.weight(1f),
                        onClick = { navBackStack.add(ScreenRoute.Admin) }
                    )
                }
            }

            when {
                isLoading -> {
                    LoadingState(
                        modifier = Modifier.fillMaxWidth().height(280.dp),
                        text = "正在读取音乐库..."
                    )
                }
                error != null -> {
                    Spacer(Modifier.height(24.dp))
                    GlassBanner(
                        text = error ?: "加载失败",
                        type = GlassBannerType.Error,
                        modifier = Modifier.padding(horizontal = 16.dp)
                    )
                }
                folders.isEmpty() -> {
                    EmptyState(
                        icon = AppIcons.Folder,
                        title = "音乐库为空",
                        hint = "请在管理面板中扫描音乐目录",
                        modifier = Modifier.fillMaxWidth().height(360.dp)
                    )
                }
                else -> {
                    SectionTitle(text = "文件夹")
                    GlassCard(modifier = Modifier.padding(horizontal = 16.dp)) {
                        folders.forEachIndexed { index, folder ->
                            if (index > 0) GlassDivider()
                            GlassListItem(
                                title = folder.name,
                                subtitle = "${folder.trackCount} 首",
                                leadingIcon = AppIcons.Folder,
                                showChevron = true,
                                onClick = {
                                    navBackStack.add(ScreenRoute.Folder(folder.id, folder.name))
                                }
                            )
                        }
                    }
                }
            }

            Spacer(Modifier.height(chromeBottomSpace))
        }
    }
}

@Composable
private fun QuickEntryCard(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    GlassCard(modifier = modifier, onClick = onClick) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            GlassIconCircle(icon = icon)
            Spacer(Modifier.width(10.dp))
            Text(
                text = title,
                color = StreamSoundColors.textPrimary,
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium
            )
        }
    }
}
