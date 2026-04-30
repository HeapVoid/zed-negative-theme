#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const defaultSetiRoot =
  "/Applications/Visual Studio Code.app/Contents/Resources/app/extensions/theme-seti";
const defaultImbaIcon =
  "/Users/fedor/.vscode/extensions/scrimba.vsimba-4.2.3/assets/imba.svg";
const languageContributionRoots = [
  "/Applications/Visual Studio Code.app/Contents/Resources/app/extensions",
  "/Users/fedor/.vscode/extensions",
];

const setiRoot = process.argv[2] ?? defaultSetiRoot;
const sourceThemePath = path.join(setiRoot, "icons", "vs-seti-icon-theme.json");
const sourceFontPath = path.join(setiRoot, "icons", "seti.woff");
const outputIconsDir = path.join(root, "icons", "seti");
const outputThemePath = path.join(
  root,
  "icon_themes",
  "negative-seti-icons.json",
);

const chevronColor = "#8F93A2";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function iconKey(vsCodeKey) {
  return vsCodeKey.replace(/^_/, "");
}

function svgPath(fileName) {
  return `./icons/seti/${fileName}`;
}

function fontCharacterToCodepoint(fontCharacter) {
  const match = /^\\([0-9a-fA-F]+)$/.exec(fontCharacter);
  if (!match) {
    throw new Error(`Unsupported font character: ${fontCharacter}`);
  }
  return Number.parseInt(match[1], 16);
}

function writeSvgIcon(filePath, body) {
  fs.writeFileSync(
    filePath,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">${body}</svg>\n`,
  );
}

function glyphToSvg(font, glyph, color) {
  const pathData = glyph
    .getPath(0, font.ascender, font.unitsPerEm)
    .toPathData(2);
  return `<path fill="${color}" d="${pathData}"/>`;
}

