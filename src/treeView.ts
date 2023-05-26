import * as vscode from 'vscode';
import * as path from 'path';
import { getFilesAndDirectories, FileItem } from './fileSystem';

export class FileTreeProvider implements vscode.TreeDataProvider<FileItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<FileItem | undefined | null | void> = new vscode.EventEmitter<FileItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<FileItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private selectedItems: Set<string> = new Set();

  constructor(private workspaceState: vscode.Memento) {
    const storedSelectedItems = this.workspaceState.get<string[]>('selectedItems');
    if (storedSelectedItems) {
      this.selectedItems = new Set(storedSelectedItems);
    }
  }

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

      const selectedCount = this.getSelectedCount(element);
      if (selectedCount > 0) {
        treeItem.description = `(${selectedCount}) selected`;
      }
    } else {
      treeItem.iconPath = new vscode.ThemeIcon("file");

      if (this.isSelected(element)) {
        treeItem.description = "✅";
      } else {
        treeItem.description = "☑️";
      }
    }

    return treeItem;
  }

  getChildren(element?: FileItem): Thenable<FileItem[]> {
    if (element) {
      return Promise.resolve(getFilesAndDirectories(element.path, element));
    } else {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      return Promise.resolve(workspaceFolder ? getFilesAndDirectories(workspaceFolder.uri.fsPath) : []);
    }
  }

  select(item: FileItem): void {
    this.selectedItems.add(item.path);
    this.workspaceState.update('selectedItems', Array.from(this.selectedItems));
    this.refresh(item);
    this.refreshParents(item);
  }

  deselect(item: FileItem): void {
    this.selectedItems.delete(item.path);
    this.workspaceState.update('selectedItems', Array.from(this.selectedItems));
    this.refresh(item);
    this.refreshParents(item);
  }

  isSelected(item: FileItem): boolean {
    return this.selectedItems.has(item.path);
  }

  getSelectedCount(item: FileItem): number {
    if (!item.children) {
      return 0;
    }
    let count = 0;
    for (const child of item.children) {
      if (child.isDirectory) {
        count += this.getSelectedCount(child);
      } else if (this.isSelected(child)) {
        count++;
      }
    }
    return count;
  }

  private refreshParents(item: FileItem): void {
    let parent = item.parent;
    while (parent) {
      this.refresh(parent);
      parent = parent.parent;
    }
  }

  private findChildItem(parent: FileItem, name: string): FileItem | null {
    if (!parent.children) {
      return null;
    }
    for (const child of parent.children) {
      if (child.name === name) {
        return child;
      }
    }
    return null;
  }

  exportSelection(): string {
    let html = '<html><body><pre>';

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      throw new Error('No workspace folder is open');
    }

    const workspaceRootPath = workspaceFolders[0].uri.fsPath;

    for (const selectedItemPath of Array.from(this.selectedItems)) {
      const relativePath = path.relative(workspaceRootPath, selectedItemPath);
      html += this.exportItem(relativePath, 0);
    }

    html += '</pre></body></html>';
    console.log("HTML content: " + html);
    return html;
  }

  private exportItem(relativePath: string, level: number): string {
    return '<div>' + relativePath + '</div>';
  }
}
