import MarkdownIt from 'markdown-it';
import type { Token } from 'markdown-it';
import { randomUUID } from 'node:crypto';
import hljs from 'highlight.js/lib/core';
import * as vscode from 'vscode';
import markdownItContainer from 'markdown-it-container';
import markdownItDeflist from 'markdown-it-deflist';
import { full as markdownItEmoji } from 'markdown-it-emoji';
import markdownItFootnote from 'markdown-it-footnote';
import markdownItGitHubAlerts from 'markdown-it-github-alerts';
import markdownItTaskLists from 'markdown-it-task-lists';
import bash from 'highlight.js/lib/languages/bash';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import diff from 'highlight.js/lib/languages/diff';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import go from 'highlight.js/lib/languages/go';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import xml from 'highlight.js/lib/languages/xml';
import markdownLanguage from 'highlight.js/lib/languages/markdown';
import php from 'highlight.js/lib/languages/php';
import python from 'highlight.js/lib/languages/python';
import ruby from 'highlight.js/lib/languages/ruby';
import rust from 'highlight.js/lib/languages/rust';
import sql from 'highlight.js/lib/languages/sql';
import ini from 'highlight.js/lib/languages/ini';
import typescript from 'highlight.js/lib/languages/typescript';
import yaml from 'highlight.js/lib/languages/yaml';

const highlightLanguages = {
  bash,
  c,
  cpp,
  csharp,
  diff,
  dockerfile,
  go,
  java,
  javascript,
  json,
  xml,
  markdown: markdownLanguage,
  php,
  python,
  ruby,
  rust,
  sql,
  ini,
  typescript,
  yaml,
};

for (const [name, language] of Object.entries(highlightLanguages)) {
  hljs.registerLanguage(name, language);
}

const languageAliases: Record<string, string> = {
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  yml: 'yaml',
  html: 'xml',
  htm: 'xml',
  svg: 'xml',
  markup: 'xml',
  md: 'markdown',
  cxx: 'cpp',
  ['c++']: 'cpp',
  cs: 'csharp',
  ['c#']: 'csharp',
  docker: 'dockerfile',
  toml: 'ini',
};

const codeThemes = [
  'default.css',
  'dark.css',
  'github.css',
  'github-dark.css',
  'monokai.css',
  'pojoaque.css',
  'vs.css',
];

export const SIDE_PANEL_VIEW_ID = 'markdown-preview-bill.sidePanelView';

const SIDE_PANEL_LOCKED_CONTEXT = 'markdown-preview-bill.sidePanelLocked';
const SIDE_PANEL_HAS_SOURCE_CONTEXT =
  'markdown-preview-bill.sidePanelHasSource';
const CODE_THEME_DEFAULT_MIGRATION_KEY = 'codeThemeGitHubDefaultApplied';
const CODE_RUN_TASK_TYPE = 'xmark-code-run';
const CODE_RUN_DIRECTORY = 'code-runs';
const STALE_CODE_RUN_AGE_MS = 24 * 60 * 60 * 1000;
type ExecutionShell = 'bash' | 'zsh';

function isMarkdownDocument(document: vscode.TextDocument): boolean {
  return (
    [
      'markdown',
      'quarto',
      'prompt',
      'instructions',
      'chatagent',
      'skill',
    ].includes(document.languageId) ||
    /\.(md|markdown|mdown|mkdn|mkd|rmd|qmd|mdx)$/i.test(document.fileName)
  );
}

type WebviewTarget = vscode.WebviewPanel | vscode.WebviewView;

function getDirectoryUri(uri: vscode.Uri): vscode.Uri {
  const slashIndex = uri.path.lastIndexOf('/');
  return uri.with({
    path: slashIndex < 0 ? '/' : uri.path.slice(0, slashIndex + 1),
    query: '',
    fragment: '',
  });
}

export default class PreviewProvider implements vscode.WebviewViewProvider {
  private readonly panels = new Map<string, vscode.WebviewPanel>();
  private sidePanel: vscode.WebviewView | undefined;
  private sidePanelSource: vscode.Uri | undefined;
  private sidePanelLocked = false;
  private readonly runScripts = new Map<string, vscode.Uri>();

