# Agent Learning System

## Core Concept

The agent doesn't learn by fine-tuning. It learns by maintaining a **living strategy document** that gets rewritten after each simulation run.

## How It Works

### During Simulation

The LangGraph orchestrator runs the simulation in batches (~30 days each):

1. **Plan**: LLM receives strategy doc + current state + KB data, outputs actions for next batch
2. **Simulate**: Sim engine executes the batch, advancing crop growth, depleting resources, rolling for events
3. **React** (if event fires): LLM receives event details + KB guidance, outputs response actions
4. Repeat until day 450

The strategy doc is read-only during a simulation run. It guides decisions but doesn't change mid-run.

### After Simulation

1. Evaluate the run (nutrition coverage, resource efficiency, crop survival)
2. Pass **current strategy doc + run results + key decisions** to the LLM
3. LLM rewrites the strategy -- keeps what works, drops what was disproven
4. Save as the new strategy doc (replaces the old one)

### Result

After N runs, you have **one concise document** (2-3 pages) that contains the agent's accumulated wisdom. It never grows unboundedly -- it gets sharper, not longer.

## Two Knowledge Sources

| Source | Role | Example |
|---|---|---|
| MCP Knowledge Base | Reference facts (static) | "Beans need 18-25C and moderate water" |
| Strategy Document | Learned wisdom (evolves) | "Start beans by day 5, stagger every 30 days" |

Both are injected into the agent's context when making decisions.
