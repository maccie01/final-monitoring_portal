# Claude Agent SDK Setup

This directory contains the Claude Agent SDK setup for Python-based agent interactions with Claude Code.

## 🚀 Installation Status

✅ **Claude Agent SDK**: Installed (v0.1.1)
✅ **Python Virtual Environment**: Created at `.agents/venv/`
✅ **Claude Code**: Installed (v2.0.9)
✅ **Prerequisites**: All met (Python 3.10+, Node.js)

## 📋 Prerequisites Verified

- **Python 3.10+**: ✅ Available
- **Node.js**: ✅ Available
- **Claude Code 2.0.0+**: ✅ Version 2.0.9 installed

## 🔧 Usage

### Activating the Virtual Environment

```bash
cd /path/to/project
source .agents/venv/bin/activate
```

### Basic Query Example

```python
import anyio
from claude_agent_sdk import query

async def main():
    async for message in query(prompt="Hello Claude!"):
        print(message)

anyio.run(main)
```

### Advanced Usage with Options

```python
from claude_agent_sdk import query, ClaudeAgentOptions

options = ClaudeAgentOptions(
    system_prompt="You are a helpful coding assistant",
    max_turns=3,
    allowed_tools=["Read", "Write", "Bash"]
)

async def main():
    async for message in query(
        prompt="Help me refactor this code",
        options=options
    ):
        print(message)

anyio.run(main)
```

### Using ClaudeSDKClient for Interactive Sessions

```python
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions

async def main():
    options = ClaudeAgentOptions(
        cwd="/path/to/project",
        allowed_tools=["Read", "Write", "Bash", "Grep"]
    )

    async with ClaudeSDKClient(options=options) as client:
        await client.query("Analyze this codebase")

        async for msg in client.receive_response():
            print(msg)

anyio.run(main)
```

## 🛠️ Custom Tools Support

### Creating In-Process MCP Tools

```python
from claude_agent_sdk import tool, create_sdk_mcp_server

@tool("analyze_code", "Analyze code quality", {"file_path": str})
async def analyze_code(args):
    # Your tool implementation
    return {
        "content": [
            {"type": "text", "text": f"Analysis of {args['file_path']}"}
        ]
    }

# Create server
server = create_sdk_mcp_server(
    name="code-tools",
    version="1.0.0",
    tools=[analyze_code]
)

# Use with Claude
options = ClaudeAgentOptions(
    mcp_servers={"code-tools": server},
    allowed_tools=["mcp__code-tools__analyze_code"]
)
```

## 🪝 Hooks System

### Pre-Tool-Use Hook Example

```python
from claude_agent_sdk import HookMatcher

async def security_check(input_data, tool_use_id, context):
    tool_name = input_data["tool_name"]
    if tool_name == "Bash":
        command = input_data["tool_input"].get("command", "")
        if "rm -rf" in command:
            return {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": "Dangerous command blocked"
                }
            }
    return {}

options = ClaudeAgentOptions(
    allowed_tools=["Bash"],
    hooks={
        "PreToolUse": [
            HookMatcher(matcher="Bash", hooks=[security_check])
        ]
    }
)
```

## 🧪 Testing

### Run Basic Test
```bash
source .agents/venv/bin/activate
python .agents/test_sdk_improved.py
```

Expected output:
```
🧪 Testing Claude Agent SDK (Improved Version)...
🤖 Querying Claude: 'What is the capital of France?'

🔧 System: system
📥 Claude says: Paris

✅ Claude Agent SDK is working correctly!
🎉 Ready to use for .agents functionality!
```

## 📁 File Structure

```
.agents/
├── venv/                    # Python virtual environment
├── test_sdk.py             # Basic functionality test
├── test_sdk_improved.py    # Improved test with proper response handling
└── README.md               # This documentation
```

## 🔧 Available Tools

The SDK provides access to Claude Code's comprehensive tool set:

- **File Operations**: Read, Write, Edit
- **Search**: Grep, Glob
- **Shell**: Bash, KillShell
- **Web**: WebFetch, WebSearch
- **Development**: Task, TodoWrite, NotebookEdit
- **System**: ExitPlanMode, SlashCommand

## ⚙️ Configuration Options

### ClaudeAgentOptions

```python
ClaudeAgentOptions(
    system_prompt="Custom system prompt",
    max_turns=5,
    cwd="/working/directory",
    allowed_tools=["Read", "Write", "Bash"],
    permission_mode="acceptEdits",  # Auto-accept file changes
    mcp_servers={"name": server},   # Custom MCP servers
    hooks={"event": [hooks]}        # Custom hooks
)
```

## 🚨 Error Handling

```python
from claude_agent_sdk import (
    ClaudeSDKError,      # Base error
    CLINotFoundError,    # Claude Code not installed
    CLIConnectionError,  # Connection issues
    ProcessError,        # Process execution errors
)

try:
    async for message in query(prompt="Hello"):
        pass
except CLINotFoundError:
    print("Install Claude Code: npm install -g @anthropic-ai/claude-code")
except ProcessError as e:
    print(f"Process error: {e}")
```

## 🔄 Migration Notes

If upgrading from older Claude Code SDK versions:
- `ClaudeCodeOptions` → `ClaudeAgentOptions`
- Merged system prompt configuration
- New programmatic subagents support
- Enhanced session forking capabilities

## 📚 Resources

- [Claude Agent SDK Documentation](https://docs.anthropic.com/claude-agent-sdk)
- [Claude Code Tools Reference](https://docs.anthropic.com/claude-code/tools)
- [MCP Protocol Specification](https://modelcontextprotocol.io/specification)

## 🎯 Next Steps

1. **Create Custom Tools**: Implement project-specific tools using the `@tool` decorator
2. **Add Security Hooks**: Implement pre-tool-use validation for dangerous operations
3. **Build Agent Workflows**: Create automated workflows using `ClaudeSDKClient`
4. **Integrate with CI/CD**: Use SDK for automated code analysis and improvements

---

**Status**: ✅ **Fully Operational**
**SDK Version**: 0.1.1
**Claude Code Version**: 2.0.9
**Last Verified**: October 7, 2025