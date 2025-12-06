# Project Context for Claude Code

## Project Overview

### Cashflow Planner
A Next.js application for personal cashflow and payment management:
- Kanban-style board for organizing payments by week
- Drag-and-drop between columns (Overdue, Week 1-4, Needs Work)
- Mark items as paid/unpaid
- Recurring expense management
- AI-powered payment capture and prioritization
- Supabase backend with authentication

## Code Standards
- TypeScript strict mode
- Tailwind CSS for styling
- Supabase for database and auth
- Zod for validation
- React Hook Form for forms
- Next.js 15 App Router
- dnd-kit for drag and drop

## Key Directories
- `src/app/` - Next.js app router pages
- `src/components/cashflow/` - Cashflow board components
- `src/components/ui/` - Shared UI components (shadcn/ui)
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utilities, types, constants
- `supabase/migrations/` - Database migrations

## Common Commands
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run ESLint
```

## Claude Code Sub-Agents
Use specialized sub-agents via the Task tool for focused expertise:

### When to Use Sub-Agents
- **backend-architect**: For API design, database schema, Next.js architecture
- **code-reviewer**: After completing significant code changes
- **testing-specialist**: For test strategy and writing test suites
- **security-auditor**: When handling auth, payments, sensitive data
- **frontend-specialist**: For React components, UI/UX, accessibility
- **documentation-writer**: For README updates, API docs
- **database-architect**: For schema changes, query optimization
- **playwright-tester**: For automated browser testing after feature completion
- **debugger-specialist**: For bug reproduction, root cause analysis

### Agent Usage Guidelines
- Use agents proactively when their expertise matches the task
- Delegate to specialists rather than handling complex domain logic directly
- For multi-faceted tasks, use multiple agents in sequence or parallel

## Three-Agent Development Workflow

### Agent Responsibilities

**Main Development Agent (YOU)**
- Feature planning and implementation
- Writing business logic
- Creating new functionality
- Coordination between agents

**Playwright Tester Agent**
- Automated browser testing
- Comprehensive test execution
- Bug detection and reporting

**Debugger Specialist Agent**
- Bug reproduction and analysis
- Root cause diagnosis
- Surgical bug fixes

### Testing Delegation Protocol

**CRITICAL: Never ask the user to manually test anything**

When feature implementation is complete:
- DO: Delegate to playwright-tester for automated verification
- DO: Let debugger-specialist handle any failures
- DO: Wait for final test results before claiming completion
- DON'T: Ask user to manually test
- DON'T: Debug test failures yourself (delegate to debugger-specialist)
