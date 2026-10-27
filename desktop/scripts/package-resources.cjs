// 按显式白名单组装干净的应用，禁止整目录复制暂存区。
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve('output/resources');
const out = path.resolve(process.argv[2]);
const files = [
    'archive-baked-surface.bin',
    'archive-baked-light.bin',
    'archive-baked-normal.bin',
    'archive-cassette.bin',
    'archive-cassette-indices.bin',
    'archive-cassette.json',
    'archive-assembly.bin',
    'archive-assembly-indices.bin',
    'archive-assembly.json',
    'NotoSansSymbols2-Regular.ttf',
    'slots.json',
    'scene-fixture.json',
    'boot-lettering-art.json',
    ...[
        'netease-sq',
        'netease-hires',
        'netease-jymaster',
        'netease-jyeffect',
        'netease-sky',
        'qq-hq',
        'qq-sq',
        'kugou-hq',
        'kugou-sq',
        'kugou-hires',
    ].map((name) => `quality/${name}.png`),
    'quality/sources.json',
    'misans-glyphs.json',
    ...['light', 'regular', 'demibold', 'bold'].map((w) => `RhineMiSans-${w}.otf`),
];
fs.mkdirSync(out, {
    recursive: true,
});
for (const name of files) {
    fs.mkdirSync(path.dirname(path.join(out, name)), { recursive: true });
    fs.copyFileSync(path.join(root, name), path.join(out, name));
}
const bridge = path.join(root, 'MusicBridge');
const target = path.join(out, 'MusicBridge');
fs.mkdirSync(target, {
    recursive: true,
});
// 桥接只依赖 Node 内置模块，直接复制构建期准备好的文件。
for (const name of [
    'worker.cjs',
    'streamsound.cjs',
    'lyrics-format.cjs',
    'lyrics-source.json',
    'LyricsKit-LICENSE',
    'NODE-LICENSE',
    'package.json',
]) {
    fs.copyFileSync(path.join(bridge, name), path.join(target, name));
}
const nodeName = process.platform === 'win32' ? 'node.exe' : 'node';
fs.copyFileSync(path.join(bridge, nodeName), path.join(target, nodeName));
fs.chmodSync(path.join(target, nodeName), 0o755);
fs.copyFileSync('NOTICE', path.join(out, 'NOTICE'));
// 许可证原样复制，不转换字体或替换资源。
fs.copyFileSync('licenses/NotoSansSymbols2-OFL.txt', path.join(out, 'NotoSansSymbols2-OFL.txt'));
fs.copyFileSync('licenses/MiSans-license.pdf', path.join(out, 'MiSans-license.pdf'));
console.log(`Clean resources: ${files.length} files, bridge bundled without node_modules`);
