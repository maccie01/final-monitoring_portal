#!/usr/bin/env python3
"""
Example script showing how to use the Memory MCP server with Claude Agent SDK
"""
import asyncio
import anyio
from claude_agent_sdk import ClaudeAgentOptions, ClaudeSDKClient

async def memory_mcp_example():
    """
    Example of using the Memory MCP server for persistent knowledge storage
    """

    # Configure the Memory MCP server
    memory_server = {
        "type": "stdio",
        "command": "docker",
        "args": ["run", "--rm", "mcp/memory"]
    }

    # Claude Agent options with memory MCP
    options = ClaudeAgentOptions(
        mcp_servers={"memory": memory_server},
        allowed_tools=[
            "mcp__memory__create_entities",
            "mcp__memory__create_relations",
            "mcp__memory__add_observations",
            "mcp__memory__read_graph",
            "mcp__memory__search_nodes",
            "mcp__memory__open_nodes",
            "mcp__memory__delete_entities",
            "mcp__memory__delete_observations",
            "mcp__memory__delete_relations"
        ],
        system_prompt="""
        You have access to a persistent knowledge graph memory system.
        Use it to store and organize information as entities with observations and relations.
        Always use the memory tools to persist important information for future reference.
        """,
        max_turns=5  # Limit interactions for examples
    )

    print("🧠 Memory MCP Example")
    print("=" * 40)
    print("This example demonstrates persistent memory storage using a knowledge graph.")
    print()

    try:
        async with ClaudeSDKClient(options=options) as client:
            print("📝 Step 1: Creating project knowledge")
            print("Asking Claude to store information about this project...")

            await client.query("""
            Create entities for this Netzwächter project:
            - Entity: Netzwächter (type: software_application)
              Observations: Heating system monitoring application, Built with React and Node.js, Uses PostgreSQL database, Provides real-time temperature monitoring, Includes energy efficiency analysis

            - Entity: React (type: technology)
              Observations: Frontend framework, Component-based architecture, TypeScript support, Virtual DOM

            - Entity: PostgreSQL (type: technology)
              Observations: Relational database, ACID compliance, JSON support, Used for settings and monitoring data

            Then create relations showing how they connect.
            """)

            # Process responses
            async for message in client.receive_response():
                if hasattr(message, 'content'):
                    for block in message.content:
                        if hasattr(block, 'text'):
                            print(f"🤖 Claude: {block.text[:200]}...")
                            break
                break  # Just show first response

            print()
            print("🔍 Step 2: Retrieving stored information")
            print("Asking Claude to search and retrieve the stored knowledge...")

            await client.query("Search for 'Netzwächter' in the knowledge graph and tell me what technologies it uses.")

            # Process search responses
            async for message in client.receive_response():
                if hasattr(message, 'content'):
                    for block in message.content:
                        if hasattr(block, 'text'):
                            print(f"🔍 Results: {block.text[:300]}...")
                            break
                break

    except Exception as e:
        print(f"❌ Error in memory MCP example: {e}")
        print()
        print("💡 Note: The memory MCP server requires proper tool naming.")
        print("   Current tools may be named differently than expected.")
        return False

    print()
    print("✅ Memory MCP Example Completed!")
    return True

async def main():
    await memory_mcp_example()

if __name__ == "__main__":
    anyio.run(main)
