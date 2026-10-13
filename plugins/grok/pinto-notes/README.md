# Pinto Notes plugin for Grok Build

Adds the [Pinto Notes](https://pintonotes.com) MCP server to Grok Build, with a skill that tells Grok how the notes are laid out and how to edit them safely.

In Grok Build, open `/plugins` and install Pinto Notes from the xAI marketplace, or install it straight from this repo:

```sh
grok plugin install "pinto-notes/pinto-notes#plugins/grok/pinto-notes"
```

Then start `grok`, run `/mcps`, select `pinto-notes` and press `i` to sign in. Your browser opens pintonotes.com/connect, where you approve Grok Build with read and edit, or read only access. You need the free Pinto Notes app (pintonotes.com/download) and an account.

Prefer to skip the plugin? Add the server on its own:

```sh
grok mcp add --transport http pinto-notes https://mcp.pintonotes.com
```

## What it contains

- `.mcp.json`: one remote MCP server, `pinto-notes`, at `https://mcp.pintonotes.com` (streamable HTTP).
- `skills/pinto-notes/SKILL.md`: how the notes are laid out and how to edit them safely.

No hooks, commands, agents or local processes.

## Network and credentials

- The plugin talks to one address: `https://mcp.pintonotes.com`, the Pinto Notes MCP server.
- Sign-in is OAuth 2.1 with dynamic client registration and PKCE (S256). Grok Build registers itself, opens pintonotes.com/connect in your browser, and receives the token on a loopback address on your computer. The plugin holds no keys, and you can remove the connection any time in Pinto Notes, Settings, Connect an AI.
- Scopes: `notes:read`, and `notes:write` if you choose Read and Edit.

## License

MIT. Source: https://github.com/pinto-notes/pinto-notes
