#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const defaultSource =
  "/Users/fedor/.vscode/extensions/negative.negative-theme-2.1.3/themes/negative-theme-color-theme.json";

const sourcePath = process.argv[2] ?? defaultSource;
const outputPath = path.join(root, "themes", "negative-theme.json");

function stripJsonComments(input) {
  let output = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (inString) {
      output += char;
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      output += char;
      continue;
    }

    if (char === "/" && next === "/") {
      while (i < input.length && input[i] !== "\n") i += 1;
      output += "\n";
      continue;
    }

    if (char === "/" && next === "*") {
      i += 2;
      while (i < input.length && !(input[i] === "*" && input[i + 1] === "/"))
        i += 1;
      i += 1;
      continue;
    }

    output += char;
  }

  return output;
}

function stripTrailingCommas(input) {
  let output = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if (inString) {
      output += char;
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      output += char;
      continue;
    }

    if (char === ",") {
      let j = i + 1;
      while (/\s/.test(input[j])) j += 1;
      if (input[j] === "}" || input[j] === "]") continue;
    }

    output += char;
  }

  return output;
}

function parseJsonc(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  return JSON.parse(stripTrailingCommas(stripJsonComments(source)));
}

function color(theme, key, fallback) {
  return theme.colors?.[key] ?? fallback;
}

function token(theme, scope, fallback = null) {
  for (const rule of theme.tokenColors) {
    const scopes = Array.isArray(rule.scope) ? rule.scope : [rule.scope];
    if (scopes.includes(scope)) {
      return rule.settings.foreground ?? fallback;
    }
  }
  return fallback;
}

function tokenFontStyle(theme, scope) {
  for (const rule of theme.tokenColors) {
    const scopes = Array.isArray(rule.scope) ? rule.scope : [rule.scope];
    if (scopes.includes(scope)) return rule.settings.fontStyle ?? "";
  }
  return "";
}

function style(colorValue, fontStyle = null, fontWeight = null) {
  return {
    color: colorValue,
    font_style: fontStyle,
    font_weight: fontWeight,
  };
}

function italic(colorValue) {
  return style(colorValue, "italic");
}

const sourceTheme = parseJsonc(sourcePath);

const c = (key, fallback) => color(sourceTheme, key, fallback);
const t = (scope, fallback) => token(sourceTheme, scope, fallback);

const palette = {
  app: c("sideBar.background", "#090B10"),
  editor: c("editor.background", "#0F111A"),
  input: c("input.background", "#1A1C25"),
  border: c("panel.border", "#00000060"),
  borderVariant: c("editorHoverWidget.border", "#FFFFFF10"),
  focus: c("tab.activeBorder", "#80CBC4"),
  accent: c("textLink.foreground", "#80CBC4"),
  cursor: c("editorCursor.foreground", "#FFCC00"),
  selection: c("editor.selectionBackground", "#717CB450"),
  text: c("editor.foreground", "#8F93A2"),
  activeText: c("tab.activeForeground", "#FFFFFF"),
  muted: c("tab.inactiveForeground", "#4B526D"),
  placeholder: c("input.placeholderForeground", "#8F93A260"),
  lineNumber: c("editorLineNumber.foreground", "#3B3F5180"),
  activeLineNumber: c("editorLineNumber.activeForeground", "#4B526D"),
  activeLine: c("editor.lineHighlightBackground", "#00000050"),
  indent: c("editorIndentGuide.background", "#3B3F5170"),
  indentActive: c("editorIndentGuide.activeBackground", "#3B3F51"),
  comment: t("comment", "#888899"),
  function: t("entity.name.function", "#FFDD44"),
  keyword: t("keyword", "#88BBFF"),
  string: t("string", "#88CC44"),
  support: t("entity.name.tag", "#BBA0FF"),
  property: t("variable.other.property", "#BBBBCC"),
  imbaMember: t("entity.name.tag", "#BBA0FF"),
  punctuation: t("punctuation", "#9999AA"),
  primary: t("source", "#FFFFFF"),
  error: c("editorError.foreground", "#FF537070").replace(/70$/i, ""),
  warning: c("editorWarning.foreground", "#FFCB6B70").replace(/70$/i, ""),
  info: c("editorInfo.foreground", "#82AAFF70").replace(/70$/i, ""),
  success: c("gitDecoration.untrackedResourceForeground", "#C3E88D90").replace(
    /90$/i,
    "",
  ),
};

const commentStyle = tokenFontStyle(sourceTheme, "comment").includes("italic")
  ? italic(palette.comment)
  : style(palette.comment);

