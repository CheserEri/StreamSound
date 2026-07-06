package com.streamsound.util

data class LyricLine(
    val time: Double,
    val text: String
)

fun parseLyrics(lrc: String?): List<LyricLine> {
    if (lrc.isNullOrBlank()) return emptyList()
    val regex = Regex("""\[(\d{2}):(\d{2})\.(\d{2,3})](.*)""")
    return lrc.lines().mapNotNull { line ->
        val match = regex.matchEntire(line.trim()) ?: return@mapNotNull null
        val mins = match.groupValues[1].toDouble()
        val secs = match.groupValues[2].toDouble()
        val millis = match.groupValues[3].let {
            if (it.length == 2) it.toDouble() * 10 else it.toDouble()
        }
        val time = mins * 60 + secs + millis / 1000
        val text = match.groupValues[4].trim()
        if (text.isNotEmpty()) LyricLine(time, text) else null
    }.sortedBy { it.time }
}

fun findCurrentLineIndex(lyrics: List<LyricLine>, progressSeconds: Double): Int {
    if (lyrics.isEmpty()) return -1
    var idx = -1
    for (i in lyrics.indices) {
        if (lyrics[i].time <= progressSeconds) idx = i else break
    }
    return idx
}
