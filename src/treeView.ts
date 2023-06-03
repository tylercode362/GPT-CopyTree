import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getFilesAndDirectories, FileItem } from './fileSystem';
const { isText } = require('istextorbinary')

export class FileTreeProvider implements vscode.TreeDataProvider<FileItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<FileItem | undefined | null | void> = new vscode.EventEmitter<FileItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<FileItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private selectedItems: Set<string> = new Set();

  constructor(private workspaceState: vscode.Memento) {
    const storedSelectedItems = this.workspaceState.get<string[]>('selectedItems');
    if (storedSelectedItems) {
      this.selectedItems = new Set(storedSelectedItems.filter(fs.existsSync));
      this.workspaceState.update('selectedItems', Array.from(this.selectedItems));
    }
  }

  clearAllSelected(): void {
    vscode.window.showWarningMessage('Are you sure you want to clear all selected files?', { modal: true }, 'Yes')
    .then((userResponse) => {
      if (userResponse === 'Yes') {
        this.selectedItems.clear();
        this.workspaceState.update('selectedItems', []);
        this.refreshAll();
      }
    });
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

    if (!element.isDirectory) {
      treeItem.command = {
        command: 'gpt-copytree.toggleSelect',
        arguments: [element],
        title: 'Toggle Select'
      };

      if (this.isSelected(element)) {
        treeItem.description = "✅";
      } else {
        treeItem.description = "☑️";
      }
    }

    if (element.isDirectory) {
      treeItem.iconPath = new vscode.ThemeIcon("folder");

      const selectedCount = this.getSelectedCount(element);
      if (selectedCount > 0) {
        treeItem.description = `(${selectedCount}) selected`;
      }
    } else {
      treeItem.iconPath = new vscode.ThemeIcon("file");
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

  toggleSelect(item: FileItem): void {
    if (!item.isDirectory) {
      if (this.isSelected(item)) {
        this.deselect(item);
      } else {
        this.select(item);
      }
    }
  }

  exportSelection(): string {
    const exportStartHtmlSegment = vscode.workspace.getConfiguration().get<string>('gpt-copytree.gptTemplates')! + '\n';
    const exportContinueContent = vscode.workspace.getConfiguration().get<string>('gpt-copytree.exportContinueContent')! + '\n';
    const exportNextStartContent = vscode.workspace.getConfiguration().get<string>('gpt-copytree.exportNextStartContent')! + '\n';

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      throw new Error('No workspace folder is open');
    }

    const workspaceRootPath = workspaceFolders[0].uri.fsPath;
    let content = '';

    for (const selectedItemPath of Array.from(this.selectedItems)) {
      if (!fs.existsSync(selectedItemPath)) {
        continue;
      }

      const relativePath = path.relative(workspaceRootPath, selectedItemPath);
      if (fs.statSync(selectedItemPath).isDirectory()) {
        continue;
      } else {
        if (fs.statSync(selectedItemPath).size > 10 * 1024 * 1024) {
          content += `${relativePath} \n`;
        } else {
          const title = `\n------- ${relativePath} -----\n`;
          const fileContent = fs.readFileSync(selectedItemPath);
          if (isText(selectedItemPath, fileContent)) {
            content += `${title}} \n${fileContent}`;
          } else {
            content += `${relativePath} \n`;
          }
        }

        content += `\n------- end of ${relativePath} -----\n`;
      }
    }

    return content;
  }
}
