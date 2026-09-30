import fs from "fs";
import path from "path";
import { PROJECT_NAME } from "./constant";

type ScanScope = "assets" | "target";

type FileSizeInfo = {
  bundle: string;
  category: string;
  extension: string;
  relativePath: string;
  absolutePath: string;
  sizeBytes: number;
};

type GroupSizeInfo = {
  name: string;
  fileCount: number;
  sizeBytes: number;
  sizeKB: number;
  sizeMB: number;
  percent: number;
  largestFile: string;
  largestFileBytes: number;
};

const CONFIG = {
  // build/<target> cần kiểm tra.
  target: "web-mobile",

  // "assets": chỉ thống kê build/<target>/assets.
  // "target": thống kê toàn bộ build/<target>, gồm cả JS/HTML/CSS ngoài assets.
  scope: "assets" as ScanScope,

  // Chỉ có tác dụng khi scope = "assets".
  // [] = toàn bộ bundle. Ví dụ: ["main", "resources"].
  bundles: [] as string[],

  // Xuất báo cáo JSON và CSV vào thư mục gốc dự án.
  writeReportFiles: true,
  reportFolderName: "build-size-reports",
};

const CATEGORY_EXTENSIONS: Record<string, Set<string>> = {
  Image: new Set([
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".avif",
    ".gif",
    ".bmp",
    ".tga",
    ".psd",
    ".svg",
    ".ico",
    ".ktx",
    ".ktx2",
    ".pvr",
    ".pkm",
    ".astc",
    ".dds",
  ]),
  Audio: new Set([
    ".mp3",
    ".ogg",
    ".wav",
    ".m4a",
    ".aac",
    ".flac",
    ".opus",
    ".webm-audio",
  ]),
  "Binary / Mesh": new Set([".bin"]),
  JSON: new Set([".json"]),
  JavaScript: new Set([".js", ".mjs", ".cjs"]),
  Font: new Set([".ttf", ".otf", ".woff", ".woff2", ".eot"]),
  Video: new Set([".mp4", ".webm", ".mov", ".m4v", ".avi"]),
  "Web / Style": new Set([".html", ".htm", ".css", ".map"]),
  Shader: new Set([".effect", ".chunk", ".glsl", ".vert", ".frag"]),
  WebAssembly: new Set([".wasm"]),
  "Text / Config": new Set([
    ".txt",
    ".xml",
    ".plist",
    ".csv",
    ".yaml",
    ".yml",
    ".ini",
  ]),
  Archive: new Set([".zip", ".gz", ".br", ".rar", ".7z"]),
};

function main(): void {
  const projectRoot = getProjectRoot();
  const target = getStringArg("--target", CONFIG.target);
  const scope = getScopeArg("--scope", CONFIG.scope);
  const bundles = getListArg("--bundles", CONFIG.bundles);
  const targetRoot = path.join(projectRoot, "build", target);
  const assetsRoot = path.join(targetRoot, "assets");
  const baseScanRoot = scope === "assets" ? assetsRoot : targetRoot;

  if (!fs.existsSync(baseScanRoot)) {
    throw new Error(
      `Không tìm thấy thư mục build: ${baseScanRoot}\n` +
        `Hãy build target "${target}" trước khi chạy tool.`,
    );
  }

  if (scope === "target" && bundles.length > 0) {
    console.warn('⚠️ --bundles bị bỏ qua vì scope đang là "target".');
  }

  const scanRoots =
    scope === "assets"
      ? getBundleScanRoots(assetsRoot, bundles)
      : [targetRoot];

  const files: FileSizeInfo[] = [];
  for (const scanRoot of scanRoots) {
    scanDirectory(scanRoot, baseScanRoot, assetsRoot, files);
  }

  files.sort((a, b) => b.sizeBytes - a.sizeBytes);
  const totalBytes = sumFileBytes(files);
  const categoryStats = aggregateFiles(files, (file) => file.category, totalBytes);
  const extensionStats = aggregateFiles(files, (file) => file.extension, totalBytes);
  const bundleStats = aggregateFiles(files, (file) => file.bundle, totalBytes);

  printReport({
    target,
    scope,
    baseScanRoot,
    bundles,
    files,
    totalBytes,
    categoryStats,
    extensionStats,
    bundleStats,
  });

  if (CONFIG.writeReportFiles) {
    writeReports({
      projectRoot,
      target,
      scope,
      bundles,
      files,
      totalBytes,
      categoryStats,
      extensionStats,
      bundleStats,
    });
  }
}

