#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Setting up Langfuse Prompt MCP Server...${NC}"
echo ""

# Navigate to server directory
cd "$(dirname "$0")"

# Check Node.js version
NODE_VERSION=$(node -v 2>/dev/null)
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js v18 or higher.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js version: $NODE_VERSION${NC}"

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install --silent
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Check/Create .env file
ENV_FILE="$HOME/.claude/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}📝 Creating .env file...${NC}"
    
    # Create directory if it doesn't exist
    mkdir -p "$HOME/.claude"
    
    # Check if example file exists locally
    if [ -f ".env.example" ]; then
        cp ".env.example" "$ENV_FILE"
    else
        # Create a basic .env file
        cat > "$ENV_FILE" << EOF
# Langfuse Configuration
LANGFUSE_PUBLIC_KEY=your_public_key_here
LANGFUSE_SECRET_KEY=your_secret_key_here
# Optional: Change if using hosted Langfuse
# LANGFUSE_HOST=https://cloud.langfuse.com
EOF
    fi
    echo -e "${YELLOW}⚠️  Please update $ENV_FILE with your Langfuse API keys${NC}"
else
    echo -e "${GREEN}✅ .env file found at $ENV_FILE${NC}"
    
    # Check if keys are configured
    if grep -q "your_public_key_here\|your_secret_key_here" "$ENV_FILE"; then
        echo -e "${YELLOW}⚠️  Please update your Langfuse API keys in $ENV_FILE${NC}"
    fi
fi

# Test the server
echo ""
echo -e "${BLUE}🧪 Testing MCP server...${NC}"
if [ -f "test-mcp-server.js" ]; then
    node test-mcp-server.js 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Server test passed!${NC}"
    else
        echo -e "${YELLOW}⚠️  Server test had warnings. Check the output above.${NC}"
    fi
else
    # Quick inline test
    timeout 2 node server.js < /dev/null > /dev/null 2>&1
    if [ $? -eq 124 ] || [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Server starts without errors${NC}"
    else
        echo -e "${RED}❌ Server failed to start. Check for errors.${NC}"
        exit 1
    fi
fi

# Show MCP configuration
echo ""
echo -e "${BLUE}📋 MCP Configuration for Claude Code:${NC}"
echo ""
echo "Add this to your claude_desktop_config.json:"
echo ""
cat << EOF
{
  "langfuse-prompt": {
    "command": "node",
    "args": ["$(pwd)/server.js"],
    "env": {
      "NODE_ENV": "production"
    }
  }
}
EOF

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${BLUE}Available MCP Tools:${NC}"
echo "  • track     - Track prompts to Langfuse"
echo "  • evaluate  - Evaluate prompt quality"
echo "  • improve   - Improve prompts with AI techniques"
echo "  • compare   - Compare two prompt versions"
echo "  • patterns  - Extract patterns from high-scoring prompts"
echo "  • deploy    - Deploy prompts to production"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update $ENV_FILE with your Langfuse credentials"
echo "2. Add the configuration above to your claude_desktop_config.json"
echo "3. Restart Claude Code to load the MCP server"
echo ""
echo -e "${BLUE}For troubleshooting, run: node test-mcp-server.js${NC}"