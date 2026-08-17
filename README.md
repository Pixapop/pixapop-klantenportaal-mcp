# Pixapop Klantenportaal MCP (Cursor)

Lokale stdio-MCP voor Cursor. Praat met `/api/admin/v1/*` via jouw Sanctum-token.

## Vereisten

- Node.js 18+
- Token uit het portaal: **Instellingen → Integraties → Cursor MCP**

## Installatie (partner)

1. Download de ZIP uit het portaal (of ontvang hem van Pixapop).
2. Pak uit naar bv. `C:\Users\JouwNaam\pixapop-klantenportaal-mcp`
3. Open die map in een terminal en run:

```bash
npm install
```

4. In Cursor → Settings → MCP, plak de JSON uit het portaal.
5. Vervang in `args` het pad door **jouw echte pad** naar `index.js` (niet `PAD/NAAR/...`).
6. Zet je token in `KLANTENPORTAAL_TOKEN`.
7. Herlaad MCP in Cursor.

### Voorbeeld Windows

```json
{
  "mcpServers": {
    "klantenportaal": {
      "command": "node",
      "args": [
        "C:/Users/Frederik/pixapop-klantenportaal-mcp/index.js"
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

Gebruik forward slashes `/` in het pad, ook op Windows.
