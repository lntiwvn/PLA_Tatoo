"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chokidar = require("chokidar");
const { add, change, remove } = require('./wacherPusherFunction');
const { localParentPath } = require("../../assets/assets-compression/dist/constant");
const inputPath = localParentPath + '\\resources';

let watchs = []; 

async function watcher(folderToWatch, table) {
    const watcher = chokidar.watch(folderToWatch, {
      ignored: /^\./,
      persistent: true,
    });

    watchs.push(watcher);
    watcher
    .on('add', path => add(path, table))
    .on('change', path => change(path, table))
    .on('unlink', path => remove(path, table));
}

function constainPusher(){
    console.log("Constant enable");
    const musicPath = inputPath + '\\audio\\music';
    const soundPath = inputPath + '\\audio\\sound';
    const effectPath = inputPath + '\\prefab\\effect';
    watcher(musicPath, 'AUDIO_NAME');
    watcher(soundPath, 'AUDIO_NAME');
    watcher(effectPath, 'EFFECT_NAME');
}

function removeWatcher() {
    if(watchs){
      watchs.forEach(async element => {
      await element.close();
      });
    }
}

exports.removeWatcher = removeWatcher;
exports.constainPusher = constainPusher;



