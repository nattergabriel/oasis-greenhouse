"""
Query the Syngenta MCP Knowledge Base and save results locally.

Run this on YOUR machine (not in Claude Desktop — the endpoint is blocked there).

Usage:
    pip install requests
    python query_mcp.py

Output:
    simulation/kb_data/tools.json          — available MCP tools
    simulation/kb_data/domain_1_mars.json  — Mars environmental data
    simulation/kb_data/domain_2_cea.json   — Controlled environment agriculture
    simulation/kb_data/domain_3_crops.json — Crop profiles
    simulation/kb_data/domain_4_stress.json — Plant stress & response
    simulation/kb_data/domain_5_nutrition.json — Human nutritional strategy
    simulation/kb_data/domain_6_scenarios.json — Greenhouse operational scenarios
    simulation/kb_data/domain_7_earth.json — Mars-to-Earth innovation
    simulation/kb_data/raw_responses.json  — All raw responses for reference
"""

import requests
import json
import os
import time

MCP_URL = "https://kb-start-hack-gateway-buyjtibfpg.gateway.bedrock-agentcore.us-east-2.amazonaws.com/mcp"

HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream"
}

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "kb_data")

# ─────────────────────────────────────────────
# MCP Protocol helpers
# ─────────────────────────────────────────────

session_id = None

def mcp_request(method, params=None):
    """Send a JSON-RPC 2.0 request to the MCP endpoint."""
    global session_id

    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
    }
    if params:
        payload["params"] = params

    headers = dict(HEADERS)
    if session_id:
        headers["Mcp-Session-Id"] = session_id

    print(f"  → {method}" + (f" ({json.dumps(params)[:80]}...)" if params else ""))

    try:
        resp = requests.post(MCP_URL, headers=headers, json=payload, timeout=60)

        # Capture session ID from response headers
        if "Mcp-Session-Id" in resp.headers:
            session_id = resp.headers["Mcp-Session-Id"]

        # Handle SSE (text/event-stream) responses
        content_type = resp.headers.get("Content-Type", "")
        if "text/event-stream" in content_type:
            return parse_sse(resp.text)

        resp.raise_for_status()
        return resp.json()

    except requests.exceptions.RequestException as e:
        print(f"  ✗ Request failed: {e}")
        return {"error": str(e)}


def parse_sse(text):
    """Parse Server-Sent Events response into JSON."""
    result = None
    for line in text.split("\n"):
        if line.startswith("data: "):
            try:
                data = json.loads(line[6:])
                result = data  # take the last data event
            except json.JSONDecodeError:
                pass
    return result if result else {"raw_sse": text}


def initialize():
    """Initialize the MCP session."""
    print("\n" + "=" * 60)
    print("INITIALIZING MCP SESSION")
    print("=" * 60)

    result = mcp_request("initialize", {
        "protocolVersion": "2024-11-05",
        "capabilities": {},
        "clientInfo": {"name": "simulation-query", "version": "1.0"}
    })
    print(f"  Session ID: {session_id}")
    print(json.dumps(result, indent=2)[:500])

    # Send initialized notification
    mcp_request("notifications/initialized")

    return result


def list_tools():
    """List available tools on the MCP server."""
    print("\n" + "=" * 60)
    print("LISTING AVAILABLE TOOLS")
    print("=" * 60)

    result = mcp_request("tools/list")
    print(json.dumps(result, indent=2)[:2000])
    return result


def call_tool(tool_name, arguments):
    """Call a specific tool on the MCP server."""
    result = mcp_request("tools/call", {
        "name": tool_name,
        "arguments": arguments
    })
    return result


# ─────────────────────────────────────────────
# Knowledge Base Queries
# ─────────────────────────────────────────────

