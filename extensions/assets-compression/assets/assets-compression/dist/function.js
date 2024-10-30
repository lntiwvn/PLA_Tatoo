"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs')
const fsPromises = fs.promises;
const path = require('path');
  
function getCurrentDirectory() {
    return __dirname;
}

function getParentDirectory(folder) {
    console.log(path);
    return path.resolve(folder, '..');
}

function getChildDirectory(parentDir, childFolder) {
    return path.join(parentDir, childFolder);
}

function isPathAccessible(path) {
    try{
        fs.accessSync(path)
        return true;
    }catch(e){
        return false;
    }
}

async function createAndGetChildDirectory(parentDir, childDir) {
    const childPath = path.join(parentDir, childDir);

    try {
        try {
            await fsPromises.access(childPath);

            await fsPromises.rm(childPath, { recursive: true, force: true });
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log(`Directory does not exist, no need to remove.`);
            } else {
                throw error; 
            }
        }

        await fsPromises.mkdir(childPath, { recursive: true });

        return childPath;
    } catch (error) {
        console.error('Error creating or removing directory:', error);
    }
}

function checkWrongPath(_path){
    return !_path || !isPathAccessible(_path);
}

async function getJsonData(filePath) {
    try {
        const data = await fsPromises.readFile(filePath, 'utf8');
        const jsonData = JSON.parse(data);
        return jsonData;
    } catch (error) {
        console.error('Error reading or parsing the JSON file:', error);
    }
}

function checkFileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch (err) {
        console.error('Error checking file existence:', err);
        return false;
    }
}

async function getKeyTinyValue() {
    try {
      const jsonData = await getKeyTiny();
      const key = jsonData.key;
      return key;
    } catch (error) {
      console.error("Error getting key:", error);
    }
  }
  
  async function getKeyTiny() {
    const pathParent = getParentDirectory(
      getParentDirectory(getParentDirectory(getCurrentDirectory()))
    );
    const pathKeyJson = getChildDirectory(pathParent, "//dist//tinyKey.json");
    return await getJsonData(pathKeyJson);
  }

exports.getCurrentDirectory = getCurrentDirectory;
exports.getParentDirectory = getParentDirectory;
exports.getChildDirectory = getChildDirectory;
exports.createAndGetChildDirectory = createAndGetChildDirectory;
exports.checkWrongPath = checkWrongPath;
exports.getJsonData = getJsonData;
exports.checkFileExists = checkFileExists;
exports.getKeyTinyValue = getKeyTinyValue;
