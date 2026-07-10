# open.video MCP

Remote MCP server for [open.video](https://open.video) — video upload, channels,
playlists, analytics, and monetization.

This repo is wired for it in [`.claude/settings.json`](../.claude/settings.json):
the `open-video` server (remote, URL type) and the `open-video-upload` helper
(local uploads). Restart Claude Code after cloning so both entries load.

## Install

### Cursor / Claude Code / Windsurf (url type)

```json
{ "mcpServers": { "open-video": { "url": "https://mcp.open.video/mcp" } } }
```

### Claude Desktop (Custom Connector)

Settings → Connectors → Add custom connector → URL: `https://mcp.open.video`

### Claude Desktop (mcp-remote fallback)

Use if Custom Connectors is unavailable. Requires Node.js.

```json
{ "mcpServers": { "open-video": { "command": "npx", "args": ["-y", "mcp-remote", "https://mcp.open.video/mcp"] } } }
```

## Auth

OAuth is automatic for Custom Connectors. For other clients, call
`openvideo_register(email)` to start sign-in — a browser opens, enter the
emailed code.

## Local file uploads

Local file uploads require the Upload Helper:

- **Claude Desktop**: install the [Upload Helper extension](https://mcp.open.video/extension)
  (double-click the `.mcpb` file)
- **Cursor / Windsurf / Claude Code**: add a second MCP entry (already present in
  this repo's `.claude/settings.json` as `open-video-upload`):

```json
{ "mcpServers": { "open-video-upload": { "command": "npx", "args": ["-y", "open-video-upload-helper"] } } }
```

URL uploads (`sourceUrl`) do not need the Upload Helper.

## Verify

Call `list_channels` to confirm auth is working.
