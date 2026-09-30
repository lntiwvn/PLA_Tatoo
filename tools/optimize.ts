import fs from "fs";
import path from "path";
import archiver from "archiver";
import sharp from "sharp";
import { PROJECT_NAME } from "./constant";

const excludesFiles = [
];

function hasExtension(filePath) {
  return path.extname(filePath) !== '';
}

function hasSpecificExtension(filePath, extensions) {
  const ext = path.extname(filePath).toLowerCase();
  return extensions.includes(ext);
}

function excludeFiles(name, exts) {
  return exts.some(ext => name == ext);
}

async function main() {
  // const target = "fb-instant-games";
  const target = "web-mobile";
  await optimizeImageAndImportToTemplates(target);
  // optimizeImageRemote(target);
  cleanEmptyFolders(path.join(getProjectRoot(), "build-templates", target, "assets"));
}

main();

async function cleanEmptyFolders(directoryPath) {
  console.log(`Starting empty folder clean up in: ${directoryPath}`);
  await cleanEmptyFoldersRecursively(directoryPath);
  console.log('✅ Empty folder clean up finished.');
}

//====

async function optimizeImageAndImportToTemplates(target) {
  // for assets
  const listBundle = ["main"];
  const projectRoot = getProjectRoot();
  const BASE_BUILD_URL = path.join(projectRoot, "build", target, "assets");
  const BASE_TEMPLATES_URL = path.join(projectRoot, "build-templates", target, "assets");

  const exts = [".png"];
  for (let bundle of listBundle) {
    const destinationFolder = path.join(BASE_TEMPLATES_URL, bundle);
    deleteFolder(destinationFolder);
    await sleep(1000);
    const nativePath = path.join(BASE_BUILD_URL, bundle, "native");
    const nativeDest = path.join(BASE_TEMPLATES_URL, bundle, "native");

    copyFolderSync(nativePath, nativeDest, exts);
    await sleep(1000);
    console.log(`Folder ${bundle} copied successfully.`);
    const promises = [];
    optimizeImages(nativeDest, promises);
    console.log("promises : ", promises.length)
    const arrays = splitArray(promises);
    let count = 0;
    console.log(`optimize image : ${Math.floor(100 * (count / arrays.length))}%`)
    for (let array of arrays) {
      await Promise.all(array);
      count++;
      console.log(`optimize image : ${Math.floor(100 * (count / arrays.length))}%`)
    }
    console.log(`successfully optimize build.`);
  }
}

async function optimizeImageRemote(target) {
  // for remote
  const listBundle2 = ["area1", "area2"];
  const projectRoot = getProjectRoot();
  const BASE_URL = path.join(projectRoot, "bundles_original");
  const BASE_TEMPLATES_URL = path.join(projectRoot, "build-templates", target, "bundles");
  const exts = [".png", ".jpg", ".jpeg"];
  for (let bundle of listBundle2) {
    const destinationFolder = path.join(BASE_TEMPLATES_URL, bundle);
    deleteFolder(destinationFolder);
    await sleep(1000);
    const nativePath = path.join(BASE_URL, bundle);
    const nativeDest = path.join(BASE_TEMPLATES_URL, bundle);
    copyFolderSync(nativePath, nativeDest, exts);
    await sleep(1000);
    console.log(`Folder ${bundle} copied successfully.`);
    const promises = [];
    optimizeImages(nativeDest, promises);
    console.log("promises : ", promises.length)
    const arrays = splitArray(promises);
    let count = 0;
    console.log(`optimize image remote : ${Math.floor(100 * (count / arrays.length))}%`)
    for (let array of arrays) {
      await Promise.all(array);
      count++;
      console.log(`optimize image remote : ${Math.floor(100 * (count / arrays.length))}%`)
    }
    console.log(`successfully optimize bundle remote.`);
  }
}

function sleep(duration) : Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, duration);
  });
}

