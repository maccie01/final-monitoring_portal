# Multi-Agent Orchestration System

**Status**: ✅ **OPERATIONAL**
**Execution Model**: SDK-Based Autonomous Agents
**SDK Version**: claude-agent-sdk 0.1.1
**Last Updated**: October 7, 2025

---

## Overview

This directory contains a multi-agent orchestration system for the Netzwächter monitoring portal. Agents run autonomously via the Claude Agent SDK, working on independent branches in parallel.

## Active Agents

### Frontend Cleanup Agent
- **Agent ID**: `frontend-cleanup-agent`
- **Branch**: `cleanup/frontend-dead-code`
- **Priority**: P0 (Critical)
- **Status**: ✅ RUNNING (PID tracked in state/)
- **Progress**: 6/11 tasks complete (55%)
- **Task Document**: `todo/AGENT-A-FRONTEND-CLEANUP.md`
- **Progress Log**: `logs/frontend-agent-progress.md`

**Recent Completions**:
- ✅ Task 3.1: ARIA labels (10 buttons) - Commit af294c2
- ✅ Task 3.2: Button Guidelines (224 buttons audited) - Commit 65cfb41
- 🔄 Task 4.1: Design Token System (IN PROGRESS)

### Security Hardening Agent
- **Agent ID**: `security-agent`
- **Branch**: `security/backend-hardening`
- **Priority**: P0 (Critical)
- **Status**: ⏸️ PAUSED (manual work completed)
- **Progress**: 4/9 tasks complete (44%)
- **Task Document**: `todo/AGENT-B-SECURITY.md`
- **Progress Log**: `logs/security-agent-progress.md`

**Completed Tasks**:
- ✅ SEC-1.1: bcrypt password hashing - Commit f104d5b
- ✅ SEC-1.2: Remove admin bypass - Commit d8cf78a
- ✅ SEC-1.3: SSL/TLS configuration - Commit 73d2e76
- ✅ SEC-1.4: API rate limiting - Commit aca2596

---

## Quick Start

### Spawn an Agent

```bash
cd /path/to/project
source .agents/venv/bin/activate
python .agents/spawn_agent.py <agent-id>
```

**Available Agents**:
- `frontend-cleanup-agent` - Frontend cleanup and optimization
- `security-agent` - Backend security hardening

**Example**:
```bash
python .agents/spawn_agent.py frontend-cleanup-agent
```

### Check Agent Progress

```bash
# View progress log
cat .agents/logs/frontend-agent-progress.md

# View agent state
cat .agents/state/frontend-cleanup-agent.json

# View latest commit
git log cleanup/frontend-dead-code -1
```

### Manager Validation Process

As the managing agent, validate work after each agent commit:

1. **Check Agent Output**:
   ```bash
   # Via BashOutput tool (if agent running in background)
   # Or monitor logs/[agent]-progress.md
   ```

2. **Verify Commits**:
   ```bash
   git show <commit-hash> --stat
   git log <branch> --oneline -5
   ```

3. **Validate Build**:
   ```bash
   npm run build
   ```

4. **Check for Regressions**:
   ```bash
   git diff main...<branch>
   ```

---

## Directory Structure

```
.agents/
├── README.md                      # This file - orchestration overview
├── orchestrator.py                # High-level orchestrator (WIP)
├── spawn_agent.py                 # ✅ ACTIVE - spawns SDK agents
├── requirements.txt               # Python dependencies
├── venv/                          # Python virtual environment
│
├── agents/                        # Agent configurations
│   ├── frontend-cleanup/
│   │   ├── config.json           # Agent settings (max_turns, tools)
│   │   └── prompt.md             # System prompt for agent
│   └── security/
│       ├── config.json
│       └── prompt.md
│
├── logs/                          # Agent progress tracking
│   ├── frontend-agent-progress.md # ✅ Updated by agent autonomously
│   └── security-agent-progress.md # ✅ Updated manually (pre-SDK)
│
├── state/                         # Runtime state (git-ignored)
│   ├── frontend-cleanup-agent.json
│   └── security-agent.json
│
└── todo/                          # Task documents
    ├── AGENT-A-FRONTEND-CLEANUP.md  # 11 tasks, 2 weeks
    └── AGENT-B-SECURITY.md          # 9 tasks, 2 weeks
```

