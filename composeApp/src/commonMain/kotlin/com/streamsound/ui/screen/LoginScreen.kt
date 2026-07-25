package com.streamsound.ui.screen

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.Icon
import androidx.compose.material.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.streamsound.navigation.LocalNavBackStack
import com.streamsound.navigation.ScreenRoute
import com.streamsound.store.AuthStateFlow
import com.streamsound.store.SettingsStateFlow
import com.streamsound.ui.component.*
import com.streamsound.ui.theme.StreamSoundColors
import kotlinx.coroutines.launch

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

    GlassScreen {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Logo：液态玻璃圆 + 音符
            Box(
                modifier = Modifier
                    .size(92.dp)
                    .clip(CircleShape)
                    .background(
                        Brush.radialGradient(
                            listOf(
                                StreamSoundColors.accent.copy(alpha = 0.85f),
                                StreamSoundColors.accentDeep.copy(alpha = 0.55f),
                                StreamSoundColors.accentDeep.copy(alpha = 0.2f)
                            )
                        )
                    )
                    .border(1.dp, StreamSoundColors.glassBorderLight, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = AppIcons.MusicNote,
                    contentDescription = null,
                    tint = StreamSoundColors.textPrimary,
                    modifier = Modifier.size(44.dp)
                )
            }

            Spacer(Modifier.height(20.dp))

            Text(
                text = "流声",
                color = StreamSoundColors.textPrimary,
                fontSize = 32.sp,
                fontWeight = FontWeight.Bold
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text = "自托管音乐串流服务",
                color = StreamSoundColors.textSecondary,
                fontSize = 14.sp
            )

            Spacer(Modifier.height(36.dp))

            GlassCard(cornerRadius = 22.dp) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Text(
                        text = if (isRegister) "创建账号" else "欢迎回来",
                        color = StreamSoundColors.textPrimary,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(Modifier.height(16.dp))

                    GlassTextField(
                        value = serverUrl,
                        onValueChange = { serverUrl = it },
                        hint = "服务器地址  http://192.168.1.100:3000",
                        leadingIcon = AppIcons.Home
                    )
                    Spacer(Modifier.height(12.dp))
                    GlassTextField(
                        value = username,
                        onValueChange = { username = it },
                        hint = "用户名",
                        leadingIcon = AppIcons.Person
                    )
                    Spacer(Modifier.height(12.dp))
                    GlassTextField(
                        value = password,
                        onValueChange = { password = it },
                        hint = "密码",
                        isPassword = true
                    )

                    error?.let {
                        Spacer(Modifier.height(14.dp))
                        GlassBanner(text = it, type = GlassBannerType.Error)
                    }
                    registerSuccess?.let {
                        Spacer(Modifier.height(14.dp))
                        GlassBanner(text = it, type = GlassBannerType.Success)
                    }

                    Spacer(Modifier.height(18.dp))

                    GlassButton(
                        text = if (isLoading) "请稍候..." else if (isRegister) "注 册" else "登 录",
                        enabled = !isLoading,
                        modifier = Modifier.fillMaxWidth(),
                        onClick = {
                            if (serverUrl.isBlank() || username.isBlank() || password.isBlank()) return@GlassButton
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
                                        navBackStack.clear()
                                        navBackStack.add(ScreenRoute.Library)
                                    }
                                }
                            }
                        }
                    )
                }
            }

            Spacer(Modifier.height(18.dp))

            Text(
                text = if (isRegister) "已有账号？去登录" else "没有账号？去注册",
                color = StreamSoundColors.accent,
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                modifier = Modifier.noRippleClickable {
                    isRegister = !isRegister
                    registerSuccess = null
                }
            )
        }
    }
}
