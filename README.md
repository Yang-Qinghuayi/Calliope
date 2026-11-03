# YSH 阅读 · 移动端

> 一个本地优先的 EPUB / PDF 阅读器，基于 React Native Readium，面向 Android、iOS 手机与平板，提供种子色驱动的 Material 主题。

这段话可以直接用于项目介绍。更完整的介绍：

**YSH 阅读是一个不依赖账号或云同步的移动阅读应用。书籍、阅读进度、书签和笔记保存在设备本地；使用 Readium 原生集成承载 EPUB/PDF 阅读，通过 Google 官方 Material Color Utilities 从一颗种子生成全局主题，结合 NativeWind v5 RC 和 Material 3 组件完成手机、平板及分屏布局。项目不包含 AI 创作功能，不适配 Web/桌面，永久不支持 LCP/DRM。**

## 快速开始（pnpm）

**本仓库根目录就是移动端工程**，没有 `mobile/` 子目录，所有命令都在仓库根目录执行。

```bash
node --version                  # 需要 v24+（.nvmrc = 24）
npm i -g pnpm@12.16.1           # 本机还没有 pnpm 时；packageManager 固定 pnpm@12.16.1
pnpm install --frozen-lockfile   # 按 pnpm-lock.yaml 安装依赖；设置全在 pnpm-workspace.yaml
pnpm run check                   # TypeScript 严格检查 + 28 个自动化测试
pnpm run android                 # Android：先启动模拟器或连接真机
# macOS + Xcode 时改用：pnpm run ios
```

首次 `android` / `ios` 会生成原生工程、编译并安装 development build，耗时较长。之后只改 JS/TS 时不必重新编译：

```bash
pnpm start                      # expo start --dev-client，启动 Metro
```

在已安装的开发客户端里打开 Metro 给出的地址。**浏览器预览和 Expo Go 都不能运行本项目的 Readium / Nitro 原生模块**；没有模拟器或真机时，至少可以跑 `pnpm run check` 和 `pnpm run bundle:check` 验证 JS 层。

### 命令速查

| 目的                    | 命令                                                     | 前提 / 说明                                                       |
| ----------------------- | -------------------------------------------------------- | ----------------------------------------------------------------- |
| 安装依赖                | `pnpm install --frozen-lockfile`                          | 使用 `pnpm-lock.yaml`；`pnpm-workspace.yaml` 已配置 `nodeLinker: hoisted` |
| 类型检查                | `pnpm run typecheck`                                     | `tsc --noEmit`                                                    |
| 自动化测试              | `pnpm test`                                              | `tsx --test tests/*.test.ts`，28 个用例，不需要设备                |
| 类型检查 + 测试         | `pnpm run check`                                         | 提交前建议执行                                                    |
| 启动 Metro              | `pnpm start` / `pnpm start --clear`                      | `expo start --dev-client`；清缓存直接加参数，不要写 `--`            |
| Android 构建运行        | `pnpm run android`                                       | `expo run:android`；需要 Android SDK / JDK 17 / 设备               |
| iOS 构建运行            | `pnpm run ios`                                           | `expo run:ios`；仅 macOS + Xcode                                   |
| 只生成原生工程          | `pnpm run prebuild`                                      | 生成 `android/`、`ios/`（都不纳入 Git）                            |
| Release 配置验证        | `pnpm run android:release` / `pnpm run ios:release`      | 本地测试，不是商店签名构建                                        |
| 双平台 JS bundle 检查   | `pnpm run bundle:check`                                  | `expo export` + Hermes，不编译 Kotlin/Swift                       |
| 格式化                  | `pnpm run format` / `pnpm run format:check`              | 可选，当前状态见第 3 节                                           |

> 仍可用 npm：仓库保留 `package-lock.json`，`npm ci` / `npm run check` 等价可用。但**pnpm 是本项目的默认包管理器**，两份锁文件对应同一份 `package.json`；升级依赖时要同时更新 `pnpm-lock.yaml` 和 `package-lock.json`，不要只删其中一份让它重新解析到 latest。

