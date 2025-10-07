# Agent SDK Setup Guide

## Quick Start (5 minutes)

```bash
# 1. Navigate to agents directory
cd .agents

# 2. Create Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Initialize orchestrator
python orchestrator.py init

# 5. List available agents
python orchestrator.py list

# 6. Check status
python orchestrator.py status
```

##Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Claude Code 2.0.0+
- Git

### Step 1: Install Claude Agent SDK

```bash
pip install claude-agent-sdk
```

### Step 2: Verify Installation

```bash
python -c "from claude_agent_sdk import query; print('✓ SDK installed')"
```

### Step 3: Initialize Orchestrator

```bash
cd .agents
python orchestrator.py init
```

This creates:
- `state/agent-status.json` - Agent tracking
- `state/task-assignments.json` - Task allocation
- `state/completion-log.json` - Completed work

## Usage

### Spawn Agents

**Parallel Execution** (Recommended for Phase 1):
```bash
# Terminal 1: Security Agent
python orchestrator.py spawn security-agent

# Terminal 2: Frontend Cleanup Agent
python orchestrator.py spawn frontend-cleanup-agent
```

Both agents work simultaneously on separate branches with zero conflicts.

**Sequential Execution**:
```bash
python orchestrator.py spawn security-agent
# Wait for completion
python orchestrator.py spawn frontend-cleanup-agent
```

### Monitor Progress

**Real-time Status**:
```bash
python orchestrator.py status
```

Shows:
- Agent status (running/blocked/complete)
- Current task
- Progress percentage
- Last update time

**Watch Logs**:
```bash
# View specific agent logs
python orchestrator.py logs security-agent

# Follow logs in real-time
python orchestrator.py logs security-agent --follow
```

### Agent Lifecycle

```
┌─────────────────────────────────────────────┐
│ 1. SPAWN                                    │
│    orchestrator.py spawn security-agent     │
│    → Creates branch                         │
│    → Loads config + prompt + tasks          │
│    → Starts autonomous execution            │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 2. EXECUTE (Autonomous)                     │
│    Agent reads tasks.json                   │
│    → Implements each task                   │
│    → Runs verifications                     │
│    → Commits changes                        │
│    → Reports status every 30min             │
│    Loop until all tasks complete            │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 3. VERIFY                                   │
│    → All tests passing                      │
│    → Security scan clean                    │
│    → Build successful                       │
│    → Metrics collected                      │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 4. REPORT COMPLETE                          │
│    Agent updates status to "complete"       │
│    → Push branch to remote                  │
│    → Create pull request                    │
│    → Update completion log                  │
│    → Notify orchestrator                    │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 5. HUMAN REVIEW                             │
│    Review PR, run additional tests          │
│    → Approve and merge                      │
│    → Agent branch deleted                   │
└─────────────────────────────────────────────┘
```

## Agent Configurations

### Security Agent
- **ID**: `security-agent`
- **Branch**: `security/backend-hardening`
- **Tasks**: 12 security fixes
- **Duration**: 3 weeks
- **Config**: `agents/security/config.json`
- **Prompt**: `agents/security/prompt.md`
- **Tasks**: `agents/security/tasks.json`

### Frontend Cleanup Agent
- **ID**: `frontend-cleanup-agent`
- **Branch**: `cleanup/frontend-dead-code`
- **Tasks**: Dead code removal, UI standardization
- **Duration**: 2 weeks
- **Config**: `agents/frontend-cleanup/config.json`

### Backend Modularization Agent
- **ID**: `backend-modularization-agent`
- **Branch**: `refactor/backend-modules`
- **Tasks**: Refactor storage.ts into 8 modules
- **Duration**: 6 weeks → 2 weeks (with 8 subagents)
- **Config**: `agents/backend-modularization/config.json`

## Troubleshooting

### Agent Not Starting
```bash
# Check orchestrator initialized
python orchestrator.py status

# If not initialized
python orchestrator.py init

# Verify agent exists
python orchestrator.py list
```

