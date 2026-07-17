# perky — CLI Workspace Launcher & AI Assistant

perky is a CLI that combines workspace automation and AI assistance for developers. It lets you name projects, start services, open tools, and ask or explain code using AI providers (Gemini, OpenAI, Ollama).

Status: Active development — core commands implemented and tested.

**Highlights (recent updates):**
- New `perky start` orchestration improvements: better concurrent service handling and detached mode.
- `perky summarize` now saves local JSON summaries and offers optional AI insights.
- Improved AI provider abstraction and streaming support (see `src/ai/`).
- Expanded project preset config and `perky config` helpers (add/list/remove projects).

## Quick list of commands
- `perky init` — interactive setup for AI provider, model, editor, and optional project registration
- `perky ask` — AI Q&A (supports streaming and clipboard copy)
- `perky explain` — AI file explanations with `--detail` and `--section`
- `perky summarize` — summarize logs; outputs JSON summary and optional AI insights
- `perky time` — show local time (`--live` for continuous update)
- `perky open` — open editor, browser URLs, file explorer, terminal
- `perky app <name>` — open an installed app (alias: `perky <app>`)
- `perky start` — start configured services (attached or detached)
- `perky go` — normalize/open/copy/print URLs quickly
- `perky shutdown` / `perky restart` — system power actions (`--delay` available)
- `perky update` — update perky to latest published version
- `perky config` — set/get/list/add-project/remove-project/edit global config

## Install

Using npm (published package name: `perky`):

```bash
npm i perky
# or
npm i -g perky
```

Local development:

```bash
git clone https://github.com/ArushKhasru/perky.git
cd perky
npm install
npm link
```

Run:

```bash
perky --help
# or
node cli.js --help
```

## Configuration

Global config: `~/.perky/config.json` — stores AI defaults and project presets.
Project-local config: `.perky.json` in project root.

Environment variables supported:
- `GEMINI_API_KEY`
- `OPENAI_API_KEY`

`perky init` can persist keys into a local `.env` file.

Example global config structure is in `config/defaults.json`.

## AI Providers

Supported providers:
- Gemini — uses `GEMINI_API_KEY`
- OpenAI — uses `OPENAI_API_KEY`
- Ollama — local server at `http://localhost:11434`

AI behavior and prompt templates are in `src/ai/prompt.js` and provider adapters in `src/ai/provider.js`.

## Project presets

Register projects with `perky config add-project <name> --path <path>` and include optional `editor`, `browser`, and `services` entries so `perky start` and `perky open` work seamlessly.

## Development & Testing

Run the test suite with:

```bash
npm test
```

Tests are under the `tests/` directory and cover `src/ai`, `src/commands`, `src/utils`, and `src/workspace`.

## Contributing

- Open issues or PRs at: https://github.com/ArushKhasru/perky
- Follow repo coding conventions (ESM, minimal changes, focused PRs)

## License

ISC
