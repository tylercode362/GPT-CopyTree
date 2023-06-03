# GPT-CopyTree Visual Studio Code Extension

## Description

GPT-CopyTree is a Visual Studio Code extension designed to facilitate easy file copying. It provides a tree view display of your files and directories within the VS Code workspace. With GPT-CopyTree, you can easily select files, navigate your file structure, and perform copy actions with the help of custom GPT templates.

![Copied for chatGPT web](https://github.com/tylercode362/GPT-CopyTree/assets/22150402/88464b65-5e73-48fd-9827-8c5c8c100a3e)


## Features

1. **File Tree View:** Navigate your file structure with an interactive tree view, enabling easy file and directory access right in your workspace.
2. 
![tree](https://github.com/tylercode362/GPT-CopyTree/assets/22150402/5049461d-7ead-4bba-8da6-8e4efebf9406)

2. **File Selection:** Select files directly from the tree view. Easily toggle selection with a single click, or clear all your selected files with a dedicated command.

3. **Custom Templates:** Use custom GPT templates for your file copying tasks. Define templates with placeholders to format your copied files exactly how you want them.

![Select templates](https://github.com/tylercode362/GPT-CopyTree/assets/22150402/d332e448-5e56-4709-a396-281bd974db51)
![Configuration](https://github.com/tylercode362/GPT-CopyTree/assets/22150402/592f025c-d987-45f7-8651-d7a6561b8977)
![Set the templates](https://github.com/tylercode362/GPT-CopyTree/assets/22150402/a199eb00-0bed-49a7-847e-b08cbe85bfdd)

4. **Export Functionality:** Export your selected files as a formatted string. Copy the output to your clipboard for easy pasting in your desired location.

5. **Additional Commands:** Additional commands such as "Refresh", "Collapse All Directories", and "Open GPT-CopyTree Settings" provide you with full control over your workspace.

## Getting Started

1. Install the GPT-CopyTree extension in VS Code.

2. Open your workspace, and you will see the GPT-CopyTree icon in your activity bar.

3. Click on the icon to see a tree view of your files and directories.

4. Select files by clicking on them in the tree view. The selected files will be marked in the tree view for easy reference.

5. Use the commands in the navigation bar above the tree view to perform actions such as "Refresh", "Export", "Clear Selected", "Collapse All Directories", and "Open GPT-CopyTree Settings".

## Configuration

Configure the GPT-CopyTree extension by opening the settings (use the "Open GPT-CopyTree Settings" command).

In the settings, you can configure the 'gpt-copytree.gptTemplates' property. This allows you to define your own custom templates for copying files. The '%content%' placeholder can be used to represent the position of the copied file name and content within the template.

Default templates include:

- "Remember Only": Holds onto the codes without transmitting them back instantly.
- "Execute Order": Executes an order command after the file content.
- "Just Copy": Simply copies the file content without any additional action.

## Contributing

If you would like to contribute to the development of GPT-CopyTree, please visit the [GPT-CopyTree repository](https://github.com/tylercode362/GPT-CopyTree.git) on GitHub.

## License

GPT-CopyTree is released under [MIT License](https://opensource.org/licenses/MIT).
