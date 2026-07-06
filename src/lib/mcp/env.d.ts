// Ambient declaration so MCP tool files (bundled into a Deno Edge Function
// at build time) can reference `process.env` without pulling in @types/node.
declare const process: { env: Record<string, string | undefined> };