## 当前状态：首版实现，等待原生设备验收

以下页面和数据流程已有代码，**不代表已在 Android/iOS 真机完成验收，也不是可以直接发布商店的成品**。

| 功能     | 当前实现                                                                                             |
| -------- | ---------------------------------------------------------------------------------------------------- |
| 导入     | 系统文件选择、多选、EPUB/PDF 内容识别、SHA-256 去重、失败回滚、取消剩余任务、持久副本、缓存清理      |
| 书库     | 标题/作者/封面或占位、最近阅读排序、标题/作者筛选、多列、删除确认；重新导入可修复丢失的副本          |
| 阅读     | ReadiumView、目录/章节跳转、前后翻页、原生手势、可用位置跳转、EPUB 分页/滚动、PDF 宽度适配滚动       |
| 位置     | Readium Locator 持久化，800ms 节流；退后台、失焦、退出主动刷新；重开恢复                             |
| 排版     | EPUB 字号、字体、行高、边距、大屏双页/双列；按当前出版物 capabilities 禁用不适用控件                 |
| 阅读工具 | 书签、高亮、笔记编辑/删除/跳转，选字复制，分页搜索与结果跳转；受格式/原生能力限制                    |
| 主题     | 4 个种子预设、自定义 #rgb/#rrggbb、system/light/dark、设置持久化、统一 Paper/NativeWind/Readium 颜色 |
| 响应式   | 实时窗口宽度驱动书库列数、侧栏/底部导航、目录侧栏/弹层、正文限宽、设置分栏；支持旋转与分屏的设计     |

EPUB2/3 可重排与固定版式、竖排/RTL、脚注、嵌入字体，以及 PDF 的搜索/选字/批注，最终均需对具体设备和样书验证。PDF 不会像 EPUB 一样改变文字字号，也不会自动把白色扫描页改成深色；扫描件没有文字层时不会凭空提供搜索/OCR。

## 技术栈与版本

- Expo SDK **57.0.22**，React Native **0.86.3**，React **19.2.3**，TypeScript。
- `react-native-readium` **5.3.0** + `react-native-nitro-modules` **0.35.0**。不使用 EPUB.js，不安装 LCP 配套包。
- NativeWind **5.0.0-rc.1** + `react-native-css` **3.1.0-rc.1** + Tailwind **4.1.18**。
- React Native Paper **5.15.3**，Material Color Utilities **0.4.0**。
- Expo Router、SQLite、文件系统、系统文件选择器；AsyncStorage 保存偏好。
- `fflate` + `fast-xml-parser` 只负责导入前检查和元数据，不另造排版引擎。

**包管理器：pnpm 12（10.26+ 的旧版也能正确读取本仓库的配置）**。`package.json` 的 `packageManager` 固定为 `pnpm@12.16.1`，用别的 pnpm 版本运行时它会自动切换到该版本；`pnpm-lock.yaml` 由 `pnpm import` 从 `package-lock.json` 生成，两者解析到的版本一致。所有项目级设置都写在 `pnpm-workspace.yaml`：`allowBuilds` 放行 `tsx` 依赖的 `esbuild` 的构建脚本，`nodeLinker: hoisted` 把 `node_modules` 摊平。仓库同时保留 `package-lock.json` 供 npm 用户回退。

`pnpm-workspace.yaml` 里的 `nodeLinker: hoisted` **不是可选项**：pnpm 默认的隔离符号链接 `node_modules` 会让 React Native / Expo 的 Metro、Gradle、CocoaPods 和 config plugin 找不到原生模块，必须改用扁平布局。**pnpm 11+ 不再读取 `.npmrc` 里的 `node-linker`，也不再读取 `package.json` 的 `pnpm` 字段**，所以这些设置只能放在 `pnpm-workspace.yaml`（旧位置会被静默忽略，`node_modules` 会悄悄变回隔离布局）。`react-dom` 仅为 Expo/Router 间接依赖锁定同版 React 的 peer，不表示提供 Web 应用。**不要直接把所有依赖升级到 latest**（尤其 NativeWind RC 锁定的 `lightningcss 1.30.1` 与 Expo 57 Metro 版本），也不要用 `--force` / `--legacy-peer-deps` 绕过 peer 冲突。

