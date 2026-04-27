# StreamSound · Git 工作流规范

---

## 1. 仓库结构

StreamSound 采用 Monorepo，前后端代码统一在同一仓库管理：

```
streamsound/
├── server/          # 后端（Node.js + Fastify）
├── app/             # 前端（React Native）
├── docs/            # 所有文档（PRD、架构、API Spec 等）
└── CONTRIBUTING.md
```

---

## 2. 分支策略

### 2.1 长期分支

| 分支 | 说明 |
|------|------|
| `main` | 稳定分支，始终对应最新正式版或 RC 版本。只接受来自 `release/*` 和 `hotfix/*` 的合并 |
| `dev` | 日常开发主线，功能开发完成后合并到此分支 |

### 2.2 短期分支

从 `dev` 创建，完成后合并回 `dev` 并删除。

| 前缀 | 用途 | 示例 |
|------|------|------|
| `feature/` | 新功能开发 | `feature/lyrics-scroll` |
| `fix/` | Bug 修复 | `fix/range-request-header` |
| `chore/` | 构建、配置、依赖等非功能改动 | `chore/upgrade-fastify-v5` |
| `docs/` | 文档更新 | `docs/update-api-spec` |
| `release/` | 版本发布准备，从 `dev` 创建 | `release/1.0.0-rc.1` |
| `hotfix/` | 生产环境紧急修复，从 `main` 创建 | `hotfix/ipv6-bracket-crash` |

### 2.3 分支命名规则

- 全小写，单词间用连字符 `-` 分隔
- 简洁描述改动内容，不超过 5 个单词
- 禁止使用 `my-branch`、`test`、`temp` 等无意义名称

---

## 3. Commit Message 规范

采用 [Conventional Commits](https://www.conventionalcommits.org/) 格式。

### 3.1 格式

```
<type>(<scope>): <subject>

[body]

[footer]
```

### 3.2 Type 类型

| Type | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `perf` | 性能优化（不新增功能） |
| `refactor` | 重构（不影响功能和 Bug） |
| `style` | 代码格式调整（空格、分号等，不影响逻辑） |
| `test` | 新增或修改测试 |
| `docs` | 文档变更 |
| `chore` | 构建、依赖、配置等杂项 |
| `revert` | 回退某个 commit |

### 3.3 Scope 范围（可选）

用于标识改动所在模块，建议从以下选取：

**后端**：`auth` / `library` / `stream` / `search` / `favorites` / `history` / `admin` / `scanner` / `db`

**前端**：`player` / `lyrics` / `queue` / `search` / `favorites` / `settings` / `nav` / `store`

**通用**：`deps` / `config` / `ci` / `docs`

### 3.4 Subject 规则

- 动词开头，首字母小写
- 不加句号
- 50 字符以内（中英文均可）
- 描述"做了什么"，而非"为什么"（原因放 body）

### 3.5 示例

```
feat(lyrics): 实现 LRC 歌词逐行滚动高亮

fix(stream): 修复 Range 请求 Content-Range 头缺失问题

perf(library): 使用 FTS5 替换 LIKE 查询，搜索响应提速 80%

chore(deps): 升级 fastify 至 5.2.0

docs: 补充 API Spec 扫描状态轮询接口

refactor(scanner): 将元数据提取逻辑抽离至独立 service

fix(auth)!: refresh token 验证逻辑重写，不向后兼容
```

> `!` 后缀表示破坏性变更（Breaking Change），对应版本号升 MAJOR。

### 3.6 Body 和 Footer（可选）

当改动原因不显而易见时，用 body 补充说明：

```
fix(scanner): 跳过隐藏文件和系统目录

之前会扫描 .DS_Store、__MACOSX 等目录导致入库脏数据。
现在过滤所有以 . 开头的文件和目录。

Closes #12
```

---

## 4. 版本发布流程

与 `streamsound_versioning.md` 中的版本号规则联动。

### 4.1 常规版本发布

```bash
# 1. 从 dev 创建 release 分支
git checkout dev
git pull
git checkout -b release/0.3.0-beta.1

# 2. 在 release 分支上：
#    - 更新 server/package.json 和 app/package.json 的 version 字段
#    - 更新 CHANGELOG.md（见下方规范）
#    - 最后一轮测试和 Bug 修复（仅 fix，不新增功能）

# 3. 合并到 main 并打 tag
git checkout main
git merge release/0.3.0-beta.1 --no-ff -m "chore: release 0.3.0-beta.1"
git tag -a v0.3.0-beta.1 -m "Release 0.3.0-beta.1"
git push origin main --tags

# 4. 将 release 分支的修复同步回 dev
git checkout dev
git merge release/0.3.0-beta.1 --no-ff
git push origin dev

# 5. 删除 release 分支
git branch -d release/0.3.0-beta.1
git push origin --delete release/0.3.0-beta.1
```

### 4.2 紧急热修复（Hotfix）

```bash
# 1. 从 main 创建 hotfix 分支
git checkout main
git checkout -b hotfix/ipv6-bracket-crash

# 2. 修复 Bug，提交

# 3. 合并到 main，升 PATCH 版本号，打 tag
git checkout main
git merge hotfix/ipv6-bracket-crash --no-ff -m "chore: release 1.0.1"
git tag -a v1.0.1 -m "Release 1.0.1"
git push origin main --tags

# 4. 同步回 dev
git checkout dev
git merge hotfix/ipv6-bracket-crash --no-ff
git push origin dev

# 5. 删除 hotfix 分支
git branch -d hotfix/ipv6-bracket-crash
```

---

## 5. CHANGELOG 维护规范

每次发布前更新 `CHANGELOG.md`，置于仓库根目录。

### 5.1 格式

```markdown
## [版本号] - YYYY-MM-DD

### Added
- 新增功能描述

### Changed
- 变更描述

### Fixed
- 修复描述

### Removed
- 移除描述
```

### 5.2 示例

```markdown
## [0.3.0-beta.1] - 2025-10-15

### Added
- 歌词逐行滚动高亮，支持点击歌词行跳转
- 播放队列支持拖拽排序和左滑移除
- 后台播放与锁屏通知栏控制

### Fixed
- 修复 Android 13 下快速切歌时进度条卡死问题
- 修复无封面曲目在列表中占位图不显示的问题

## [0.2.0-alpha.1] - 2025-09-20

### Added
- 基础播放器：播放/暂停/上下曲/进度条拖动
- 音乐库文件夹浏览页
- 用户登录/注册流程
```

---

## 6. 日常开发节奏

独立开发建议遵循以下节奏，避免长期在 `dev` 上堆积未整理的提交：

```
每个功能点 → 建 feature/ 分支 → 完成后合并回 dev → 删分支
小修小补   → 直接在 dev 上提交（fix/chore 类）
阶段完成   → 建 release/ 分支 → 测试 → 打 tag → 合并回 main
```

**提交频率**：功能可运行的最小单元提交一次，不要把多个无关改动堆在一个 commit 里。宁可提交多、信息清晰，也不要一个 commit 改了十个地方。

---

## 7. .gitignore 关键项

```gitignore
# 环境变量（绝不提交）
server/.env

# 依赖
node_modules/

# 编译产物
server/dist/
app/android/build/
app/ios/build/
app/.expo/

# 系统文件
.DS_Store
Thumbs.db

# 测试覆盖率
coverage/

# SQLite 数据库（本地开发数据）
*.db
*.db-journal
```

---

*StreamSound · Git 工作流规范 · 内部文档*
