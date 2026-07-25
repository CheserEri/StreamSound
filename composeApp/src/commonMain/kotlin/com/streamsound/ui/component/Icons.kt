package com.streamsound.ui.component

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathFillType
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.path
import androidx.compose.ui.unit.dp

object AppIcons {
    val Play: ImageVector by lazy {
        ImageVector.Builder("Play", 24f.dp, 24f.dp, 24f, 24f).apply {
            path(fill = SolidColor(Color.White), pathFillType = PathFillType.EvenOdd) {
                moveTo(8f, 5.14f)
                verticalLineTo(18.86f)
                curveTo(8f, 19.62f, 8.84f, 20.08f, 9.49f, 19.7f)
                lineTo(18.09f, 14.84f)
                curveTo(18.71f, 14.48f, 18.71f, 13.52f, 18.09f, 13.16f)
                lineTo(9.49f, 8.30f)
                curveTo(8.84f, 7.92f, 8f, 8.38f, 8f, 9.14f)
                close()
            }
        }.build()
    }

    val Pause: ImageVector by lazy {
        ImageVector.Builder("Pause", 24f.dp, 24f.dp, 24f, 24f).apply {
            path(fill = SolidColor(Color.White)) {
                moveTo(6f, 4f)
                horizontalLineTo(10f)
                verticalLineTo(20f)
                horizontalLineTo(6f)
                close()
                moveTo(14f, 4f)
                horizontalLineTo(18f)
                verticalLineTo(20f)
                horizontalLineTo(14f)
                close()
            }
        }.build()
    }

    val SkipPrevious: ImageVector by lazy {
        ImageVector.Builder("SkipPrevious", 24f.dp, 24f.dp, 24f, 24f).apply {
            path(fill = SolidColor(Color.White)) {
                moveTo(6f, 6f)
                horizontalLineTo(8f)
                verticalLineTo(18f)
                horizontalLineTo(6f)
                close()
                moveTo(9.5f, 12f)
                lineTo(18f, 6f)
                verticalLineTo(18f)
                close()
            }
        }.build()
    }

    val SkipNext: ImageVector by lazy {
        ImageVector.Builder("SkipNext", 24f.dp, 24f.dp, 24f, 24f).apply {
            path(fill = SolidColor(Color.White)) {
                moveTo(6f, 18f)
                lineTo(14.5f, 12f)
                lineTo(6f, 6f)
                close()
                moveTo(16f, 6f)
                horizontalLineTo(18f)
                verticalLineTo(18f)
                horizontalLineTo(16f)
                close()
            }
        }.build()
    }

    val Shuffle: ImageVector by lazy {
        ImageVector.Builder("Shuffle", 24f.dp, 24f.dp, 24f, 24f).apply {
            path(fill = SolidColor(Color.White)) {
                moveTo(10.59f, 9.17f)
                lineTo(5.41f, 4f)
                lineTo(4f, 5.41f)
                lineTo(9.17f, 10.59f)
                close()
                moveTo(14.5f, 4f)
                lineTo(20f, 4f)
                verticalLineTo(6f)
                lineTo(15.88f, 6f)
                lineTo(17.78f, 8.78f)
                lineTo(16.36f, 10.2f)
                lineTo(13f, 6.5f)
                close()
                moveTo(14.5f, 20f)
                lineTo(20f, 20f)
                verticalLineTo(18f)
                lineTo(15.88f, 18f)
                lineTo(17.78f, 15.22f)
                lineTo(16.36f, 13.8f)
                lineTo(13f, 17.5f)
                close()
                moveTo(4f, 18.59f)
                lineTo(9.17f, 13.41f)
                lineTo(10.59f, 14.83f)
                lineTo(5.41f, 20f)
                close()
            }
        }.build()
    }

    val Repeat: ImageVector by lazy {
        ImageVector.Builder("Repeat", 24f.dp, 24f.dp, 24f, 24f).apply {
            path(fill = SolidColor(Color.White)) {
                moveTo(7f, 7f)
                horizontalLineTo(17f)
                verticalLineTo(4f)
                lineTo(21f, 8f)
                lineTo(17f, 12f)
                verticalLineTo(9f)
                horizontalLineTo(7f)
                verticalLineTo(12f)
                lineTo(3f, 8f)
                lineTo(7f, 4f)
                close()
            }
        }.build()
    }

