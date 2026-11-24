# xMark

xMark 是一个轻量的 VS Code Markdown 预览扩展。它使用 [`markdown-it`](https://github.com/markdown-it/markdown-it) 渲染文档，并使用项目自有的轻量 Webview 界面显示预览。

需要 VS Code 1.106 或更高版本。

## 支持的文档

扩展可预览以下文件扩展名：`.md`、`.markdown`、`.mdown`、`.mkdn`、`.mkd`、`.rmd`、`.qmd` 和 `.mdx`。也支持 VS Code 识别为 `markdown`、`quarto`、`prompt`、`instructions`、`chatagent` 或 `skill` 的文档。

## 打开预览

打开受支持的文档后，可在命令面板运行以下命令；编辑器标题栏和右键菜单也提供适用的预览入口：

- **xMark: Open Preview**：在当前编辑器组打开预览。
- **xMark: Open Preview to the Side**：在旁边的编辑器组打开预览。
- **xMark: Open Preview in Side Panel**：在 xMark 侧栏中预览。

默认快捷键：

- `Ctrl+Shift+V`（macOS：`Cmd+Shift+V`）：打开预览。
- `Ctrl+K V`（macOS：`Cmd+K V`）：在旁边打开预览。

## 升级 xMark

在命令面板运行 **xMark: Check for Updates** 可立即检查稳定版。默认情况下，扩展启动 15 秒后会自动检查，每 24 小时最多一次。可通过 `xmarkPreview.update.enabled` 关闭更新检查，或通过 `xmarkPreview.update.autoCheck` 关闭自动检查。发现新版本后可查看发布说明、稍后处理或忽略该版本；低于最低受支持版本时会要求升级。选择 **Upgrade Now** 后，xMark 会下载 VSIX、验证 SHA-256，并交由 VS Code 安装。

同一文档在编辑器预览中重复执行命令时，会复用该文档已有的预览面板。文档内容更改后，打开的预览会自动更新。侧栏预览默认跟随当前活动的受支持文档；锁定侧栏后，切换编辑器不会更改侧栏正在预览的文档。侧栏标题栏还提供锁定或解锁、刷新、打开源文件以及将预览弹出到编辑器标签页的操作。

## 渲染与主题

预览支持 Markdown 标题、段落、列表、表格、链接、图片和围栏代码块等常见语法。表格会铺满预览内容宽度；Bill 主题会显示表格外边框。Markdown 使用 `markdown-it` 渲染，原始 HTML 不会作为 HTML 执行。

代码块使用 highlight.js 进行语法高亮，默认使用 GitHub 代码主题，也可单独选择其他 highlight.js 主题。代码块标题区会显示语言；鼠标移入代码块时显示 Copy 按钮。Bash、Shell 和 Zsh 代码块还会显示 Run 按钮。点击后，代码会写入扩展存储目录中的临时脚本，并作为 VS Code Task 在集成终端中运行；任务结束后脚本会删除。可在预览选项菜单中选择 Bash 或 Zsh 作为执行解释器，选择保存在 VS Code 全局状态中。运行需要系统中可调用所选解释器。

预览界面提供目录、同步源文件、缩放、Markdown 预览主题、代码块主题和脚本执行解释器控件。预览主题提供 Bill 和 GitHub 的 Light、Dark 版本，默认使用 GitHub Light。主题和执行解释器选择会保存在 VS Code 全局状态中，并立即应用于打开的预览及后续预览。预览选项菜单从工具栏的“…”按钮打开，不会由右键触发。

扩展还支持 Emoji 短代码、GitHub 风格任务列表、GitHub Alerts，以及 `info`、`note`、`tip`、`warning` 和 `danger` 容器。容器语法示例：

```markdown
::: warning
请先保存文件。
:::
```

可打开 [xMark Markdown 支持范围 Demo](examples/markdown-plugins-demo.md)，在预览中查看当前支持的语法、扩展语法和控件示例。

脚注和定义列表也可用于补充说明：

```markdown
这是正文中的脚注引用[^detail]。

[^detail]: 脚注内容支持 **Markdown 格式**。

术语
: 术语解释可以包含 _强调_ 等 Markdown 格式。
```

脚注会在文末生成可跳转的注释列表；定义列表使用术语行和以冒号开头的解释行。两者的样式适用于 Bill 和 GitHub 的浅色、深色预览主题。

GitHub Alerts 使用 `> [!NOTE]`、`> [!TIP]`、`> [!IMPORTANT]`、`> [!WARNING]` 和 `> [!CAUTION]` 语法。任务列表的复选框默认为只读。

相对路径图片会按源 Markdown 文件所在目录解析。点击链接时，HTTP、HTTPS 和邮件链接交由系统默认应用打开；本地文件及 VS Code Remote 链接交由 VS Code 打开。

Markdown 内容由 `markdown-it` 渲染。预览界面交互由 xMark 自己实现；Markdown 预览主题使用 Bill 和 GitHub 样式资源，代码高亮由 highlight.js 生成，代码主题使用随扩展打包的 highlight.js 主题。本扩展不包含 Crossnote 的 Markdown 渲染运行时、数学公式、图表、导出、笔记本或 Wiki 链接功能。

## 第三方资源许可

`media/preview_theme/` 中保留的 GitHub 预览主题样式源自 Crossnote，适用 University of Illinois/NCSA Open Source License：

```text
University of Illinois/NCSA
Open Source License

Copyright (c) 2017 ~ 2023  Yiyi Wang
All rights reserved.

Developed by:     Yiyi Wang
                  https://github.com/shd101wyy/crossnote

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal with the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimers.
Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimers in the documentation and/or other materials provided with the distribution.
Neither the names of Yiyi Wang, nor the names of its contributors may be used to endorse or promote products derived from this Software without specific prior written permission.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE CONTRIBUTORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS WITH THE SOFTWARE.
```
