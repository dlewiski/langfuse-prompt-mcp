#!/bin/bash

echo "🚀 Setting up Langfuse Prompt MCP Server..."

# Navigate to server directory
cd "$(dirname "$0")"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f "$HOME/.claude/.env" ]; then
    echo "📝 Creating .env file..."
    cp "$HOME/.claude/.env.example" "$HOME/.claude/.env"
    echo "⚠️  Please update $HOME/.claude/.env with your Langfuse API keys"
fi

echo "✅ Setup complete!"
echo ""
echo "To use the prompt management system:"
echo "1. Update $HOME/.claude/.env with your Langfuse credentials"
echo "2. Restart Claude Code to load the new MCP server"
echo "3. Use commands like /prompt-auto-improve, /prompt-review, etc."
echo ""
echo "Available commands:"
echo "  /prompt-auto-improve    - Full improvement pipeline"
echo "  /prompt-review         - Quick evaluation"
echo "  /prompt-discover-patterns - Learn from your data"
echo "  /prompt-test-improvement - Test specific techniques"
echo "  /prompt-compare-versions - Compare two versions"