    val RepeatOne: ImageVector by lazy {
        ImageVector.Builder("RepeatOne", 24f.dp, 24f.dp, 24f, 24f).apply {
            path(fill = SolidColor(Color.White)) {
                moveTo(7f, 7f)
                horizontalLineTo(17f)
                verticalLineTo(4f)
                lineTo(21f, 8f)
                lineTo(17f, 12f)
                verticalLineTo(9f)
                horizontalLineTo(7f)
                verticalLineTo(12f)
                lineTo(3f, 8f)
                lineTo(7f, 4f)
                close()
            }
            path(fill = SolidColor(Color.White)) {
                moveTo(12f, 15f)
                horizontalLineTo(11f)
                verticalLineTo(13f)
                horizontalLineTo(13f)
                verticalLineTo(18f)
                horizontalLineTo(11f)
                verticalLineTo(17f)
                horizontalLineTo(12f)
                close()
            }
        }.build()
    }

    val HeartOutline: ImageVector by lazy {
        ImageVector.Builder("HeartOutline", 24f.dp, 24f.dp, 24f, 24f).apply {
            path(stroke = SolidColor(Color(0xFFAAAAAA)), strokeWidth = 2f, fill = SolidColor(Color.Transparent)) {
                moveTo(12f, 21.35f)
                lineTo(10.55f, 20.03f)
                curveTo(5.4f, 15.36f, 2f, 12.28f, 2f, 8.5f)
                curveTo(2f, 5.42f, 4.42f, 3f, 7.5f, 3f)
                curveTo(9.24f, 3f, 10.91f, 3.81f, 12f, 5.09f)
                curveTo(13.09f, 3.81f, 14.76f, 3f, 16.5f, 3f)
                curveTo(19.58f, 3f, 22f, 5.42f, 22f, 8.5f)
                curveTo(22f, 12.28f, 18.6f, 15.36f, 13.45f, 20.04f)
                close()
            }
        }.build()
    }

    val HeartFilled: ImageVector by lazy {
        ImageVector.Builder("HeartFilled", 24f.dp, 24f.dp, 24f, 24f).apply {
            path(fill = SolidColor(Color(0xFFFF4757))) {
                moveTo(12f, 21.35f)
                lineTo(10.55f, 20.03f)
                curveTo(5.4f, 15.36f, 2f, 12.28f, 2f, 8.5f)
                curveTo(2f, 5.42f, 4.42f, 3f, 7.5f, 3f)
                curveTo(9.24f, 3f, 10.91f, 3.81f, 12f, 5.09f)
                curveTo(13.09f, 3.81f, 14.76f, 3f, 16.5f, 3f)
                curveTo(19.58f, 3f, 22f, 5.42f, 22f, 8.5f)
                curveTo(22f, 12.28f, 18.6f, 15.36f, 13.45f, 20.04f)
                close()
            }
        }.build()
    }

    val Search: ImageVector by lazy {
        ImageVector.Builder("Search", 24f.dp, 24f.dp, 24f, 24f).apply {
            path(fill = SolidColor(Color.White)) {
                moveTo(15.5f, 14f)
                horizontalLineTo(14.71f)
                lineTo(14.43f, 13.73f)
                curveTo(15.41f, 12.59f, 16f, 11.11f, 16f, 9.5f)
                curveTo(16f, 5.91f, 13.09f, 3f, 9.5f, 3f)
                curveTo(5.91f, 3f, 3f, 5.91f, 3f, 9.5f)
                curveTo(3f, 13.09f, 5.91f, 16f, 9.5f, 16f)
                curveTo(11.11f, 16f, 12.59f, 15.41f, 13.73f, 14.43f)
                lineTo(14f, 14.71f)
                verticalLineTo(15.5f)
                lineTo(19f, 20.49f)
                lineTo(20.49f, 19f)
                close()
                moveTo(9.5f, 14f)
                curveTo(7.01f, 14f, 5f, 11.99f, 5f, 9.5f)
                curveTo(5f, 7.01f, 7.01f, 5f, 9.5f, 5f)
                curveTo(11.99f, 5f, 14f, 7.01f, 14f, 9.5f)
                curveTo(14f, 11.99f, 11.99f, 14f, 9.5f, 14f)
            }
        }.build()
    }

