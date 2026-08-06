# Cross-Module Impact Template

Copy this block into change planning or PR description when touching shared logic.

## Impact Plan

| Field | Value |
|-------|-------|
| **Trigger module** | |
| **Change type** | schema / RPC / lib / UI / edge |
| **Symbols touched** | (function names, RPC, tables) |

### Dependent modules (search results)

| Module/path | Relationship | Action needed |
|-------------|--------------|---------------|
| | consumer / sibling / shared RPC | patch now / verify / follow-up |

### Risks if dependents not updated

-

### Verification plan

- [ ] `npm run lint` + `npm run build`
- [ ] MCP SQL smoke (if RPC/schema)
- [ ] Stuck-state query (if state-transition RPC)

### Impact Report (fill after implementation)

- **Changed modules:**
- **Verified dependents:**
- **Follow-up (if deferred):**
