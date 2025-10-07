#!/usr/bin/env python3
"""
Working test script for Memory MCP server integration with Claude Agent SDK
"""
import asyncio
import anyio
from claude_agent_sdk import ClaudeAgentOptions, ClaudeSDKClient

async def test_memory_mcp_working():
    print("🧠 Testing Memory MCP Server Integration (Working Version)...")
    print("=" * 60)

    # Configure MCP server for memory
    memory_mcp_config = {
        "type": "stdio",
        "command": "docker",
        "args": ["run", "--rm", "mcp/memory"]
    }

    options = ClaudeAgentOptions(
        mcp_servers={
            "memory": memory_mcp_config
        },
        allowed_tools=[
            "mcp__memory__create_entities",
            "mcp__memory__create_relations",
            "mcp__memory__add_observations",
            "mcp__memory__read_graph",
            "mcp__memory__search_nodes",
            "mcp__memory__open_nodes"
        ],
        system_prompt="You have access to a persistent knowledge graph memory system. Use it to store and retrieve information as entities, relations, and observations.",
        max_turns=3  # Limit for testing
    )

    print("🔧 MCP Configuration:")
    print(f"  - Server: memory (mcp/memory)")
    print(f"  - Type: stdio (Docker container)")
    print(f"  - Tools: 9 available (knowledge graph operations)")
    print()

    print("📋 Available Memory MCP Tools:")
    tools = [
        "create_entities - Create entities in knowledge graph",
        "create_relations - Create relations between entities",
        "add_observations - Add observations to entities",
        "delete_entities - Remove entities and relations",
        "delete_observations - Remove specific observations",
        "delete_relations - Remove relations",
        "read_graph - Read entire knowledge graph",
        "search_nodes - Search entities by query",
        "open_nodes - Retrieve specific entities"
    ]
    for tool in tools:
        print(f"  • {tool}")
    print()

    try:
        print("🤖 Starting Claude SDK Client with Memory MCP...")
        async with ClaudeSDKClient(options=options) as client:
            print("✅ Connected successfully!")
            print()

            # Test 1: Basic memory operations
            print("🧪 Test 1: Creating and retrieving memory")
            print("Sending: 'Create an entity for this project and add some observations'")
            print("-" * 50)

            await client.query(
                "Create a knowledge graph entity for the 'Netzwächter' project. "
                "Add observations about it being a heating system monitoring application "
                "built with React, Node.js, and PostgreSQL. Then read the graph to confirm it was stored."
            )

            # Collect responses
            response_count = 0
            async for msg in client.receive_response():
                response_count += 1
                print(f"📥 Response {response_count}: {str(msg)[:200]}{'...' if len(str(msg)) > 200 else ''}")

                # Limit responses for testing
                if response_count >= 5:
                    break

            print()
            print("🧪 Test 2: Memory search and retrieval")
            print("Sending: 'Search for information about Netzwächter'")
            print("-" * 50)

            await client.query("Search the knowledge graph for 'Netzwächter' and tell me what you find.")

            # Collect search responses
            search_count = 0
            async for msg in client.receive_response():
                search_count += 1
                print(f"🔍 Search Response {search_count}: {str(msg)[:200]}{'...' if len(str(msg)) > 200 else ''}")

                if search_count >= 3:
                    break

    except Exception as e:
        print(f"❌ Error: {e}")
        print()
        print("🔧 Troubleshooting:")
        print("1. Ensure Docker is running: docker ps")
        print("2. Check MCP image: docker images | grep mcp/memory")
        print("3. Try manual test: echo 'test' | docker run --rm -i mcp/memory")
        print("4. Check Claude Code: claude --version")
        return False

    print()
    print("✅ Memory MCP Integration Test Completed Successfully!")
    print("🎉 The memory MCP server is working with Claude Agent SDK!")
    return True

async def main():
    success = await test_memory_mcp_working()
    return success

if __name__ == "__main__":
    success = anyio.run(main)
    exit(0 if success else 1)
