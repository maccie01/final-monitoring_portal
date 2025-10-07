#!/usr/bin/env python3
"""
Agent spawner using Claude Agent SDK.
This script spawns a single agent and monitors its progress.
"""

import anyio
import json
import sys
from pathlib import Path
from claude_agent_sdk import query, ClaudeAgentOptions

async def spawn_agent(agent_id: str, base_dir: Path):
    """Spawn an agent using the Claude Agent SDK."""

    # Load agent configuration
    config_file = base_dir / ".agents" / "agents" / agent_id.replace("-agent", "") / "config.json"

    if not config_file.exists():
        print(f"❌ Config not found: {config_file}")
        return

    with open(config_file) as f:
        config = json.load(f)

    print(f"🚀 Spawning: {config['name']}")
    print(f"   Branch: {config['git']['branch']}")
    print(f"   Priority: {config['priority']}")
    print(f"   Duration: {config['estimated_duration_weeks']} weeks")
    print()

    # Load agent prompt
    prompt_file = base_dir / ".agents" / "agents" / agent_id.replace("-agent", "") / "prompt.md"

    if not prompt_file.exists():
        print(f"❌ Prompt not found: {prompt_file}")
        return

    with open(prompt_file) as f:
        agent_prompt = f.read()

    # Configure agent options
    options = ClaudeAgentOptions(
        cwd=str(base_dir),
        system_prompt=agent_prompt,
        max_turns=config.get("max_turns", 80),
        allowed_tools=config.get("tools", ["Read", "Write", "Edit", "Bash", "Grep", "Glob"])
    )

    # Initial query to start the agent
    initial_query = f"""You are now active as the {config['name']}.

Your task document is at: {config['source_document']}

Please:
1. Read your task document completely
2. Check the current git branch (should be: {config['git']['branch']})
3. Review what work has already been done (check git log)
4. Continue from where you left off or start the first pending task
5. Update your progress log at .agents/logs/{agent_id}-progress.md

Begin your work now."""

    print("=" * 80)
    print("AGENT OUTPUT:")
    print("=" * 80)
    print()

    # Execute agent query
    try:
        async for message in query(prompt=initial_query, options=options):
            # Print agent responses in real-time
            if hasattr(message, 'content'):
                for block in message.content:
                    if hasattr(block, 'text'):
                        print(block.text, end='', flush=True)
            print()

    except KeyboardInterrupt:
        print("\n\n⚠️  Agent interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Agent error: {e}")

    print()
    print("=" * 80)
    print(f"✓ Agent {agent_id} session completed")
    print("=" * 80)

def main():
    if len(sys.argv) < 2:
        print("Usage: spawn_agent.py <agent-id>")
        print("Example: spawn_agent.py frontend-cleanup-agent")
        sys.exit(1)

    agent_id = sys.argv[1]
    base_dir = Path(__file__).parent.parent.resolve()

    anyio.run(spawn_agent, agent_id, base_dir)

if __name__ == "__main__":
    main()