    val Settings: ImageVector by lazy {
        ImageVector.Builder("Settings", 24f.dp, 24f.dp, 24f, 24f).apply {
            path(fill = SolidColor(Color.White)) {
                moveTo(19.14f, 12.94f)
                curveTo(19.18f, 12.64f, 19.2f, 12.33f, 19.2f, 12f)
                curveTo(19.2f, 11.68f, 19.18f, 11.36f, 19.13f, 11.06f)
                lineTo(21.16f, 9.48f)
                curveTo(21.34f, 9.34f, 21.39f, 9.07f, 21.28f, 8.87f)
                lineTo(19.36f, 5.55f)
                curveTo(19.24f, 5.33f, 18.99f, 5.26f, 18.77f, 5.33f)
                lineTo(16.38f, 6.29f)
                curveTo(15.88f, 5.91f, 15.35f, 5.59f, 14.76f, 5.35f)
                lineTo(14.4f, 2.81f)
                curveTo(14.36f, 2.57f, 14.16f, 2.4f, 13.92f, 2.4f)
                horizontalLineTo(10.08f)
                curveTo(9.84f, 2.4f, 9.65f, 2.57f, 9.61f, 2.81f)
                lineTo(9.25f, 5.35f)
                curveTo(8.66f, 5.59f, 8.12f, 5.92f, 7.63f, 6.29f)
                lineTo(5.24f, 5.33f)
                curveTo(5.02f, 5.25f, 4.77f, 5.33f, 4.65f, 5.55f)
                lineTo(2.74f, 8.87f)
                curveTo(2.62f, 9.08f, 2.66f, 9.34f, 2.86f, 9.48f)
                lineTo(4.89f, 11.06f)
                curveTo(4.84f, 11.36f, 4.8f, 11.69f, 4.8f, 12f)
                curveTo(4.8f, 12.31f, 4.82f, 12.64f, 4.87f, 12.94f)
                lineTo(2.84f, 14.52f)
                curveTo(2.66f, 14.66f, 2.61f, 14.93f, 2.72f, 15.13f)
                lineTo(4.64f, 18.45f)
                curveTo(4.76f, 18.67f, 5.01f, 18.74f, 5.23f, 18.67f)
                lineTo(7.62f, 17.71f)
                curveTo(8.12f, 18.09f, 8.65f, 18.41f, 9.24f, 18.65f)
                lineTo(9.6f, 21.19f)
                curveTo(9.65f, 21.43f, 9.84f, 21.6f, 10.08f, 21.6f)
                horizontalLineTo(13.92f)
                curveTo(14.16f, 21.6f, 14.36f, 21.43f, 14.39f, 21.19f)
                lineTo(14.75f, 18.65f)
                curveTo(15.34f, 18.41f, 15.88f, 18.09f, 16.37f, 17.71f)
                lineTo(18.76f, 18.67f)
                curveTo(18.98f, 18.75f, 19.23f, 18.67f, 19.35f, 18.45f)
                lineTo(21.27f, 15.13f)
                curveTo(21.39f, 14.92f, 21.34f, 14.66f, 21.15f, 14.52f)
                close()
                moveTo(12f, 15.6f)
                curveTo(10.02f, 15.6f, 8.4f, 13.98f, 8.4f, 12f)
                curveTo(8.4f, 10.02f, 10.02f, 8.4f, 12f, 8.4f)
                curveTo(13.98f, 8.4f, 15.6f, 10.02f, 15.6f, 12f)
                curveTo(15.6f, 13.98f, 13.98f, 15.6f, 12f, 15.6f)
            }
        }.build()
    }

