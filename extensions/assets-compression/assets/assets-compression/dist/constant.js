"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const {
  getParentDirectory,
  getCurrentDirectory,
  getChildDirectory,
} = require("./function");

const projectPath = 
getParentDirectory(getParentDirectory(getParentDirectory(getParentDirectory(getParentDirectory(getCurrentDirectory()))))
);
const localParentPath = getChildDirectory(projectPath, 'assets');
const inputPath = "/res/assets";
const folderToWatch = getChildDirectory(localParentPath, inputPath);

const outputPath = "/res/compressedAssets";
const outputCompression = getChildDirectory(localParentPath, outputPath);

exports.FOLDER_INPUT = folderToWatch;
exports.FOLDER_OUTPUT = outputCompression;
exports.localParentPath = localParentPath;
