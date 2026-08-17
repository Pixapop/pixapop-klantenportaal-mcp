#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE_URL = (process.env.KLANTENPORTAAL_BASE_URL || "").replace(/\/$/, "");
const TOKEN = process.env.KLANTENPORTAAL_TOKEN || "";
const ORG_ID = process.env.KLANTENPORTAAL_ORG_ID || "";

if (!BASE_URL || !TOKEN) {
  console.error(
    "Missing KLANTENPORTAAL_BASE_URL or KLANTENPORTAAL_TOKEN environment variables.",
  );
  process.exit(1);
}

/**
 * @param {string} path
 * @param {{ method?: string, query?: Record<string, unknown>, body?: unknown }} [opts]
 */
async function api(path, opts = {}) {
  const method = opts.method || "GET";
  const url = new URL(`${BASE_URL}/api/admin/v1${path}`);
  if (opts.query) {
    for (const [key, value] of Object.entries(opts.query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  /** @type {Record<string, string>} */
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${TOKEN}`,
  };
  if (ORG_ID) headers["X-Organization-Id"] = ORG_ID;

  /** @type {RequestInit} */
  const init = { method, headers };
  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(opts.body);
  }

  const res = await fetch(url, init);
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const message =
      json?.message ||
      json?.error ||
      (typeof json === "object" ? JSON.stringify(json) : text) ||
      res.statusText;
    throw new Error(`API ${res.status}: ${message}`);
  }

  return json;
}

function asText(data) {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

const server = new McpServer({
  name: "pixapop-klantenportaal",
  version: "1.0.0",
});

server.tool(
  "me",
  "Current MCP user, default organization and admin capabilities.",
  {},
  async () => asText(await api("/me")),
);

server.tool(
  "lookup_by_domain",
  "Resolve a domain or site URL to customer, website and services (cross-links for Hostinger/WP/Billit).",
  { domain: z.string().describe("Domain or URL, e.g. oxizinc.be") },
  async ({ domain }) => asText(await api("/lookup", { query: { domain } })),
);

server.tool(
  "list_customers",
  "Search/list customers in the active organization.",
  {
    search: z.string().optional(),
    status: z.string().optional(),
  },
  async ({ search, status }) =>
    asText(await api("/customers", { query: { search, status } })),
);

server.tool(
  "get_customer",
  "Get one customer with websites and services.",
  { customer_id: z.union([z.string(), z.number()]) },
  async ({ customer_id }) => asText(await api(`/customers/${customer_id}`)),
);

server.tool(
  "create_customer",
  "Create a customer. Requires company_name and status.",
  {
    company_name: z.string(),
    status: z.string().default("active"),
    billing_email: z.string().optional(),
    contact_name: z.string().optional(),
    phone: z.string().optional(),
    website: z.string().optional(),
    vat_number: z.string().optional(),
    internal_notes: z.string().optional(),
  },
  async (body) => asText(await api("/customers", { method: "POST", body })),
);

server.tool(
  "update_customer",
  "Update customer fields (same shape as create; include required company_name + status).",
  {
    customer_id: z.union([z.string(), z.number()]),
    company_name: z.string(),
    status: z.string(),
    billing_email: z.string().optional().nullable(),
    contact_name: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    website: z.string().optional().nullable(),
    vat_number: z.string().optional().nullable(),
    address_line_1: z.string().optional().nullable(),
    address_line_2: z.string().optional().nullable(),
    postal_code: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
    billit_customer_id: z.string().optional().nullable(),
    billit_contact_id: z.string().optional().nullable(),
    internal_notes: z.string().optional().nullable(),
  },
  async ({ customer_id, ...body }) =>
    asText(await api(`/customers/${customer_id}`, { method: "PATCH", body })),
);

server.tool(
  "update_customer_notes",
  "Replace internal notes on a customer.",
  {
    customer_id: z.union([z.string(), z.number()]),
    internal_notes: z.string().nullable(),
  },
  async ({ customer_id, internal_notes }) =>
    asText(
      await api(`/customers/${customer_id}/notes`, {
        method: "PATCH",
        body: { internal_notes },
      }),
    ),
);

server.tool(
  "get_support_hours",
  "Support-hour balance for a customer.",
  { customer_id: z.union([z.string(), z.number()]) },
  async ({ customer_id }) =>
    asText(await api(`/customers/${customer_id}/support-hours`)),
);

server.tool(
  "list_websites",
  "List WordPress / connector websites.",
  {
    search: z.string().optional(),
    customer_id: z.union([z.string(), z.number()]).optional(),
  },
  async ({ search, customer_id }) =>
    asText(await api("/websites", { query: { search, customer_id } })),
);

server.tool(
  "get_website",
  "Get a website by id.",
  { website_id: z.union([z.string(), z.number()]) },
  async ({ website_id }) => asText(await api(`/websites/${website_id}`)),
);

server.tool(
  "get_website_status",
  "Connector health, uptime and site-intelligence snapshot for a website.",
  { website_id: z.union([z.string(), z.number()]) },
  async ({ website_id }) =>
    asText(await api(`/websites/${website_id}/status`)),
);

server.tool(
  "create_website",
  "Attach a website to a customer (returns connector uuid/secret once).",
  {
    customer_id: z.union([z.string(), z.number()]),
    name: z.string(),
    url: z.string().url(),
    admin_url: z.string().url().optional(),
  },
  async ({ customer_id, ...body }) =>
    asText(
      await api(`/customers/${customer_id}/websites`, {
        method: "POST",
        body,
      }),
    ),
);

server.tool(
  "update_website",
  "Update website name/url/admin_url.",
  {
    customer_id: z.union([z.string(), z.number()]),
    website_id: z.union([z.string(), z.number()]),
    name: z.string(),
    url: z.string().url(),
    admin_url: z.string().url().optional().nullable(),
  },
  async ({ customer_id, website_id, ...body }) =>
    asText(
      await api(`/customers/${customer_id}/websites/${website_id}`, {
        method: "PATCH",
        body,
      }),
    ),
);

server.tool(
  "request_wp_login",
  "Create a one-click WordPress admin login URL via the connector.",
  { website_id: z.union([z.string(), z.number()]) },
  async ({ website_id }) =>
    asText(
      await api(`/websites/${website_id}/wordpress-login`, { method: "POST" }),
    ),
);

server.tool(
  "list_services",
  "List services (hosting, domain, M365, …) with external provider IDs.",
  {
    search: z.string().optional(),
    customer_id: z.union([z.string(), z.number()]).optional(),
  },
  async ({ search, customer_id }) =>
    asText(await api("/services", { query: { search, customer_id } })),
);

server.tool(
  "create_service",
  "Create a service for a customer (admin only).",
  {
    customer_id: z.union([z.string(), z.number()]),
    name: z.string(),
    type: z.string(),
    status: z.string().default("active"),
    url: z.string().optional(),
    package_name: z.string().optional(),
    monthly_price_cents: z.number().optional(),
    vat_exempt: z.boolean().default(false),
    external_provider: z.string().optional(),
    external_id: z.string().optional(),
    public_notes: z.string().optional(),
    internal_notes: z.string().optional(),
  },
  async ({ customer_id, ...body }) =>
    asText(
      await api(`/customers/${customer_id}/services`, {
        method: "POST",
        body,
      }),
    ),
);

server.tool(
  "update_service",
  "Update a service (admin only).",
  {
    service_id: z.union([z.string(), z.number()]),
    name: z.string(),
    type: z.string(),
    status: z.string(),
    url: z.string().optional().nullable(),
    package_name: z.string().optional().nullable(),
    monthly_price_cents: z.number().optional().nullable(),
    vat_exempt: z.boolean().default(false),
    external_provider: z.string().optional().nullable(),
    external_id: z.string().optional().nullable(),
    public_notes: z.string().optional().nullable(),
    internal_notes: z.string().optional().nullable(),
  },
  async ({ service_id, ...body }) =>
    asText(await api(`/services/${service_id}`, { method: "PATCH", body })),
);

server.tool(
  "list_tickets",
  "List tickets; use open_only=true for triage.",
  {
    search: z.string().optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
    customer_id: z.union([z.string(), z.number()]).optional(),
    open_only: z.boolean().optional(),
  },
  async (query) => asText(await api("/tickets", { query })),
);

server.tool(
  "get_ticket",
  "Ticket detail including messages.",
  { ticket_id: z.union([z.string(), z.number()]) },
  async ({ ticket_id }) => asText(await api(`/tickets/${ticket_id}`)),
);

server.tool(
  "create_ticket",
  "Create a ticket for a customer.",
  {
    customer_id: z.union([z.string(), z.number()]),
    title: z.string(),
    description: z.string(),
    priority: z.string().default("normal"),
    service_id: z.union([z.string(), z.number()]).optional(),
    status: z.string().optional(),
    customer_visible: z.boolean().optional(),
    requires_support_hours: z.boolean().optional(),
  },
  async (body) => asText(await api("/tickets", { method: "POST", body })),
);

server.tool(
  "add_ticket_message",
  "Add a message to a ticket (optionally internal).",
  {
    ticket_id: z.union([z.string(), z.number()]),
    message: z.string(),
    is_internal: z.boolean().optional(),
  },
  async ({ ticket_id, message, is_internal }) =>
    asText(
      await api(`/tickets/${ticket_id}/messages`, {
        method: "POST",
        body: { message, is_internal: is_internal ?? false },
      }),
    ),
);

server.tool(
  "update_ticket_status",
  "Update ticket status (new, in_progress, waiting_for_customer, waiting_for_admin, completed, closed, cancelled).",
  {
    ticket_id: z.union([z.string(), z.number()]),
    status: z.string(),
  },
  async ({ ticket_id, status }) =>
    asText(
      await api(`/tickets/${ticket_id}/status`, {
        method: "PATCH",
        body: { status },
      }),
    ),
);

server.tool(
  "get_active_timer",
  "Active timer for the MCP user, if any.",
  {},
  async () => asText(await api("/timers/active")),
);

server.tool(
  "start_timer",
  "Start a timer for a customer (optional service/ticket).",
  {
    customer_id: z.union([z.string(), z.number()]),
    service_id: z.union([z.string(), z.number()]).optional(),
    ticket_id: z.union([z.string(), z.number()]).optional(),
    customer_question: z.string().optional(),
  },
  async (body) => asText(await api("/timers/start", { method: "POST", body })),
);

server.tool(
  "pause_timer",
  "Pause a running timer.",
  { timer_id: z.union([z.string(), z.number()]) },
  async ({ timer_id }) =>
    asText(await api(`/timers/${timer_id}/pause`, { method: "POST" })),
);

server.tool(
  "resume_timer",
  "Resume a paused timer.",
  { timer_id: z.union([z.string(), z.number()]) },
  async ({ timer_id }) =>
    asText(await api(`/timers/${timer_id}/resume`, { method: "POST" })),
);

server.tool(
  "create_time_entry",
  "Log a manual time entry (billable_minutes required; question and/or solution).",
  {
    customer_id: z.union([z.string(), z.number()]),
    billable_minutes: z.number().int().positive(),
    customer_question: z.string().optional(),
    solution: z.string().optional(),
    service_id: z.union([z.string(), z.number()]).optional(),
    ticket_id: z.union([z.string(), z.number()]).optional(),
    is_billable: z.boolean().optional(),
    deduct_from_support_hours: z.boolean().optional(),
    customer_visible: z.boolean().optional(),
  },
  async ({ customer_id, ...body }) =>
    asText(
      await api(`/customers/${customer_id}/time-entries`, {
        method: "POST",
        body,
      }),
    ),
);

const transport = new StdioServerTransport();
await server.connect(transport);
