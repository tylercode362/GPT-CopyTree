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
  let itemNames: string[];
  try {
    itemNames = fs.readdirSync(filePath);
  } catch (error) {
    console.error(`Error reading directory at ${filePath}:`, error);
    return [];
  }

  const items = itemNames.map(name => {
    const itemPath = path.join(filePath, name);
    let isDirectory = false;
    try {
      isDirectory = fs.statSync(itemPath).isDirectory();
    } catch (error) {
      console.error(`Error accessing file or directory at ${itemPath}:`, error);
      // If we can't access this file or directory, we can't process it further.
      return null;
    }
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
  }).filter((item): item is FileItem => item !== null);

  return items;
}
