#!/usr/bin/env node
// PreToolUse guard for the internship-agents plugin.
//
// Active only inside a workspace containing internship-profile.md (in the session
// cwd or any parent), so it never interferes with the user's other projects.
// Within that workspace, any mail-related MCP tool is BLOCKED BY DEFAULT. The only
// allowed calls are draft creation/update and read-only lookups. Sending, replying,
// forwarding, scheduling, deleting and labelling are always denied.

const fs = require('fs');
const path = require('path');

const MAIL_SERVER = /gmail|mail|outlook|google_?workspace|gws/;
const FORBIDDEN = /send|reply|forward|schedule|deliver|dispatch|delete|trash|remove|archive|label|modify|move|filter|submit|post/;
const DRAFT_WRITE = /draft/;
const DRAFT_VERB = /create|new|save|compose|update/;
const READ_ONLY = /^(get|list|search|read|fetch|find|query)/;

function inPipelineWorkspace(cwd) {
  let dir = path.resolve(cwd || process.cwd());
  while (true) {
    if (fs.existsSync(path.join(dir, 'internship-profile.md'))) return true;
    const parent = path.dirname(dir);
    if (parent === dir) return false;
    dir = parent;
  }
}

// Returns null when the call is allowed, otherwise the reason it is blocked.
function decide(toolName, cwd) {
  const name = String(toolName || '').toLowerCase();
  if (!name.startsWith('mcp__')) return null;
  if (!inPipelineWorkspace(cwd)) return null;

  const parts = name.split('__');
  const server = parts.slice(1, -1).join('__');
  const op = parts[parts.length - 1];
  const isMail = MAIL_SERVER.test(server) || /mail/.test(op);
  if (!isMail) return null;

  if (FORBIDDEN.test(op)) return `'${toolName}' could send or alter mail`;
  if (DRAFT_WRITE.test(op) && DRAFT_VERB.test(op)) return null;
  if (READ_ONLY.test(op)) return null;
  return `'${toolName}' is not a recognised draft-only or read-only mail tool`;
}

module.exports = { decide };

if (require.main === module) {
  let raw = '';
  process.stdin.on('data', (c) => (raw += c));
  process.stdin.on('end', () => {
    let input = {};
    try { input = JSON.parse(raw || '{}'); } catch { /* malformed input: allow */ }
    const reason = decide(input.tool_name, input.cwd);
    if (reason) {
      process.stderr.write(
        `BLOCKED by internship-agents: ${reason}. This workspace only allows creating Gmail drafts. Nothing is ever sent.\n`
      );
      process.exit(2);
    }
    process.exit(0);
  });
}
