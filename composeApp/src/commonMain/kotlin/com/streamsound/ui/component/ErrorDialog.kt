package com.streamsound.ui.component

import androidx.compose.foundation.layout.*
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.streamsound.ui.theme.StreamSoundColors

@Composable
fun ErrorDialog(
    visible: Boolean,
    title: String,
    message: String,
    onDismiss: () -> Unit,
    primaryAction: (() -> Unit)? = null
) {
    if (!visible) return
    Dialog(onDismissRequest = onDismiss) {
        GlassCard(cornerRadius = 22.dp) {
            Column(modifier = Modifier.padding(22.dp)) {
                Text(
                    text = title,
                    color = StreamSoundColors.textPrimary,
                    fontSize = 17.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(Modifier.height(10.dp))
                Text(
                    text = message,
                    color = StreamSoundColors.textSecondary,
                    fontSize = 14.sp
                )
                Spacer(Modifier.height(20.dp))
                GlassButton(
                    text = "知道了",
                    onClick = {
                        primaryAction?.invoke() ?: onDismiss()
                    },
                    modifier = Modifier.align(Alignment.End),
                    compact = true
                )
            }
        }
    }
}

@Composable
fun ConfirmDialog(
    visible: Boolean,
    title: String,
    message: String,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    if (!visible) return
    Dialog(onDismissRequest = onDismiss) {
        GlassCard(cornerRadius = 22.dp) {
            Column(modifier = Modifier.padding(22.dp)) {
                Text(
                    text = title,
                    color = StreamSoundColors.textPrimary,
                    fontSize = 17.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(Modifier.height(10.dp))
                Text(
                    text = message,
                    color = StreamSoundColors.textSecondary,
                    fontSize = 14.sp
                )
                Spacer(Modifier.height(20.dp))
                Row(modifier = Modifier.align(Alignment.End)) {
                    GlassButton(
                        text = "取消",
                        onClick = onDismiss,
                        style = GlassButtonStyle.Glass,
                        compact = true
                    )
                    Spacer(Modifier.width(10.dp))
                    GlassButton(
                        text = "确定",
                        onClick = {
                            onConfirm()
                            onDismiss()
                        },
                        compact = true
                    )
                }
            }
        }
    }
}