// Function to copy files and directories
function copyFolderSync(src, dest, exts) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyFolderSync(srcPath, destPath, exts);
    } else {
      // if (entry.name.length > 20) continue;
      if (exts && !hasSpecificExtension(entry.name, exts)) continue;
      if (excludeFiles(entry.name, excludesFiles)) continue;
      fs.copyFileSync(srcPath, destPath);
    }
  }
}



async function optimizeImages(src, promises){
  try {
    if (fs.lstatSync(src).isFile()) {
      let sharpPromise = sharpTool(src);
      promises.push(sharpPromise);
    } else {
      const entries = fs.readdirSync(src);
      let count = 0;
      for (let entry of entries) {
        const srcPath = path.join(src, entry);
        if (fs.lstatSync(srcPath).isFile() && /\.(jpg|jpeg|png)$/i.test(entry)) {
          const fileName = path.basename(srcPath);
          console.log("fileName : ", fileName);
          const extension = fileName.toLowerCase().split(".")[1];
          let sharpPromise = sharpTool(srcPath, extension);
          promises.push(sharpPromise);
        } else {
          optimizeImages(srcPath, promises);
        }
      }
    }
  } catch (error) {
    console.error('Error optimizing images:', error);
  }
}

function sharpTool(inputFile, ext?) : Promise<void>{
  return new Promise((resolve, reject) => {
    sharp(inputFile)
      .toFormat(ext, { quality: 80, }) // Convert to JPEG with 80% quality
      .toBuffer()
      .then(data => {
        fs.writeFileSync(inputFile, data); // Replace the original file with the optimized one
        // console.log(`Optimized and replaced ${file}`);
        resolve();
      })
      .catch(err => {
        console.error(`Error optimizing ${inputFile}:`, err);
      });
  });
}

function deleteFolder(folderPath) {
  fs.rm(folderPath, { recursive: true, force: true }, (err) => {
    if (err) {
      console.error('Error deleting the folder:', err);
    } else {
      console.log(`Deleted : ${folderPath}`);
    }
  });
}

function splitArray(inputArray, maxLength = 10) {
  const result = [];
  for (let i = 0; i < inputArray.length; i += maxLength) {
    result.push(inputArray.slice(i, i + maxLength));
  }
  return result;
}


function getProjectRoot() {
  if (!PROJECT_NAME.trim()) {
    throw new Error("PROJECT_NAME is empty. Please set it in tools/constant.ts.");
  }
  return path.join("D:/Rinna", PROJECT_NAME);
}
async function cleanEmptyFoldersRecursively(directoryPath) {
  try {
      // 1. Read the contents of the directory
      const contents = fs.readdirSync(directoryPath);
      let subDirFound = false;

      // 2. Process all contents: recursively clean subdirectories
      for (const item of contents) {
          const fullPath = path.join(directoryPath, item);
          const stats = fs.statSync(fullPath);

          if (stats.isDirectory()) {
              subDirFound = true;
              // Recursive call: try to clean the subdirectory
              const removed = await cleanEmptyFoldersRecursively(fullPath);

              // If a sub-folder was removed, the parent folder's contents have changed,
              // so we need to break and re-read the contents.
              if (removed) {
                  return cleanEmptyFoldersRecursively(directoryPath);
              }
          }
      }

      // 3. After processing all subdirectories, check if the current directory is empty
      const finalContents = fs.readdirSync(directoryPath);

      if (finalContents.length === 0) {
          // 4. Directory is empty, so delete it
          console.log(`🗑️ Deleting empty directory: ${directoryPath}`);
          // Use fs.rmdir or fs.rm (recommended for newer Node.js versions)
          fs.rmdirSync(directoryPath);
          // Or use: await fs.rm(directoryPath, { recursive: false });
          return true; // Directory was removed
      } else {
          // Directory is not empty (it has files or non-empty sub-folders)
          return false;
      }

  } catch (error) {
      // Handle errors like ENOENT (directory not found) or EPERM (permission denied)
      if (error.code === 'ENOENT') {
          return false; // Already gone or never existed
      }
      console.error(`Error processing directory ${directoryPath}:`, error.message);
      return false;
  }
}