    val Clock: ImageVector by lazy {
        ImageVector.Builder("Clock", 24f.dp, 24f.dp, 24f, 24f).apply {
            path(fill = SolidColor(Color.White)) {
                moveTo(12f, 2f)
                curveTo(6.5f, 2f, 2f, 6.5f, 2f, 12f)
                reflectiveCurveTo(6.5f, 22f, 12f, 22f)
                reflectiveCurveTo(22f, 17.5f, 22f, 12f)
                reflectiveCurveTo(17.5f, 2f, 12f, 2f)
                moveTo(12f, 20f)
                curveTo(7.59f, 20f, 4f, 16.41f, 4f, 12f)
                reflectiveCurveTo(7.59f, 4f, 12f, 4f)
                reflectiveCurveTo(20f, 7.59f, 20f, 12f)
                reflectiveCurveTo(16.41f, 20f, 12f, 20f)
                moveTo(12.5f, 7f)
                horizontalLineTo(11f)
                verticalLineTo(13f)
                lineTo(16.25f, 16.15f)
                lineTo(17f, 14.92f)
                lineTo(12.5f, 12.25f)
                close()
            }
        }.build()
    }

    val Folder: ImageVector by lazy {
        ImageVector.Builder("Folder", 24f.dp, 24f.dp, 24f, 24f).apply {
            path(fill = SolidColor(Color.White)) {
                moveTo(10f, 4f)
                horizontalLineTo(4f)
                curveTo(2.9f, 4f, 2.01f, 4.9f, 2.01f, 6f)
                lineTo(2f, 18f)
                curveTo(2f, 19.1f, 2.9f, 20f, 4f, 20f)
                horizontalLineTo(20f)
                curveTo(21.1f, 20f, 22f, 19.1f, 22f, 18f)
                verticalLineTo(8f)
                curveTo(22f, 6.9f, 21.1f, 6f, 20f, 6f)
                horizontalLineTo(12f)
                lineTo(10f, 4f)
                close()
            }
        }.build()
    }

    val MusicNote: ImageVector by lazy {
        ImageVector.Builder("MusicNote", 24f.dp, 24f.dp, 24f, 24f).apply {
            path(fill = SolidColor(Color.White)) {
                moveTo(12f, 3f)
                verticalLineTo(13.55f)
                curveTo(11.41f, 13.21f, 10.73f, 13f, 10f, 13f)
                curveTo(7.79f, 13f, 6f, 14.79f, 6f, 17f)
                reflectiveCurveTo(7.79f, 21f, 10f, 21f)
                reflectiveCurveTo(14f, 19.21f, 14f, 17f)
                verticalLineTo(7f)
                horizontalLineTo(18f)
                verticalLineTo(3f)
                close()
            }
        }.build()
    }

    val Queue: ImageVector by lazy {
        ImageVector.Builder("Queue", 24f.dp, 24f.dp, 24f, 24f).apply {
            path(fill = SolidColor(Color.White)) {
                moveTo(15f, 6f)
                horizontalLineTo(3f)
                verticalLineTo(8f)
                horizontalLineTo(15f)
                close()
                moveTo(15f, 10f)
                horizontalLineTo(3f)
                verticalLineTo(12f)
                horizontalLineTo(15f)
                close()
                moveTo(3f, 16f)
                horizontalLineTo(11f)
                verticalLineTo(14f)
                horizontalLineTo(3f)
                close()
                moveTo(17f, 6f)
                verticalLineTo(14.18f)
                curveTo(16.69f, 14.07f, 16.35f, 14f, 16f, 14f)
                curveTo(14.34f, 14f, 13f, 15.34f, 13f, 17f)
                reflectiveCurveTo(14.34f, 20f, 16f, 20f)
                reflectiveCurveTo(19f, 18.66f, 19f, 17f)
                verticalLineTo(8f)
                horizontalLineTo(22f)
                verticalLineTo(6f)
                close()
            }
        }.build()
    }

    val ChevronDown: ImageVector by lazy {
        ImageVector.Builder("ChevronDown", 24f.dp, 24f.dp, 24f, 24f).apply {
            path(fill = SolidColor(Color.White)) {
                moveTo(7.41f, 8.59f)
                lineTo(12f, 13.17f)
                lineTo(16.59f, 8.59f)
                lineTo(18f, 10f)
                lineTo(12f, 16f)
                lineTo(6f, 10f)
                close()
            }
        }.build()
    }