---

## How Agents Work

### 1. Agent Spawning

`spawn_agent.py` uses the Claude Agent SDK to create autonomous agent instances:

```python
from claude_agent_sdk import query, ClaudeAgentOptions

# Load agent configuration
config = json.load(open(f".agents/agents/{agent_id}/config.json"))
prompt = open(f".agents/agents/{agent_id}/prompt.md").read()

# Configure agent
options = ClaudeAgentOptions(
    cwd=str(base_dir),
    system_prompt=prompt,
    max_turns=config.get("max_turns", 80),
    allowed_tools=config.get("tools", ["Read", "Write", "Edit", "Bash"])
)

# Spawn agent
async for message in query(prompt=initial_query, options=options):
    # Agent runs autonomously
```

### 2. Agent Autonomy

Agents independently:
- ✅ Read their task documents
- ✅ Check current progress
- ✅ Plan next steps
- ✅ Execute tasks (search, edit, test)
- ✅ Run builds to verify changes
- ✅ Commit with proper messages
- ✅ Update progress logs
- ✅ Move to next task

### 3. Manager Oversight

The managing agent (this Claude instance) validates:
- Commit quality and accuracy
- Build success after changes
- Progress log accuracy
- No regressions introduced

---

## Agent Configuration

### Agent Prompt Structure

Each `agents/{agent-id}/prompt.md` contains:

```markdown
# [Agent Name]

## Your Identity
- Agent ID: [agent-id]
- Branch: [feature-branch]
- Priority: P0/P1/P2

## Your Task Document
../../todo/[TASK-DOC].md

## Your Working Approach
1. Read task document
2. Work systematically
3. Verify after each task (npm run build)
4. Track progress in ../../logs/[agent]-progress.md
5. Commit with format: `type(scope): description (Task X.Y)`
```

### Agent Config Options

`agents/{agent-id}/config.json`:

```json
{
  "agent_id": "frontend-cleanup-agent",
  "branch": "cleanup/frontend-dead-code",
  "priority": "P0",
  "max_turns": 80,
  "tools": ["Read", "Write", "Edit", "Bash", "Grep", "Glob", "TodoWrite"],
  "allowed_actions": ["commit", "push"],
  "auto_commit": true
}
```

---

## Parallel Execution Safety

**Validated**: Security and Frontend agents can run simultaneously.

**Conflict Analysis** (from VALIDATION-MATRIX.md):
- Security Agent: Modifies `server/**` (backend)
- Frontend Agent: Modifies `client/**` (frontend)
- **File Overlap**: ZERO conflicts ✅

**Git Strategy**:
- Both agents branch from `main`
- Work in isolated feature branches
- No shared files = no merge conflicts
- Can merge independently when complete

---

## Claude Agent SDK Reference

### Installation (Already Complete)

```bash
python3 -m venv .agents/venv
source .agents/venv/bin/activate
pip install claude-agent-sdk anthropic rich gitpython
```

### Basic Query

```python
import anyio
from claude_agent_sdk import query

async def main():
    async for message in query(prompt="Hello Claude!"):
        print(message)

anyio.run(main)
```

### Advanced Usage with Options

```python
from claude_agent_sdk import query, ClaudeAgentOptions

options = ClaudeAgentOptions(
    system_prompt="You are a specialized agent",
    max_turns=50,
    cwd="/path/to/project",
    allowed_tools=["Read", "Write", "Edit", "Bash", "Grep"]
)

async def main():
    async for message in query(
        prompt="Complete your assigned task",
        options=options
    ):
        # Process agent responses
        if hasattr(message, 'content'):
            for block in message.content:
                if hasattr(block, 'text'):
                    print(block.text)

anyio.run(main)
```

### Available Tools

Agents have access to:
- **File Operations**: Read, Write, Edit
- **Search**: Grep, Glob
- **Shell**: Bash
- **Task Management**: TodoWrite
- **Web**: WebFetch, WebSearch (if enabled)

