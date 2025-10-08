#!/bin/bash
# Spawn an agent on its designated branch
# Usage: spawn_on_branch.sh <agent-id>

set -e

AGENT_ID="$1"
if [ -z "$AGENT_ID" ]; then
    echo "Usage: spawn_on_branch.sh <agent-id>"
    exit 1
fi

# Load agent config to get the branch name
CONFIG_FILE=".agents/agents/${AGENT_ID%-agent}/config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Config not found at $CONFIG_FILE"
    exit 1
fi

# Extract branch name from config
BRANCH=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE'))['git']['branch'])")

echo "=================================="
echo "Agent: $AGENT_ID"
echo "Branch: $BRANCH"
echo "=================================="

# Switch to the designated branch
git checkout "$BRANCH"

# Activate venv and spawn agent
source .agents/venv/bin/activate
cd .agents
python spawn_agent.py "$AGENT_ID"
