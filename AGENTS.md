# 代理指引

## 项目目标

xMark 是一个轻量的 VS Code Markdown 预览扩展。扩展以 `markdown-it` 解析和渲染 Markdown，并在 VS Code Webview 中显示结果。`media/webview/` 提供项目自有的预览界面；`media/preview_theme/` 提供 Bill 和 GitHub 预览主题，不得重新引入 Crossnote 的渲染运行时或其图表、数学公式、导出、笔记本和 Wiki 链接功能。

## 支持范围

- 支持 `.md`、`.markdown`、`.mdown`、`.mkdn`、`.mkd`、`.rmd`、`.qmd` 和 `.mdx` 扩展名。
- 也支持 VS Code 语言 ID：`markdown`、`quarto`、`prompt`、`instructions`、`chatagent` 和 `skill`。
- 最低支持 VS Code 1.106；侧栏预览使用 `secondarySidebar` 视图容器。
- Markdown 渲染使用 `markdown-it`，关闭原始 HTML，启用自动链接识别；为标题生成唯一 ID 和侧栏目录。
- 相对路径图片按源文档目录转换为 Webview 资源 URI。HTTP、HTTPS 和邮件链接由 Webview 打开到系统默认应用；本地文件和 VS Code Remote 链接交由 VS Code 打开。
- 用户可从预览选项菜单选择预览主题、代码块主题和脚本执行解释器（Bash 或 Zsh）；选择保存在扩展全局状态中。
- 预览选项菜单只从工具栏的“…”按钮打开；不要将该菜单绑定到右键。
- 代码块标题区显示语言，并提供 Copy；Bash shell 代码块另提供 Run。Run 将代码写入扩展全局存储目录中的临时脚本，作为 VS Code Task 执行，任务结束后删除；启动时清理超过一天的遗留脚本。

## 架构

- `src/extension.ts` 是桌面版扩展入口；当前不提供 Web 版入口。
- `src/extension-common.ts` 注册 `markdown-preview-bill.*` 命令、Webview 视图提供器及 VS Code 文档和编辑器事件监听器。
- `src/preview-provider.ts` 管理按源文档复用的编辑器预览面板、侧栏预览、Markdown 渲染、目录、主题、资源 URI 和链接处理。
- `media/webview/` 提供项目自有的预览界面和控件样式。
- `media/preview_theme/` 提供可选择的 Markdown 预览主题。
- `scripts/build.js` 使用 esbuild 打包桌面版入口，并复制 Webview、预览主题和 highlight.js 主题资源。
- `package.json` 声明扩展命令、快捷键、菜单、Webview 视图及扩展元数据。

## 预览行为

- 保留现有命令和菜单位置：普通预览、在旁边打开预览、在 xMark 侧栏中打开预览。
- 源文档更改时，更新与该文档关联的打开预览。
- 表格在预览内容区铺满宽度；Bill 主题为表格显示外边框。
- 代码块标题区显示语言；代码块悬停时显示 Copy，受支持的 Bash shell 代码块还提供 Run。Run 使用菜单中选择的 Bash 或 Zsh，通过临时脚本文件和 VS Code Task 在集成终端执行。
- 预览区 HTTP、HTTPS 和邮件链接由 Webview 打开到系统默认应用；本地文件和 VS Code Remote 链接由 VS Code 打开。预览选项菜单不响应右键，只从工具栏“…”按钮打开。
- 侧栏预览默认跟随当前活动的受支持文档；锁定后保持当前源文档。保留侧栏的刷新、打开源文件和弹出到编辑器标签页操作。
- 编辑器预览应按源 URI 复用；侧栏视图使用 `secondarySidebar` 视图容器。
- 新增或修改预览能力时，同步更新 `README.md`，确保用户文档反映实际行为。

## 开发

- 包管理器使用 `package.json` 中固定的 pnpm 版本。
- 构建：`pnpm build`
- 代码检查、格式检查和 TypeScript 检查：`pnpm check:all`
- 监听构建：`pnpm watch`
- 手动调试：在 VS Code 中按 F5，然后打开受支持的文档。
