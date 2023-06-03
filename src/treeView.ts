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
    vscode.window.showWarningMessage('Are you sure you want to delete this file or directory?', { modal: true }, 'Yes')
      .then((userResponse) => {
        if (userResponse === 'Yes') {
          try {
            if (fs.lstatSync(item.path).isDirectory()) {
              this.deleteDirectoryRecursive(item.path);
            } else {
              fs.unlinkSync(item.path);
            }
            vscode.window.showInformationMessage('File or directory deleted successfully.');
            this.refresh(item.parent); // Refresh the parent to update the view
          } catch (err) {
            vscode.window.showErrorMessage('Failed to delete file or directory.');
          }
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
      (element.isDirectory && element.parent === undefined)
        ? vscode.TreeItemCollapsibleState.Expanded
        : (!element.isDirectory)
          ? vscode.TreeItemCollapsibleState.None
          : vscode.TreeItemCollapsibleState.Collapsed
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

    if (element.parent === undefined) {
      treeItem.contextValue = 'workSpace';
    } else if (element.isDirectory) {
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
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (workspaceFolders) {
        const workspaceFolderItems: FileItem[] = workspaceFolders.map(workspaceFolder => ({
          name: workspaceFolder.name,
          path: workspaceFolder.uri.fsPath,
          isDirectory: true
        }));
        return Promise.resolve(workspaceFolderItems);
      } else {
        return Promise.resolve([]);
      }
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

  async newFile(fileItem: FileItem): Promise<void> {
    let filePath = fileItem.isDirectory ? fileItem.path : path.dirname(fileItem.path);

    let fileName = await vscode.window.showInputBox({
      prompt: 'Enter new file name',
      validateInput: (value) => {
        if (value.trim() === '') {
          return 'The file name cannot be empty.';
        }
        return null;
      },
    });

    if (fileName) {
      let newFilePath = path.join(filePath, fileName);
      try {
        await vscode.workspace.fs.writeFile(vscode.Uri.file(newFilePath), new Uint8Array());
        this.refresh(fileItem);
        await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(newFilePath));
      } catch (err) {
        vscode.window.showErrorMessage(`Failed to create file: ${err}`);
      }
    }
  }

  async newFolder(fileItem: FileItem): Promise<void> {
    let dirPath = fileItem.isDirectory ? fileItem.path : path.dirname(fileItem.path);

    let folderName = await vscode.window.showInputBox({
      prompt: 'Enter new folder name',
      validateInput: (value) => {
        if (value.trim() === '') {
          return 'The folder name cannot be empty.';
        }
        return null;
      },
    });

    if (folderName) {
      let newFolderPath = path.join(dirPath, folderName);
      try {
        await vscode.workspace.fs.createDirectory(vscode.Uri.file(newFolderPath));
        this.refresh(fileItem);
      } catch (err) {
        vscode.window.showErrorMessage(`Failed to create folder: ${err}`);
      }
    }
  }

  private deleteDirectoryRecursive(dirPath: string) {
    if (fs.existsSync(dirPath)) {
      fs.readdirSync(dirPath).forEach((file: string) => {
        const curPath = path.join(dirPath, file);
        if (fs.lstatSync(curPath).isDirectory()) {
          // this is a directory, recurse
          this.deleteDirectoryRecursive(curPath);
        } else {
          // this is a file, remove it
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(dirPath);
    }
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
