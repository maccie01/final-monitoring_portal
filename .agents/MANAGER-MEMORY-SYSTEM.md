# Manager Agent Memory System

Created: 2025-10-07
Purpose: Persistent memory management for multi-agent coordination

---

## Overview

This system provides persistent memory storage for the Manager Agent to track progress, decisions, and state across multiple agents and sessions.

**MCP Server**: Docker MCP Memory Server
**Purpose**: Track agent progress, decisions, blockers, and coordination state
**Persistence**: Survives context window resets and session restarts

---

## Memory Categories

### 1. Agent Status Memory
**Entity**: `agent-status-{agent-id}`
**When to Save**: After each significant agent milestone
**What to Save**:
```json
{
  "agent_id": "security-agent",
  "status": "in_progress",
  "branch": "security/backend-hardening",
  "tasks_complete": 2,
  "tasks_total": 12,
  "progress_percent": 16.7,
  "last_task": "SEC-1.2: Remove admin bypass",
  "next_task": "SEC-1.3: SSL/TLS configuration",
  "commits": ["f104d5b", "d8cf78a"],
  "blockers": [],
  "estimated_hours_remaining": 18,
  "last_update": "2025-10-07T17:48:00Z"
}
```

**Update Frequency**: After each task completion or major milestone

---

### 2. Task Completion Memory
**Entity**: `task-completed-{task-id}`
**When to Save**: Immediately after each task completes
**What to Save**:
```json
{
  "task_id": "SEC-1.1",
  "title": "Implement bcrypt password hashing",
  "agent": "security-agent",
  "status": "completed",
  "commit": "f104d5b",
  "duration_hours": 1.5,
  "verification": "All 11 passwords migrated to bcrypt",
  "files_modified": ["server/storage.ts", "server/db.ts"],
  "impact": "CRITICAL vulnerability fixed (CVSS 9.8 → 0.0)",
  "completed_at": "2025-10-07T17:30:00Z"
}
```

**Update Frequency**: Immediately after task completion

---

### 3. Coordination State Memory
**Entity**: `coordination-state`
**When to Save**: When agents start, pause, or change execution state
**What to Save**:
```json
{
  "active_agents": ["security-agent"],
  "paused_agents": [],
  "completed_agents": [],
  "parallel_execution": false,
  "file_conflicts": {
    "storage.ts": ["security-agent", "backend-modularization-agent"]
  },
  "execution_phase": "Phase 1: Security + Frontend",
  "current_week": 1,
  "estimated_completion": "2025-10-28",
  "last_coordination_decision": "Continue Security Agent with SEC-1.3",
  "decision_rationale": "2 critical vulnerabilities fixed, SSL next priority",
  "updated_at": "2025-10-07T17:48:00Z"
}
```

**Update Frequency**: At coordination decision points (every 2-3 tasks)

---

### 4. Critical Decisions Memory
**Entity**: `decision-{decision-id}`
**When to Save**: After any significant architectural or strategic decision
**What to Save**:
```json
{
  "decision_id": "DEC-001",
  "title": "Use bcrypt for password hashing",
  "context": "Plaintext passwords in database (CVSS 9.8)",
  "options_considered": [
    "bcrypt (chosen)",
    "argon2",
    "scrypt"
  ],
  "decision": "Use bcrypt with 12 salt rounds",
  "rationale": "Industry standard, well-tested, Node.js native support",
  "impact": "All user passwords now secure",
  "alternatives_rejected": "argon2 (memory-hard but overkill), scrypt (less common)",
  "decided_at": "2025-10-07T16:00:00Z"
}
```

**Update Frequency**: After major architectural decisions

---

### 5. Blocker Memory
**Entity**: `blocker-{blocker-id}`
**When to Save**: When agent encounters a blocker
**What to Save**:
```json
{
  "blocker_id": "BLK-001",
  "agent": "security-agent",
  "task": "SEC-1.1",
  "type": "technical",
  "severity": "medium",
  "description": "ES module syntax error in migration script",
  "resolution": "Changed require.main check to direct async execution",
  "resolution_time_minutes": 15,
  "status": "resolved",
  "created_at": "2025-10-07T17:20:00Z",
  "resolved_at": "2025-10-07T17:35:00Z"
}
```

