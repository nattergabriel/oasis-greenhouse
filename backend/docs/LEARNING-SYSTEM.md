# Agent Learning System

## Core Concept

The agent doesn't learn by fine-tuning. It learns by maintaining a **living strategy document** that gets rewritten after each simulation run.

## How It Works

### During Simulation

Each day tick:
1. Update greenhouse state (crops grow, resources deplete, events fire)
2. Pass **strategy doc + current state** to the LLM as context
3. LLM decides actions (adjust temp, plant crop, harvest, etc.)
4. Apply actions to state
5. Next day

### After Simulation

1. Evaluate the run (nutrition coverage, resource efficiency, crop survival)
2. Pass **current strategy doc + run results** to the LLM
3. LLM rewrites the strategy — keeps what works, drops what was disproven
4. Save as the new strategy doc (replaces the old one)

### Result

After N runs, you have **one concise document** (2-3 pages) that contains the agent's accumulated wisdom. It never grows unboundedly — it gets sharper, not longer.

## Two Knowledge Sources

| Source | Role | Example |
|---|---|---|
| MCP Knowledge Base | Reference facts (static) | "Soybeans need 20-25°C and 60-70% humidity" |
| Strategy Document | Learned wisdom (evolves) | "Start soybeans by day 5, stagger every 30 days" |

Both are injected into the agent's context when making decisions.

