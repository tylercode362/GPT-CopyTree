import * as vscode from 'vscode';
import { getFilesAndDirectories, FileItem } from './fileSystem';

export class FileTreeProvider implements vscode.TreeDataProvider<FileItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<FileItem | undefined | null | void> = new vscode.EventEmitter<FileItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<FileItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private selectedItems: Set<string> = new Set();

  refresh(item?: FileItem): void {
    this._onDidChangeTreeData.fire(item);
  }

  refreshAll(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: FileItem): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(
      element.name,
      element.isDirectory ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
    );

    treeItem.command = {
      command: 'GPT-CopyTree.toggleSelect',
      arguments: [element],
      title: 'Toggle Select'
    };

    if (element.isDirectory) {
      treeItem.iconPath = new vscode.ThemeIcon("folder");
    } else {
      treeItem.iconPath = new vscode.ThemeIcon("file");
    }

    if (this.isSelected(element)) {
      treeItem.description = "✅";
    } else {
      treeItem.description = "☑️";
    }

    return treeItem;
  }

  getChildren(element?: FileItem): Thenable<FileItem[]> {
    if (element) {
      return Promise.resolve(getFilesAndDirectories(element.path));
    } else {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      return Promise.resolve(workspaceFolder ? getFilesAndDirectories(workspaceFolder.uri.fsPath) : []);
    }
  }

  select(item: FileItem): void {
    this.selectedItems.add(item.path);
    this.refresh(item);
  }

  deselect(item: FileItem): void {
    this.selectedItems.delete(item.path);
    this.refresh(item);
  }

  isSelected(item: FileItem): boolean {
    return this.selectedItems.has(item.path);
  }
}
