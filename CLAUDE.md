# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Static Jekyll site (Spanish-language, `locale: es`) for Club de Algoritmos de Sinaloa, published on GitHub Pages at algoritmos.club (see `CNAME`). It uses the remote theme `mmistakes/minimal-mistakes@4.24.0` (dark skin), so layouts/includes come from the theme; local `_includes/`, `assets/` and `_data/ui-text.yml` only override it. There is no test suite or linter.

## Commands

Ruby versions are managed via `asdf` (`.tool-versions`).

- Install deps: `bundle install`
- Serve locally: `bundle exec jekyll serve --livereload --incremental`
- One-off build (output to `_site/`): `bundle exec jekyll build`

The remote theme is fetched at build time, so builds need network access.

## Architecture

- `_config.yml` is the center of the site. Layout, TOC and sidebar are assigned through `defaults:` scopes by path (`icpc`, `icpc/resultados`, `icpc/scoreboard`, `_escuela`, `_pages`, `_posts`), so individual content files usually have no front matter. Each scope picks a sidebar nav key from `_data/navigation.yml` (`pages`, `icpc`, `icpc_results`, `icpc_scoreboard`). New sections need both a defaults scope and a nav entry.
- `_pages/` — top-level pages, served at `/:basename` (e.g. `/historia`). `_redirects/` — pages served at `/:basename` too (`registro`, `calendario`, `discord`), used for external-link redirects. Both are listed under `include:` so Jekyll processes these underscore directories.
- `icpc/` — ICPC section: `index.md`, `resultados/` (`mexico`, `tecnm`, `sinaloa`, `escuela/index`), and `scoreboard/`.
- `_escuela/` — a Jekyll collection (`escuela`, output at `/icpc/resultados/escuela/:path`), one Markdown file per school. **These are generated files, do not edit them by hand.** They and `icpc/resultados/*.md` are copied from a sibling checkout `../icpc-mexico-history` (`analysis/*.md`, `analysis/escuela/*.md`) by `_scripts/sync_icpc_history.sh`, run from the repo root. The script deletes all of `_escuela/*.md` first (so deletions sync) and prepends empty front matter (`---\n---`) so files join the collection. Fix content problems upstream in that repo.
- `icpc/scoreboard/mexico/<year>/<contest>/index.html` — saved static snapshots (with `index_files/` assets) of BOCA scoreboards from scorelatam.naquadah.com.br and similar, kept as raw HTML. Some load `/assets/js/scoreboard_replay.js` (contests with an `aumentado` subfolder are the "augmented" variants). Year folders have an `index.md` that links to them; add a link there when adding a contest snapshot.
- `content/404.html`, `assets/` (css, js, images, webfonts), and root favicon/manifest files are static assets.
- `_config.yml` `titles_from_headings` is enabled: page titles come from the first `#` heading, so pages/escuelas don't need a `title:` in front matter.