  private previewTheme: string;
  private codeBlockTheme: string;
  private executionShell: ExecutionShell;

  constructor(private readonly context: vscode.ExtensionContext) {
    context.subscriptions.push(
      vscode.tasks.onDidEndTask((event) => {
        const definition = event.execution.task.definition;
        const runId =
          definition.type === CODE_RUN_TASK_TYPE ? definition.id : undefined;
        if (typeof runId === 'string') {
          void this.removeRunScript(runId);
        }
      }),
    );
    void this.cleanupStaleRunScripts();
    this.previewTheme = this.safeThemeName(
      context.globalState.get('previewTheme', 'github-light.css'),
      'preview',
    );
    this.executionShell = this.safeExecutionShell(
      context.globalState.get('executionShell', 'bash'),
    );
    const savedCodeBlockTheme = context.globalState.get<string | undefined>(
      'codeBlockTheme',
    );
    const hasAppliedGitHubDefault = context.globalState.get(
      CODE_THEME_DEFAULT_MIGRATION_KEY,
      false,
    );
    this.codeBlockTheme = hasAppliedGitHubDefault
      ? this.safeThemeName(savedCodeBlockTheme ?? 'github.css', 'code')
      : 'github.css';
    if (!hasAppliedGitHubDefault) {
      void (async () => {
        try {
          await context.globalState.update('codeBlockTheme', 'github.css');
          await context.globalState.update(
            CODE_THEME_DEFAULT_MIGRATION_KEY,
            true,
          );
        } catch (error) {
          console.warn('[xMark] Could not set the default code theme.', error);
        }
      })();
    }
  }

  public async openPreview(
    uri: vscode.Uri | undefined,
    beside: boolean,
  ): Promise<void> {
    const sourceUri = uri ?? vscode.window.activeTextEditor?.document.uri;
    if (!sourceUri) {
      return;
    }

    const document = await vscode.workspace.openTextDocument(sourceUri);
    if (!isMarkdownDocument(document)) {
      return;
    }
    const key = sourceUri.toString();
    let panel = this.panels.get(key);

    if (panel) {
      panel.reveal(
        beside ? vscode.ViewColumn.Beside : vscode.ViewColumn.Active,
      );
    } else {
      const createdPanel = vscode.window.createWebviewPanel(
        'markdown-preview-bill.preview',
        `${sourceUri.path.split('/').filter(Boolean).pop() || 'Markdown'} Preview`,
        beside ? vscode.ViewColumn.Beside : vscode.ViewColumn.Active,
        {
          enableScripts: true,
          localResourceRoots: this.getLocalResourceRoots(sourceUri),
        },
      );
      panel = createdPanel;
      this.panels.set(key, panel);
      createdPanel.onDidDispose(() => this.panels.delete(key));
      createdPanel.webview.onDidReceiveMessage((message: unknown) =>
        this.handleLinkMessage(sourceUri, message, createdPanel),
      );
    }

    await this.render(panel, document);
  }

  public async openPreviewInSidePanel(uri?: vscode.Uri): Promise<void> {
    const sourceUri = uri ?? vscode.window.activeTextEditor?.document.uri;
    if (!sourceUri) {
      return;
    }

    const sourceDocument = await vscode.workspace.openTextDocument(sourceUri);
    if (!isMarkdownDocument(sourceDocument)) {
      return;
    }

    if (!this.sidePanelLocked || !this.sidePanelSource) {
      this.sidePanelSource = sourceUri;
    }
    await this.updateSidePanelContext();
    await vscode.commands.executeCommand(`${SIDE_PANEL_VIEW_ID}.focus`);
    if (this.sidePanel) {
      const document = await vscode.workspace.openTextDocument(
        this.sidePanelSource ?? sourceUri,
      );
      await this.renderSidePanel(document);
    }
  }

