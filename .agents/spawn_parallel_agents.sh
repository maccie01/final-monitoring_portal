#!/bin/bash
# Spawn multiple agents in parallel using git worktrees
# Each agent gets its own working directory on its designated branch

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=================================="
echo "Spawning Parallel Agents"
echo "=================================="

# Agent IDs to spawn
AGENTS=(
    "monitoring-feature-agent"
    "ki-reports-feature-agent"
    "settings-feature-agent"
)

# Create worktree directory if it doesn't exist
WORKTREE_DIR="$PROJECT_ROOT/.worktrees"
mkdir -p "$WORKTREE_DIR"

# Clean up old worktrees
for agent_id in "${AGENTS[@]}"; do
    worktree_path="$WORKTREE_DIR/${agent_id%-agent}"
    if [ -d "$worktree_path" ]; then
        echo "Removing old worktree: $worktree_path"
        git worktree remove "$worktree_path" --force 2>/dev/null || true
    fi
done

# Create worktrees and spawn agents
for agent_id in "${AGENTS[@]}"; do
    # Load agent config
    config_file="$PROJECT_ROOT/.agents/agents/${agent_id%-agent}/config.json"
    if [ ! -f "$config_file" ]; then
        echo "Error: Config not found at $config_file"
        continue
    fi

    # Extract branch name
    branch=$(python3 -c "import json; print(json.load(open('$config_file'))['git']['branch'])")

    # Create worktree
    worktree_path="$WORKTREE_DIR/${agent_id%-agent}"
    echo ""
    echo "Creating worktree for $agent_id on branch $branch"
    git worktree add "$worktree_path" "$branch"

    # Copy .agents directory to worktree
    cp -r "$PROJECT_ROOT/.agents" "$worktree_path/"

    # Spawn agent in background
    echo "Spawning $agent_id in background..."
    (
        cd "$worktree_path"
        source .agents/venv/bin/activate
        cd .agents
        python spawn_agent.py "$agent_id" > "$PROJECT_ROOT/.agents/logs/${agent_id}.log" 2>&1
        echo "Agent $agent_id completed"
    ) &

    # Store PID
    echo $! > "$PROJECT_ROOT/.agents/logs/${agent_id}.pid"
    echo "Agent $agent_id spawned with PID $!"
done

echo ""
echo "=================================="
echo "All agents spawned in parallel"
echo "Monitor logs in .agents/logs/"
echo "=================================="
