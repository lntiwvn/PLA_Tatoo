"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const { watcher, removeWatcher } = require("./dist/fileWatcher");
const { FOLDER_OUTPUT, FOLDER_INPUT } = require("./dist/constant");
const { compression, changeAsssets, removeAssets, removeFromCompressionAssets, changeFromCompressionAssets, addFromCompressionAssets } = require("./dist/assetsCompression");

function assetsCompression(){
    watcher(FOLDER_INPUT, compression, changeAsssets, removeAssets);
    watcher(FOLDER_OUTPUT, addFromCompressionAssets, changeFromCompressionAssets, removeFromCompressionAssets);
}

function removeFuncCompression(){
    removeWatcher();
}

exports.assetsCompression = assetsCompression;
exports.removeFuncCompression = removeFuncCompression;
