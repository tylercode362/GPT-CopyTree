import * as vscode from 'vscode';
import { getFilesAndDirectories, FileItem } from './fileSystem';

export class FileTreeProvider implements vscode.TreeDataProvider<FileItem> {
  onDidChangeTreeData?: vscode.Event<FileItem | undefined | null | void>;

  getTreeItem(element: FileItem): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(element.name);
    treeItem.collapsibleState = element.isDirectory ?
      vscode.TreeItemCollapsibleState.Collapsed :
      vscode.TreeItemCollapsibleState.None;
    treeItem.contextValue = element.isDirectory ? 'directory' : 'file';
    treeItem.command = {
      command: 'GPT-CopyTree.select',
      title: 'Select',
      arguments: [element],
    };
    return treeItem;
  }

  getChildren(element?: FileItem): vscode.ProviderResult<FileItem[]> {
    if (element) {
      return element.children;
    } else {
      if (vscode.workspace.workspaceFolders) {
        return getFilesAndDirectories(vscode.workspace.workspaceFolders[0].uri.fsPath || '');
      } else {
        const noWorkspaceItem: FileItem = {
          name: 'No folder or workspace opened',
          path: '',
          isDirectory: false
        };
        return [noWorkspaceItem];
      }
    }
  }
}