**Update Frequency**: When blockers occur and when resolved

---

### 6. Test Results Memory
**Entity**: `test-results-{test-id}`
**When to Save**: After running verification tests
**What to Save**:
```json
{
  "test_id": "TEST-SEC-001",
  "agent": "security-agent",
  "task": "SEC-1.1",
  "test_type": "database_verification",
  "command": "psql query for password format",
  "result": "PASS",
  "details": "All 11 passwords start with $2b$12$",
  "failures": 0,
  "warnings": 0,
  "executed_at": "2025-10-07T17:45:00Z"
}
```

**Update Frequency**: After each verification step

---

### 7. Session State Memory
**Entity**: `session-state`
**When to Save**: At key checkpoints during work session
**What to Save**:
```json
{
  "session_id": "2025-10-07-session-1",
  "start_time": "2025-10-07T16:00:00Z",
  "duration_minutes": 108,
  "agents_worked_on": ["security-agent"],
  "tasks_completed": ["SEC-1.1", "SEC-1.2"],
  "commits_created": 2,
  "critical_vulnerabilities_fixed": 2,
  "files_modified": 6,
  "lines_changed": "+136/-16",
  "context_tokens_used": 94000,
  "next_session_resume_point": "Continue with SEC-1.3: SSL/TLS configuration",
  "state_snapshot": "2 critical security tasks complete, SSL next",
  "updated_at": "2025-10-07T17:48:00Z"
}
```

**Update Frequency**: Every 30-60 minutes or before context reset

---

## When to Save Memory

### Critical Save Points

**1. Task Completion** (MUST SAVE)
```
After completing ANY task:
- Save task-completed-{task-id}
- Update agent-status-{agent-id}
- Update coordination-state
```

**2. Agent State Change** (MUST SAVE)
```
When agent starts/pauses/resumes/completes:
- Update agent-status-{agent-id}
- Update coordination-state
```

**3. Before Context Reset** (CRITICAL - MUST SAVE)
```
Before running out of context:
- Save session-state
- Update all agent-status entities
- Save coordination-state
- Document resume point
```

**4. After Major Decision** (SHOULD SAVE)
```
After architectural or strategic decisions:
- Save decision-{decision-id}
- Update coordination-state
```

**5. When Blocker Occurs** (SHOULD SAVE)
```
When encountering blockers:
- Save blocker-{blocker-id}
- Update agent-status (add to blockers array)
```

**6. After Verification** (NICE TO HAVE)
```
After running tests:
- Save test-results-{test-id}
```

---

## Memory Retrieval Strategy

### At Session Start
```
1. Load session-state (last session)
2. Load coordination-state (current execution state)
3. Load all agent-status-{agent-id} (active agents)
4. Review last 3 task-completed entries
5. Check for unresolved blockers
```

### During Coordination Decisions
```
1. Load coordination-state
2. Load all agent-status entities
3. Review file_conflicts
4. Check execution_phase
5. Make informed decision
```

### When Resuming Agent Work
```
1. Load agent-status-{agent-id}
2. Load last task-completed-{task-id}
3. Check for blockers
4. Resume from next_task
```

---

## Example Usage Workflow

### Starting New Task
```bash
# 1. Update coordination state
Save: coordination-state
{
  "current_task": "SEC-1.3",
  "active_agents": ["security-agent"]
}

# 2. Update agent status
Save: agent-status-security-agent
{
  "status": "working",
  "current_task": "SEC-1.3: SSL/TLS configuration"
}
```

