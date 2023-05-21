import * as vscode from 'vscode';
import { FileTreeProvider } from './treeView';

export function activate(context: vscode.ExtensionContext) {
  const fileTreeProvider = new FileTreeProvider();
  vscode.window.createTreeView('gpt-copytree-panel', { treeDataProvider: fileTreeProvider });
}


export function deactivate() {}
