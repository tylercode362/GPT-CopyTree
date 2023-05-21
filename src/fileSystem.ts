import * as fs from 'fs';
import * as path from 'path';

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileItem[];
}

export function getFilesAndDirectories(filePath: string): FileItem[] {
  const itemNames = fs.readdirSync(filePath);
  const items: FileItem[] = itemNames.map(name => {
    const itemPath = path.join(filePath, name);
    const isDirectory = fs.statSync(itemPath).isDirectory();
    const item: FileItem = {
      name,
      path: itemPath,
      isDirectory,
    };
    if (isDirectory) {
      item.children = getFilesAndDirectories(itemPath);
    }
    return item;
  });
  return items;
}