  public resolveWebviewView(view: vscode.WebviewView): void {
    this.sidePanel = view;
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: this.getLocalResourceRoots(
        this.sidePanelSource ?? vscode.window.activeTextEditor?.document.uri,
      ),
    };
    view.webview.onDidReceiveMessage((message: unknown) => {
      if (this.sidePanelSource) {
        return this.handleLinkMessage(this.sidePanelSource, message, view);
      }
    });
    view.onDidChangeVisibility(() => {
      if (view.visible) {
        void this.refreshSidePanel();
      }
    });
    view.onDidDispose(() => {
      if (this.sidePanel === view) {
        this.sidePanel = undefined;
      }
    });
    const activeDocument = vscode.window.activeTextEditor?.document;
    const sourceUri =
      this.sidePanelSource ??
      (activeDocument && isMarkdownDocument(activeDocument)
        ? activeDocument.uri
        : undefined);
    if (sourceUri) {
      this.sidePanelSource = sourceUri;
      void Promise.resolve(vscode.workspace.openTextDocument(sourceUri))
        .then((document) => {
          if (this.sidePanel === view) {
            return this.render(view, document);
          }
        })
        .catch((error: unknown) =>
          this.handleUnavailableSidePanelSource(sourceUri, error),
        );
    }
    void this.updateSidePanelContext();
  }

  public async updateDocument(document: vscode.TextDocument): Promise<void> {
    const sourceUri = document.uri.toString();
    for (const [panelSourceUri, panel] of this.panels) {
      if (panelSourceUri === sourceUri) {
        await this.updatePreview(panel, document);
      }
    }

    if (this.sidePanelSource?.toString() === sourceUri) {
      if (this.sidePanel) {
        await this.updatePreview(this.sidePanel, document);
      }
    }
  }

  public async onActiveEditorChanged(
    editor: vscode.TextEditor | undefined,
  ): Promise<void> {
    if (
      this.sidePanelLocked ||
      !editor ||
      !isMarkdownDocument(editor.document)
    ) {
      return;
    }
    this.sidePanelSource = editor.document.uri;
    await this.updateSidePanelContext();
    if (this.sidePanelSource.toString() !== editor.document.uri.toString()) {
      return;
    }
    await this.renderSidePanel(editor.document);
  }

  public async toggleSidePanelLock(): Promise<void> {
    this.sidePanelLocked = !this.sidePanelLocked;
    await this.updateSidePanelContext();
  }

  public async setSidePanelLock(locked: boolean): Promise<void> {
    this.sidePanelLocked = locked;
    await this.updateSidePanelContext();
  }

  public async refreshSidePanel(): Promise<void> {
    if (!this.sidePanelSource) {
      return;
    }
    const sourceUri = this.sidePanelSource;
    let document: vscode.TextDocument;
    try {
      document = await vscode.workspace.openTextDocument(sourceUri);
    } catch (error) {
      this.handleUnavailableSidePanelSource(sourceUri, error);
      return;
    }
    await this.renderSidePanel(document);
  }

  public async openSidePanelSourceInEditor(): Promise<void> {
    if (!this.sidePanelSource) {
      return;
    }
    const document = await vscode.workspace.openTextDocument(
      this.sidePanelSource,
    );
    await vscode.window.showTextDocument(document, { preview: false });
  }

  public async popOutSidePanelPreview(): Promise<void> {
    await this.openPreview(this.sidePanelSource, true);
  }

  private async renderSidePanel(document: vscode.TextDocument): Promise<void> {
    if (!this.sidePanel) {
      return;
    }
    this.sidePanel.webview.options = {
      enableScripts: true,
      localResourceRoots: this.getLocalResourceRoots(document.uri),
    };
    await this.render(this.sidePanel, document);
  }

  private async render(
    target: WebviewTarget,
    document: vscode.TextDocument,
  ): Promise<void> {
    const { html } = this.renderMarkdown(target.webview, document);
    target.webview.html = this.getHtml(target.webview, document.uri, html);
  }

  private async updatePreview(
    target: WebviewTarget,
    document: vscode.TextDocument,
  ): Promise<void> {
    const markdown = document.getText();
    const { html, tocHTML } = this.renderMarkdown(target.webview, document);
    const delivered = await target.webview.postMessage({
      command: 'updateHtml',
      markdown,
      html,
      tocHTML,
      totalLineCount: document.lineCount,
      sourceUri: document.uri.toString(),
      sourceScheme: document.uri.scheme,
      id: '',
      class: '',
    });
    if (!delivered) {
      target.webview.html = this.getHtml(target.webview, document.uri, html);
    }
  }

  private renderMarkdown(
    webview: vscode.Webview,
    document: vscode.TextDocument,
  ): { html: string; tocHTML: string } {
    const markdown = new MarkdownIt({
      html: false,
      linkify: true,
      highlight: (code, language) => {
        const languageName = language.trim().toLowerCase();
        const languageId = languageAliases[languageName] ?? languageName;
        if (!languageId || !hljs.getLanguage(languageId)) {
          return '';
        }
        try {
          return `<pre class="xmark-code-block"><code class="hljs language-${languageId}">${
            hljs.highlight(code, {
              language: languageId,
              ignoreIllegals: true,
            }).value
          }</code></pre>`;
        } catch {
          return '';
        }
      },
    })
      .use(markdownItEmoji)
      .use(markdownItTaskLists, { enabled: false })
      .use(markdownItGitHubAlerts)
      .use(markdownItFootnote)
      .use(markdownItDeflist)
      .use(markdownItContainer, 'info', this.containerOptions('info'))
      .use(markdownItContainer, 'note', this.containerOptions('note'))
      .use(markdownItContainer, 'tip', this.containerOptions('tip'))
      .use(markdownItContainer, 'warning', this.containerOptions('warning'))
      .use(markdownItContainer, 'danger', this.containerOptions('danger'));
    const env = {};
    const tokens = markdown.parse(document.getText(), env);
    const usedHeadingIds = new Set<string>();
    const tocEntries: string[] = [];
    const escapeHtml = (value: string) =>
      value.replace(/[&<>"']/g, (character) => {
        switch (character) {
          case '&':
            return '&amp;';
          case '<':
            return '&lt;';
          case '>':
            return '&gt;';
          case '"':
            return '&quot;';
          default:
            return '&#39;';
        }
      });
    markdown.renderer.rules.emoji = (emojiTokens, index) => {
      const token = emojiTokens[index];
      return `<span class="xmark-emoji" role="img" aria-label="${escapeHtml(token.markup)}">${escapeHtml(token.content)}</span>`;
    };
    const headingText = (token: (typeof tokens)[number]) =>
      (token.children ?? [])
        .map((child) => {
          if (child.type === 'text' || child.type === 'code_inline') {
            return child.content;
          }
          if (child.type === 'image') {
            return child.content;
          }
          return '';
        })
        .join('')
        .trim();

    for (let index = 0; index < tokens.length; index += 1) {
      const token = tokens[index];
      if (token.type !== 'heading_open') {
        continue;
      }

      const inlineToken = tokens[index + 1];
      const title =
        inlineToken?.type === 'inline' ? headingText(inlineToken) : '';
      if (!title) {
        continue;
      }

      const slug =
        title
          .normalize('NFKD')
          .toLowerCase()
          .replace(/\p{M}/gu, '')
          .replace(/[^\p{L}\p{N}_\s-]/gu, '')
          .trim()
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-') || 'section';
      let id = slug;
      let suffix = 1;
      while (usedHeadingIds.has(id)) {
        id = `${slug}-${suffix}`;
        suffix += 1;
      }
      usedHeadingIds.add(id);
      token.attrSet('id', id);
      tocEntries.push(
        `<div class="md-toc-link-wrapper" data-level="${Number(token.tag.slice(1)) - 1}"><a class="md-toc-link" href="#${id}">${escapeHtml(title)}</a></div>`,
      );
    }

    const imageRule = markdown.renderer.rules.image;
    markdown.renderer.rules.image = (tokens, index, options, env, renderer) => {
      const token = tokens[index];
      const source = token.attrGet('src');
      if (typeof source === 'string' && this.isRelativeResource(source)) {
        const suffixIndex = source.search(/[?#]/);
        const imagePath =
          suffixIndex < 0 ? source : source.slice(0, suffixIndex);
        const suffix = suffixIndex < 0 ? '' : source.slice(suffixIndex);
        let decodedImagePath = imagePath;
        try {
          decodedImagePath = decodeURIComponent(imagePath);
        } catch {
          // Keep the literal path if it contains a malformed escape sequence.
        }
        token.attrSet(
          'src',
          `${webview.asWebviewUri(
            vscode.Uri.joinPath(
              getDirectoryUri(document.uri),
              decodedImagePath,
            ),
          )}${suffix}`,
        );
      }
      if (imageRule) {
        return imageRule(tokens, index, options, env, renderer);
      }
      return renderer.renderToken(tokens, index, options);
    };

    return {
      html: markdown.renderer.render(tokens, markdown.options, env),
      tocHTML: tocEntries.length
        ? `<div class="md-toc">${tocEntries.join('')}</div>`
        : '',
    };
  }

  private getHtml(
    webview: vscode.Webview,
    sourceUri: vscode.Uri,
    renderedMarkdown: string,
  ): string {
    const outputRoot = vscode.Uri.joinPath(this.context.extensionUri, 'out');
    const resource = (...parts: string[]) =>
      webview.asWebviewUri(vscode.Uri.joinPath(outputRoot, ...parts));
    const uiStyleUri = resource('webview', 'preview.css');
    const uiScriptUri = resource('webview', 'preview.js');
    const markdownPluginsStyleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        'media',
        'markdown-plugins.css',
      ),
    );
    const themeUri = resource('preview_theme', this.previewTheme);
    const codeThemeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        'out',
        'highlightjs',
        this.getCodeTheme(),
      ),
    );
    const baseUri = getDirectoryUri(sourceUri);
    const csp = [
      `default-src 'none'`,
      `img-src ${webview.cspSource} https: http: data: blob:`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `script-src ${webview.cspSource}`,
      `worker-src blob: ${webview.cspSource}`,
      `font-src ${webview.cspSource} data:`,
      `base-uri ${webview.cspSource} file: vscode-remote:`,
    ].join('; ');
    const config = JSON.stringify({
      previewTheme: this.previewTheme,
      codeBlockTheme: this.codeBlockTheme,
      executionShell: this.executionShell,
    })
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;');
    const htmlAttribute = renderedMarkdown
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;');

    return `<!DOCTYPE html>
<html lang="${vscode.env.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta id="xmark-data" data-config="${config}">
  <base href="${baseUri}">
  <link rel="stylesheet" href="${themeUri}">
  <link rel="stylesheet" href="${codeThemeUri}">
  <link rel="stylesheet" href="${uiStyleUri}">
  <link rel="stylesheet" href="${markdownPluginsStyleUri}">
  <script defer src="${uiScriptUri}"></script>
</head>
<body class="preview-container vscode-web-extension" data-html="${htmlAttribute}">
</body>
</html>`;
  }

  private getLocalResourceRoots(uri?: vscode.Uri): vscode.Uri[] {
    const roots = [this.context.extensionUri];
    if (!uri) {
      return roots;
    }

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    if (workspaceFolder) {
      roots.push(workspaceFolder.uri);
    } else if (uri.scheme === 'file') {
      roots.push(getDirectoryUri(uri));
    }
    return roots;
  }

  private isRelativeResource(source: string): boolean {
    return !/^(?:[a-z][a-z0-9+.-]*:|\/\/|\/)/i.test(source);
  }

  private containerOptions(name: string) {
    return {
      render: (tokens: Token[], index: number) =>
        tokens[index].nesting === 1
          ? `<div class="xmark-container xmark-container-${name}">\n`
          : '</div>\n',
    };
  }

  private async handleLinkMessage(
    sourceUri: vscode.Uri,
    message: unknown,
    target: WebviewTarget,
  ): Promise<void> {
    const request = message as {
      command?: unknown;
      href?: unknown;
      args?: unknown[];
      id?: unknown;
      text?: unknown;
    } | null;
    if (request?.command === 'webviewFinishLoading') {
      const document = await vscode.workspace.openTextDocument(sourceUri);
      await this.updatePreview(target, document);
      return;
    }
    if (
      request?.command === 'copyCode' &&
      typeof request.id === 'string' &&
      typeof request.text === 'string'
    ) {
      try {
        await vscode.env.clipboard.writeText(request.text);
        await target.webview.postMessage({
          command: 'copyCodeResult',
          id: request.id,
          success: true,
        });
      } catch (error) {
        console.warn('[xMark] Could not copy code block.', error);
        await target.webview.postMessage({
          command: 'copyCodeResult',
          id: request.id,
          success: false,
        });
      }
      return;
    }
    if (
      request?.command === 'executeCode' &&
      typeof request.id === 'string' &&
      typeof request.text === 'string'
    ) {
      let scriptUri: vscode.Uri | undefined;
      let runId: string | undefined;
      try {
        runId = randomUUID();
        const runDirectory = vscode.Uri.joinPath(
          this.context.globalStorageUri,
          CODE_RUN_DIRECTORY,
        );
        await vscode.workspace.fs.createDirectory(runDirectory);
        const scriptExtension = this.executionShell === 'zsh' ? '.zsh' : '.sh';
        scriptUri = vscode.Uri.joinPath(
          runDirectory,
          `run-${Date.now()}-${runId}${scriptExtension}`,
        );
        await vscode.workspace.fs.writeFile(
          scriptUri,
          new TextEncoder().encode(request.text),
        );
        this.runScripts.set(runId, scriptUri);

        const taskDefinition = { type: CODE_RUN_TASK_TYPE, id: runId };
        const taskName = 'Run xMark shell script';
        const process = new vscode.ProcessExecution(this.executionShell, [
          scriptUri.fsPath,
        ]);
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const task = workspaceFolder
          ? new vscode.Task(
              taskDefinition,
              workspaceFolder,
              taskName,
              'xMark',
              process,
            )
          : new vscode.Task(taskDefinition, taskName, 'xMark', process);
        task.presentationOptions = {
          reveal: vscode.TaskRevealKind.Always,
          panel: vscode.TaskPanelKind.Dedicated,
          focus: true,
          showReuseMessage: false,
          clear: false,
          close: false,
        };
        await vscode.tasks.executeTask(task);
        await target.webview.postMessage({
          command: 'executeCodeResult',
          id: request.id,
          success: true,
        });
      } catch (error) {
        if (runId && this.runScripts.has(runId)) {
          await this.removeRunScript(runId);
        } else if (scriptUri) {
          await vscode.workspace.fs.delete(scriptUri).then(
            () => undefined,
            () => undefined,
          );
        }
        console.warn('[xMark] Could not run the shell script.', error);
        await target.webview.postMessage({
          command: 'executeCodeResult',
          id: request.id,
          success: false,
        });
      }
      return;
    }
    if (
      request?.command === 'setPreviewTheme' &&
      typeof request.args?.[1] === 'string'
    ) {
      this.previewTheme = this.safeThemeName(request.args[1], 'preview');
      await this.context.globalState.update('previewTheme', this.previewTheme);
      await this.refreshAllPreviews();
      return;
    }
    if (
      request?.command === 'setCodeBlockTheme' &&
      typeof request.args?.[1] === 'string'
    ) {
      this.codeBlockTheme = this.safeThemeName(request.args[1], 'code');
      await this.context.globalState.update(
        'codeBlockTheme',
        this.codeBlockTheme,
      );
      await this.refreshAllPreviews();
      return;
    }
    if (
      request?.command === 'setExecutionShell' &&
      typeof request.args?.[1] === 'string'
    ) {
      this.executionShell = this.safeExecutionShell(request.args[1]);
      await this.context.globalState.update(
        'executionShell',
        this.executionShell,
      );
      await this.refreshAllPreviews();
      return;
    }
    if (request?.command === 'previewSyncSource') {
      await vscode.window.showTextDocument(sourceUri, { preview: false });
      return;
    }
    const href =
      typeof request?.href === 'string'
        ? request.href
        : typeof request?.args?.[0] === 'string'
          ? request.args[0]
          : undefined;
    if (request?.command !== 'openLink' || !href) {
      return;
    }

    try {
      const base = getDirectoryUri(sourceUri);
      const link = new URL(href, base.toString());
      const linkUri = vscode.Uri.parse(link.toString());
      const sourceWorkspaceFolder =
        vscode.workspace.getWorkspaceFolder(sourceUri);
      if (
        ['file:', 'vscode-remote:'].includes(link.protocol) ||
        (sourceWorkspaceFolder &&
          linkUri.scheme === sourceUri.scheme &&
          linkUri.authority === sourceUri.authority)
      ) {
        await vscode.commands.executeCommand('vscode.open', linkUri);
      }
    } catch (error) {
      console.warn('[xMark] Could not open Markdown link.', error);
    }
  }

  private async updateSidePanelContext(): Promise<void> {
    await vscode.commands.executeCommand(
      'setContext',
      SIDE_PANEL_LOCKED_CONTEXT,
      this.sidePanelLocked,
    );
    await vscode.commands.executeCommand(
      'setContext',
      SIDE_PANEL_HAS_SOURCE_CONTEXT,
      !!this.sidePanelSource,
    );
  }

  private handleUnavailableSidePanelSource(
    sourceUri: vscode.Uri,
    error: unknown,
  ): void {
    console.warn('[xMark] Could not open side panel source.', error);
    if (this.sidePanelSource?.toString() === sourceUri.toString()) {
      this.sidePanelSource = undefined;
      void this.updateSidePanelContext();
    }
  }

  private safeThemeName(name: string, type: 'preview' | 'code'): string {
    const previewThemes = [
      'bill-dark.css',
      'bill-light.css',
      'github-dark.css',
      'github-light.css',
    ];
    return (type === 'preview'
      ? previewThemes
      : ['auto.css', ...codeThemes]
    ).includes(name)
      ? name
      : type === 'preview'
        ? 'github-light.css'
        : 'github.css';
  }

  private safeExecutionShell(shell: unknown): ExecutionShell {
    return shell === 'zsh' ? 'zsh' : 'bash';
  }

  private getCodeTheme(): string {
    if (this.codeBlockTheme !== 'auto.css') {
      return this.codeBlockTheme;
    }
    const darkPreviewThemes = new Set(['bill-dark.css', 'github-dark.css']);
    return darkPreviewThemes.has(this.previewTheme)
      ? 'github-dark.css'
      : 'github.css';
  }

  private async refreshAllPreviews(): Promise<void> {
    for (const [source, panel] of this.panels) {
      try {
        const document = await vscode.workspace.openTextDocument(
          vscode.Uri.parse(source),
        );
        await this.render(panel, document);
      } catch (error) {
        console.warn(`[xMark] Could not refresh preview for ${source}.`, error);
      }
    }
    if (this.sidePanel && this.sidePanelSource) {
      try {
        const document = await vscode.workspace.openTextDocument(
          this.sidePanelSource,
        );
        await this.render(this.sidePanel, document);
      } catch (error) {
        console.warn('[xMark] Could not refresh side panel preview.', error);
      }
    }
  }

  private async removeRunScript(runId: string): Promise<void> {
    const scriptUri = this.runScripts.get(runId);
    if (!scriptUri) {
      return;
    }
    this.runScripts.delete(runId);
    try {
      await vscode.workspace.fs.delete(scriptUri, { useTrash: false });
    } catch (error) {
      console.warn('[xMark] Could not remove a temporary script.', error);
    }
  }

  private async cleanupStaleRunScripts(): Promise<void> {
    const runDirectory = vscode.Uri.joinPath(
      this.context.globalStorageUri,
      CODE_RUN_DIRECTORY,
    );
    try {
      const entries = await vscode.workspace.fs.readDirectory(runDirectory);
      const staleBefore = Date.now() - STALE_CODE_RUN_AGE_MS;
      await Promise.all(
        entries
          .filter(
            ([name, type]) =>
              name.startsWith('run-') && type === vscode.FileType.File,
          )
          .map(async ([name]) => {
            const scriptUri = vscode.Uri.joinPath(runDirectory, name);
            const stat = await vscode.workspace.fs.stat(scriptUri);
            if (stat.mtime < staleBefore) {
              await vscode.workspace.fs.delete(scriptUri, { useTrash: false });
            }
          }),
      );
    } catch (error) {
      if ((error as { code?: string }).code !== 'FileNotFound') {
        console.warn('[xMark] Could not clean temporary scripts.', error);
      }
    }
  }
}