    val ArrowBack: ImageVector by lazy {
        ImageVector.Builder("ArrowBack", 24f.dp, 24f.dp, 24f, 24f).apply {
            path(fill = SolidColor(Color.White)) {
                moveTo(20f, 11f)
                horizontalLineTo(7.83f)
                lineTo(13.42f, 5.41f)
                lineTo(12f, 4f)
                lineTo(4f, 12f)
                lineTo(12f, 20f)
                lineTo(13.41f, 18.59f)
                lineTo(7.83f, 13f)
                horizontalLineTo(20f)
                close()
            }
        }.build()
    }

    val ChevronRight: ImageVector by lazy {
        ImageVector.Builder("ChevronRight", 24f.dp, 24f.dp, 24f, 24f).apply {
            path(fill = SolidColor(Color.White)) {
                moveTo(10f, 6f)
                lineTo(8.59f, 7.41f)
                lineTo(13.17f, 12f)
                lineTo(8.59f, 16.59f)
                lineTo(10f, 18f)
                lineTo(16f, 12f)
                close()
            }
        }.build()
    }

    val Delete: ImageVector by lazy {
        ImageVector.Builder("Delete", 24f.dp, 24f.dp, 24f, 24f).apply {
            path(fill = SolidColor(Color(0xFFFF4444))) {
                moveTo(6f, 19f)
                curveTo(6f, 20.1f, 6.9f, 21f, 8f, 21f)
                horizontalLineTo(16f)
                curveTo(17.1f, 21f, 18f, 20.1f, 18f, 19f)
                verticalLineTo(7f)
                horizontalLineTo(6f)
                close()
                moveTo(19f, 4f)
                horizontalLineTo(15.5f)
                lineTo(14.5f, 3f)
                horizontalLineTo(9.5f)
                lineTo(8.5f, 4f)
                horizontalLineTo(5f)
                verticalLineTo(6f)
                horizontalLineTo(19f)
                close()
            }
        }.build()
    }

    val Home: ImageVector by lazy {
        ImageVector.Builder("Home", 24f.dp, 24f.dp, 24f, 24f).apply {
            path(fill = SolidColor(Color.White)) {
                moveTo(10f, 20f)
                verticalLineTo(14f)
                horizontalLineTo(14f)
                verticalLineTo(20f)
                horizontalLineTo(19f)
                verticalLineTo(12f)
                horizontalLineTo(22f)
                lineTo(12f, 3f)
                lineTo(2f, 12f)
                horizontalLineTo(5f)
                verticalLineTo(20f)
                close()
            }
        }.build()
    }

    val Person: ImageVector by lazy {
        ImageVector.Builder("Person", 24f.dp, 24f.dp, 24f, 24f).apply {
            path(fill = SolidColor(Color.White)) {
                moveTo(12f, 12f)
                curveTo(14.21f, 12f, 16f, 10.21f, 16f, 8f)
                reflectiveCurveTo(14.21f, 4f, 12f, 4f)
                reflectiveCurveTo(8f, 5.79f, 8f, 8f)
                reflectiveCurveTo(9.79f, 12f, 12f, 12f)
                close()
                moveTo(12f, 14f)
                curveTo(9.33f, 14f, 4f, 15.34f, 4f, 18f)
                verticalLineTo(20f)
                horizontalLineTo(20f)
                verticalLineTo(18f)
                curveTo(20f, 15.34f, 14.67f, 14f, 12f, 14f)
                close()
            }
        }.build()
    }