function chevronSvg(points) {
  return `<path d="${points}" fill="none" stroke="${chevronColor}" stroke-width="90" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function writeUtilityIcons() {
  writeSvgIcon(
    path.join(outputIconsDir, "folder.svg"),
    chevronSvg("M390 260 630 500 390 740"),
  );
  writeSvgIcon(
    path.join(outputIconsDir, "folder-open.svg"),
    chevronSvg("M260 390 500 630 740 390"),
  );
  writeSvgIcon(
    path.join(outputIconsDir, "chevron-right.svg"),
    chevronSvg("M390 260 630 500 390 740"),
  );
  writeSvgIcon(
    path.join(outputIconsDir, "chevron-down.svg"),
    chevronSvg("M260 390 500 630 740 390"),
  );
}

function copyImbaIcon(fileIcons, fileSuffixes) {
  if (!fs.existsSync(defaultImbaIcon)) return false;

  fs.copyFileSync(defaultImbaIcon, path.join(outputIconsDir, "imba.svg"));
  fileIcons.imba = { path: svgPath("imba.svg") };
  fileSuffixes.imba = "imba";
  fileSuffixes.imba1 = "imba";
  fileSuffixes.imba2 = "imba";
  return true;
}

function readPackageJsonFiles(directory, result = []) {
  if (!fs.existsSync(directory)) return result;

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      readPackageJsonFiles(fullPath, result);
    } else if (entry.isFile() && entry.name === "package.json") {
      result.push(fullPath);
    }
  }

  return result;
}

function extensionToSuffix(extension) {
  if (!extension.startsWith(".")) return null;
  return extension.slice(1).toLowerCase();
}

function canUseFileNamePattern(pattern) {
  return !/[{[\\*?]/.test(pattern);
}

function readLanguageAssociations() {
  const associations = new Map();

  for (const root of languageContributionRoots) {
    for (const packageJsonPath of readPackageJsonFiles(root)) {
      let packageJson;
      try {
        packageJson = readJson(packageJsonPath);
      } catch {
        continue;
      }

      for (const language of packageJson.contributes?.languages ?? []) {
        const id = language.id;
        if (!id) continue;

        const association = associations.get(id) ?? {
          suffixes: new Set(),
          stems: new Set(),
        };

        for (const extension of language.extensions ?? []) {
          const suffix = extensionToSuffix(extension);
          if (suffix) association.suffixes.add(suffix);
        }

        for (const fileName of language.filenames ?? []) {
          association.stems.add(fileName);
        }

        for (const pattern of language.filenamePatterns ?? []) {
          if (canUseFileNamePattern(pattern)) association.stems.add(pattern);
        }

        associations.set(id, association);
      }
    }
  }

  return associations;
}

const sourceTheme = readJson(sourceThemePath);
const fontBuffer = fs.readFileSync(sourceFontPath);
const font = opentype.parse(fontBuffer.buffer.slice(0));
const languageAssociations = readLanguageAssociations();

fs.rmSync(outputIconsDir, { recursive: true, force: true });
fs.mkdirSync(outputIconsDir, { recursive: true });
fs.mkdirSync(path.dirname(outputThemePath), { recursive: true });

const fileIcons = {};
let generatedIconCount = 0;

for (const [vsCodeKey, definition] of Object.entries(
  sourceTheme.iconDefinitions,
)) {
  const key = iconKey(vsCodeKey);
  const fileName = `${key}.svg`;
  const codepoint = fontCharacterToCodepoint(definition.fontCharacter);
  const glyph = font.charToGlyph(String.fromCodePoint(codepoint));

  if (!glyph || glyph.index === 0) {
    throw new Error(
      `Missing glyph for ${vsCodeKey} (${definition.fontCharacter})`,
    );
  }

  writeSvgIcon(
    path.join(outputIconsDir, fileName),
    glyphToSvg(font, glyph, definition.fontColor ?? "#D4D7D6"),
  );

  fileIcons[key] = { path: svgPath(fileName) };
  generatedIconCount += 1;
}

writeUtilityIcons();

fileIcons.default = fileIcons[iconKey(sourceTheme.file)];

const fileSuffixes = {};
for (const [suffix, key] of Object.entries(sourceTheme.fileExtensions ?? {})) {
  fileSuffixes[suffix.toLowerCase()] = iconKey(key);
}

const fileStems = {};
for (const [fileName, key] of Object.entries(sourceTheme.fileNames ?? {})) {
  fileStems[fileName] = iconKey(key);
}

for (const [languageId, key] of Object.entries(sourceTheme.languageIds ?? {})) {
  const association = languageAssociations.get(languageId);
  if (!association) continue;

  for (const suffix of association.suffixes) {
    fileSuffixes[suffix] ??= iconKey(key);
  }

  for (const stem of association.stems) {
    fileStems[stem] ??= iconKey(key);
  }
}

const copiedImbaIcon = copyImbaIcon(fileIcons, fileSuffixes);

const iconTheme = {
  $schema: "https://zed.dev/schema/icon_themes/v0.3.0.json",
  name: "Negative Seti Icons",
  author: "Jesse Weed, Microsoft, ported by Heap Void",
  themes: [
    {
      name: "Negative Seti Icons",
      appearance: "dark",
      directory_icons: {
        collapsed: svgPath("folder.svg"),
        expanded: svgPath("folder-open.svg"),
      },
      chevron_icons: {
        collapsed: svgPath("chevron-right.svg"),
        expanded: svgPath("chevron-down.svg"),
      },
      file_stems: fileStems,
      file_suffixes: fileSuffixes,
      file_icons: fileIcons,
    },
  ],
};

fs.writeFileSync(outputThemePath, `${JSON.stringify(iconTheme, null, 2)}\n`);

console.log(`Converted ${sourceThemePath}`);
console.log(`Generated ${generatedIconCount} Seti SVG icons`);
if (copiedImbaIcon) console.log(`Copied ${defaultImbaIcon}`);
console.log(`Wrote ${outputThemePath}`);
