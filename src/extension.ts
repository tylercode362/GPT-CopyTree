import * as vscode from 'vscode';
import { FileTreeProvider } from './treeView';

export function activate(context: vscode.ExtensionContext) {
  const fileTreeProvider = new FileTreeProvider(context.workspaceState);
  vscode.window.createTreeView('gpt-copytree-panel', { treeDataProvider: fileTreeProvider });

  vscode.commands.registerCommand('gpt-copytree.copy', () => {
    let copyContent = fileTreeProvider.copySelection();
    const quickPick = vscode.window.createQuickPick();
    const templates = vscode.workspace.getConfiguration().get<{ [index: string]: string }>('gpt-copytree.gptTemplates') || {};
    quickPick.items = Object.keys(templates).map(label => ({
      label,
      description: "Select a GPT-CopyTree Command Template"
    }));

    quickPick.onDidChangeSelection(selection => {
      if (selection[0]) {
        const template = templates[selection[0].label];
        const codeSection = template.replace('%content%', copyContent);

        vscode.env.clipboard.writeText(codeSection).then(() => {
          vscode.window.showInformationMessage(`Copied to clipboard: template is ${selection[0].label}, the content includes ${codeSection.length} characters.`);
        });
      }
    });

    quickPick.onDidHide(() => quickPick.dispose());
    quickPick.show();
  });


  vscode.commands.registerCommand('gpt-copytree.refresh', () => fileTreeProvider.refreshAll()),

    context.subscriptions.push(
      vscode.commands.registerCommand('gpt-copytree.collapseAllDirectories', () => {
        vscode.commands.executeCommand('workbench.actions.treeView.gpt-copytree-panel.collapseAll');
      })
    );

  context.subscriptions.push(
    vscode.commands.registerCommand('gpt-copytree.clear', () => {
      fileTreeProvider.clearAllSelected();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('gpt-copytree.openSettings', () => {
      vscode.commands.executeCommand('workbench.action.openSettings', 'gpt-copytree');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('gpt-copytree.toggleSelect', (fileItem) => {
      if (fileTreeProvider.isSelected(fileItem)) {
        fileTreeProvider.deselect(fileItem);
      } else {
        fileTreeProvider.select(fileItem);
      }
    }),
  );

  vscode.commands.registerCommand('gpt-copytree.openFile', (fileItem) => {
    if (!fileItem.isDirectory) {
      vscode.commands.executeCommand('vscode.open', vscode.Uri.file(fileItem.path));
    }
  });

  context.subscriptions.push(
    vscode.commands.registerCommand('gpt-copytree.rename', (fileItem) => {
      fileTreeProvider.rename(fileItem);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('gpt-copytree.delete', (fileItem) => {
      fileTreeProvider.delete(fileItem);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('gpt-copytree.newFile', (fileItem) => {
      fileTreeProvider.newFile(fileItem);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('gpt-copytree.newFolder', (fileItem) => {
      fileTreeProvider.newFolder(fileItem);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('gpt-copytree.unselectAllInDirectory', (directoryItem) => {
      fileTreeProvider.unselectAllInDirectory(directoryItem);
    }),
  );
}

export function deactivate() { }