QUERIES = {
    "domain_1_mars": [
        "What are all Mars environmental conditions relevant to greenhouse agriculture? Include gravity, atmospheric pressure, atmospheric composition, solar irradiance, daylight hours, temperature ranges, radiation levels, soil composition, and any seasonal variations.",
        "What is the exact solar irradiance on Mars surface? How do dust storms affect solar input? What are typical dust storm durations and frequencies?",
    ],
    "domain_2_cea": [
        "What are the core principles of controlled environment agriculture for Mars? Include hydroponics systems, environmental control methods, lighting strategies, nutrient delivery systems, and water recycling approaches.",
        "What are the optimal greenhouse parameters to maintain? Temperature, humidity, CO2 levels, lighting cycles.",
    ],
    "domain_3_crops": [
        "List ALL crop profiles available for Mars greenhouse cultivation. For each crop include: name, growth cycle duration in days, water requirement per day, light requirement in hours, optimal temperature range, optimal humidity range, yield per harvest, nutritional content (calories, protein, vitamins, minerals), and response to stress conditions.",
        "What crops provide the best protein sources for astronauts? What are their specific growing requirements?",
        "What crops have the shortest growth cycles and can be harvested quickly for emergency food supply?",
        "What are the caloric yields per unit of water consumed for each crop? Which crops are most water-efficient?",
    ],
    "domain_4_stress": [
        "What are all plant stress indicators the AI agent should monitor? Include nutrient deficiency symptoms, disease indicators, environmental stress signs, and water stress markers for each crop type.",
        "What are the recommended automated responses for each type of plant stress? What actions should an AI agent take when detecting nutrient deficiency, disease, water stress, light stress, and temperature stress?",
        "How does crop disease spread between plants? What containment strategies should be used?",
    ],
    "domain_5_nutrition": [
        "What are the complete daily nutritional requirements for 4 astronauts on Mars? Include calories, protein, carbohydrates, fat, vitamins (A, C, D, K, B-complex), and minerals (iron, calcium, potassium, zinc). Break down by activity level.",
        "What is the minimum viable diet from greenhouse crops? What nutritional gaps are hardest to fill?",
        "How do nutritional needs change during high-activity EVA mission days vs regular days?",
    ],
    "domain_6_scenarios": [
        "List ALL greenhouse operational scenarios and failure modes. For each include: event type, probability, duration, impact on systems, and recommended AI agent response.",
        "What happens during a dust storm? How long do they last? What is the exact impact on solar power, temperature, and crop growth?",
        "What equipment failures can occur? Pump failure, lighting failure, heating failure, water recycling degradation. What are the cascading effects?",
    ],
    "domain_7_earth": [
        "What are the key connections between Mars autonomous agriculture and Earth applications? What technologies transfer to extreme agriculture on Earth — deserts, vertical farming, food security?",
    ],
}


def query_all_domains(tool_name):
    """Query all 7 knowledge base domains and save results."""
    all_results = {}

    for domain_key, queries in QUERIES.items():
        print(f"\n{'=' * 60}")
        print(f"DOMAIN: {domain_key}")
        print("=" * 60)

        domain_results = []
        for query in queries:
            print(f"\n  Query: {query[:80]}...")
            result = call_tool(tool_name, {"query": query})
            domain_results.append({
                "query": query,
                "response": result
            })
            time.sleep(1)  # rate limiting

        all_results[domain_key] = domain_results

        # Save each domain separately
        domain_path = os.path.join(OUTPUT_DIR, f"{domain_key}.json")
        with open(domain_path, "w") as f:
            json.dump(domain_results, f, indent=2)
        print(f"  ✓ Saved to {domain_path}")

    return all_results


# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Step 1: Initialize session
    init_result = initialize()
    with open(os.path.join(OUTPUT_DIR, "init.json"), "w") as f:
        json.dump(init_result, f, indent=2)

    # Step 2: List available tools
    tools_result = list_tools()
    with open(os.path.join(OUTPUT_DIR, "tools.json"), "w") as f:
        json.dump(tools_result, f, indent=2)

    # Step 3: Figure out the tool name to use
    # Try to extract from tools_result
    tool_name = None
    if isinstance(tools_result, dict):
        tools = tools_result.get("result", {}).get("tools", [])
        if tools:
            print(f"\n  Available tools:")
            for t in tools:
                name = t.get("name", "unknown")
                desc = t.get("description", "no description")[:80]
                print(f"    - {name}: {desc}")
            # Use the first tool (usually the KB query tool)
            tool_name = tools[0].get("name")

    if not tool_name:
        # Fallback: try common names
        print("\n  Could not auto-detect tool name. Trying common names...")
        for candidate in ["query_knowledge_base", "search", "retrieve", "query", "ask"]:
            print(f"  Trying: {candidate}")
            test = call_tool(candidate, {"query": "test"})
            if "error" not in str(test).lower() or "not found" not in str(test).lower():
                tool_name = candidate
                break

    if not tool_name:
        print("\n  ✗ Could not find a working tool. Check tools.json for available tools.")
        print("  You may need to adjust the tool_name manually in this script.")
        return

    print(f"\n  Using tool: {tool_name}")

    # Step 4: Query all domains
    all_results = query_all_domains(tool_name)

    # Save everything
    with open(os.path.join(OUTPUT_DIR, "all_responses.json"), "w") as f:
        json.dump(all_results, f, indent=2)

    print(f"\n{'=' * 60}")
    print("DONE — All results saved to simulation/kb_data/")
    print("=" * 60)
    print(f"\nFiles created:")
    for fname in sorted(os.listdir(OUTPUT_DIR)):
        fpath = os.path.join(OUTPUT_DIR, fname)
        size = os.path.getsize(fpath)
        print(f"  {fname} ({size:,} bytes)")

    print(f"\nNext step: Open Claude Desktop and say 'read the KB data and update the simulation spec'")


if __name__ == "__main__":
    main()