### Completing Task
```bash
# 1. Save task completion
Save: task-completed-SEC-1.3
{
  "status": "completed",
  "commit": "abc123f",
  "verification": "SSL configured, HTTPS working"
}

# 2. Update agent status
Save: agent-status-security-agent
{
  "tasks_complete": 3,
  "progress_percent": 25,
  "last_task": "SEC-1.3",
  "next_task": "SEC-1.4"
}

# 3. Update coordination
Save: coordination-state
{
  "execution_phase": "Phase 1: Week 1 - Day 1",
  "last_coordination_decision": "Continue with SEC-1.4"
}
```

### Before Context Reset
```bash
# CRITICAL - Save everything
Save: session-state
{
  "session_id": "2025-10-07-session-1",
  "next_session_resume_point": "Continue Security Agent with SEC-1.4",
  "state_snapshot": "3/12 security tasks complete, SSL configured"
}

Save: coordination-state (updated)
Save: agent-status-security-agent (updated)
```

---

## Query Patterns

### Check Agent Progress
```
Query: agent-status-security-agent
Returns: Current status, progress, next task
```

### Get Completed Tasks
```
Query: task-completed-* where status = "completed"
Returns: List of all completed tasks
```

### Find Blockers
```
Query: blocker-* where status = "unresolved"
Returns: Active blockers requiring attention
```

### Review Session History
```
Query: session-state
Returns: Last session state and resume point
```

---

## Memory Hygiene

### When to Clean Up
- Archive completed agents (move to agent-status-{id}-archived)
- Archive old sessions (keep last 5 sessions only)
- Archive resolved blockers after 7 days
- Keep all task-completed entries (permanent record)

### Backup Strategy
- Coordination-state: NEVER delete (critical for state)
- Agent-status: Archive after agent completes
- Task-completed: Permanent (audit trail)
- Session-state: Keep last 10 sessions

---

## Integration with Orchestrator

### When orchestrator.py runs:
```python
# Load memory state
memory = load_memory("coordination-state")
active_agents = memory["active_agents"]

# Update after spawn
save_memory("agent-status-{agent_id}", {
  "status": "spawned",
  "started_at": datetime.now()
})

# Update coordination state
save_memory("coordination-state", {
  "active_agents": active_agents + [new_agent_id]
})
```

---

## Critical Memory Points for Manager

**MUST REMEMBER**:
1. Agent progress (tasks complete/total)
2. Current execution phase
3. File conflicts (prevent parallel conflicts)
4. Next task for each agent
5. Unresolved blockers

**SHOULD REMEMBER**:
1. Commits created
2. Verification results
3. Time estimates
4. Decision rationale

**NICE TO HAVE**:
1. Detailed test results
2. Performance metrics
3. Historical decisions

---

## Memory Usage Examples

### Example 1: Resuming After Context Reset
```
1. Query session-state
   → "Continue Security Agent with SEC-1.4"

2. Query agent-status-security-agent
   → tasks_complete: 3, next_task: "SEC-1.4"

3. Query coordination-state
   → active_agents: ["security-agent"], no conflicts

4. Resume work on SEC-1.4
```

### Example 2: Starting Parallel Agent
```
1. Query coordination-state
   → Check file_conflicts

2. Query agent-status-security-agent
   → files_being_modified: ["server/storage.ts"]

3. Query agent-status-frontend-cleanup-agent
   → files_to_modify: ["client/**"]

4. Decision: No conflict, start frontend agent

5. Update coordination-state
   → active_agents: ["security-agent", "frontend-cleanup-agent"]
```

---

## Manager Decision Framework

### Use Memory To:
1. **Prevent Conflicts**: Check file_conflicts before spawning agents
2. **Track Progress**: Know exactly what's done and what's next
3. **Handle Interruptions**: Resume seamlessly after context resets
4. **Coordinate Agents**: Ensure parallel agents don't interfere
5. **Document Decisions**: Maintain audit trail of choices made

### Save Memory When:
1. ✅ Task completes
2. ✅ Agent state changes
3. ✅ Making coordination decisions
4. ✅ Encountering blockers
5. ✅ Before context limit
6. ✅ After verification tests

---

**Created**: 2025-10-07T17:50:00Z
**Manager**: Claude Code
**Status**: Active System
**Next Review**: After 10 tasks completed

