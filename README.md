# internship-agents

A Claude Code plugin that goes from "what internship do I want" to a **Gmail draft
ready for you to review**. It finds a matching posting, finds a source-verified hiring
email, tailors cover letter in your voice, and drafts a personable intro email with
your CV attached.

**It never sends anything.** You will review every draft and press send yourself.

## How it works
`/internship-apply` runs a head agent that calls four sandboxed subagents, strictly in order:

| # | Subagent | Does only this | Tools | Writes |
|---|---|---|---|---|
| 1 | `internship-finder` | Finds one live posting that meets your MUST requirements, with quoted evidence | web | `01-internship.md` |
| 2 | `email-finder` | Finds a hiring email that appears verbatim on an official page. Never guessed | web | `02-contact.md` |
| 3 | `cover-letter-writer` | Drafts a tailored letter in your tone, using only facts from your CV | files only | `03-cover-letter.md` |
| 4 | `email-drafter` | Saves an intro email as a Gmail **draft** | files + Gmail draft | `04-email.md` |

The head agent copies your CV into the run folder, passes it to the drafter as an attachment,
writes `00-SUMMARY.md`, and logs the run in `applications/tracker.csv` so companies aren't repeated.

## Install
```
/plugin marketplace add ctrain2006/internship-agents
/plugin install internship-agents@internship-agents
```

## Setup
1. Make a folder for your job search and start Claude Code in it.
2. Run `/internship-apply`. On the first run it creates `internship-profile.md` and `cv/`.
3. Put your CV in `cv/` (PDF, .md, or .txt) and fill every `TODO` in `internship-profile.md`
   (requirements, tone, and banned phrases).
4. Connect Gmail: run `/mcp`, or connect Gmail under claude.ai → Settings → Connectors.
   You can also set `Gmail mode: dry-run` to skip Gmail and get the email as a file.
5. Run `/internship-apply` again.

Your data stays in your folder:
```
my-job-search/
├── internship-profile.md
├── cv/Jane_Doe_CV.pdf
└── applications/
    ├── tracker.csv
    └── 2026-10-01-acme/  00-SUMMARY.md … 04-email.md, CV copy
```

## Requirements
- Claude Code with plugin support, plus a Claude plan or API key. Each run uses web
  search and several agents, so it costs tokens.
- Node.js (already installed with Claude Code), used by the safety hook.
- A Gmail MCP connection, unless you use dry-run mode. If your Gmail tool can't add
  attachments, the draft starts with `[ATTACH BEFORE SENDING: CV + cover letter]`.

## Safety design
- **Drafts only, enforced in code.** `hooks/block-mail-send.js` runs before every MCP call.
  In a folder containing `internship-profile.md`, it **blocks every mail tool by default**
  and allows only draft creation and read-only lookups. Send, reply, forward, schedule,
  delete, and label tools are always denied. Outside those folders it does nothing, so your
  other projects aren't affected.
- **Separated roles.** The agents that read the web can't touch Gmail, and the agent that
  touches Gmail can't read the web. A malicious job page can't directly trigger email
  actions. Please keep this separation when you contribute.
- **No guessed or scraped contacts.** Emails must appear verbatim on a public, official page.
  LinkedIn isn't scraped.
- **No spam.** A run is capped at 5 internships, whatever the profile says.

## Disclaimer
AI can misread postings, and contact details go stale. **Review every draft before
sending.** You're responsible for your outreach and for following local privacy and
anti-spam laws. The authors aren't affiliated with any employer or job board.

## Development
```
node --test tests/                  # safety hook tests
claude plugin validate .            # manifest check
claude --plugin-dir .               # try it locally without installing
```

MIT licensed. See [LICENSE](LICENSE).
