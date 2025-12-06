# Claude Code Agent Library - Quick Reference

## Installation Complete

Your global agent library is now set up and ready to use!

## Your Agent Team

### 1. **appraisal-expert**
   - USPAP compliance expert
   - Florida market specialist
   - Adjustment calculations
   - Comparable selection

### 2. **backend-architect**
   - API design and architecture
   - Next.js and server-side logic
   - Database schema design
   - Scalability planning

### 3. **frontend-specialist**
   - React and UI development
   - Component design
   - Responsive layouts
   - Accessibility

### 4. **testing-specialist**
   - Test strategy
   - Unit, integration, E2E tests
   - Code coverage
   - Quality assurance

### 5. **code-reviewer**
   - Code quality reviews
   - Security checks
   - Performance optimization
   - Best practices

### 6. **database-architect**
   - PostgreSQL schema design
   - Prisma ORM
   - Query optimization
   - Migrations

### 7. **security-auditor**
   - Vulnerability scanning
   - Authentication review
   - Input validation
   - OWASP compliance

### 8. **documentation-writer**
   - Technical documentation
   - API docs
   - User guides
   - Code comments

## How to Use Agents

### In CLI (Agents Auto-Available)

The agents in `~/.claude/agents/` are automatically available in all CLI sessions:

```bash
# Explicit agent use (not yet supported, but planned)
claude "Use the appraisal-expert agent to review comp adjustments in src/lib/comps.ts"

# Natural language (Claude auto-selects agent)
claude "Review the security of my authentication system"
# → Automatically uses security-auditor

claude "Design an API for property comparables"
# → Automatically uses backend-architect
```

### In Web Interface

Agents are loaded from your project's `.claude/agents/` directory.

Your project now has:
- `.claude/agents/` - All 8 specialists
- `.claude/memory/` - Agent memory system
- `CLAUDE.md` - Project context

**To use in web:**
1. Commit and push these files
2. Connect repo at claude.ai/code
3. Agents load automatically!

## Agent Memory System

Agents can read/update context files:

### `.claude/memory/preferences.json`
```json
{
  "adjustments": {
    "gla_per_sqft": 95,
    "waterfront_premium": 0.18,
    "pool_value": 12000
  },
  "comp_criteria": {
    "max_distance_miles": 1.0,
    "max_age_months": 6
  }
}
```

### `.claude/memory/market-conditions.json`
```json
{
  "markets": {
    "brevard_county": {
      "trend": "stable",
      "monthly_appreciation": 0.005
    }
  }
}
```

### `.claude/memory/lessons-learned.json`
Agents can store insights here for future reference.

## Example Workflows

### 1. New Feature Development
```
You: "Add a waterfront property premium calculator"

Claude uses:
1. backend-architect → Design API
2. database-architect → Schema changes
3. appraisal-expert → Validate formulas
4. frontend-specialist → Build UI
5. testing-specialist → Write tests
6. code-reviewer → Final review
```

### 2. Security Audit
```
You: "Audit authentication and API security"

Claude uses:
1. security-auditor → Find vulnerabilities
2. code-reviewer → Review fixes
3. testing-specialist → Test security
```

### 3. Comp Analysis Feature
```
You: "Build comparable property analysis system"

Claude uses:
1. appraisal-expert → Define requirements
2. backend-architect → API design
3. database-architect → Data model
4. frontend-specialist → UI components
5. testing-specialist → Test coverage
```

## Updating Agents

### Update Global Library
```bash
# Edit any agent
vim ~/.claude/agents/appraisal-expert.md

# Sync to projects
cd ~/Documents/Salesmod
~/setup-agents.sh
```

### Update Project-Specific
```bash
# Edit project agent
vim .claude/agents/appraisal-expert.md

# Commit changes
git add .claude/agents/
git commit -m "Update appraisal-expert agent"
```

## Memory Management

Update agent memories as you learn:

```bash
# Update market conditions
vim .claude/memory/market-conditions.json

# Update preferences
vim .claude/memory/preferences.json

# Agents will read these on next session
```

## Setup New Projects

```bash
cd new-project
~/setup-agents.sh        # Copy agents
~/setup-agent-memory.sh  # Create memory system
cp ~/CLAUDE-template.md CLAUDE.md  # Add context

# Customize CLAUDE.md for project
vim CLAUDE.md

# Commit
git add .claude/ CLAUDE.md
git commit -m "Add Claude Code agents"
```

## Tips

1. **Natural Language**: Just describe your task, Claude will pick the right agent(s)
2. **Multi-Agent**: Claude can use multiple agents in one session
3. **Context Matters**: Keep CLAUDE.md updated with project specifics
4. **Memory Updates**: Let agents update preferences.json as you work
5. **Agent Evolution**: Improve agents based on experience

## Agent File Structure

```
~/.claude/agents/           # Global library (CLI auto-loads)
└── *.md                    # Agent definitions

your-project/
├── .claude/
│   ├── agents/             # Project-specific agents
│   │   └── *.md
│   └── memory/             # Agent memory
│       ├── preferences.json
│       ├── market-conditions.json
│       └── lessons-learned.json
└── CLAUDE.md               # Project context
```

## Next Steps

1. Try a task: "Review my appraisal adjustment calculations"
2. Watch which agents Claude uses
3. Update preferences based on feedback
4. Evolve agents as you learn

Your agent team is ready to work!
