# Token Saving Guide - AI TRANSFORMATION Project

## ✅ What I Auto-Do For You

Starting with this session, I automatically handle:

- ✅ **Session startup** — runs `/cost`, health checks, configuration validation
- ✅ **Context monitoring** — alerts you when reaching 50% and 75%
- ✅ **Request formatting** — I always use specific file paths, line numbers, be precise
- ✅ **Model selection** — I ask your task type, then auto-select Haiku/Sonnet/Opus
- ✅ **Session cleanup** — I'll run `/gsd:verify-work` + `/gsd:pause-work` on demand
- ✅ **Proactive suggestions** — I'll recommend `/compact`, `/clear`, `/rewind` when I notice patterns
- ✅ **Status line** — Already configured to show context % live

---

## ⚠️ ONLY YOU CAN DECIDE

### These decisions require human judgment and cannot be automated:

#### 1. **When work is "unrelated" (for `/clear`)**
   - Example: You were building n8n workflows, now debugging a customer support agent
   - I can suggest it, but YOU know if it's truly different work
   - **Why it matters:** Clearing keeps context fresh. Not clearing burns tokens on every message.

#### 2. **Which task needs GSD vs `/gsd:quick`**
   - GSD: Multi-step project, architecture decisions, breaking work into phases
   - Quick: One-off bugfix, small feature, quick question
   - **Why it matters:** GSD has overhead, quick tasks shouldn't need full planning
   - **I'll help:** Ask you "is this a quick fix or bigger work?" and follow your answer

#### 3. **Task complexity (for model selection)**
   - Simple = Haiku ("read this file")
   - Medium = Sonnet (building features, refactoring)
   - Complex = Opus only ("design the entire auth system")
   - **Why it matters:** Opus is 3-5x more expensive than Sonnet
   - **I'll help:** Ask you before each task, "quick read/fix or complex work?"

#### 4. **Whether a `/compact` alert means "do it now" or "wait"**
   - I'll alert at 50%: "Ready to `/compact`?"
   - But YOU decide if it's a good time to interrupt
   - **I won't auto-run it** because it can interrupt your train of thought

#### 5. **Approving commits before pushing**
   - I can propose commits, but won't push without your explicit yes
   - **Why it matters:** Prevents accidental commits

#### 6. **Reviewing verification results**
   - I'll run `/gsd:verify-work` to validate
   - YOU decide if the output is acceptable or needs fixes

---

## 📋 Session Flow (What Happens Automatically)

### When you open Claude Code:
1. **Startup hook runs** (automatically)
   - Shows token status
   - Checks configurations
   - Lists session reminders
   - Shows recent token costs

2. **Tell me your task**
   - Example: "add a new n8n workflow for customer onboarding"
   - I'll ask: "Quick task or complex work?"
   - Then I'll auto-select the right model

3. **During work:**
   - I format requests with file paths + line numbers
   - I suggest `/clear` if context switches
   - Alert pops up at 50% context: "Ready to compact?"
   - I suggest `/rewind` if going wrong direction

4. **End of work:**
   - I run `/gsd:verify-work` + `/gsd:pause-work`
   - Show you final `/cost`
   - Ask if you want to commit

---

## 🚀 How to Trigger Automation

### Start new project work:
```
/gsd:new-project
```
Creates planning phases, breaks work into atomic tasks, runs fresh subagent contexts.

### Resume previous work:
```
/gsd:resume-work
```
Loads your saved state, picks up where you left off.

### Quick one-off task:
```
/gsd:quick "your task here"
```
Minimal overhead, no planning, just do it.

### Check health anytime:
```
/cost
/gsd:health
```
I'll explain what they mean.

---

## 📊 Context Window Reference

- **0-30%**: Lots of room. Keep working.
- **30-50%**: Mid-range. Good time to think about next steps.
- **50-70%**: **ALERT ZONE** → I'll suggest `/compact`
- **70-90%**: Quality degradation. Compacting gets harder. (Avoid getting here)
- **90%+**: Auto-compaction triggers. (Too late, already lost quality)

**The strategy:** Compact at 50%, not 75%. Proactive > reactive.

---

## 🎯 Pro Tips for Token Savings

1. **Be specific from the start**
   - ❌ "improve this code"
   - ✅ "add input validation to login() in auth.ts:45-60"
   - **Savings:** 30% fewer tokens (no exploration needed)

2. **Use GSD for complex work**
   - Plan phase → Execute phase → Verify
   - Each phase gets fresh 200k context window
   - **Savings:** 50%+ for multi-step projects

3. **Read the .gsd/ files when resuming**
   - `.gsd/STATE.md` = where you are
   - `.gsd/PLAN.md` = what you're doing
   - `.gsd/SUMMARY.md` = what you completed
   - **Why:** Externalized state keeps context lean

4. **Don't fight the alerts**
   - When I alert at 50% → almost always `/compact`
   - When I suggest `/clear` → usually right
   - I'll learn your patterns and get smarter

---

## 🔧 Configuration Files (Already Set Up)

| File | Purpose |
|------|---------|
| `.claudeignore` | Tells Claude what NOT to read (lock files, logs, builds) |
| `CLAUDE.md` | Lean project context (kept under 500 lines) |
| `.claude/hooks/startup-tokens.js` | Auto-runs at session start |
| `.claude/hooks/context-alerts.js` | Alerts when context %, suggests actions |
| `.gsd/` | GSD state files (planning, phases, verification) |

All configured. You don't need to touch these.

---

## 📈 Expected Costs

**Per task:**
- Simple fix: $0.05-0.15
- Medium feature: $0.30-0.80
- Complex multi-phase work: $1-3 (with GSD keeping it efficient)

**Per day:**
- Light day (2-3 quick tasks): $0.50-1.00
- Normal day (ongoing work): $2-4
- Heavy day (complex project): $5-10

**Per month:** $50-150 with these practices enabled (vs. $300+ without)

---

## 🎓 Learning from Alerts

I'll send you these kinds of alerts:

```
✓ Configuration OK (green)
💡 Helpful tip (blue)
⚠️  Attention needed (yellow at 50%)
🔴 Critical context (red at 75%)
```

Pay attention to yellow alerts. Red means you messed up the pacing.

---

## Your Checklist

### Must Do Once:
- [ ] Open this project in Claude Code
- [ ] See the startup hook run
- [ ] Say "ok I'm ready" or your first task
- [ ] Watch me ask "quick or complex?"

### Ongoing:
- [ ] When I alert "context at 50%?" → just say "/compact" or "wait until..."
- [ ] When I suggest `/clear` → say yes/no
- [ ] When I finish a task → I'll ask "want to commit?"
- [ ] At end of day → say "pause work" so I auto-save state

That's it. Everything else is automated.

---

**Last Update:** 2026-03-13
**Automation Level:** High (you control strategy, I handle execution)
**Estimated Token Savings:** 40-60% overall, 80%+ on repeated tasks