## 1. 准备环境

共同要求：

- **Node.js 24+**（Readium 的部分间接依赖要求 Node 24，`.nvmrc` 写的是 24）。例如 `nvm install 24 && nvm use 24`，用 `node --version` 确认。
- **pnpm 12.16.1**（`packageManager` 已固定；pnpm 10.26+ 也能读本仓库的 `pnpm-workspace.yaml`）。推荐用官方脚本或 npm 安装：`curl -fsSL https://get.pnpm.io/install.sh | sh -` 或 `npm i -g pnpm@12.16.1`。**不要用 `--ignore-scripts` 安装 pnpm**，否则 pnpm 12 会退化成通过 Node.js 运行，并提示 “pnpm is running through Node.js…”（能用，但每次启动都慢）。用 `corepack enable` 也可以，但 Corepack 不执行 pnpm 的安装脚本，同样会看到这条提示。`packageManager` 字段会让 pnpm 自动切换到固定版本，首次可能联网下载。
- Git；首次安装/原生构建可联网访问 npm、Google Maven、Maven Central、JitPack，以及 iOS 的 CocoaPods/Readium spec 源。
- 足够的原生构建空间。浏览器预览和 Expo Go 都不能运行本项目的 Readium 原生模块。

Android：

- Android Studio、SDK、模拟器或开启 USB 调试的真机；`adb devices` 能看到设备。
- JDK 17，正确配置 `JAVA_HOME`、`ANDROID_HOME` 和 platform-tools。
- 当前 RN 模板使用 API 36、Build Tools 36 和 NDK 27.1.12297006；以生成工程/Gradle 提示的工具版本为准。Readium 的 Kotlin 2.3.20、JitPack、Java API desugaring 由配置插件写入。
- 产品最低 Android 版本受 Expo/RN/Readium 组合约束；当前 RN 声明 minSdk 24，不是最低版本设备已经测试通过的保证。

iOS：

- **必须使用 macOS**，安装匹配 Expo SDK 57 的 Xcode、Command Line Tools、iOS Simulator、CocoaPods。
- Readium 自身要求 Xcode 16.4+；当前 Expo/RN 组合可能要求更新工具，按本机 Xcode/SDK 的实际构建检查处理。
- 当前生成模板 deployment target 为 **iOS 16.4**，iPad 支持开启，未要求全屏；不要仅依据 Readium 的 iOS 15.1 最低要求下调整个应用。
- 真机需要你自己的 Apple 开发签名；修改 `app.config.ts` 中的 bundle identifier 后重新 prebuild。

## 2. 安装与运行

在仓库根目录执行：

```bash
node --version               # v24 或更高
pnpm --version               # 12.16.1（packageManager 固定）
pnpm install --frozen-lockfile
pnpm run check               # 类型检查 + 自动化测试
```

改动了 `package.json` 的依赖后，先更新并提交两份锁文件，再继续开发：

```bash
pnpm install                          # 更新 pnpm-lock.yaml
npm install --package-lock-only        # 更新 package-lock.json，保持 npm 回退路径可用
pnpm install --frozen-lockfile         # 确认锁文件可复现
```

### Android

先打开 Android 模拟器或连接真机：

```bash
pnpm run android
```

该命令生成原生工程、编译安装 development build 并启动 Metro。后续只改 JS/TS 时：

```bash
pnpm start
# 在已安装的开发客户端打开 Metro 显示的开发地址；清缓存用 pnpm start --clear
```

真机与电脑需要能够互通；开发时从 Metro 输出中选择可达的局域网地址，或按 Expo/adb 的 USB 调试方式连接。不要把浏览器里的 localhost 地址当手机可以访问的电脑地址。pnpm 会直接把参数透传给脚本，所以写 `pnpm start --clear`，不要写 npm 习惯的 `pnpm start -- --clear`。

