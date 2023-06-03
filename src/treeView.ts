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

  delete(item: FileItem): void {
    vscode.window.showWarningMessage('Are you sure you want to delete this file?', { modal: true }, 'Yes')
      .then((userResponse) => {
        if (userResponse === 'Yes') {
          fs.unlink(item.path, (err) => {
            if (err) {
              vscode.window.showErrorMessage('Failed to delete file.');
            } else {
              vscode.window.showInformationMessage('File deleted successfully.');
              this.refresh(item.parent); // Refresh the parent to update the view
            }
          });
        }
      });
  }

  async rename(fileItem: FileItem): Promise<void> {
    let oldUri = vscode.Uri.file(fileItem.path);
    let oldFilePath = fileItem.path;
    let oldFileName = path.basename(oldFilePath);
    let oldDirPath = path.dirname(oldFilePath);

    let newFileName = await vscode.window.showInputBox({
      prompt: 'Enter new file name',
      value: oldFileName,
      validateInput: (value) => {
        if (value.trim() === '') {
          return 'The file name cannot be empty.';
        }
        return null;
      },
    });

    if (newFileName) {
      let newFilePath = path.join(oldDirPath, newFileName);
      let newUri = vscode.Uri.file(newFilePath);
      try {
        await vscode.workspace.fs.rename(oldUri, newUri);
        this.refresh();
      } catch (err) {
        vscode.window.showErrorMessage(`Failed to rename file: ${err}`);
      }
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
      treeItem.contextValue = 'folder';
      const selectedCount = this.getSelectedCount(element);
      if (selectedCount > 0) {
        treeItem.description = `(${selectedCount}) selected`;
      }
    } else {
      treeItem.iconPath = new vscode.ThemeIcon("file");
      treeItem.contextValue = 'file';
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

  copySelection(): string {
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
