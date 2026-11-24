(() => {
  const vscode = acquireVsCodeApi();
  const config = JSON.parse(
    document.getElementById('xmark-data')?.dataset.config || '{}',
  );
  const body = document.body;
  const initialHtml = body.dataset.html || '';
  const previewThemes = [
    ['Bill Light', 'bill-light.css'],
    ['Bill Dark', 'bill-dark.css'],
    ['GitHub Light', 'github-light.css'],
    ['GitHub Dark', 'github-dark.css'],
  ];
  const codeThemes = [
    ['default.css', 'default.css'],
    ['dark.css', 'dark.css'],
    ['github.css', 'github.css'],
    ['github-dark.css', 'github-dark.css'],
    ['monokai.css', 'monokai.css'],
    ['pojoaque.css', 'pojoaque.css'],
    ['vs.css', 'vs.css'],
    ['Auto', 'auto.css'],
  ];
  const executionShells = [
    ['Bash', 'bash'],
    ['Zsh', 'zsh'],
  ];
  let previewTheme = config.previewTheme || 'github-light.css';
  let codeBlockTheme = config.codeBlockTheme || 'github.css';
  let executionShell = config.executionShell || 'bash';
  let zoom = 100;
  let tocVisible = false;

  body.innerHTML = `
    <header class="xmark-toolbar" aria-label="Markdown preview controls">
      <div class="xmark-toolbar-actions" hidden>
        <button class="xmark-tool-button" data-action="sync" title="Sync Source" aria-label="Sync Source">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.65 6.35A8 8 0 0 0 4 12h2a6 6 0 0 1 10.24-4.24L13 11h7V4l-2.35 2.35ZM18 12a6 6 0 0 1-10.24 4.24L11 13H4v7l2.35-2.35A8 8 0 0 0 20 12h-2Z"/></svg>
        </button>
        <button class="xmark-tool-button" data-action="toc" title="Table of Contents" aria-label="Table of Contents" aria-expanded="false">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h2v2H3V5Zm4 0h14v2H7V5ZM3 11h2v2H3v-2Zm4 0h14v2H7v-2ZM3 17h2v2H3v-2Zm4 0h14v2H7v-2Z"/></svg>
        </button>
        <button class="xmark-tool-button" data-action="menu" title="Preview Options" aria-label="Preview Options" aria-expanded="false">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>
        </button>
      </div>
      <button class="xmark-tool-button xmark-toolbar-toggle" data-action="toggle-toolbar" title="Expand preview controls" aria-label="Expand preview controls" aria-expanded="false">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <nav class="xmark-menu" aria-label="Preview options" hidden>
        <div class="xmark-menu-entry">
          <button class="xmark-menu-item" data-action="submenu" data-submenu="zoom"><span class="xmark-menu-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 3a7.5 7.5 0 1 0 4.62 13.41l4.24 4.24 1.42-1.42-4.24-4.24A7.5 7.5 0 0 0 10.5 3Zm0 2a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z"/></svg></span><span class="xmark-menu-label">Zoom (100%)</span><span class="xmark-menu-arrow">›</span></button>
          <div class="xmark-submenu" data-menu="zoom" hidden></div>
        </div>
        <div class="xmark-menu-entry">
          <button class="xmark-menu-item" data-action="submenu" data-submenu="preview-theme"><span class="xmark-menu-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18h1.2a2.8 2.8 0 0 0 2.05-4.7 1 1 0 0 1 .73-1.68H18a3 3 0 0 0 3-3 8.01 8.01 0 0 0-9-8.62ZM6.5 12a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"/></svg></span><span>Preview Theme</span><span class="xmark-menu-arrow">›</span></button>
          <div class="xmark-submenu" data-menu="preview-theme" hidden></div>
        </div>
        <div class="xmark-menu-entry">
          <button class="xmark-menu-item" data-action="submenu" data-submenu="code-theme"><span class="xmark-menu-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8.7 16.6-4.6-4.6 4.6-4.6L7.3 6 1.3 12l6 6 1.4-1.4ZM15.3 16.6l4.6-4.6-4.6-4.6L16.7 6l6 6-6 6-1.4-1.4ZM13.2 4l-4 16 1.9.5 4-16-1.9-.5Z"/></svg></span><span>Code Block Theme</span><span class="xmark-menu-arrow">›</span></button>
          <div class="xmark-submenu" data-menu="code-theme" hidden></div>
        </div>
        <div class="xmark-menu-entry">
          <button class="xmark-menu-item" data-action="submenu" data-submenu="execution-shell"><span class="xmark-menu-icon">&gt;_</span><span>Execution Shell</span><span class="xmark-menu-arrow">›</span></button>
          <div class="xmark-submenu" data-menu="execution-shell" hidden></div>
        </div>
      </nav>
    </header>
    <div class="xmark-layout">
      <main class="crossnote" data-for="preview"><article class="markdown-preview xmark-markdown">${initialHtml}</article></main>
      <aside class="xmark-toc" aria-label="Table of Contents" hidden><div class="xmark-toc-content"></div></aside>
    </div>
  `;

  const content = document.querySelector('.xmark-markdown');
  const toc = document.querySelector('.xmark-toc');
  const tocContent = document.querySelector('.xmark-toc-content');
  const menu = document.querySelector('.xmark-menu');
  const menuButton = document.querySelector('[data-action="menu"]');
  const toolbar = document.querySelector('.xmark-toolbar');
  const toolbarActions = document.querySelector('.xmark-toolbar-actions');
  const toolbarToggle = document.querySelector('.xmark-toolbar-toggle');
  const zoomLabel = document.querySelector('.xmark-menu-label');
  const pendingCodeCopies = new Map();
  const pendingCodeRuns = new Map();
  let nextCodeCopyId = 0;
  const addCodeCopyButtons = () => {
    content.querySelectorAll('pre.xmark-code-block').forEach((pre) => {
      if (pre.parentElement?.classList.contains('xmark-code-block-container')) {
        return;
      }
      const wrapper = document.createElement('div');
      wrapper.className = 'xmark-code-block-container';
      pre.parentNode.insertBefore(wrapper, pre);
      const toolbar = document.createElement('div');
      toolbar.className = 'xmark-code-block-toolbar';
      const code = pre.querySelector('code');
      const languageClass = [...(code?.classList || [])].find((name) =>
        name.startsWith('language-'),
      );
      if (languageClass) {
        const language = languageClass.slice('language-'.length).toLowerCase();
        const languageNames = {
          bash: 'Bash',
          c: 'C',
          cpp: 'C++',
          css: 'CSS',
          html: 'HTML',
          javascript: 'JavaScript',
          js: 'JavaScript',
          json: 'JSON',
          md: 'Markdown',
          markdown: 'Markdown',
          python: 'Python',
          py: 'Python',
          sh: 'Shell',
          shell: 'Shell',
          ts: 'TypeScript',
          typescript: 'TypeScript',
          yaml: 'YAML',
          yml: 'YAML',
        };
        const label = document.createElement('span');
        label.className = 'xmark-code-language';
        label.textContent =
          languageNames[language] ||
          language.charAt(0).toUpperCase() + language.slice(1);
        toolbar.append(label);
        if (['bash', 'sh', 'shell', 'zsh'].includes(language)) {
          const runButton = document.createElement('button');
          runButton.className = 'xmark-run-code';
          runButton.type = 'button';
          runButton.dataset.action = 'run-code';
          runButton.textContent = 'Run';
          runButton.title = 'Run in xMark terminal';
          runButton.setAttribute(
            'aria-label',
            'Run this code block in terminal',
          );
          toolbar.append(runButton);
        }
      }
      const button = document.createElement('button');
      button.className = 'xmark-copy-code';
      button.type = 'button';
      button.dataset.action = 'copy-code';
      button.textContent = 'Copy';
      button.title = 'Copy code';
      button.setAttribute('aria-label', 'Copy code block');
      toolbar.append(button);
      wrapper.append(toolbar, pre);
    });
  };
  addCodeCopyButtons();
  const addMenuOption = (container, label, action, value, selected) => {
    const button = document.createElement('button');
    button.className = 'xmark-menu-item xmark-menu-option';
    button.dataset.action = action;
    button.dataset.value = value;
    button.textContent = label;
    if (selected) button.classList.add('is-selected');
    container.append(button);
  };
  const zoomMenu = document.querySelector('[data-menu="zoom"]');
  const previewMenu = document.querySelector('[data-menu="preview-theme"]');
  const codeMenu = document.querySelector('[data-menu="code-theme"]');
  const executionShellMenu = document.querySelector(
    '[data-menu="execution-shell"]',
  );
  [50, 60, 70, 80, 90, 100, 110, 125, 140, 150].forEach((value) =>
    addMenuOption(zoomMenu, `${value}%`, 'zoom', value, value === zoom),
  );
  previewThemes.forEach(([label, value]) =>
    addMenuOption(
      previewMenu,
      label,
      'preview-theme',
      value,
      value === previewTheme,
    ),
  );
  codeThemes.forEach(([label, value]) =>
    addMenuOption(
      codeMenu,
      label,
      'code-theme',
      value,
      value === codeBlockTheme,
    ),
  );
  executionShells.forEach(([label, value]) =>
    addMenuOption(
      executionShellMenu,
      label,
      'execution-shell',
      value,
      value === executionShell,
    ),
  );

  const updateThemeClass = () => {
    body.dataset.previewTheme = previewTheme.includes('dark')
      ? 'dark'
      : 'light';
    body.dataset.codeTheme = codeBlockTheme;
  };
  const closeSubmenus = () => {
    document
      .querySelectorAll('.xmark-submenu:not([hidden])')
      .forEach((submenu) => {
        submenu.hidden = true;
      });
    document.querySelectorAll('.xmark-menu-entry.is-open').forEach((entry) => {
      entry.classList.remove('is-open');
    });
  };
  const closeMenu = () => {
    menu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    closeSubmenus();
  };
  const updateToc = (html) => {
    tocContent.innerHTML = html || '';
    if (!html) {
      tocVisible = false;
      document
        .querySelector('[data-action="toc"]')
        .setAttribute('aria-expanded', 'false');
    }
    toc.hidden = !html || !tocVisible;
    document.querySelector('[data-action="toc"]').disabled = !html;
  };
  const openMenuAt = (x, y) => {
    menu.hidden = false;
    menuButton.setAttribute('aria-expanded', 'true');
    menu.style.left = '';
    menu.style.top = '';
    menu.style.right = '';
    menu.style.bottom = '';
    const bounds = menu.getBoundingClientRect();
    if (x === undefined || y === undefined) {
      menu.style.top = '44px';
      menu.style.right = '8px';
    } else {
      menu.style.left = `${Math.max(8, Math.min(x, innerWidth - bounds.width - 8))}px`;
      menu.style.top = `${Math.max(8, Math.min(y, innerHeight - bounds.height - 8))}px`;
    }
  };
  const openSubmenu = (entry, name) => {
    closeSubmenus();
    const submenu = entry.querySelector(`[data-menu="${name}"]`);
    if (!submenu) return;
    submenu.hidden = false;
    entry.classList.add('is-open');
    submenu.classList.remove('opens-left');
    if (submenu.getBoundingClientRect().right > innerWidth - 8) {
      submenu.classList.add('opens-left');
    }
  };

  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) {
      if (!event.target.closest('.xmark-menu')) closeMenu();
      return;
    }
    const action = target.dataset.action;
    if (action === 'toggle-toolbar') {
      const expanded = toolbarToggle.getAttribute('aria-expanded') !== 'true';
      toolbarToggle.setAttribute('aria-expanded', String(expanded));
      toolbarToggle.setAttribute(
        'aria-label',
        expanded ? 'Collapse preview controls' : 'Expand preview controls',
      );
      toolbarToggle.title = expanded
        ? 'Collapse preview controls'
        : 'Expand preview controls';
      toolbar.classList.toggle('is-expanded', expanded);
      toolbarActions.hidden = !expanded;
      if (!expanded) closeMenu();
    } else if (action === 'menu') {
      if (menu.hidden) openMenuAt();
      else closeMenu();
    } else if (action === 'sync') {
      vscode.postMessage({ command: 'previewSyncSource' });
      closeMenu();
    } else if (action === 'copy-code') {
      const code = target
        .closest('.xmark-code-block-container')
        ?.querySelector('code')?.textContent;
      if (code === undefined) return;
      const id = `code-copy-${++nextCodeCopyId}`;
      pendingCodeCopies.set(id, target);
      target.disabled = true;
      vscode.postMessage({ command: 'copyCode', id, text: code });
    } else if (action === 'run-code') {
      const code = target
        .closest('.xmark-code-block-container')
        ?.querySelector('code')?.textContent;
      if (code === undefined) return;
      const id = `code-run-${++nextCodeCopyId}`;
      pendingCodeRuns.set(id, target);
      target.disabled = true;
      vscode.postMessage({ command: 'executeCode', id, text: code });
    } else if (action === 'toc') {
      tocVisible = !tocVisible;
      toc.hidden = !tocVisible;
      target.setAttribute('aria-expanded', String(tocVisible));
    } else if (action === 'submenu') {
      const entry = target.closest('.xmark-menu-entry');
      const submenu = entry.querySelector(
        `[data-menu="${target.dataset.submenu}"]`,
      );
      if (submenu.hidden) openSubmenu(entry, target.dataset.submenu);
      else closeSubmenus();
    } else if (action === 'zoom') {
      zoom = Number(target.dataset.value);
      content.style.fontSize = `${zoom}%`;
      zoomLabel.textContent = `Zoom (${zoom}%)`;
      zoomMenu.querySelectorAll('[data-action="zoom"]').forEach((option) => {
        option.classList.toggle('is-selected', option === target);
      });
      closeSubmenus();
    } else if (action === 'preview-theme') {
      previewTheme = target.dataset.value;
      vscode.postMessage({
        command: 'setPreviewTheme',
        args: ['', previewTheme],
      });
      closeMenu();
    } else if (action === 'code-theme') {
      codeBlockTheme = target.dataset.value;
      vscode.postMessage({
        command: 'setCodeBlockTheme',
        args: ['', codeBlockTheme],
      });
      closeMenu();
    } else if (action === 'execution-shell') {
      executionShell = target.dataset.value;
      vscode.postMessage({
        command: 'setExecutionShell',
        args: ['', executionShell],
      });
      closeMenu();
    }
  });

  document.addEventListener('mouseover', (event) => {
    const item = event.target.closest(
      '.xmark-menu-entry > [data-action="submenu"]',
    );
    if (item) openSubmenu(item.parentElement, item.dataset.submenu);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
  document.addEventListener('click', (event) => {
    const anchor = event.target.closest('a[href]');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    const protocol = new URL(anchor.href).protocol;
    if (['http:', 'https:', 'mailto:'].includes(protocol)) return;
    event.preventDefault();
    vscode.postMessage({ command: 'openLink', href });
  });

  window.addEventListener('message', (event) => {
    const message = event.data;
    if (message?.command === 'copyCodeResult') {
      const button = pendingCodeCopies.get(message.id);
      if (!button) return;
      pendingCodeCopies.delete(message.id);
      button.disabled = false;
      button.textContent = message.success ? 'Copied' : 'Failed';
      button.setAttribute(
        'aria-label',
        message.success ? 'Code copied' : 'Could not copy code',
      );
      setTimeout(() => {
        if (!button.isConnected) return;
        button.textContent = 'Copy';
        button.setAttribute('aria-label', 'Copy code block');
      }, 1500);
      return;
    }
    if (message?.command === 'executeCodeResult') {
      const button = pendingCodeRuns.get(message.id);
      if (!button) return;
      pendingCodeRuns.delete(message.id);
      button.disabled = false;
      button.textContent = message.success ? 'Sent' : 'Failed';
      setTimeout(() => {
        if (!button.isConnected) return;
        button.textContent = 'Run';
      }, 1500);
      return;
    }
    if (message?.command === 'updateHtml') {
      content.innerHTML = message.html || '';
      addCodeCopyButtons();
      updateToc(message.tocHTML || '');
    }
  });

  updateToc('');
  updateThemeClass();
  vscode.postMessage({ command: 'webviewFinishLoading' });
})();
