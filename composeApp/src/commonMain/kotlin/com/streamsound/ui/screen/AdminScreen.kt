package com.streamsound.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import com.moriafly.salt.ui.*
import com.streamsound.model.AdminUser
import com.streamsound.model.ScanStatus
import com.streamsound.network.AdminApi

@OptIn(UnstableSaltUiApi::class)
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

    BasicScreenColumn(title = "管理") {
        ItemOuterLargeTitle(text = "管理面板", sub = "管理员功能")

        // Scan section
        ItemOuterTitle(text = "音乐扫描")
        RoundedColumn {
            Item(
                onClick = {},
                text = "音乐目录",
                sub = musicRoot.ifEmpty { "未配置" }
            )
            scanStatus?.let { status ->
                Item(
                    onClick = {},
                    text = "扫描状态",
                    sub = if (status.isScanning) "扫描中 (${status.scannedCount})" else "空闲"
                )
                if (!status.isScanning) {
                    ItemButton(
                        onClick = {
                            scope.launch {
                                try {
                                    AdminApi.startScan(musicRoot)
                                    scanStatus = AdminApi.getScanStatus()
                                } catch (e: Exception) {
                                    error = e.message
                                }
                            }
                        },
                        text = "开始扫描",
                        enabled = musicRoot.isNotBlank()
                    )
                }
            }
        }

        // Users section
        ItemOuterTitle(text = "用户管理")
        if (isLoading) {
            RoundedColumn {
                Item(onClick = {}, text = "加载中...")
            }
        }

        error?.let {
            RoundedColumn {
                ItemInfo(text = it, infoType = ItemInfoType.Error)
            }
        }

        users.forEach { adminUser ->
            RoundedColumn {
                Item(
                    onClick = {},
                    text = adminUser.username,
                    sub = when {
                        adminUser.role.name == "ADMIN" -> "管理员"
                        adminUser.approved -> "已批准"
                        else -> "待审批"
                    }
                )
                if (adminUser.role.name != "ADMIN") {
                    ItemButton(
                        onClick = {
                            scope.launch {
                                try {
                                    AdminApi.approveUser(adminUser.id, !adminUser.approved)
                                    users = AdminApi.getUsers()
                                } catch (e: Exception) {
                                    error = e.message
                                }
                            }
                        },
                        text = if (adminUser.approved) "取消批准" else "批准",
                        primary = !adminUser.approved
                    )
                }
            }
        }
    }
}
