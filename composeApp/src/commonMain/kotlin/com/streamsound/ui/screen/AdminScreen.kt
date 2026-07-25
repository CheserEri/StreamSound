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
import com.streamsound.model.AdminUser
import com.streamsound.model.ScanStatus
import com.streamsound.model.UserRole
import com.streamsound.network.AdminApi
import com.streamsound.ui.component.*
import com.streamsound.ui.theme.StreamSoundColors
import kotlinx.coroutines.launch

/**
 * 管理面板（仅管理员）
 */
@Composable
fun AdminScreen() {
    var users by remember { mutableStateOf<List<AdminUser>>(emptyList()) }
    var scanStatus by remember { mutableStateOf<ScanStatus?>(null) }
    var musicRoot by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        try {
            users = AdminApi.getUsers()
            scanStatus = AdminApi.getScanStatus()
            musicRoot = AdminApi.getMusicRoot()
        } catch (e: Exception) {
            error = e.message
        } finally {
            isLoading = false
        }
    }

    GlassScreen(title = "管理面板", subtitle = "管理员功能", showBack = true) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
        ) {
            // ---- 音乐扫描 ----
            SectionTitle(text = "音乐扫描")
            GlassCard(modifier = Modifier.padding(horizontal = 16.dp)) {
                GlassListItem(
                    title = "音乐目录",
                    subtitle = musicRoot.ifEmpty { "未配置" },
                    leadingIcon = AppIcons.Folder
                )
                GlassDivider()
                scanStatus?.let { status ->
                    GlassListItem(
                        title = "扫描状态",
                        subtitle = if (status.isScanning) {
                            "扫描中 · 已处理 ${status.scannedCount} 个文件"
                        } else {
                            "空闲"
                        },
                        leadingIcon = AppIcons.Refresh,
                        trailing = {
                            GlassBadge(
                                text = if (status.isScanning) "进行中" else "空闲",
                                color = if (status.isScanning) StreamSoundColors.warning else StreamSoundColors.success
                            )
                        }
                    )
                    if (!status.isScanning) {
                        GlassDivider()
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp)
                        ) {
                            GlassButton(
                                text = "开始扫描",
                                enabled = musicRoot.isNotBlank(),
                                modifier = Modifier.fillMaxWidth(),
                                onClick = {
                                    scope.launch {
                                        try {
                                            AdminApi.startScan(musicRoot)
                                            scanStatus = AdminApi.getScanStatus()
                                        } catch (e: Exception) {
                                            error = e.message
                                        }
                                    }
                                }
                            )
                        }
                    }
                } ?: GlassListItem(
                    title = "扫描状态",
                    subtitle = "读取中...",
                    leadingIcon = AppIcons.Refresh
                )
            }

            // ---- 用户管理 ----
            SectionTitle(text = "用户管理 (${users.size})")

            error?.let {
                GlassBanner(
                    text = it,
                    type = GlassBannerType.Error,
                    modifier = Modifier.padding(horizontal = 16.dp)
                )
                Spacer(Modifier.height(12.dp))
            }

            if (isLoading) {
                LoadingState(
                    modifier = Modifier.fillMaxWidth().height(160.dp),
                    text = "加载用户..."
                )
            } else {
                GlassCard(modifier = Modifier.padding(horizontal = 16.dp)) {
                    users.forEachIndexed { index, adminUser ->
                        if (index > 0) GlassDivider()
                        GlassListItem(
                            title = adminUser.username,
                            subtitle = when {
                                adminUser.role == UserRole.ADMIN -> "管理员"
                                adminUser.approved -> "已批准"
                                else -> "待审批"
                            },
                            leadingIcon = AppIcons.Person,
                            trailing = {
                                when {
                                    adminUser.role == UserRole.ADMIN -> GlassBadge(text = "ADMIN")
                                    adminUser.approved -> GlassBadge(
                                        text = "已批准",
                                        color = StreamSoundColors.success
                                    )
                                    else -> GlassBadge(
                                        text = "待审批",
                                        color = StreamSoundColors.warning
                                    )
                                }
                            }
                        )
                        if (adminUser.role != UserRole.ADMIN) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(start = 16.dp, end = 16.dp, bottom = 12.dp)
                            ) {
                                GlassButton(
                                    text = if (adminUser.approved) "取消批准" else "批准使用",
                                    style = if (adminUser.approved) GlassButtonStyle.Danger else GlassButtonStyle.Primary,
                                    compact = true,
                                    modifier = Modifier.align(Alignment.CenterEnd),
                                    onClick = {
                                        scope.launch {
                                            try {
                                                AdminApi.approveUser(adminUser.id, !adminUser.approved)
                                                users = AdminApi.getUsers()
                                            } catch (e: Exception) {
                                                error = e.message
                                            }
                                        }
                                    }
                                )
                            }
                        }
                    }
                }
            }

            Spacer(Modifier.height(chromeBottomSpace))
        }
    }
}