    val Album: ImageVector by lazy {
        ImageVector.Builder("Album", 24f.dp, 24f.dp, 24f, 24f).apply {
            path(fill = SolidColor(Color.White)) {
                moveTo(12f, 2f)
                curveTo(6.48f, 2f, 2f, 6.48f, 2f, 12f)
                reflectiveCurveTo(6.48f, 22f, 12f, 22f)
                reflectiveCurveTo(22f, 17.52f, 22f, 12f)
                reflectiveCurveTo(17.52f, 2f, 12f, 2f)
                close()
                moveTo(12f, 16.5f)
                curveTo(9.51f, 16.5f, 7.5f, 14.49f, 7.5f, 12f)
                reflectiveCurveTo(9.51f, 7.5f, 12f, 7.5f)
                reflectiveCurveTo(16.5f, 9.51f, 16.5f, 12f)
                reflectiveCurveTo(14.49f, 16.5f, 12f, 16.5f)
                close()
                moveTo(12f, 11f)
                curveTo(11.45f, 11f, 11f, 11.45f, 11f, 12f)
                reflectiveCurveTo(11.45f, 13f, 12f, 13f)
                reflectiveCurveTo(13f, 12.55f, 13f, 12f)
                reflectiveCurveTo(12.55f, 11f, 12f, 11f)
                close()
            }
        }.build()
    }

    val Close: ImageVector by lazy {
        ImageVector.Builder("Close", 24f.dp, 24f.dp, 24f, 24f).apply {
            path(fill = SolidColor(Color.White)) {
                moveTo(19f, 6.41f)
                lineTo(17.59f, 5f)
                lineTo(12f, 10.59f)
                lineTo(6.41f, 5f)
                lineTo(5f, 6.41f)
                lineTo(10.59f, 12f)
                lineTo(5f, 17.59f)
                lineTo(6.41f, 19f)
                lineTo(12f, 13.41f)
                lineTo(17.59f, 19f)
                lineTo(19f, 17.59f)
                lineTo(13.41f, 12f)
                close()
            }
        }.build()
    }

    val Logout: ImageVector by lazy {
        ImageVector.Builder("Logout", 24f.dp, 24f.dp, 24f, 24f).apply {
            path(fill = SolidColor(Color.White)) {
                moveTo(17f, 7f)
                lineTo(15.59f, 8.41f)
                lineTo(18.17f, 11f)
                horizontalLineTo(8f)
                verticalLineTo(13f)
                horizontalLineTo(18.17f)
                lineTo(15.59f, 15.58f)
                lineTo(17f, 17f)
                lineTo(22f, 12f)
                close()
                moveTo(4f, 5f)
                horizontalLineTo(12f)
                verticalLineTo(3f)
                horizontalLineTo(4f)
                curveTo(2.9f, 3f, 2f, 3.9f, 2f, 5f)
                verticalLineTo(19f)
                curveTo(2f, 20.1f, 2.9f, 21f, 4f, 21f)
                horizontalLineTo(12f)
                verticalLineTo(19f)
                horizontalLineTo(4f)
                close()
            }
        }.build()
    }

    val Refresh: ImageVector by lazy {
        ImageVector.Builder("Refresh", 24f.dp, 24f.dp, 24f, 24f).apply {
            path(fill = SolidColor(Color.White)) {
                moveTo(17.65f, 6.35f)
                curveTo(16.2f, 4.9f, 14.21f, 4f, 12f, 4f)
                curveTo(7.58f, 4f, 4.01f, 7.58f, 4.01f, 12f)
                reflectiveCurveTo(7.58f, 20f, 12f, 20f)
                curveTo(15.73f, 20f, 18.84f, 17.45f, 19.73f, 14f)
                horizontalLineTo(17.65f)
                curveTo(16.83f, 16.33f, 14.61f, 18f, 12f, 18f)
                curveTo(8.69f, 18f, 6f, 15.31f, 6f, 12f)
                reflectiveCurveTo(8.69f, 6f, 12f, 6f)
                curveTo(13.66f, 6f, 15.14f, 6.69f, 16.22f, 7.78f)
                lineTo(13f, 11f)
                horizontalLineTo(20f)
                verticalLineTo(4f)
                close()
            }
        }.build()
    }

    val Check: ImageVector by lazy {
        ImageVector.Builder("Check", 24f.dp, 24f.dp, 24f, 24f).apply {
            path(fill = SolidColor(Color.White)) {
                moveTo(9f, 16.17f)
                lineTo(4.83f, 12f)
                lineTo(3.41f, 13.41f)
                lineTo(9f, 19f)
                lineTo(21f, 7f)
                lineTo(19.59f, 5.59f)
                close()
            }
        }.build()
    }

