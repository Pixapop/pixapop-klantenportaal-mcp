# Pixapop Klantenportaal MCP (Cursor)

Stdio-MCP voor Cursor. Praat met `/api/admin/v1/*` via jouw Sanctum-token.

## Vereisten

- Node.js 18+
- Token uit het portaal: **Instellingen → Integraties → Cursor MCP**

## Setup (geen lokale map)

In Cursor → Settings → MCP (of `~/.cursor/mcp.json`), plak:

```json
{
  "mcpServers": {
    "klantenportaal": {
      "command": "npx",
      "args": [
        "-y",
        "github:Pixapop/pixapop-klantenportaal-mcp"
      ],
      "env": {
        "KLANTENPORTAAL_BASE_URL": "https://portaal.jouwdomein.be",
        "KLANTENPORTAAL_TOKEN": "1|jouw-token",
        "KLANTENPORTAAL_ORG_ID": "3"
      }
    }
  }
}
```

`npx` haalt het pakket automatisch op. Geen ZIP, geen `npm install`, geen pad naar `index.js`.

Bron: https://github.com/Pixapop/pixapop-klantenportaal-mcp
