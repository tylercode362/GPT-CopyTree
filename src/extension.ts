import * as vscode from 'vscode';
import { FileTreeProvider } from './treeView';

export function activate(context: vscode.ExtensionContext) {
  const fileTreeProvider = new FileTreeProvider(context.workspaceState);
  vscode.window.createTreeView('gpt-copytree-panel', { treeDataProvider: fileTreeProvider });

  context.subscriptions.push(
    vscode.commands.registerCommand('gpt-copytree.toggleSelect', (fileItem) => {
      if (fileTreeProvider.isSelected(fileItem)) {
        fileTreeProvider.deselect(fileItem);
      } else {
        fileTreeProvider.select(fileItem);
      }
    }),
    vscode.commands.registerCommand('gpt-copytree.refresh', () => fileTreeProvider.refreshAll()),
		vscode.commands.registerCommand('gpt-copytree.export', () => {
      const panel = vscode.window.createWebviewPanel(
        'gpt-copytree-export',
        'Exported Selection',
        vscode.ViewColumn.One,
        {}
      );

      panel.webview.html = fileTreeProvider.exportSelection();
    })
  );
}

export function deactivate() {}