"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chokidar = require("chokidar");
const {
  checkWrongPath,
  getKeyTinyValue,
} = require("./function");
const tinify = require("tinify");

let watchs = []; 

async function watcher(folderToWatch, add, change, remove) {
  getKeyTinyValue().then((key) => {
    tinify.key = key;
    if (checkWrongPath(folderToWatch)) {
      throw new Error("File PATH ./res has been non Acccessible!");
    }

    const watcher = chokidar.watch(folderToWatch, {
      ignored: /^\./,
      persistent: true,
    });

    watchs.push(watcher);
    watcher.on("add", add).on("change", change).on("unlink", remove);
  });
}

function removeWatcher() {
  if(watchs){
    watchs.forEach(async element => {
    await element.close();
    });
  }
}


exports.watcher = watcher;
exports.removeWatcher = removeWatcher;
