"use strict";
const { constainPusher, removeWatcher } = require("./constainPusher/constainPusher");
const { editorSetupInit, removeCompression } = require("./editorSetupInit");
function load() { 
  constainPusher();
  editorSetupInit();
}
function unload() {
  removeCompression(); 
  removeWatcher();
}
Object.defineProperty(exports, "__esModule", { value: !0 }),
  (exports.unload = exports.load = exports.methods = void 0),
  (exports.methods = {
    showLog() {
      console.log("Hello World");
    },
  }),
  (exports.load = load),
  (exports.unload = unload);
