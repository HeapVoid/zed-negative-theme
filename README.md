# Negative Theme for Zed

This is a Zed port of the VS Code [Negative Theme](https://github.com/joaom00/negative-theme), plus a Seti-based icon theme matching VS Code's default file icons.

## Install Locally

Open Zed and run `zed: install dev extension`, then select this repository:

```text
/Users/fedor/Projects/modules/zed-negative-theme
```

After installing or reloading the dev extension:

- Open the theme selector with `theme selector: toggle` and pick `Negative Theme`.
- Open the icon theme selector with `icon theme selector: toggle` and pick `Negative Seti Icons`.

For a direct local-theme install, copy `themes/negative-theme.json` into `~/.config/zed/themes/`.

## Regenerate

The theme is generated from the installed VS Code extension:

```sh
npm run build:theme
```

To use another source file:

```sh
node scripts/convert-negative-theme.mjs /path/to/vscode-theme.json
```

The icon theme is generated from VS Code's built-in Seti icon theme:

```sh
npm install
npm run build:icons
```

## Porting Notes

Zed themes are theme-family JSON files under `themes/`, referenced by an `extension.toml` manifest. Syntax colors use Zed's Tree-sitter capture names (`keyword`, `string`, `function`, `property`, `variable.parameter`, and so on), so TextMate scopes from VS Code must be mapped rather than copied literally.

The Imba Zed extension maps its custom semantic token types through syntax scopes such as `imba.class.field`, `imba.tag.field`, and `imba.tag.attribute`; this theme colors those separately from generic `property` and `attribute`.

Zed icon themes are separate JSON files under `icon_themes/`. VS Code's Seti theme uses an icon font, so `scripts/convert-seti-icons.mjs` converts each glyph into a standalone SVG and maps VS Code file/language associations to Zed file suffixes and stems.
