# historia — Execution Guide

**Purpose.** How to run the phase plan with two roles (coordinator + implementer), keeping the repo as the source of truth for state.

**Companion documents:**

- [PRD.md](./PRD.md) — what we are building.
- [PHASE-PLAN.md](./PHASE-PLAN.md) — the locked 18-phase sequence (Phase 0 + 1..17).
- [HANDOFF.md](./HANDOFF.md) — ledger of completed phases.

---

## 1. Roles

### Coordinator (one long-running chat)

A single chat instance you keep open for the duration of the project. Responsibilities:

- Owns the project mental model. Reads [HANDOFF.md](./HANDOFF.md), [PHASE-PLAN.md](./PHASE-PLAN.md), and the current branch state to know what's next.
- Generates the implementer prompt for each phase.
- After each phase, **independently reviews** the implementer's PR: inspects the actual diff, re-runs the quality gates locally, compares the HANDOFF.md entry against the diff, and walks the phase's Review checklist.
- **Takes direct action on the merge.** When approved, the coordinator squash-merges the PR via the GitHub API (using the PAT embedded in the local `origin` remote URL — never echoed to chat), pulls `main`, deletes the local + remote branch, updates the [PHASE-PLAN.md status tracker](./PHASE-PLAN.md#status-tracker) and HANDOFF "Current state", commits + pushes those updates on `main`, and proceeds to the next phase prompt without round-tripping through the user. The user is only involved when a real decision (PRD ambiguity, scope expansion, blocker) needs human judgment.
- Catches drift before it compounds.

### Implementer (one fresh chat per phase)

A brand-new chat opened for each phase. Knows nothing except what's in the repo and the implementer prompt the coordinator generated. Responsibilities:

- Reads [PRD.md](./PRD.md), the relevant section of [PHASE-PLAN.md](./PHASE-PLAN.md), and the current [HANDOFF.md](./HANDOFF.md).
- Implements the phase exactly as specified. No scope expansion. No silent assumptions.
- If a clarifying question arises, asks it **before** writing code. All clarifications upfront, never mid-task.
- Runs the full quality gate (`pnpm lint && pnpm typecheck && pnpm test && pnpm build`) plus any manual smoke tests the phase requires.
- Appends a fresh entry to [HANDOFF.md](./HANDOFF.md) using the template at the bottom of that file.
- Commits, pushes the phase branch, opens a PR. Reports the PR link back to you.
- **Auto-generates the coordinator review prompt** as the final step of its turn (see §4a below) so the user can paste it directly into the coordinator chat with zero rewriting.
- Does **not** merge to `main` — coordinator owns the merge.

### Why this separation works

- The coordinator chat keeps a coherent mental model across the whole project without context bloat — it doesn't need to hold the details of every Implementation step.
- The implementer chat is cheap to start fresh and has a single small focus: one phase.
- The repo is the medium between them. No copy-paste, no transcription error, no "what did the other chat say?"
- The independent review by the coordinator is the safety net that catches a lesser-model implementer's silent drift.

---

## 2. The cycle (one phase, end to end)

For each phase from 0 to 17:

1. **Coordinator session — kick off.**
   You ask: _"What's next?"_ Coordinator reads HANDOFF.md, identifies the next phase, generates an implementer prompt using the template in §4 below.

2. **Open a fresh chat for the implementer.**
   Paste the implementer prompt. The implementer reads the repo, asks any clarifying questions upfront, then implements. It produces a feature branch, a PR, and a HANDOFF.md entry inside that branch.

3. **Implementer returns to you with a PR link** (and a one-line status: `complete` or `blocked — needs input`).

4. **Back to coordinator session — review.**
   You paste: _"Phase N is done. PR: <link>. Review."_ Coordinator:
   - Checks out the branch locally (or reads via `gh pr diff`).
   - Re-runs `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
   - Walks the phase's Success criteria + Review checklist from PHASE-PLAN.md.
   - Reads the HANDOFF.md entry and compares it to the actual diff.
   - Reports back: `approved` / `change requests`.

5. **If approved:** coordinator merges (or instructs you to merge via UI), updates the status tracker in PHASE-PLAN.md on `main`, and closes the loop.
   **If change requests:** you paste the coordinator's feedback into the implementer chat (or open a fresh fix chat); cycle repeats until approved.

6. **Repeat for the next phase.**

---

## 3. Coordinator chat — opening prompt

Paste this into the coordinator chat as your **first** message. The coordinator chat then stays open for the entire project.

```
You are the coordinator for the historia project. Your job is to track state and review work — not to implement.

Source of truth files in this repo (read them now, then keep them in mind):
1. PRD.md — locked product behavior. Cited by PRD IDs (B-005, SW-003a, HM-001, etc.).
2. PHASE-PLAN.md — the 18-phase implementation plan (Phase 0 + Phase 1..17). Includes cross-cutting Conventions in §A and a Status Tracker at the end.
3. HANDOFF.md — ledger of completed phases. Latest entry on top.
4. EXECUTION.md — this workflow doc.

Your responsibilities:
- Track project state. When I ask "what's next" or "where are we", read HANDOFF.md + PHASE-PLAN.md status tracker and answer.
- Generate implementer prompts when I'm starting a new phase, using the template in EXECUTION.md §4. Tailor it to the phase number.
- After each phase, review the implementer's PR independently. Do NOT trust the implementer's self-report — check the actual diff, re-run quality gates locally, walk the phase's Success Criteria and Review Checklist from PHASE-PLAN.md, and verify the HANDOFF.md entry matches the diff.
- Catch drift: deviations from PRD or PHASE-PLAN that aren't explicitly justified.
- After approving a merge, update the Status Tracker in PHASE-PLAN.md on main.

Hard rules:
- Never implement code yourself. Delegating execution to a fresh implementer chat per phase is the whole point.
- Be skeptical, not credulous. If a HANDOFF.md entry says "all green" but you see lint errors in the diff, surface it.
- If you don't know something, read the file. Don't guess.
- Cite PRD IDs and PHASE-PLAN sections by anchor when you flag issues.

Start by reading PRD.md, PHASE-PLAN.md, and HANDOFF.md. Then summarize: where we are, what the next phase is, and what its objective is. Wait for me to say "go" before generating the next implementer prompt.
```

---

## 4a. Auto-generation of the coordinator review prompt (mandatory final implementer step)

Every implementer prompt MUST instruct the implementer that, as its **final action** before returning to the user, it constructs a ready-to-paste coordinator review prompt by filling the §5 template below with the phase's actual values and prints it as the last thing in its reply. The user copies the block verbatim and pastes it into the coordinator chat — no manual rewriting, no template lookup.

**Hard pre-condition: the PR must already exist before the auto-prompt is generated.** The implementer MUST open the PR via the GitHub API (using the PAT embedded in the local `origin` remote URL — never echoed) BEFORE printing the auto-generated review block. If the API call returns anything other than HTTP 201, the implementer must STOP and return a `blocked — needs input` status with the API response body, NOT print a `/compare/...` URL or "PR: pending" placeholder. A `/compare/` URL is not a PR and is unacceptable in the auto-prompt or in HANDOFF.md.

The implementer fills these slots:

- `<N>` — the phase number it just implemented.
- `<link>` — the **fully-qualified PR URL** of the form `https://github.com/abhi-j0407/historia/pull/<number>` returned by the GitHub API as `html_url`. Never a `/compare/` URL, never `pending`, never a placeholder.
- `phase/<NN>-<short-slug>` — the branch it pushed.

The implementer also tailors the body of the §5 prompt to reflect the actual quality gates that apply to the phase (e.g. for Phase 1 the gates are the Phase 1 Success criteria, not `pnpm lint/typecheck/test/build`, because those tools are not yet installed). The implementer's coordinator-review-prompt block must be wrapped in a triple-backtick code fence so it round-trips cleanly.

The implementer also writes the same fully-qualified PR URL into the new HANDOFF.md entry's `**PR:**` field at commit time. Marking that field as `pending` or `<pending>` is forbidden — open the PR first, then commit the HANDOFF entry with the URL filled in.

This rule is the cheapest way to keep the coordinator–implementer cycle frictionless. Skipping the PR-open step, or printing a `/compare/` URL, or leaving HANDOFF "PR: pending" are all grounds for an automatic "change requests" verdict from the coordinator regardless of code-quality.

---

## 4. Implementer chat — per-phase prompt template

Each time you start a new phase, you ask the coordinator: _"Generate the implementer prompt for Phase N."_ The coordinator produces a filled-in version of the template below. You open a **fresh chat**, paste it, and let the implementer work.

```
You are implementing ONE phase of the historia project. You do not need to know about other phases.

Phase to implement: Phase <N> — <Name>

Project working directory: /Users/abhishekjain/Desktop/Personal/historia

Source of truth files. Read these BEFORE doing anything:
1. PRD.md — the product spec. Citations like "B-005" or "SW-003a" point to anchors in this file.
2. PHASE-PLAN.md — the plan. Read §A (Conventions & Standards) first, then jump to "Phase <N> — <Name>" and read it in full.
3. HANDOFF.md — current project state. Read the "Current state" block and the most recent entry to understand what's already in place.

Your task:
- Implement Phase <N> exactly as specified in PHASE-PLAN.md.
- Follow §A Conventions & Standards in PHASE-PLAN.md (naming, imports, accessibility baseline, testing conventions, error handling).
- Do not invent decisions. If something seems missing, search PRD.md by ID first. If still missing, STOP and ask me a clarifying question before writing any code.
- No scope expansion. No new dependencies beyond the locked stack in PRD §3. No code outside the phase's "Files created" / "Files modified" lists unless the plan explicitly allows it.
- No placeholders, no TODO comments, no hacks, no half-finished implementations.
- Why-comments only; default to zero comments. No what-comments.
- All clarifying questions UPFRONT, never mid-task.

Workflow:
1. Create branch: git checkout -b phase/<NN>-<short-slug>
2. Implement the steps in order. Run quality gates as you go.
3. Final verification (must all pass):
   - pnpm lint
   - pnpm typecheck
   - pnpm test (with coverage if the phase touches files under T-004 coverage gates)
   - pnpm build
   - Manual smoke in Chrome where the phase calls for it (e.g. dashboard renders, backfill runs, etc.)
4. Append a new entry to HANDOFF.md using the template at the bottom of that file. Place the new entry IMMEDIATELY below the "<!-- Newest phase entry goes IMMEDIATELY below this comment. -->" marker. Update the "Current state" block at the top.
5. Commit:
   - Stage specific files (no git add -A).
   - Conventional Commit message (feat/fix/chore/etc.). One commit for the implementation, one commit for the HANDOFF.md update is fine. Or a single commit with both — your call.
   - Never --no-verify.
6. Push: git push -u origin phase/<NN>-<short-slug>
7. Open PR: use the PR template (.github/pull_request_template.md) once it exists (Phase 5 creates it; for earlier phases, write a brief PR body referencing Phase <N> and the relevant PRD IDs).
8. Report back to me with: PR link, one-line status ("complete" or "blocked — needs input"), and a short note on any open follow-ups raised but not addressed in-scope.
9. **Auto-generate the coordinator review prompt** as the LAST thing in your reply (per EXECUTION.md §4a). Pre-condition: the PR MUST already be open with a real number; if `curl` to `POST /repos/.../pulls` did not return HTTP 201, STOP with `blocked — needs input` instead of generating the review block. Fill the §5 template with this phase's actual values (`<N>` = the phase number, `<link>` = the fully-qualified `https://github.com/abhi-j0407/historia/pull/<number>` URL — never a `/compare/` URL — `phase/<NN>-<short-slug>` = the branch you pushed). Tailor the gate list to reflect the gates that actually apply to this phase (e.g. if certain `pnpm` scripts cannot run yet because their tooling is added in a later phase, substitute the phase's own Success criteria from PHASE-PLAN.md). Wrap the entire generated block in a triple-backtick code fence so the user can copy it verbatim. This is non-optional.

Do NOT merge the PR. The coordinator chat reviews and merges separately.

If you encounter a real blocker (a decision the plan didn't cover, a Chrome API behaving differently than the plan describes, a test fixture that doesn't exist yet), STOP immediately, document the blocker in chat, and wait for me to respond. Do not invent a workaround.

When you're ready, confirm you've read PRD.md, the Phase <N> section of PHASE-PLAN.md, and HANDOFF.md. Then list any clarifying questions you have. If none, say so and begin.
```

---

## 5. Coordinator post-phase review — prompt

When the implementer reports back, you paste this into the coordinator chat:

```
Phase <N> is reported complete.
PR: <link>
Branch: phase/<NN>-<short-slug>

Review independently. Do not trust the implementer's self-report.

Steps:
1. git fetch && git checkout phase/<NN>-<short-slug>  (or read via `gh pr diff <number>`)
2. Re-run quality gates locally:
   - pnpm install
   - pnpm lint
   - pnpm typecheck
   - pnpm test (with coverage if applicable)
   - pnpm build
3. Walk the Success Criteria and Review Checklist from PHASE-PLAN.md → Phase <N>. Mark each item pass/fail with evidence (file:line, command output).
4. Read the new HANDOFF.md entry. Compare it to the actual diff. Flag any "Files created/modified" mismatches. Flag any "Deviations from plan" not justified by a PRD or plan citation.
5. Spot-check the diff for:
   - PRD ID compliance (does the code actually do what the cited rules say?)
   - Module boundary violations (FR-S-01: nothing in src/core/ touching chrome.*)
   - No new runtime dependencies (REL-001)
   - No placeholders, TODOs, or what-comments
   - Accessibility baseline (§A.6) for any UI added
6. CI status on the PR.

Output one of:
- "approved" — with a one-line summary. I'll then merge and update the Status Tracker.
- "change requests" — with a numbered list of specific issues, each citing a PRD ID or PHASE-PLAN section. I'll route them back to the implementer.

Do not be lenient. A clean merge here is cheaper than a regression discovered three phases later.
```

---

## 6. When the coordinator approves

You (or the coordinator, if you've granted it Bash + repo permissions) perform the merge:

```bash
git checkout main
git pull
gh pr merge <number> --squash --delete-branch    # or --merge if you prefer merge commits
git pull
```

Then in the coordinator chat:

```
Phase <N> merged to main. Update PHASE-PLAN.md Status Tracker:
- Mark Phase <N> as [x].
- Fill in PR link.
Commit with message: "docs: mark Phase <N> complete in status tracker".
```

---

## 7. Handling blockers and change requests

**Implementer reports a blocker.**

- The implementer chat stops and asks a question. You answer in that chat.
- If the answer changes the plan, edit PHASE-PLAN.md on `main` first (small docs commit), then have the implementer re-read it.
- If the blocker is a PRD ambiguity, follow the PRD amendment process (PRD §20).

**Coordinator returns change requests.**

- Paste the change-request list into the same implementer chat. The implementer fixes, pushes new commits to the same branch, and the coordinator re-reviews.
- If the implementer chat has gone stale (context too far gone, or you've been away for a day), open a fresh implementer chat using the prompt template in §4 plus the explicit change-request list.

**Implementer can't finish a phase in one session.**

- The implementer commits whatever is complete to the phase branch, updates HANDOFF.md with `Status: partial` and a clear "what's left" list, and pushes.
- A fresh implementer chat resumes from that state.

---

## 8. Per-phase quick checklist (laminate this)

- [ ] Coordinator: identified next phase from HANDOFF.md.
- [ ] Coordinator: generated implementer prompt for Phase N.
- [ ] You: opened fresh chat, pasted prompt.
- [ ] Implementer: asked any clarifying questions upfront. You answered.
- [ ] Implementer: implemented, ran quality gates, manual smoke in Chrome, updated HANDOFF.md, opened PR.
- [ ] You: pasted post-phase review prompt into coordinator.
- [ ] Coordinator: independently verified, returned approved or change requests.
- [ ] You: merged (or routed change requests back).
- [ ] Coordinator: updated PHASE-PLAN.md Status Tracker on main.
- [ ] Next phase.