function scanDirectory(
  directoryPath: string,
  baseScanRoot: string,
  assetsRoot: string,
  result: FileSizeInfo[],
): void {
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      scanDirectory(absolutePath, baseScanRoot, assetsRoot, result);
      continue;
    }

    if (!entry.isFile()) continue;

    const stats = fs.statSync(absolutePath);
    const rawExtension = path.extname(entry.name).toLowerCase();
    const extension = rawExtension || "(no extension)";

    result.push({
      bundle: detectBundle(absolutePath, assetsRoot),
      category: detectCategory(extension),
      extension,
      relativePath: toForwardSlashes(path.relative(baseScanRoot, absolutePath)),
      absolutePath,
      sizeBytes: stats.size,
    });
  }
}

function aggregateFiles(
  files: FileSizeInfo[],
  getGroupName: (file: FileSizeInfo) => string,
  totalBytes: number,
): GroupSizeInfo[] {
  const groups = new Map<
    string,
    {
      fileCount: number;
      sizeBytes: number;
      largestFile: string;
      largestFileBytes: number;
    }
  >();

  for (const file of files) {
    const name = getGroupName(file);
    const current = groups.get(name) ?? {
      fileCount: 0,
      sizeBytes: 0,
      largestFile: "",
      largestFileBytes: -1,
    };

    current.fileCount += 1;
    current.sizeBytes += file.sizeBytes;

    if (file.sizeBytes > current.largestFileBytes) {
      current.largestFile = file.relativePath;
      current.largestFileBytes = file.sizeBytes;
    }

    groups.set(name, current);
  }

  return Array.from(groups.entries())
    .map(([name, group]) => ({
      name,
      fileCount: group.fileCount,
      sizeBytes: group.sizeBytes,
      sizeKB: round(group.sizeBytes / 1024, 2),
      sizeMB: round(group.sizeBytes / 1024 / 1024, 3),
      percent: totalBytes > 0 ? round((group.sizeBytes / totalBytes) * 100, 2) : 0,
      largestFile: group.largestFile,
      largestFileBytes: Math.max(group.largestFileBytes, 0),
    }))
    .sort((a, b) => b.sizeBytes - a.sizeBytes);
}

function printReport(options: {
  target: string;
  scope: ScanScope;
  baseScanRoot: string;
  bundles: string[];
  files: FileSizeInfo[];
  totalBytes: number;
  categoryStats: GroupSizeInfo[];
  extensionStats: GroupSizeInfo[];
  bundleStats: GroupSizeInfo[];
}): void {
  const {
    target,
    scope,
    baseScanRoot,
    bundles,
    files,
    totalBytes,
    categoryStats,
    extensionStats,
    bundleStats,
  } = options;

  console.log("\n===== BUILD ASSET TYPE REPORT =====");
  console.log(`Target       : ${target}`);
  console.log(`Scope        : ${scope}`);
  console.log(`Scan root    : ${baseScanRoot}`);
  console.log(`Bundles      : ${bundles.length ? bundles.join(", ") : "all"}`);
  console.log(`Total        : ${files.length} files (${formatBytes(totalBytes)})`);

  console.log("\n===== BY CATEGORY =====");
  console.table(createConsoleRows(categoryStats, "Category"));

  console.log("\n===== BY EXTENSION =====");
  console.table(createConsoleRows(extensionStats, "Extension"));

  console.log("\n===== BY BUNDLE =====");
  console.table(createConsoleRows(bundleStats, "Bundle"));
}

function createConsoleRows(groups: GroupSizeInfo[], label: string) {
  return groups.map((group, index) => ({
    "#": index + 1,
    [label]: group.name,
    Files: group.fileCount,
    KB: group.sizeKB,
    MB: group.sizeMB,
    Percent: `${group.percent}%`,
    "Largest file": group.largestFile,
    "Largest KB": round(group.largestFileBytes / 1024, 2),
  }));
}

function writeReports(options: {
  projectRoot: string;
  target: string;
  scope: ScanScope;
  bundles: string[];
  files: FileSizeInfo[];
  totalBytes: number;
  categoryStats: GroupSizeInfo[];
  extensionStats: GroupSizeInfo[];
  bundleStats: GroupSizeInfo[];
}): void {
  const {
    projectRoot,
    target,
    scope,
    bundles,
    files,
    totalBytes,
    categoryStats,
    extensionStats,
    bundleStats,
  } = options;

  const reportDirectory = path.join(projectRoot, CONFIG.reportFolderName);
  fs.mkdirSync(reportDirectory, { recursive: true });

  const timestamp = createTimestamp();
  const baseName = `asset-type-${target}-${scope}-${timestamp}`;
  const jsonPath = path.join(reportDirectory, `${baseName}.json`);
  const categoryCsvPath = path.join(
    reportDirectory,
    `${baseName}-categories.csv`,
  );
  const extensionCsvPath = path.join(
    reportDirectory,
    `${baseName}-extensions.csv`,
  );
  const bundleCsvPath = path.join(reportDirectory, `${baseName}-bundles.csv`);

  const jsonData = {
    generatedAt: new Date().toISOString(),
    target,
    scope,
    bundles: bundles.length ? bundles : "all",
    totalFileCount: files.length,
    totalSizeBytes: totalBytes,
    totalSizeMB: round(totalBytes / 1024 / 1024, 3),
    byCategory: categoryStats,
    byExtension: extensionStats,
    byBundle: bundleStats,
    files,
  };

  fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), "utf8");
  fs.writeFileSync(categoryCsvPath, createGroupCsv(categoryStats), "utf8");
  fs.writeFileSync(extensionCsvPath, createGroupCsv(extensionStats), "utf8");
  fs.writeFileSync(bundleCsvPath, createGroupCsv(bundleStats), "utf8");

  console.log(`\n✅ JSON report     : ${jsonPath}`);
  console.log(`✅ Category report : ${categoryCsvPath}`);
  console.log(`✅ Extension report: ${extensionCsvPath}`);
  console.log(`✅ Bundle report   : ${bundleCsvPath}`);
}

