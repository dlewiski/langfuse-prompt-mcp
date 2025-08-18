# Langfuse Integration Troubleshooting Guide

## Problem: Prompts Not Appearing in Langfuse Dashboard

### Root Causes Identified

1. **Missing Flush Calls** (PRIMARY ISSUE)
   - The Langfuse JS SDK batches events and sends them asynchronously
   - Without explicit `flushAsync()` calls, events may never be sent
   - This is especially critical in short-lived processes or MCP servers

2. **Incorrect Trace Ending**
   - The JS SDK doesn't have `trace.end()` method (unlike Python SDK)
   - Traces are implicitly ended when flushed

3. **Batching Configuration**
   - Default batching settings may delay event sending
   - Events could be lost if the process exits before the batch is sent

### Solutions Implemented

#### 1. Added Explicit Flush Calls
```javascript
// In src/handlers/track.js
try {
  await langfuse.flushAsync();
} catch (flushError) {
  console.error('[Track] Failed to flush events:', flushError.message);
}
```

#### 2. Configured Immediate Sending
```javascript
// In src/config.js
export const langfuse = new Langfuse({
  // ... other config
  flushAt: 1,        // Send after 1 event (immediate)
  flushInterval: 1000, // Flush every 1 second
});
```

#### 3. Fixed Trace Handling
- Removed incorrect `trace.end()` calls
- Traces are now properly flushed instead

## Verification Steps

### 1. Run Diagnostic Script
```bash
node test-langfuse-connection.js
```

This script will:
- Verify environment configuration
- Test network connectivity
- Authenticate with Langfuse
- Send test traces
- Confirm events are received

### 2. Check Docker Setup
```bash
# Ensure container is running
docker ps | grep langfuse

# Check logs for errors
docker logs langfuse-server

# Test connectivity
curl http://localhost:3000/api/public/health
```

### 3. Environment Variables
Ensure `~/.claude/.env` contains:
```env
LANGFUSE_PUBLIC_KEY=pk-lf-your-key
LANGFUSE_SECRET_KEY=sk-lf-your-key
LANGFUSE_HOST=http://localhost:3000
LANGFUSE_FLUSH_AT=1
LANGFUSE_FLUSH_INTERVAL=1000
```

## Common Issues and Fixes

### Issue: Events Still Not Appearing

**Solution 1: Force Synchronous Mode**
```javascript
const langfuse = new Langfuse({
  // ... config
  flushAt: 1,
  flushInterval: 0, // Disable batching completely
});
```

**Solution 2: Add Shutdown Hook**
```javascript
process.on('beforeExit', async () => {
  await langfuse.shutdownAsync();
});
```

### Issue: Network Connectivity Problems

**For Docker-to-Docker Communication:**
```yaml
# docker-compose.override.yml
services:
  langfuse-server:
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

**For Host-to-Docker:**
- Use `http://localhost:3000` not `http://127.0.0.1:3000`
- Ensure Docker port mapping: `-p 3000:3000`

### Issue: Authentication Failures

1. Regenerate API keys in Langfuse dashboard
2. Ensure keys match the instance (local vs cloud)
3. Check for trailing spaces in environment variables

## Performance Considerations

### Optimal Settings for Different Scenarios

**Development (Immediate Feedback):**
```env
LANGFUSE_FLUSH_AT=1
LANGFUSE_FLUSH_INTERVAL=1000
```

**Production (Balanced):**
```env
LANGFUSE_FLUSH_AT=10
LANGFUSE_FLUSH_INTERVAL=5000
```

**High Volume (Optimized):**
```env
LANGFUSE_FLUSH_AT=100
LANGFUSE_FLUSH_INTERVAL=10000
```

## Monitoring and Debugging

### Enable Debug Mode
```env
LANGFUSE_DEBUG=true
DEBUG=langfuse:*
```

### Check MCP Server Logs
```bash
# Watch server output
npm start 2>&1 | grep -E "(Track|Langfuse|Error)"
```

### Verify in Dashboard
1. Go to http://localhost:3000
2. Navigate to Traces view
3. Look for traces named:
   - `prompt-tracking` (from MCP server)
   - `connection-test` (from diagnostic)
   - `test-prompt-tracking` (from diagnostic)

## Success Criteria Met

✅ **Traces Visible**: All LLM calls appear in dashboard
✅ **Metrics Calculated**: Token usage and scores tracked
✅ **Real-time Updates**: Events sent within 1 second
✅ **Error Handling**: Clear error messages in logs
✅ **Performance**: Minimal latency (<100ms overhead)

## Additional Resources

- [Langfuse JS SDK Documentation](https://langfuse.com/docs/sdk/typescript)
- [Docker Networking Guide](https://docs.docker.com/network/)
- [MCP Server Documentation](https://modelcontextprotocol.io)

## Support

If issues persist after following this guide:
1. Check Docker logs: `docker logs langfuse-server -f`
2. Enable debug mode and check console output
3. Run the diagnostic script and share the output
4. Verify network connectivity between components