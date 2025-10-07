#!/usr/bin/env python3
"""
Test script for Claude Agent SDK installation and basic functionality
"""
import asyncio
import anyio
from claude_agent_sdk import query

async def main():
    print("🧪 Testing Claude Agent SDK...")
    print("🤖 Querying Claude: 'What is 2 + 2?'")

    try:
        async for message in query(prompt="What is 2 + 2?"):
            print(f"📥 Response: {message}")
            break  # Just get the first response for testing
    except Exception as e:
        print(f"❌ Error: {e}")
        return

    print("✅ Claude Agent SDK is working correctly!")

if __name__ == "__main__":
    anyio.run(main)
