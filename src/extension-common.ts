import * as vscode from 'vscode';
import PreviewProvider, { SIDE_PANEL_VIEW_ID } from './preview-provider';
import { activateUpdateFeature } from './features/update/updateFeature';

export function activate(context: vscode.ExtensionContext): void {
  activateUpdateFeature(context);
  const previewProvider = new PreviewProvider(context);
  const viewOptions = { webviewOptions: { retainContextWhenHidden: true } };

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SIDE_PANEL_VIEW_ID,
      previewProvider,
      viewOptions,
    ),
    vscode.commands.registerCommand(
      'markdown-preview-bill.openPreview',
      (uri?: vscode.Uri) => previewProvider.openPreview(uri, false),
    ),
    vscode.commands.registerCommand(
      'markdown-preview-bill.openPreviewToTheSide',
      (uri?: vscode.Uri) => previewProvider.openPreview(uri, true),
    ),
    vscode.commands.registerCommand(
      'markdown-preview-bill.openPreviewInSidePanel',
      (uri?: vscode.Uri) => previewProvider.openPreviewInSidePanel(uri),
    ),
    vscode.commands.registerCommand(
      'markdown-preview-bill.toggleSidePanelPreviewLock',
      () => previewProvider.toggleSidePanelLock(),
    ),
    vscode.commands.registerCommand(
      'markdown-preview-bill.lockSidePanelPreview',
      () => previewProvider.setSidePanelLock(true),
    ),
    vscode.commands.registerCommand(
      'markdown-preview-bill.unlockSidePanelPreview',
      () => previewProvider.setSidePanelLock(false),
    ),
    vscode.commands.registerCommand(
      'markdown-preview-bill.refreshSidePanelPreview',
      () => previewProvider.refreshSidePanel(),
    ),
    vscode.commands.registerCommand(
      'markdown-preview-bill.openSidePanelSourceInEditor',
      () => previewProvider.openSidePanelSourceInEditor(),
    ),
    vscode.commands.registerCommand(
      'markdown-preview-bill.popOutSidePanelPreviewToEditor',
      () => previewProvider.popOutSidePanelPreview(),
    ),
    vscode.workspace.onDidChangeTextDocument((event) =>
      previewProvider.updateDocument(event.document),
    ),
    vscode.window.onDidChangeActiveTextEditor((editor) =>
      previewProvider.onActiveEditorChanged(editor),
    ),
  );
}