### iOS（仅 macOS）

```bash
pnpm run ios               # 编译安装到模拟器；CLI 会处理 pods
# 若需真机：pnpm exec expo run:ios --device，并完成开发签名
```

### 只生成原生工程

```bash
pnpm run prebuild
# 可用 pnpm exec expo prebuild --no-install 只生成，不安装原生依赖
```

`plugins/withReadium.cjs` 自动增加 Readium CocoaPods spec 源、Podfile helper 和 Android desugaring，`expo-build-properties` 设置 Kotlin/JitPack。`android/`、`ios/` 是生成文件，不纳入 Git；不要只在里面手改配置后期待重新生成仍保留。需要修改时更新 app config/config plugin。`prebuild --clean` 会删除这两个生成目录中的手动改动，执行前先备份。

### 发布模式验证（不是商店发布）

```bash
pnpm run android:release
pnpm run ios:release       # macOS
```

这些命令用于本地 Release 配置测试。Android 生成模板可能使用 debug signing，**不能作为商店正式签名**。商店证书、隐私声明、版本号、发行流程需单独配置。

首次验证：导入自己有权使用的无 DRM EPUB/PDF → 打开/翻页 → 退出重开 → 换主题 → 旋转/分屏 → 书签/笔记/搜索。验证离线请使用 Release 构建，开发客户端运行 JS 仍可能依赖电脑上的 Metro。

## 3. 测试与打包检查

```bash
pnpm run check             # TypeScript + 28 个测试
pnpm run bundle:check      # Android/iOS JS + Hermes bundle；不编译 Swift/Kotlin
pnpm run format:check      # 可选，见下方说明
```

`format:check` 目前会报告 37 个既有文件的风格差异：仓库没有 `.prettierrc`，源码用单引号和较宽行宽，与 Prettier 3 默认配置不一致。这是仓库既有状态，**不是 pnpm 安装问题，也不影响 `check`、`bundle:check` 或构建**。若要统一风格，先运行 `pnpm run format` 并单独提交格式化改动（会改动大量文件）。

本次环境（Node 24.22.2 + pnpm 10.34.9，Linux 沙箱；pnpm 12 迁移另在 Node 22.22.3 + pnpm 12.16.1 下复验）实际验证过：

- 全新 `pnpm install --frozen-lockfile` 可重复安装；`nodeLinker: hoisted` 生效（`node_modules/react-native` 是真实目录而非符号链接），`esbuild` 的构建脚本由 `pnpm-workspace.yaml` 的 `allowBuilds` 放行。
- 在 pnpm 12.16.1 下，锁文件通过 `minimumReleaseAge` 供应链策略校验（`✓ Lockfile passes supply-chain policies`）。
- `pnpm run check`：`tsc --noEmit` 严格检查通过，28 个自动化测试全部通过（种子与对比度、真实 Tailwind/NativeWind 编译、响应式判断、格式/ZIP/CRC/DRM 检查、导入取消/去重/失败回滚、真实内存 SQLite CRUD/级联删除、进度刷新、阅读偏好单位转换、原生插件幂等）。
- `pnpm run bundle:check`：Android/iOS 的 Metro + Hermes bundle 导出成功。
- `pnpm exec expo prebuild --platform android --no-install` 与 `--platform ios --no-install`：原生模板生成成功，已检查 Podfile helper、Kotlin 2.3.20 和 desugaring 插入。
- `pnpm start` 能启动 Metro（`--dev-client`），`pnpm start --clear` 可清缓存重启。
- `npm ci --dry-run` 确认 `package-lock.json` 仍与 `package.json` 同步（npm 回退路径可用）。

**未完成的验证：**当前执行环境没有 Android SDK/JDK/Xcode/CocoaPods/设备，且网络白名单不覆盖原生依赖仓库。因此没有生成 APK/IPA，没有跑 Gradle/Swift 编译，没有真机/UI 端到端验收。通过 bundle/prebuild 不能证明原生 API 行为无误，pnpm 的 hoisted 布局也仍需在本机完成一次真实原生编译来确认。

