import fs from "fs";
import path from "path";
import { PROJECT_NAME, VERSION_NAME } from "./constant";

// Comment out any network that should not be included in the output.
const NETWORKS = [
  "applovin",
  // "bigo",
  // "chartboost",
  // "common",
  "facebook",
  // "gdt",
  "google",
  // "inmobi",
  // "ironsource2025",
  // "kwai",
  // "liftoff",
  "mintegral",
  // "moloco",
  // "nefta",
  // "news_break",
  // "pangle",
  // "snapchat",
  "tiktok",
  "unity",
  // "vungle",
  // "yandex",
] as const;

function main() {
  const projectRoot = getProjectRoot();
  const projectName = getRequiredConfig("PROJECT_NAME", PROJECT_NAME);
  const versionName = getRequiredConfig("VERSION_NAME", VERSION_NAME);

  const buildRoot = path.join(projectRoot, "build");
  const superHtmlRoot = path.join(buildRoot, "super-html");
  const outputRoot = path.join(buildRoot, versionName);

  if (!fs.existsSync(superHtmlRoot)) {
    throw new Error(`super-html folder not found: ${superHtmlRoot}`);
  }

  recreateOutputFolder(outputRoot, buildRoot);

  const channelFolders = fs
    .readdirSync(superHtmlRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) =>
      (NETWORKS as readonly string[]).includes(entry.name),
    );

  const existingChannels = new Set(
    channelFolders.map((entry) => entry.name),
  );

  for (const network of NETWORKS) {
    if (!existingChannels.has(network)) {
      console.warn(
        `Configured network folder not found: ${path.join(
          superHtmlRoot,
          network,
        )}`,
      );
    }
  }

  for (const channelFolder of channelFolders) {
    const channelName = channelFolder.name;
    const channelRoot = path.join(superHtmlRoot, channelName);

    removeGeneratedChannelFiles(
      channelRoot,
      versionName,
      channelName,
    );

    const expectedSourceBaseName =
      `${projectName}_${channelName}`;

    const sourceFiles = fs
      .readdirSync(channelRoot, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .filter((entry) =>
        isBaseNameOrVariant(
          entry.name,
          expectedSourceBaseName,
        ),
      );

    if (sourceFiles.length === 0) {
      console.warn(
        `No source file found for channel ${channelName}: ` +
        `expected ${expectedSourceBaseName}.* or ` +
        `${expectedSourceBaseName}_*.*`,
      );
      continue;
    }

    for (const file of sourceFiles) {
      const extension = path.extname(file.name);
      const actualSourceBaseName = path.basename(
        file.name,
        extension,
      );

      // Ví dụ:
      // PLA_HeroBase3D_google               -> ""
      // PLA_HeroBase3D_google_landscape     -> "_landscape"
      // PLA_HeroBase3D_google_portrait      -> "_portrait"
      const variantSuffix = actualSourceBaseName.slice(
        expectedSourceBaseName.length,
      );

      const sourcePath = path.join(
        channelRoot,
        file.name,
      );

      const outputFileName =
        `${versionName}_${channelName}` +
        `${variantSuffix}${extension}`;

      const outputPath = path.join(
        outputRoot,
        outputFileName,
      );

      fs.copyFileSync(sourcePath, outputPath);

      console.log(
        `Copied ${file.name} -> ${outputFileName}`,
      );
    }
  }
}

function recreateOutputFolder(
  outputRoot: string,
  buildRoot: string,
) {
  assertSafeOutputFolder(outputRoot, buildRoot);

  fs.rmSync(outputRoot, {
    recursive: true,
    force: true,
  });

  fs.mkdirSync(outputRoot, {
    recursive: true,
  });

  console.log(`Recreated output folder: ${outputRoot}`);
}

function removeGeneratedChannelFiles(
  channelRoot: string,
  versionName: string,
  channelName: string,
) {
  const generatedBaseName =
    `${versionName}_${channelName}`;

  const files = fs
    .readdirSync(channelRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .filter((entry) =>
      isBaseNameOrVariant(
        entry.name,
        generatedBaseName,
      ),
    );

  for (const file of files) {
    const filePath = path.join(
      channelRoot,
      file.name,
    );

    fs.rmSync(filePath, {
      force: true,
    });

    console.log(
      `Removed generated channel file: ${filePath}`,
    );
  }
}

/**
 * Cho phép:
 * baseName.ext
 * baseName_landscape.ext
 * baseName_portrait.ext
 * và những biến thể _suffix khác.
 */
function isBaseNameOrVariant(
  fileName: string,
  expectedBaseName: string,
) {
  const extension = path.extname(fileName);
  const actualBaseName = path.basename(
    fileName,
    extension,
  );

  return (
    actualBaseName === expectedBaseName ||
    actualBaseName.startsWith(
      `${expectedBaseName}_`,
    )
  );
}

function assertSafeOutputFolder(
  outputRoot: string,
  buildRoot: string,
) {
  const resolvedOutput = path.resolve(outputRoot);
  const resolvedBuild = path.resolve(buildRoot);

  if (
    resolvedOutput === resolvedBuild ||
    !resolvedOutput.startsWith(
      `${resolvedBuild}${path.sep}`,
    )
  ) {
    throw new Error(
      `Refusing to delete unsafe output folder: ${outputRoot}`,
    );
  }
}

function getProjectRoot() {
  const projectName = getRequiredConfig(
    "PROJECT_NAME",
    PROJECT_NAME,
  );

  return path.join("D:/Rinna", projectName);
}

function getRequiredConfig(
  name: string,
  value: string,
) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(
      `${name} is empty. Please set it in tools/constant.ts.`,
    );
  }

  return trimmed;
}

main();