### Agent Blocked
```bash
# View logs to identify blocker
python orchestrator.py logs security-agent

# Check last reported status
python orchestrator.py status

# Manual intervention may be needed
```

### Merge Conflicts
```bash
# Orchestrator will pause conflicting agents
# Manually resolve:
git checkout security/backend-hardening
git pull origin main
# Resolve conflicts
git add .
git commit -m "merge: resolve conflicts with main"

# Agent will resume
```

### Tests Failing
```bash
# Agent will retry up to 3 times
# If still failing, agent reports "blocked"
# Check logs:
python orchestrator.py logs security-agent | grep ERROR

# Fix manually if needed
```

## Integration with Existing Todos

The agent system directly implements:
- ✅ `todo/AGENT-A-FRONTEND-CLEANUP.md`
- ✅ `todo/AGENT-B-BACKEND-SECURITY.md`
- ✅ `todo/analysis-todo.md` (phases 1-10)

All tasks from these documents are translated into:
- `agents/{agent-name}/tasks.json`
- With specific success criteria
- With verification commands
- With rollback procedures

## Communication Protocol

### Agent → Orchestrator
Every 30 minutes or on significant event:
```json
{
  "agent_id": "security-agent",
  "status": "in_progress",
  "current_task": "SEC-1.1",
  "progress": 0.75,
  "tests_passing": true,
  "files_modified": ["server/storage.ts"],
  "next_action": "Run migration script",
  "blockers": [],
  "timestamp": "2025-10-07T14:30:00Z"
}
```

Stored in: `state/agent-status.json`

### Orchestrator → Agent
Commands and coordination:
```json
{
  "command": "pause|resume|retry|abort",
  "reason": "merge conflict detected",
  "context": {...}
}
```

### Agent → Human
For critical decisions:
- Password migration
- SESSION_SECRET change
- Production deployment
- Merge conflict resolution

Orchestrator notifies via CLI output and logs.

## Success Metrics

Tracked per agent in `state/completion-log.json`:

```json
{
  "security-agent": {
    "status": "complete",
    "tasks_completed": 12,
    "commits": 15,
    "files_modified": 23,
    "loc_changed": {
      "added": 432,
      "modified": 1247,
      "deleted": 145
    },
    "tests_added": 8,
    "vulnerabilities_fixed": 12,
    "duration_hours": 72,
    "branch": "security/backend-hardening",
    "pr_url": "https://github.com/.../pull/123"
  }
}
```

## Next Steps After Setup

1. **Test orchestrator**:
   ```bash
   python orchestrator.py list
   python orchestrator.py status
   ```

2. **Review agent configurations**:
   ```bash
   cat agents/security/config.json
   cat agents/security/tasks.json
   ```

3. **Spawn first agent** (Security - highest priority):
   ```bash
   python orchestrator.py spawn security-agent
   ```

4. **Monitor progress**:
   ```bash
   watch -n 60 python orchestrator.py status
   ```

5. **Review and merge**:
   - After agent completes, review PR
   - Run additional tests if needed
   - Merge to main
   - Spawn next agent

## Advanced Usage

### Custom Agent
Create new agent:
```bash
mkdir -p agents/my-custom-agent
# Create config.json, tasks.json, prompt.md
# Run orchestrator.py init to reload
```

### Parallel Subagents
For Backend Modularization Agent:
- Spawns 8 subagents (one per domain)
- Each works independently
- Parent agent coordinates results

### State Inspection
```bash
# View raw state
cat state/agent-status.json | jq

# Check task assignments
cat state/task-assignments.json | jq

# Review completion history
cat state/completion-log.json | jq
```

---

**Ready to start?**

```bash
cd .agents
source venv/bin/activate
python orchestrator.py init
python orchestrator.py list
python orchestrator.py spawn security-agent
```

**Need help?** Check `README.md` for detailed documentation.
