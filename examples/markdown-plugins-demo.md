# xMark Markdown 支持范围 Demo

打开本文件并运行 **xMark: Open Preview**，可浏览 xMark 当前支持的 Markdown 语法、扩展语法和预览控件。

## 标题、段落与目录

标题会生成唯一锚点，并出现在预览目录中。打开工具栏目录按钮可查看标题层级。

### 三级标题示例

段落支持 **粗体**、_斜体_、~~删除线~~、`行内代码` 和普通 URL 自动识别：<https://code.visualstudio.com/>。

#### 四级标题

##### 五级标题

###### 六级标题

### 重复标题

重复标题会获得唯一锚点，不会互相覆盖。

### 重复标题

工具栏中的目录会显示各级标题，并可跳转到对应位置。

## 列表与引用

- 无序列表项目
- 第二个项目
  - 嵌套列表项目

1. 有序列表项目
2. 第二个项目

> 引用块可包含普通文本和 **行内格式**。

## 链接与图片

- HTTPS 链接：[VS Code 文档](https://code.visualstudio.com/docs)
- 邮件链接：[联系示例](mailto:hello@example.com)
- 本地文件链接：[项目 README](../README.md)

相对路径图片会从源文档所在目录解析：

![xMark 扩展图标](../media/mpe.png)

## 表格

| 语法   | 预览行为                                      |
| ------ | --------------------------------------------- |
| 表格   | 铺满预览内容区宽度                            |
| 代码块 | 显示语言、Copy；支持的 Shell 代码块还提供 Run |

## 代码块与 Copy/Run

JavaScript 代码块提供 Copy：

```javascript
const message = 'Hello from xMark';
console.log(message);
```

Bash 代码块提供 Copy 和 Run。示例只向终端输出一行文字：

```bash
printf 'xMark preview demo\n'
```

## Emoji

Emoji 短代码：`:sparkles:`、`:memo:`、`:rocket:`。

## 任务列表

- [x] 已完成的项目
- [ ] 尚未完成的项目

预览中的任务列表复选框为只读。

## GitHub Alerts

> [!NOTE]
> 这是一条提示。

> [!TIP]
> 这是一条技巧建议。

> [!IMPORTANT]
> 这是一条重要说明。

> [!WARNING]
> 这是一条警告。

> [!CAUTION]
> 这是一条需要谨慎处理的提醒。

## 容器

容器使用 `:::` 包围内容，支持 `info`、`note`、`tip`、`warning` 和 `danger`：

::: info
信息容器可以包含 **粗体**、链接和其他 Markdown 内容。
:::

::: note
这是 note 容器。
:::

::: tip
这是 tip 容器。
:::

::: warning
这是 warning 容器。
:::

::: danger
这是 danger 容器。
:::

## 脚注

正文中的脚注引用[^source]和行内脚注^[行内脚注不需要单独的定义行]都会链接到文末注释。

[^source]: 这是文末脚注，支持 **粗体**、`行内代码` 等 Markdown 格式。点击回链可返回正文。

## 定义列表

术语
: 定义列表用于解释术语或名称。

markdown-it
: 一个 JavaScript Markdown 解析器。
: 支持通过插件扩展语法。

xMark
: 一个轻量的 VS Code Markdown 预览扩展。
: 定义内容可以包含 _强调_、**粗体**、链接和其他 Markdown 内容。

## 原始 HTML

原始 HTML 不会作为 HTML 执行；下面的标签会按普通文本显示：

<div>这不是可执行的 HTML。</div>