function createGroupCsv(groups: GroupSizeInfo[]): string {
  const rows: Array<Array<string | number>> = [
    [
      "rank",
      "name",
      "file_count",
      "size_bytes",
      "size_kb",
      "size_mb",
      "percent",
      "largest_file",
      "largest_file_bytes",
    ],
    ...groups.map((group, index) => [
      index + 1,
      group.name,
      group.fileCount,
      group.sizeBytes,
      group.sizeKB,
      group.sizeMB,
      group.percent,
      group.largestFile,
      group.largestFileBytes,
    ]),
  ];

  // BOM giúp Excel trên Windows nhận UTF-8 chính xác.
  return `\uFEFF${rows
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\n")}`;
}

function detectCategory(extension: string): string {
  for (const [category, extensions] of Object.entries(CATEGORY_EXTENSIONS)) {
    if (extensions.has(extension)) return category;
  }
  return "Other";
}

function detectBundle(absolutePath: string, assetsRoot: string): string {
  const relativeFromAssets = path.relative(assetsRoot, absolutePath);
  const isInsideAssets =
    relativeFromAssets !== "" &&
    relativeFromAssets !== ".." &&
    !relativeFromAssets.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativeFromAssets);

  if (!isInsideAssets) return "(target root)";
  return relativeFromAssets.split(path.sep)[0] || "(assets root)";
}

function getBundleScanRoots(assetsRoot: string, bundles: string[]): string[] {
  if (bundles.length === 0) return [assetsRoot];

  const roots: string[] = [];
  for (const bundle of bundles) {
    const bundlePath = path.join(assetsRoot, bundle);
    if (!fs.existsSync(bundlePath)) {
      console.warn(`⚠️ Bỏ qua bundle không tồn tại: ${bundlePath}`);
      continue;
    }
    roots.push(bundlePath);
  }

  if (roots.length === 0) {
    throw new Error("Không có bundle hợp lệ để quét.");
  }

  return roots;
}

function getScopeArg(name: string, fallback: ScanScope): ScanScope {
  const value = getStringArg(name, fallback).toLowerCase();
  if (value !== "assets" && value !== "target") {
    throw new Error(`Scope không hợp lệ: ${value}. Chỉ nhận assets hoặc target.`);
  }
  return value;
}

function getStringArg(name: string, fallback: string): string {
  const value = getRawArg(name);
  return value === undefined || value.trim() === "" ? fallback : value.trim();
}

function getListArg(name: string, fallback: string[]): string[] {
  const value = getRawArg(name);
  if (value === undefined) return fallback;
  if (value.trim() === "") return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getRawArg(name: string): string | undefined {
  const prefix = `${name}=`;
  const argument = process.argv.slice(2).find((item) => item.startsWith(prefix));
  return argument?.slice(prefix.length);
}

function getProjectRoot(): string {
  if (!PROJECT_NAME.trim()) {
    throw new Error("PROJECT_NAME is empty. Please set it in tools/constant.ts.");
  }
  return path.join("D:/Rinna", PROJECT_NAME);
}

function sumFileBytes(files: FileSizeInfo[]): number {
  return files.reduce((total, file) => total + file.sizeBytes, 0);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${round(bytes / 1024, 2)} KB`;
  if (bytes < 1024 ** 3) return `${round(bytes / 1024 ** 2, 2)} MB`;
  return `${round(bytes / 1024 ** 3, 2)} GB`;
}

function round(value: number, digits: number): number {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}

function escapeCsvCell(value: string | number): string {
  const text = String(value);
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function toForwardSlashes(value: string): string {
  return value.split(path.sep).join("/");
}

function createTimestamp(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    "-",
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join("");
}

try {
  main();
} catch (error) {
  console.error("❌ Build asset type report failed:", error);
  process.exitCode = 1;
}