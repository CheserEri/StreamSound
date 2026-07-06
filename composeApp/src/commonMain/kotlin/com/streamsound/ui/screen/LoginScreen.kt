package com.streamsound.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import com.moriafly.salt.ui.*
import com.streamsound.navigation.LocalNavBackStack
import com.streamsound.navigation.ScreenRoute
import com.streamsound.store.AuthStateFlow
import com.streamsound.store.SettingsStateFlow

@OptIn(UnstableSaltUiApi::class)
@Composable
fun LoginScreen() {
    val navBackStack = LocalNavBackStack.current
    val isLoading by AuthStateFlow.isLoading.collectAsState()
    val error by AuthStateFlow.error.collectAsState()
    val scope = rememberCoroutineScope()

    var serverUrl by remember { mutableStateOf(SettingsStateFlow.serverUrl.value) }
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isRegister by remember { mutableStateOf(false) }
    var registerSuccess by remember { mutableStateOf<String?>(null) }

    BasicScreenColumn(title = "StreamSound", showBackBtn = false) {
        ItemOuterLargeTitle(
            text = if (isRegister) "注册" else "登录",
            sub = "自托管音乐串流服务"
        )

        RoundedColumn {
            ItemEdit(
                text = serverUrl,
                onChange = { serverUrl = it },
                hint = "http://192.168.1.100:3000"
            )
            ItemEdit(
                text = username,
                onChange = { username = it },
                hint = "请输入用户名"
            )
            ItemEditPassword(
                text = password,
                onChange = { password = it },
                hint = "请输入密码"
            )
        }

        error?.let {
            RoundedColumn {
                ItemInfo(text = it, infoType = ItemInfoType.Error)
            }
        }

        registerSuccess?.let { msg ->
            RoundedColumn {
                ItemInfo(text = msg, infoType = ItemInfoType.Success)
            }
        }

        RoundedColumn {
            ItemButton(
                onClick = {
                    if (serverUrl.isBlank() || username.isBlank() || password.isBlank()) return@ItemButton
                    registerSuccess = null
                    scope.launch {
                        if (isRegister) {
                            val message = AuthStateFlow.register(serverUrl, username, password)
                            if (message != null) {
                                registerSuccess = message.ifEmpty { "注册成功，请登录" }
                                isRegister = false
                                username = ""
                                password = ""
                            }
                        } else {
                            val success = AuthStateFlow.login(serverUrl, username, password)
                            if (success) {
                                navBackStack.add(ScreenRoute.Library)
                            }
                        }
                    }
                },
                text = if (isLoading) "请稍候..." else if (isRegister) "注册" else "登录",
                enabled = !isLoading
            )
        }

        RoundedColumn {
            Item(
                onClick = { isRegister = !isRegister; registerSuccess = null },
                text = if (isRegister) "已有账号？去登录" else "没有账号？去注册"
            )
        }
    }
}