    val Eye: ImageVector by lazy {
        ImageVector.Builder("Eye", 24f.dp, 24f.dp, 24f, 24f).apply {
            path(fill = SolidColor(Color.White)) {
                moveTo(12f, 4.5f)
                curveTo(7f, 4.5f, 2.73f, 7.61f, 1f, 12f)
                curveTo(2.73f, 16.39f, 7f, 19.5f, 12f, 19.5f)
                reflectiveCurveTo(21.27f, 16.39f, 23f, 12f)
                curveTo(21.27f, 7.61f, 17f, 4.5f, 12f, 4.5f)
                close()
                moveTo(12f, 17f)
                curveTo(9.24f, 17f, 7f, 14.76f, 7f, 12f)
                reflectiveCurveTo(9.24f, 7f, 12f, 7f)
                reflectiveCurveTo(17f, 9.24f, 17f, 12f)
                reflectiveCurveTo(14.76f, 17f, 12f, 17f)
                close()
                moveTo(12f, 9f)
                curveTo(10.34f, 9f, 9f, 10.34f, 9f, 12f)
                reflectiveCurveTo(10.34f, 15f, 12f, 15f)
                reflectiveCurveTo(15f, 13.66f, 15f, 12f)
                reflectiveCurveTo(13.66f, 9f, 12f, 9f)
                close()
            }
        }.build()
    }

    val EyeOff: ImageVector by lazy {
        ImageVector.Builder("EyeOff", 24f.dp, 24f.dp, 24f, 24f).apply {
            path(fill = SolidColor(Color.White)) {
                moveTo(12f, 7f)
                curveTo(14.76f, 7f, 17f, 9.24f, 17f, 12f)
                curveTo(17f, 12.65f, 16.87f, 13.26f, 16.64f, 13.83f)
                lineTo(19.56f, 16.75f)
                curveTo(21.07f, 15.49f, 22.26f, 13.86f, 23f, 12f)
                curveTo(21.27f, 7.61f, 17f, 4.5f, 12f, 4.5f)
                curveTo(10.6f, 4.5f, 9.26f, 4.75f, 8.02f, 5.2f)
                lineTo(10.18f, 7.36f)
                curveTo(10.74f, 7.13f, 11.35f, 7f, 12f, 7f)
                close()
                moveTo(2f, 4.27f)
                lineTo(4.28f, 6.55f)
                lineTo(4.74f, 7.01f)
                curveTo(3.08f, 8.3f, 1.78f, 10.02f, 1f, 12f)
                curveTo(2.73f, 16.39f, 7f, 19.5f, 12f, 19.5f)
                curveTo(13.55f, 19.5f, 15.03f, 19.2f, 16.38f, 18.66f)
                lineTo(16.8f, 19.08f)
                lineTo(19.73f, 22f)
                lineTo(21f, 20.73f)
                lineTo(3.27f, 3f)
                close()
                moveTo(7.53f, 9.8f)
                lineTo(9.08f, 11.35f)
                curveTo(9.03f, 11.56f, 9f, 11.78f, 9f, 12f)
                curveTo(9f, 13.66f, 10.34f, 15f, 12f, 15f)
                curveTo(12.22f, 15f, 12.44f, 14.97f, 12.65f, 14.92f)
                lineTo(14.2f, 16.47f)
                curveTo(13.53f, 16.8f, 12.79f, 17f, 12f, 17f)
                curveTo(9.24f, 17f, 7f, 14.76f, 7f, 12f)
                curveTo(7f, 11.21f, 7.2f, 10.47f, 7.53f, 9.8f)
                close()
                moveTo(11.84f, 9.02f)
                lineTo(14.99f, 12.17f)
                lineTo(15.01f, 12.01f)
                curveTo(15.01f, 10.35f, 13.67f, 9.01f, 12.01f, 9.01f)
                close()
            }
        }.build()
    }
}