详细真机清单见 [设备验收矩阵](./DEVICE-TESTING.md)。

## 4. 项目结构

```text
Calliope/                      # 仓库根目录，即本工程
├── app/
│   ├── _layout.tsx           # Provider、路由、全局提示
│   ├── index.tsx             # 书库、导入、删除
│   ├── settings.tsx          # 主题与全局阅读偏好
│   └── reader/[id].tsx       # 加载本地书籍
├── src/
│   ├── components/Reader.tsx # Readium、目录、搜索、书签/笔记、排版、响应式面板
│   ├── components/Shell.tsx  # 手机导航 / 大屏导航轨
│   ├── domain/               # 模型、输入校验、导入检查、阅读偏好映射
│   ├── services/             # 导入事务、Expo 文件适配、SQLite、进度、搜索、应用状态
│   └── theme/colors.ts       # 官方种子计算与主题 token
├── plugins/withReadium.cjs    # 可重现的原生集成配置
├── tests/                    # 不需要模拟器的自动化测试
├── app.config.ts             # 仅 ios/android 平台
├── pnpm-workspace.yaml       # pnpm 设置：nodeLinker、allowBuilds、供应链策略（不要删）
├── .nvmrc                    # Node 24
├── pnpm-lock.yaml            # pnpm 锁文件（默认）
└── package-lock.json         # npm 回退锁文件
```

数据：应用 Documents 下 `library/{sha256}.epub|pdf`，封面同 hash；SQLite `ysh-reader.db` 保存书籍/locator/批注；AsyncStorage `ysh.mobile.settings.v1` 保存偏好。数据库只保存相对文件名，iOS 容器绝对路径变化不影响记录。卸载会清除这些本地数据，目前未实现导出备份/旧桌面数据迁移。

主题链路：`seed + resolved mode → MCU → canonical roles → Paper theme / NativeWind VariableContextProvider / Readium preferences`。NativeWind 使用运行时语义变量，不在业务里拼接颜色类名；Paper 的 Portal 也位于同一个变量 Provider 下。

## 5. 边界、安全与待完善项

- 永久不支持 LCP/DRM，不接受密码、不接授权/解密服务。仅 EPUB/PDF，不支持其他格式、Web 或桌面。
- 当前导入限额：单文件 80 MB、展开 128 MB、单条目 32 MB、最多 5000 条目、文本资源 8 MB；拒绝 ZIP64/分卷、越界/重复资源、异常压缩比、校验失败与不支持的加密。
- EPUB 当前采用保守的自包含内容策略：拒绝检测到的书内脚本、嵌入程序、外部资源/协议链接（包括一些正常书籍的网页链接）和实体定义。字体的标准 IDPF/Adobe 混淆不当作 DRM。
- PDF 只作文件头与常见 `/Encrypt`、主动动作/外链标记预检，**不是完整 PDF 安全解析器**。文本/正则检查也不是经过审计的浏览器沙箱，不能保证发现所有编码、压缩对象或恶意内容。正式开放任意不可信文件前，必须补充原生资源/外链策略审计、模糊测试与样书回归。不要把“未发起业务网络请求”理解为已证明底层引擎绝不联网。
- 导入目前会读取整本受限大小的书籍并同步校验/解压，低端设备大书可能产生延迟和内存压力；取消在阶段之间生效，不会中断已在运行的同步解压。后续需要流式/原生后台导入及量化性能门槛。
- 搜索、PDF 选字/批注/目录等以 `onPublicationReady` / `onPreferencesChanged` 返回的 capabilities 为准；不支持时明确提示/禁用，而不是做无效按钮。没有对扫描 PDF 承诺 OCR。
- 双页/竖排/固定版式、选区重排定位、VoiceOver/TalkBack、长列表性能必须真机验证。当前没有“完美阅读器”或所有出版物完全兼容的保证。
- NativeWind 使用 RC，已固定 `lightningcss 1.30.1` 与 Expo 57 Metro 版本：1.30.2 被该 RC 明确禁止，较新的 CSS 编译依赖组合曾出现反序列化错误。不要无回归升级这些依赖。

