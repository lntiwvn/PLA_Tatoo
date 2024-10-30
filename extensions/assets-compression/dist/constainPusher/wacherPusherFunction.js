"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const {
  checkFileExists,
} = require("../../assets/assets-compression/dist/function");
const {
  localParentPath,
} = require("../../assets/assets-compression/dist/constant");

const outputPath = localParentPath + "\\constant\\constant.ts";

function add(_path, table) {
  // if (checkFileExists(_path)) return;
  if (path.extname(_path) === ".meta") return;
  const fileName = path.basename(_path, path.extname(_path));
  addConstain(outputPath, table, fileName);
}

async function change(_path, table) {
  if (path.extname(_path) === ".meta") return;
  const fileName = path.basename(_path, path.extname(_path));
  await removeConstain(outputPath, table, fileName);
  addConstain(outputPath, table, fileName);
}

function remove(_path, table) {
  if (path.extname(_path) === ".meta") return;
  const fileName = path.basename(_path, path.extname(_path));
  removeConstain(outputPath, table, fileName);
}

function addConstain(filePath, table, value) {
  const formattedKey = value.toUpperCase();
  const content = fs.readFileSync(filePath, "utf8");
  const newEntry = `        ${formattedKey}: '${value}',\n`;

  const tableStart = content.indexOf(`static ${table} = {`);
  const defaultStart = content.indexOf("DEFAULT:''", tableStart);

  if (tableStart !== -1 && defaultStart !== -1) {
    const tableContent = content.slice(tableStart, defaultStart);
    const keyExists = tableContent.includes(`${formattedKey}:`);

    if (!keyExists) {
      const updatedContent =
        content.slice(0, defaultStart) + newEntry + content.slice(defaultStart);
      fs.writeFileSync(filePath, updatedContent, "utf8");
      console.log(`Added ${formattedKey}: '${value}' into ${filePath}`);
    } else {
      console.log(`The key ${formattedKey} already exists in ${filePath}`);
    }
  } else {
    console.log(`Table or DEFAULT entry not found in ${filePath}`);
  }
}

function removeConstain(filePath, table, key) {
  let content = fs.readFileSync(filePath, "utf8");

  const formattedKey = key.toUpperCase();

  const tableStart = content.indexOf(`static ${table} = {`);
  const tableEnd = content.indexOf("}", tableStart);

  if (tableStart !== -1 && tableEnd !== -1) {
    const tableContent = content.slice(tableStart, tableEnd + 1);

    const regex = new RegExp(`\\s*${formattedKey}:\\s*'[^']*',?\\s*`, "g");
    const updatedTableContent = tableContent.replace(regex, "");

    const updatedContent =
      content.slice(0, tableStart) +
      updatedTableContent +
      content.slice(tableEnd + 1);
    fs.writeFileSync(filePath, updatedContent, "utf8");

    console.log(`Unlink ${formattedKey} in ${table} from ${filePath}`);
  }
}

exports.add = add;
exports.change = change;
exports.remove = remove;
