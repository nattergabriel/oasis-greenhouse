# Technical Stack & Infrastructure

> Extracted from the official Getting Started Guide. This is the reference for how everything connects.

---

## MCP Knowledge Base (critical for simulation + agent)

### Endpoint
```
https://kb-start-hack-gateway-buyjtibfpg.gateway.bedrock-agentcore.us-east-2.amazonaws.com/mcp
```

### Protocol
- Type: **Streamable HTTP**
- No authentication headers needed (access controlled by AWS account)

### Configuration (for Kiro / any MCP client)
```json
{
  "mcpServers": {
    "mars-crop-knowledge-base": {
      "type": "streamableHttp",
      "url": "https://kb-start-hack-gateway-buyjtibfpg.gateway.bedrock-agentcore.us-east-2.amazonaws.com/mcp",
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

### Knowledge Base Domains (7 datasets in Amazon Bedrock KB)
1. **Mars Environmental Constraints** — gravity, atmosphere, solar, soil, temperature
2. **Controlled Environment Agriculture Principles** — hydroponics, environmental control
3. **Crop Profiles** — growth cycles, water/nutrient needs, yield, stress response
4. **Plant Stress and Response Guide** — detection and mitigation strategies
5. **Human Nutritional Strategy** — caloric/nutrient requirements for 4 astronauts
6. **Greenhouse Operational Scenarios** — failure modes, crisis events
7. **Innovation Impact (Mars to Earth)** — sustainability, Earth applications

### Example Queries
- "What are the optimal temperature and humidity ranges for growing lettuce on Mars?"
- "Query the knowledge base for water requirements per crop growth stage"
- "What crops are best suited for a 450-day Mars mission and why?"
- "What happens if the water recycling system fails in the greenhouse?"

### Why this matters for the simulation
The simulation parameters (crop growth rates, environmental constants, nutritional targets, failure scenarios) should be grounded in this knowledge base. The agent will query this same source when making decisions. If the simulation uses different data than the KB, the agent's reasoning won't match reality.

**Action:** Query each domain and extract the concrete numbers to validate/update `simulation/SIMULATION-SPEC.md`.

---

## AWS Infrastructure (provided per team)

| Resource | Detail |
|----------|--------|
| AWS Sandbox Account | 1 per team, via Workshop Studio |
| Region | us-east-1 |
| Kiro Access Code | 1 per person |
| Credentials | Temporary, from Workshop Studio (expire periodically) |

### Credential Setup
```bash
export AWS_ACCESS_KEY_ID="<from-workshop-studio>"
export AWS_SECRET_ACCESS_KEY="<from-workshop-studio>"
export AWS_SESSION_TOKEN="<from-workshop-studio>"
export AWS_DEFAULT_REGION="us-east-1"
```

Verify: `aws sts get-caller-identity`

---

## Recommended Stack (from organizers)

### Frontend
- **AWS Amplify Gen2** — React-based, easy deployment
- Supports: Auth (Cognito), Data (GraphQL/DynamoDB), Storage (S3), Functions (Lambda)
- Dev: `npm run dev` + `npx ampx sandbox` for backend

### Agent Framework
- **Strands Agents SDK** (Python) — open-source, integrates with Bedrock
- Install: `pip install strands-agents strands-agents-tools`
- Supports: tool use, LLM calls, multi-step reasoning
- Deploy to: Amazon Bedrock AgentCore Runtime

### Agent Deployment
- **Amazon Bedrock AgentCore** — hosting, scaling, operating AI agents
- Runtime: Firecracker MicroVMs (isolated per session)
- Gateway: enforces policies on agent-tool interactions
- Reference repos:
  - [AgentCore Samples](https://github.com/awslabs/amazon-bedrock-agentcore-samples)
  - [Full-Stack AgentCore Template (FAST)](https://github.com/awslabs/fullstack-solution-template-for-agentcore)

### Database
- **DynamoDB** — for simulation state, run history, agent logs

### IDE
- **Kiro** — AI-powered IDE (VS Code fork)
- Enable Powers: **Strands SDK** + **Amplify**
- Steering files in `.kiro/steering/`

---

## Architecture Overview

```
[Frontend (Amplify/React)]
        │
        ▼
[API Layer (Lambda / REST)]
        │
        ▼
[Simulation Engine (Python)]  ←→  [Agent (Strands SDK)]
        │                                │
        ▼                                ▼
[DynamoDB (state/logs)]        [AgentCore Gateway (/mcp)]
                                         │
                                         ▼
                               [Bedrock Knowledge Base]
                               (7 Syngenta domains)
```

---

## Key Links

| Resource | URL |
|----------|-----|
| MCP Endpoint | `https://kb-start-hack-gateway-buyjtibfpg.gateway.bedrock-agentcore.us-east-2.amazonaws.com/mcp` |
| Amplify Gen2 Docs | https://docs.amplify.aws/gen2/ |
| Kiro Downloads | https://kiro.dev/downloads |
| Strands SDK (GitHub) | https://github.com/strands-agents/sdk-python |
| Strands Docs | https://strandsagents.com |
| AgentCore Samples | https://github.com/awslabs/amazon-bedrock-agentcore-samples |
| FAST Template | https://github.com/awslabs/fullstack-solution-template-for-agentcore |
| Workshop Studio | https://join.workshops.aws |
| Discord | https://discord.gg/BQxYYxpU |
