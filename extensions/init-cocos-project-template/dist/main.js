"use strict";function load(){}function unload(){}Object.defineProperty(exports,"__esModule",{value:!0}),exports.unload=exports.load=exports.methods=void 0,
exports.methods={
    async createScriptAndPrefab() {
        console.log("Create");
    //     var name = "GameManager";
    //     const scriptResult = await Editor.Message.request("asset-db", "create-asset", "db://assets/" + name + ".ts", "import { _decorator, Component, Node } from 'cc';\nconst { ccclass, property } = _decorator;\n\n@ccclass('" +
    //         name +
    //         "')\nexport class " +
    //         name +
    //         " extends Component {\n    start() {\n\n    }\n\n    update(deltaTime: number) {\n             \n    }\n}\n\n");
    //     var uuid = scriptResult.uuid;
    //     var compressUuid = Editor.Utils.UUID.compressUUID(uuid, false);
    //     const prefab = await Editor.Message.request("asset-db", "create-asset", "db://assets/" + name + ".prefab", `[\n  {\n    "__type__": "cc.Prefab",\n    "_name": "${name}",\n    "_objFlags": 0, \n "__editorExtras__": {},  \n    "_native": "",\n    "data": {\n      "__id__": 1\n    },\n    "optimizationPolicy": 0,\n  "persistent": false\n  },\n  
    //   {\n   "__type__": "cc.Node",\n    "_name": "Node",\n    "_objFlags": 0,\n "__editorExtras__": {}, \n  "_parent": null,\n    "_children": [],\n    "_active": true,\n    "_components": [ \n{ \n      "__id__": 2  \n    } \n ],\n  
    //   "_prefab": {\n      "__id__": 4\n    },\n    "_lpos": {\n      "__type__": "cc.Vec3",\n      "x": 0,\n      "y": 0,\n      "z": 0\n    },\n    "_lrot": {\n      "__type__": "cc.Quat",\n      "x": 0,\n      "y": 0,\n      "z": 0,\n      "w": 1\n    },\n    "_lscale": {\n      "__type__": "cc.Vec3",\n      "x": 1,\n      "y": 1,\n      "z": 1\n    },\n "_mobility": 0, \n    "_layer": 1073741824,\n    "_euler": {\n      "__type__": "cc.Vec3",\n      "x": 0,\n      "y": 0,\n      "z": 0\n    },\n    "_id": ""\n  },\n  
    //   {\n   "__type__": "${compressUuid}", \n "_name": "", \n "_objFlags": 0, \n "__editorExtras__": {}, \n"node": { \n "__id__": 1 \n }, \n "_enabled": true, \n "__prefab": { \n "__id__": 3 \n }, \n "_id": "" \n }, \n
    //   {\n   "__type__": "cc.CompPrefabInfo", \n    "fileId": "a823Am7hZKbazCoTnG8r+Q" \n }, \n
    //   {\n    "__type__": "cc.PrefabInfo",\n    "root": {\n      "__id__": 1\n    },\n    "asset": {\n      "__id__": 0\n    },\n    "fileId": "59D3HVHkBGKq02vMeUD0G+", \n "instance": null, \n "targetOverrides": null \n}\n]`);
    },

    async buildPlayableAds(){
        console.log("Build");
    }

},exports.load=load,exports.unload=unload;