package com.streamsound.ui.component

import androidx.compose.runtime.Composable
import com.moriafly.salt.ui.dialog.YesDialog
import com.moriafly.salt.ui.dialog.YesNoDialog

@Composable
fun ErrorDialog(
    visible: Boolean,
    title: String,
    message: String,
    onDismiss: () -> Unit,
    primaryAction: (() -> Unit)? = null
) {
    if (!visible) return
    YesDialog(
        onDismissRequest = onDismiss,
        title = title,
        content = message
    )
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
    YesNoDialog(
        onDismissRequest = onDismiss,
        onConfirm = onConfirm,
        title = title,
        content = message
    )
}
