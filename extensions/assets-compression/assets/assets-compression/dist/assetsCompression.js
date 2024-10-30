"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const tinify = require("tinify");
const { FOLDER_OUTPUT, FOLDER_INPUT } = require("./constant");
const { checkWrongPath, checkFileExists } = require("./function");

let locks = new Set();

async function compression(_path) {
  // To do compression assets
  if (checkFileCompressed(_path)) return;
  while (locks.has(_path)) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  locks.add(_path);
  const fileExtension = path.extname(_path).toLowerCase();
  const fileName = path.basename(_path, path.extname(_path));
  const outputCompression =
    FOLDER_OUTPUT + `/${fileName}_compressed${fileExtension}`;
  if (isFileSupported(fileExtension)) {
    const source = tinify.fromFile(_path);
    source.toFile(outputCompression, (err) => {
      if (err) console.log(err);
      console.log(`File ${fileName} compressed!`);
    });
  }
  locks.delete(_path);
}

function checkFileCompressed(_path) {
  const pathFolderCompression = FOLDER_OUTPUT;
  const extensionFile = path.extname(_path);
  const fileNameWithExtension = path.basename(_path);
  const fileNameNoneEx = path.parse(fileNameWithExtension).name;
  const pathCompressFile = path.join(
    pathFolderCompression,
    fileNameNoneEx + "_compressed" + extensionFile
  );
  if (checkFileExists(pathCompressFile)) return true;
  else return false;
}

async function changeAsssets(_path) {
  // To do remove assets
  await removeAssets(_path);
  compression(_path);
}

function removeAssets(_path) {
  // To do remove assets
  const fileExtension = path.extname(_path).toLowerCase();
  const fileName = path.basename(_path);
  if (isFileSupported(fileExtension)) {
    const nameWithoutExtension = fileName.substring(
      0,
      fileName.lastIndexOf(fileExtension)
    );
    const newFileName = `${nameWithoutExtension}_compressed${fileExtension}`;
    const filePath = FOLDER_OUTPUT + "\\" + newFileName;
    fs.unlink(filePath, (err) => {
      if (err) console.log(err);
    });
  }
}

function removeFromCompressionAssets(_path) {
  const fileExtension = path.extname(_path).toLowerCase();
  const fileName = path.basename(_path);
  const result = fileName.substring(0, fileName.lastIndexOf("_compressed"));
  const filePath = FOLDER_INPUT + "\\" + result + fileExtension;
  if (isFileSupported(fileExtension)) {
    if (!checkWrongPath(filePath)) compression(filePath);
  }
}

function addFromCompressionAssets(_path) {
  // To do
}

function changeFromCompressionAssets(_path) {
  //To do
}

function isFileSupported(fileExtension) {
  const supportedExtensions = [".png", ".jpg", ".jpeg"];
  return supportedExtensions.includes(fileExtension);
}

exports.compression = compression;
exports.changeAsssets = changeAsssets;
exports.removeAssets = removeAssets;
exports.removeFromCompressionAssets = removeFromCompressionAssets;
exports.addFromCompressionAssets = addFromCompressionAssets;
exports.changeFromCompressionAssets = changeFromCompressionAssets;
