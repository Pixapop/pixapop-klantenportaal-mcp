# Pixapop Klantenportaal MCP (legacy local client)

**Productiestandaard:** remote MCP op het portaal zelf.

In Cursor:

```json
{
  "mcpServers": {
    "klantenportaal": {
      "url": "https://portaal.jouwdomein.be/mcp",
      "headers": {
        "Authorization": "Bearer 1|jouw-token",
        "X-Organization-Id": "3"
      }
    }
  }
}
```

Token + JSON komen uit **Instellingen → Integraties → Cursor MCP** op jouw portaal.
Deze Node-repo is alleen nog legacy/offline.