/**
 * 从专辑封面提取主色调
 * 使用 sharp 将图片缩小后取像素平均值，生成柔和的暗色调
 */
import sharp from 'sharp';

/**
 * 从封面 Buffer 提取主色调
 * @param coverBuffer 封面图片 Buffer
 * @returns hex 颜色字符串，如 "#4a6e82"；失败返回 null
 */
export async function extractDominantColor(coverBuffer: Buffer): Promise<string | null> {
  try {
    const { data } = await sharp(coverBuffer)
      .resize(32, 32, { fit: 'cover' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let r = 0;
    let g = 0;
    let b = 0;
    const pixelCount = data.length / 3;

    for (let i = 0; i < data.length; i += 3) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }

    r = Math.round(r / pixelCount);
    g = Math.round(g / pixelCount);
    b = Math.round(b / pixelCount);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  } catch {
    return null;
  }
}
