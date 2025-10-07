#!/usr/bin/env python3
"""
Improved test script for Claude Agent SDK
"""
import asyncio
import anyio
from claude_agent_sdk import query, AssistantMessage, TextBlock

async def main():
    print("🧪 Testing Claude Agent SDK (Improved Version)...")
    print("🤖 Querying Claude: 'What is the capital of France?'")
    print()

    try:
        response_received = False
        async for message in query(prompt="What is the capital of France?"):
            if isinstance(message, AssistantMessage):
                for block in message.content:
                    if isinstance(block, TextBlock):
                        print(f"📥 Claude says: {block.text}")
                        response_received = True
                        break
                if response_received:
                    break
            elif hasattr(message, 'data') and 'type' in str(message.data):
                print(f"🔧 System: {message.data.get('type', 'unknown')}")
    except Exception as e:
        print(f"❌ Error: {e}")
        return

    if response_received:
        print("\n✅ Claude Agent SDK is working correctly!")
        print("🎉 Ready to use for .agents functionality!")
    else:
        print("\n⚠️  SDK connected but no text response received")

if __name__ == "__main__":
    anyio.run(main)
