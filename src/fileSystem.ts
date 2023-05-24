import * as fs from 'fs';
import * as path from 'path';

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  parent?: FileItem;
  children?: FileItem[];
}

export function getFilesAndDirectories(filePath: string, parent?: FileItem): FileItem[] {
  const itemNames = fs.readdirSync(filePath);
  const items: FileItem[] = itemNames.map(name => {
    const itemPath = path.join(filePath, name);
    const isDirectory = fs.statSync(itemPath).isDirectory();
    const item: FileItem = {
      name,
      path: itemPath,
      isDirectory,
      parent
    };
    if (isDirectory) {
      item.children = getFilesAndDirectories(itemPath, item);
    }
    return item;
  });
  return items;
}
