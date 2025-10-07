#!/usr/bin/env python3
"""
Test script for Memory MCP server integration with Claude Agent SDK
"""
import asyncio
import anyio
from claude_agent_sdk import ClaudeAgentOptions, ClaudeSDKClient

async def test_memory_mcp():
    print("🧠 Testing Memory MCP Server Integration...")
    print("=" * 50)

    # Configure MCP server
    memory_mcp_config = {
        "type": "stdio",
        "command": "docker",
        "args": ["run", "--rm", "mcp/memory"]
    }

    options = ClaudeAgentOptions(
        mcp_servers={
            "memory": memory_mcp_config
        },
        allowed_tools=["mcp__memory__*"],  # Allow all memory MCP tools
        system_prompt="You have access to a persistent memory system. Use it to store and retrieve information across conversations."
    )

    print("🔧 MCP Configuration:")
    print(f"  - Server: memory")
    print(f"  - Type: stdio")
    print(f"  - Command: {' '.join(memory_mcp_config['args'])}")
    print()

    try:
        async with ClaudeSDKClient(options=options) as client:
            print("🤖 Testing Memory MCP Connection...")
            print("Sending: 'Hello! Can you access the memory system?'")
            print("-" * 40)

            await client.query("Hello! Can you access the memory system? Please show me what memory tools are available.")

            # Collect responses
            responses = []
            async for msg in client.receive_response():
                responses.append(str(msg))
                if len(responses) >= 5:  # Limit responses for testing
                    break

            print("📥 Responses received:")
            for i, response in enumerate(responses, 1):
                print(f"  {i}. {response[:100]}{'...' if len(response) > 100 else ''}")

            print()
            print("🧪 Testing Memory Operations...")
            print("Sending: 'Please store this information: My favorite color is blue'")
            print("-" * 40)

            await client.query("Please store this information in memory: My favorite color is blue. Then retrieve it back to confirm it was stored.")

            # Collect memory operation responses
            memory_responses = []
            async for msg in client.receive_response():
                memory_responses.append(str(msg))
                if len(memory_responses) >= 10:  # Allow more responses for memory operations
                    break

            print("📥 Memory Operation Responses:")
            for i, response in enumerate(memory_responses, 1):
                print(f"  {i}. {response[:120]}{'...' if len(response) > 120 else ''}")

    except Exception as e:
        print(f"❌ Error testing Memory MCP: {e}")
        print()
        print("🔍 Troubleshooting:")
        print("1. Make sure Docker is running")
        print("2. Check if the mcp/memory image is available: docker images | grep mcp/memory")
        print("3. Try running the MCP server manually: docker run --rm mcp/memory")
        return False

    print()
    print("✅ Memory MCP Test Completed!")
    return True

async def check_mcp_tools():
    """Check what tools the memory MCP provides"""
    print("🔍 Checking Memory MCP Tools...")

    try:
        # Try a simple query to see if we can detect available tools
        from claude_agent_sdk import query

        print("Querying Claude about available tools...")
        async for message in query(prompt="What MCP servers and tools do you have access to?"):
            print(f"Available: {message}")
            break

    except Exception as e:
        print(f"Error checking tools: {e}")

async def main():
    print("🧠 Memory MCP Server Test")
    print("=" * 50)

    # First check what's currently available
    await check_mcp_tools()

    print("\n" + "=" * 50)

    # Then test the memory MCP integration
    success = await test_memory_mcp()

    if success:
        print("\n🎉 Memory MCP integration successful!")
    else:
        print("\n⚠️  Memory MCP integration needs troubleshooting.")

if __name__ == "__main__":
    anyio.run(main)