const theme = {
  $schema: "https://zed.dev/schema/themes/v0.2.0.json",
  name: "Negative Theme",
  author: "Joao Pedro, ported by Heap Void",
  themes: [
    {
      name: "Negative Theme",
      appearance: "dark",
      style: {
        "background.appearance": "opaque",
        background: palette.app,
        "surface.background": palette.app,
        "elevated_surface.background": c("dropdown.background", palette.editor),
        "panel.background": c("panel.background", palette.app),
        "status_bar.background": c("statusBar.background", palette.app),
        "title_bar.background": c("titleBar.activeBackground", palette.app),
        "title_bar.inactive_background": c(
          "titleBar.inactiveBackground",
          palette.app,
        ),
        "toolbar.background": c("editorWidget.background", palette.app),
        "tab_bar.background": c(
          "editorGroupHeader.tabsBackground",
          palette.editor,
        ),
        "tab.active_background": palette.editor,
        "tab.inactive_background": c("tab.inactiveBackground", palette.editor),
        border: palette.border,
        "border.variant": palette.borderVariant,
        "border.focused": palette.focus,
        "border.selected": palette.focus,
        "border.transparent": c("focusBorder", "#FFFFFF00"),
        "border.disabled": palette.muted,
        "pane_group.border": c("editorGroup.border", palette.border),
        "pane.focused_border": palette.focus,
        "panel.focused_border": palette.focus,
        "panel.indent_guide": palette.indent,
        "panel.indent_guide_active": palette.indentActive,
        "panel.indent_guide_hover": palette.focus,
        "element.background": palette.input,
        "element.hover": c("list.hoverBackground", palette.editor),
        "element.active": c("list.activeSelectionBackground", palette.editor),
        "element.selected": c("list.focusBackground", "#8F93A220"),
        "element.disabled": palette.app,
        "ghost_element.background": "#00000000",
        "ghost_element.hover": c("statusBarItem.hoverBackground", "#464B5D20"),
        "ghost_element.active": c(
          "list.activeSelectionBackground",
          palette.editor,
        ),
        "ghost_element.selected": c("list.focusBackground", "#8F93A220"),
        "ghost_element.disabled": "#00000000",
        "drop_target.background": c("panel.dropBackground", "#8F93A2"),
        text: palette.text,
        "text.muted": palette.muted,
        "text.placeholder": palette.placeholder,
        "text.disabled": palette.muted,
        "text.accent": palette.accent,
        icon: palette.text,
        "icon.muted": palette.muted,
        "icon.placeholder": palette.placeholder,
        "icon.disabled": palette.muted,
        "icon.accent": palette.accent,
        "link_text.hover": c("textLink.activeForeground", "#8F93A2"),
        "scrollbar.thumb.background": c(
          "scrollbarSlider.background",
          "#8F93A220",
        ),
        "scrollbar.thumb.hover_background": c(
          "scrollbarSlider.hoverBackground",
          "#8F93A210",
        ),
        "scrollbar.thumb.border": "#00000000",
        "scrollbar.track.background": "#00000000",
        "scrollbar.track.border": "#00000000",
        "search.match_background": c(
          "editor.selectionHighlightBackground",
          "#FFCC0020",
        ),
        "editor.background": palette.editor,
        "editor.foreground": palette.text,
        "editor.gutter.background": palette.editor,
        "editor.subheader.background": palette.app,
        "editor.active_line.background": palette.activeLine,
        "editor.highlighted_line.background": c(
          "editor.findMatchHighlightBackground",
          "#00000050",
        ),
        "editor.line_number": palette.lineNumber,
        "editor.active_line_number": palette.activeLineNumber,
        "editor.invisible": c("editorWhitespace.foreground", "#8F93A240"),
        "editor.wrap_guide": c("editorRuler.foreground", "#3B3F51"),
        "editor.active_wrap_guide": palette.focus,
        "editor.indent_guide": palette.indent,
        "editor.indent_guide_active": palette.indentActive,
        "editor.document_highlight.bracket_background": c(
          "editorBracketMatch.background",
          palette.editor,
        ),
        "editor.document_highlight.read_background": c(
          "editor.selectionHighlightBackground",
          "#FFCC0020",
        ),
        "editor.document_highlight.write_background": c(
          "editor.findMatchHighlightBackground",
          "#00000050",
        ),
        "terminal.background": palette.editor,
        "terminal.foreground": palette.primary,
        "terminal.bright_foreground": palette.activeText,
        "terminal.dim_foreground": palette.muted,
        "terminal.ansi.background": palette.editor,
        "terminal.ansi.black": c("terminal.ansiBlack", "#333333"),
        "terminal.ansi.red": c("terminal.ansiRed", palette.keyword),
        "terminal.ansi.green": c("terminal.ansiGreen", palette.function),
        "terminal.ansi.yellow": c("terminal.ansiYellow", palette.string),
        "terminal.ansi.blue": c("terminal.ansiBlue", palette.keyword),
        "terminal.ansi.magenta": c("terminal.ansiMagenta", palette.keyword),
        "terminal.ansi.cyan": c("terminal.ansiCyan", palette.support),
        "terminal.ansi.white": c("terminal.ansiWhite", palette.activeText),
        "terminal.ansi.bright_black": c("terminal.ansiBrightBlack", "#666666"),
        "terminal.ansi.bright_red": c(
          "terminal.ansiBrightRed",
          palette.keyword,
        ),
        "terminal.ansi.bright_green": c(
          "terminal.ansiBrightGreen",
          palette.function,
        ),
        "terminal.ansi.bright_yellow": c(
          "terminal.ansiBrightYellow",
          palette.string,
        ),
        "terminal.ansi.bright_blue": c(
          "terminal.ansiBrightBlue",
          palette.keyword,
        ),
        "terminal.ansi.bright_magenta": c(
          "terminal.ansiBrightMagenta",
          palette.keyword,
        ),
        "terminal.ansi.bright_cyan": c(
          "terminal.ansiBrightCyan",
          palette.support,
        ),
        "terminal.ansi.bright_white": c(
          "terminal.ansiBrightWhite",
          palette.activeText,
        ),
        "terminal.ansi.dim_black": "#222222",
        "terminal.ansi.dim_red": "#4C5F86",
        "terminal.ansi.dim_green": "#9B882D",
        "terminal.ansi.dim_yellow": "#5F8D2F",
        "terminal.ansi.dim_blue": "#4C5F86",
        "terminal.ansi.dim_magenta": "#4C5F86",
        "terminal.ansi.dim_cyan": "#6F6098",
        "terminal.ansi.dim_white": palette.text,
        conflict: c(
          "gitDecoration.conflictingResourceForeground",
          "#FFCB6B90",
        ).replace(/90$/i, ""),
        "conflict.background": "#FFCB6B20",
        "conflict.border": "#FFCB6B50",
        created: palette.success,
        "created.background": c(
          "diffEditor.insertedTextBackground",
          "#C3E88D15",
        ),
        "created.border": "#C3E88D50",
        deleted: c(
          "gitDecoration.deletedResourceForeground",
          "#FF537090",
        ).replace(/90$/i, ""),
        "deleted.background": c(
          "diffEditor.removedTextBackground",
          "#FF537020",
        ),
        "deleted.border": "#FF537050",
        error: palette.error,
        "error.background": "#FF537020",
        "error.border": c("inputValidation.errorBorder", "#FF537050"),
        hidden: palette.muted,
        "hidden.background": "#4B526D20",
        "hidden.border": "#4B526D50",
        hint: palette.info,
        "hint.background": "#82AAFF20",
        "hint.border": c("inputValidation.infoBorder", "#82AAFF50"),
        ignored: c(
          "gitDecoration.ignoredResourceForeground",
          "#4B526D90",
        ).replace(/90$/i, ""),
        "ignored.background": "#4B526D20",
        "ignored.border": "#4B526D50",
        info: palette.info,
        "info.background": "#82AAFF20",
        "info.border": c("inputValidation.infoBorder", "#82AAFF50"),
        modified: c(
          "gitDecoration.modifiedResourceForeground",
          "#82AAFF90",
        ).replace(/90$/i, ""),
        "modified.background": "#82AAFF20",
        "modified.border": "#82AAFF50",
        predictive: palette.muted,
        "predictive.background": "#4B526D20",
        "predictive.border": "#4B526D50",
        renamed: palette.accent,
        "renamed.background": "#80CBC420",
        "renamed.border": "#80CBC450",
        success: palette.success,
        "success.background": c(
          "diffEditor.insertedTextBackground",
          "#C3E88D15",
        ),
        "success.border": "#C3E88D50",
        unreachable: palette.muted,
        "unreachable.background": "#4B526D20",
        "unreachable.border": "#4B526D50",
        warning: palette.warning,
        "warning.background": "#FFCB6B20",
        "warning.border": c("inputValidation.warningBorder", "#FFCB6B50"),
        accents: [
          palette.accent,
          palette.cursor,
          palette.support,
          palette.function,
          palette.string,
          palette.keyword,
          palette.success,
          palette.error,
        ],
        players: [
          {
            cursor: palette.cursor,
            background: palette.cursor,
            selection: palette.selection,
          },
          {
            cursor: palette.accent,
            background: palette.accent,
            selection: "#80CBC440",
          },
          {
            cursor: palette.support,
            background: palette.support,
            selection: "#BBA0FF40",
          },
          {
            cursor: palette.function,
            background: palette.function,
            selection: "#FFDD4440",
          },
        ],
        syntax: {
          attribute: style(palette.function),
          boolean: style(palette.keyword),
          class: style(palette.support),
          comment: commentStyle,
          "comment.documentation": commentStyle,
          "comment.doc": commentStyle,
          constant: style(palette.keyword),
          "constant.builtin": style(palette.keyword),
          constructor: style(palette.function),
          embedded: style(palette.support),
          emphasis: italic(palette.primary),
          "emphasis.strong": style(palette.primary, null, 700),
          enum: style(palette.support),
          "function.annotation": style(palette.function),
          "function.builtin": style(palette.function),
          "function.decorator": style(palette.function),
          "function.macro": style(palette.function),
          "function.method": style(palette.function),
          "function.method.builtin": style(palette.function),
          function: style(palette.function),
          hint: style(palette.info),
          "imba.class.attribute": style(palette.imbaMember),
          "imba.class.field": style(palette.imbaMember),
          "imba.class.getter": style(palette.imbaMember),
          "imba.class.property": style(palette.imbaMember),
          "imba.class.setter": style(palette.imbaMember),
          "imba.css.function": style(palette.imbaMember),
          "imba.render": style(palette.function),
          "imba.tag.attribute": style(palette.imbaMember),
          "imba.tag.field": style(palette.imbaMember),
          "imba.tag.getter": style(palette.imbaMember),
          "imba.tag.property": style(palette.imbaMember),
          "imba.tag.setter": style(palette.imbaMember),
          interface: style(palette.support),
          keyword: style(palette.keyword),
          "keyword.modifier": style(palette.keyword),
          label: style(palette.string),
          link_text: style(palette.function),
          link_uri: style(palette.string),
          module: style(palette.support),
          namespace: style(palette.support),
          number: style(palette.keyword),
          operator: style(palette.keyword),
          preproc: style(palette.keyword),
          primary: style(palette.primary),
          property: style(palette.property),
          punctuation: style(palette.punctuation),
          "punctuation.bracket": style(palette.punctuation),
          "punctuation.delimiter": style(palette.punctuation),
          "punctuation.list_marker": style(palette.keyword),
          "punctuation.markup": style(palette.keyword),
          "punctuation.special": style(palette.support),
          selector: style(palette.function),
          "selector.pseudo": italic(palette.support),
          struct: style(palette.support),
          string: style(palette.string),
          "string.doc": style(palette.string),
          "string.escape": style(palette.keyword),
          "string.regex": style(palette.keyword),
          "string.regexp": style(palette.keyword),
          "string.special": style(palette.support),
          "string.special.symbol": style(palette.string),
          tag: style(palette.function),
          "tag.definition": style(palette.function),
          "tag.doctype": style(palette.punctuation),
          "text.literal": style(palette.string),
          title: style(palette.string),
          type: style(palette.support),
          "type.builtin": italic(palette.support),
          "type.class": style(palette.support),
          "type.class.definition": style(palette.support),
          "type.definition": style(palette.support),
          "type.enum": style(palette.support),
          "type.enum.definition": style(palette.support),
          "type.enum.member": style(palette.function),
          "type.event": style(palette.support),
          "type.interface": style(palette.support),
          "type.interface.definition": style(palette.support),
          "type.parameter": italic(palette.support),
          "type.parameter.definition": italic(palette.support),
          "type.struct": style(palette.support),
          "type.struct.definition": style(palette.support),
          variable: style(palette.primary),
          "variable.builtin": style(palette.keyword),
          "variable.builtin.self": italic(palette.support),
          "variable.builtin.self.rust": italic(palette.support),
          "variable.parameter": italic(palette.primary),
          "variable.special": italic(palette.support),
          variant: style(palette.function),
          "diff.plus": style(palette.success),
          "diff.minus": style(palette.error),
        },
      },
    },
  ],
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(theme, null, 2)}\n`);
console.log(`Converted ${sourcePath}`);
console.log(`Wrote ${outputPath}`);
