"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
const path = require('path');
const { getKeyTinyValue } = require('../assets/assets-compression/dist/function');
const { assetsCompression, removeFuncCompression } = require('../assets/assets-compression/main');
const fsPromises = fs.promises;

const jsonName = __dirname + '\\tinyKey.json';

const panel = 'asset-compression';

async function editorSetupInit() {
  await createJsonFile(jsonName);
  getKeyTinyValue().then((key) => {
    if(key === ''){
      Editor.Panel.open(panel);
    } else {
      assetsCompression();
    }
  });
}

async function updateKeyValue(value) {
    const data = {
        key: value,
    };
    await updateJsonFile(jsonName, data);
    Editor.Panel.close(panel);
    assetsCompression();
}

function createJsonFile(name) {
    if (!fs.existsSync(name)) {
        const data = {
            key: "",
          };
        
        const jsonData = JSON.stringify(data, null, 2);
        fsPromises.writeFile(name, jsonData, (err) => {
          if (err) {
            console.error("JSON File unsuccessfully created:", err);
            return;
          }
          console.log("JSON File successfully created !");
        });
    }
}

async function updateJsonFile(filePath, jsData) {
  try {
    let jsonData = await getJsonData(filePath);

    console.log("Current data:", jsonData);

    jsonData = jsData;

    const updatedJsonData = JSON.stringify(jsonData, null, 2);

    console.log("Updated data:", updatedJsonData);

    await fsPromises.writeFile(filePath, updatedJsonData, "utf8");
    console.log("File has been updated");
  } catch (err) {
    console.error("Error:", err);
  }
}

async function getJsonData(filePath) {
  try {
    const data = await fsPromises.readFile(filePath, "utf8");
    const jsonData = JSON.parse(data);
    return jsonData;
  } catch (error) {
    console.error("Error reading or parsing the JSON file:", error);
  }
}

function removeCompression(){
  removeFuncCompression();
}

exports.editorSetupInit = editorSetupInit;
exports.updateKeyValue = updateKeyValue;
exports.removeCompression = removeCompression;
