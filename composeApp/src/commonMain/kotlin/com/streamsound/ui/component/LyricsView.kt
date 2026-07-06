package com.streamsound.ui.component

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.moriafly.salt.ui.Text
import com.moriafly.salt.ui.noRippleClickable
import com.streamsound.model.LyricsSize
import com.streamsound.store.PlayerStateFlow
import com.streamsound.ui.theme.StreamSoundColors
import com.streamsound.util.LyricLine
import com.streamsound.util.findCurrentLineIndex
import com.streamsound.util.parseLyrics
import kotlin.math.abs

@Composable
fun LyricsView(
    lyrics: String?,
    size: LyricsSize = LyricsSize.MD,
    onLinePress: ((Double) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val progress by PlayerStateFlow.progress.collectAsState()
    val parsedLyrics = remember(lyrics) { parseLyrics(lyrics) }
    val currentIndex = remember(progress, parsedLyrics) {
        findCurrentLineIndex(parsedLyrics, progress)
    }

    val activeFontSize = when (size) {
        LyricsSize.SM -> 16.sp
        LyricsSize.MD -> 20.sp
        LyricsSize.LG -> 24.sp
    }
    val inactiveFontSize = when (size) {
        LyricsSize.SM -> 14.sp
        LyricsSize.MD -> 16.sp
        LyricsSize.LG -> 18.sp
    }

    if (parsedLyrics.isEmpty()) {
        Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "♪",
                    fontSize = 48.sp,
                    color = StreamSoundColors.lyricsEmptyIcon
                )
                Spacer(Modifier.height(16.dp))
                Text(
                    text = "暂无歌词",
                    fontSize = 18.sp,
                    color = StreamSoundColors.lyricsEmptyText
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    text = "请确保歌曲目录中有同名 .lrc 文件",
                    fontSize = 13.sp,
                    color = StreamSoundColors.lyricsEmptyHint,
                    textAlign = TextAlign.Center
                )
            }
        }
        return
    }

    val listState = rememberLazyListState()

    LaunchedEffect(currentIndex) {
        if (currentIndex >= 0) {
            listState.animateScrollToItem(currentIndex, -200)
        }
    }

    LazyColumn(
        state = listState,
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(vertical = 300.dp)
    ) {
        itemsIndexed(parsedLyrics) { index, line ->
            val distance = abs(index - currentIndex)
            val isActive = index == currentIndex
            val alpha = if (isActive) 1f else (1f - distance * 0.15f).coerceAtLeast(0.2f)
            val fontSize = if (isActive) activeFontSize else inactiveFontSize
            val color = when {
                isActive -> StreamSoundColors.lyricsActive
                index < currentIndex -> StreamSoundColors.lyricsPast
                else -> StreamSoundColors.lyricsFuture
            }

            Text(
                text = line.text,
                fontSize = fontSize,
                fontWeight = if (isActive) FontWeight.Bold else FontWeight.Normal,
                color = color.copy(alpha = alpha),
                modifier = Modifier
                    .fillMaxWidth()
                    .noRippleClickable { onLinePress?.invoke(line.time) }
                    .graphicsLayer {
                        if (isActive) {
                            scaleX = 1.05f
                            scaleY = 1.05f
                        }
                    }
                    .padding(horizontal = 24.dp, vertical = 8.dp),
                textAlign = TextAlign.Center
            )
        }
    }
}
