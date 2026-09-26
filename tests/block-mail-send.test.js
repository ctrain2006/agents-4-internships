// Run with: node --test tests/
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { decide } = require('../hooks/block-mail-send.js');

const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'ia-ws-'));
fs.writeFileSync(path.join(ws, 'internship-profile.md'), '# test');
const nested = path.join(ws, 'applications', 'run');
fs.mkdirSync(nested, { recursive: true });
const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'ia-out-'));

const blocked = [
  'mcp__claude_ai_Gmail__send_email',
  'mcp__claude_ai_Gmail__send_draft',
  'mcp__gmail__reply_to_thread',
  'mcp__gmail__forward_message',
  'mcp__gmail__schedule_send',
  'mcp__gmail__delete_draft',
  'mcp__gmail__modify_labels',
  'mcp__outlook__create_and_send',
  'mcp__gmail__do_something_new',
];
const allowed = [
  'mcp__claude_ai_Gmail__create_draft',
  'mcp__gmail__draft_create',
  'mcp__gmail__update_draft',
  'mcp__gmail__list_drafts',
  'mcp__gmail__search_threads',
  'mcp__claude_ai_Google_Drive__search_files',
  'WebSearch',
];

for (const t of blocked) test(`blocks ${t}`, () => assert.ok(decide(t, ws)));
for (const t of allowed) test(`allows ${t}`, () => assert.strictEqual(decide(t, ws), null));
test('applies in nested folders', () => assert.ok(decide('mcp__gmail__send_email', nested)));
test('inactive outside a pipeline workspace', () =>
  assert.strictEqual(decide('mcp__gmail__send_email', outside), null));