## 常见问题

**`Nitro` / `Readium` 原生模块找不到？** 不要用 Expo Go；确认 `pnpm-workspace.yaml` 的 `nodeLinker: hoisted` 没有被删掉，重新 `pnpm install` 后 `node_modules/react-native` 应该是真实目录而不是符号链接（pnpm 默认的隔离布局会让原生构建找不到模块）。原生依赖变更后重新运行 `pnpm run android` / `pnpm run ios`，仅重启 Metro 不会安装原生模块。

**pnpm 报 peer 冲突 / 安装后缺包？** 用 `pnpm install --frozen-lockfile` 和仓库锁文件，确认 Node 24 与 `packageManager` 指定的 pnpm 版本；必要时删掉 `node_modules` 重装。不要加 `--force`、`--legacy-peer-deps` 或另设 `shamefully-hoist`。若提示 `Ignored build scripts: esbuild`，检查 `pnpm-workspace.yaml` 里的 `allowBuilds.esbuild` 是否为 `true`（`package.json` 的 `pnpm.onlyBuiltDependencies` 在 pnpm 11+ 已失效）。

**pnpm 12 安装时那几行提示是什么意思？** 逐条说明：

- `The "pnpm" field in package.json is no longer read`：pnpm 11 起不再读 `package.json` 的 `pnpm` 字段，本仓库已把设置搬进 `pnpm-workspace.yaml`，正常安装不会再出现。
- `pnpm is running through Node.js because the script that installs its native binary was skipped`：这条说的是**你本机怎么装的 pnpm**，不是仓库问题。pnpm 12 自带原生可执行文件，安装它时如果跳过了构建/安装脚本（`npm i -g pnpm --ignore-scripts`、用 pnpm 装 pnpm 时没给 `--allow-build=pnpm`、或走 Corepack），就会退回用 Node.js 跑，功能一样但启动更慢。重装即可：`curl -fsSL https://get.pnpm.io/install.sh | sh -` 或 `npm i -g pnpm@12.16.1`。
- `Verifying lockfile against supply-chain policies (681 entries)`：这不是提问，是进度行。pnpm 11+ 用 `minimumReleaseAge`（默认 1 天）和 `trustPolicy` 复查锁文件里的每个版本。如果某个锁定版本发布不到 24 小时，会报 `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`；本仓库已在 `pnpm-workspace.yaml` 里为这几个已知的“新版本”写了 `minimumReleaseAgeExclude`，等它们满 24 小时可以删掉。要临时跳过校验可在本地用 `pnpm install --trust-lockfile`（不要把 `trustLockfile: true` 提交进仓库）。

**主题类名不生效？** 检查 `postcss.config.js`（不是 `.cjs`，当前 Expo 的 PostCSS 探测只覆盖 `.js/.mjs/.json`），以及 `metro.config.cjs` 的 NativeWind v5 包装；尝试 `pnpm start --clear`（不要写成 `pnpm start -- --clear`）。

**Android Kotlin 编译不兼容？** 检查生成的 `android/gradle.properties` 中 `android.kotlinVersion=2.3.20`。修改原生设置后重新 prebuild；检查本机 JDK/Gradle/SDK 错误，不要绕过 peer 冲突强行安装。

**iOS 找不到 Readium Pod 或 Minizip 编译失败？** 检查插件生成的 Readium spec source、`readium_pods`、`readium_post_install`，使用当前锁定版本重新安装 pods；不要通过忽略报错声称构建成功。

**npm 用户还能用吗？** 可以，`npm ci` + `npm run check` 仍然可用，`package-lock.json` 与 `pnpm-lock.yaml` 由同一份 `package.json` 生成。React/React DOM 已对齐到 19.2.3，`npm ci` 不需要 `--force` 或 `--legacy-peer-deps`；升级依赖时记得同时更新两份锁文件。