---

## Manager Responsibilities

As the managing agent, I:

1. **Spawn Agents**: Use `spawn_agent.py` to create autonomous agents
2. **Monitor Progress**: Check `logs/[agent]-progress.md` regularly
3. **Validate Work**: Verify commits, builds, and code quality
4. **Intervene When Needed**: Fix issues, provide guidance
5. **Coordinate**: Ensure agents don't conflict
6. **Document**: Maintain this README and system documentation

### When to Intervene

✅ **Intervene When**:
- Agent makes incorrect changes
- Build fails after agent commit
- Agent gets stuck in a loop
- Progress log shows errors

❌ **Don't Intervene When**:
- Agent is working correctly (even if slow)
- Progress log shows steady advancement
- Build passes after commits

---

## Memory Management

**System**: Memory MCP (Docker-based)

**Categories Tracked**:
1. **Agent State**: Current task, progress, blockers
2. **Technical Decisions**: Architecture choices, patterns
3. **Error Patterns**: Common issues and resolutions
4. **Progress Milestones**: Completed phases
5. **Validation Results**: Build status, test results
6. **Inter-Agent Coordination**: Dependencies, conflicts
7. **User Feedback**: Preferences, corrections

**When to Save**:
- After each agent task completion
- When errors occur
- Before/after major decisions
- After validation steps

**Documentation**: `MANAGER-MEMORY-SYSTEM.md` (detailed guidelines)

---

## Troubleshooting

### Agent Not Spawning

```bash
# Check SDK installation
source .agents/venv/bin/activate
python -c "import claude_agent_sdk; print('SDK OK')"

# Verify agent config exists
ls .agents/agents/frontend-cleanup/
```

### Agent Stuck or Erroring

```bash
# View agent output (if running in background)
# Use BashOutput tool with agent PID

# Check progress log
cat .agents/logs/frontend-agent-progress.md

# Check for uncommitted changes
git status
```

### Build Failures After Agent Commit

```bash
# Checkout the commit
git checkout <commit-hash>

# Run build with verbose output
npm run build --verbose

# Fix manually if needed, then commit
git commit -m "fix(agent): resolve build issue from <commit-hash>"
```

---

## Resources

- **Claude Agent SDK Docs**: https://docs.anthropic.com/claude-agent-sdk
- **Claude Code Tools**: https://docs.anthropic.com/claude-code/tools
- **Project Docs**: `docs/` directory
- **Task Breakdown**: `.agents/todo/` directory

## Key Documents

- **MASTER-EXECUTION-PLAN.md** - ⭐⭐ **MANAGING AGENT PLAYBOOK** - Step-by-step execution guide, validation workflow, current status
- **AGENT-TIMELINE.md** - ⭐ When to use which agents, dependencies, execution timeline
- **TARGET-ARCHITECTURE.md** - ⭐ Final deliverable structure at `/Users/janschubert/code-projects/monitoring_firma/netzwaechter-refactored/`
- **SDK-SETUP-COMPLETE.md** - SDK setup and usage documentation

---

## Current Status Summary

### Active Work
- **Frontend Agent**: Running autonomously on Task 4.1 (Design Token System)
- **Security Agent**: Paused (manual work complete, awaiting SDK restart)

### Completed
- ✅ SDK Setup (claude-agent-sdk 0.1.1)
- ✅ Agent configuration files
- ✅ Spawn system (spawn_agent.py)
- ✅ Progress tracking logs
- ✅ Git branch strategy
- ✅ Manager validation process
- ✅ 6/11 Frontend tasks
- ✅ 4/9 Security tasks

### Next Steps
1. Frontend Agent completes remaining tasks (5 tasks)
2. Security Agent resumes via SDK (5 tasks)
3. Merge branches after validation
4. Deploy to production

---

**Manager**: Claude (this instance)
**Execution Mode**: SDK-based autonomous agents
**Last Manager Validation**: October 7, 2025 21:35 UTC
**System Health**: ✅ All systems operational
