# API Contract

This file is the source of truth for the interface between frontend and backend. **Update it when things change** — don't let it go stale.

---

## Conventions

- Base URL: `http://localhost:<PORT>/api` (update with your actual port)
- All request/response bodies are JSON
- Use standard HTTP status codes
- Auth: none for the frontend (single-operator system). Agent-initiated requests must include `X-Agent-Token: <secret>` — the backend rejects agent write endpoints without it.
- Timestamps: ISO 8601 strings (e.g. `"2026-03-19T14:32:00Z"`)
- All `id` fields are UUIDs (e.g. `"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`)
- `|null` means the field may be `null`
- Enum values listed as `"a|b|c"` — pick one

---

## Controllers

| Controller | Base Path | Responsibility |
|---|---|---|
| GreenhouseController | `/api/greenhouses` | Greenhouse CRUD, per-greenhouse sensor data & overview; slots are owned by and created with the greenhouse |
| SlotController | `/api/greenhouses/{id}/slots` | Slot updates (plant/clear/growth state) + slot history |
| WeatherController | `/api/weather` | External Mars weather |
| AgentController | `/api/agent` | AI agent log (read + agent write), recommendation queue (read + agent write), config |
| AlertController | `/api/alerts` | Stress detection — agent creates, operator acknowledges/resolves |
| CropController | `/api/crops` | Crop catalog, planting queue, harvest journal, stockpile |
| NutritionController | `/api/nutrition` | Calorie tracking & nutritional coverage |
| ForecastController | `/api/forecast` | Resource projections & mission timeline |
| OnboardingController | `/api/onboarding` | Tour progress — status, step completion, reset |
| SimulationController | `/api/simulations` | Admin: simulation lifecycle, scenario injections, full event timeline |
| ScenarioController | `/api/scenarios` | Admin: crisis event catalog |
| AnalyticsController | `/api/analytics` | Admin: agent performance metrics |

---

## GreenhouseController — `/api/greenhouses`
Greenhouses are the top-level physical unit. Each greenhouse fully owns its slots — slots are auto-created when a greenhouse is created and auto-removed when it is resized or deleted. Sensor data is scoped per greenhouse because each unit has its own hardware.

### List greenhouses

`GET /api/greenhouses`

**Purpose:** All greenhouses in the system with a summary status.

**Response (200):**
```json
{
  "greenhouses": [
    {
      "id": "UUID",
      "name": "string",
      "description": "string|null",
      "rows": "number",
      "cols": "number",
      "totalSlots": "number",
      "occupiedSlots": "number",
      "overallStatus": "string — GreenhouseStatus"
    }
  ]
}
```

---

### Create greenhouse

`POST /api/greenhouses`

**Purpose:** Register a new greenhouse. All `rows × cols` slots are created automatically and start empty.

**Request body:**
```json
{
  "name": "string",
  "description": "string|null",
  "rows": "number",
  "cols": "number"
}
```

**Response (201):**
```json
{
  "id": "UUID",
  "name": "string",
  "description": "string|null",
  "rows": "number",
  "cols": "number",
  "totalSlots": "number",
  "createdAt": "ISO 8601"
}
```

**Errors:**
- `400` — Missing or invalid fields

---

### Get greenhouse detail

`GET /api/greenhouses/{id}`

**Purpose:** Full greenhouse with all slots and current resource levels. Powers the animated greenhouse visualization.

**Query params:**
- `slotStatus` — `empty|healthy|needs_attention|critical` (optional; filters the `slots` array)

**Response (200):**
```json
{
  "id": "UUID",
  "name": "string",
  "description": "string|null",
  "rows": "number",
  "cols": "number",
  "overallStatus": "string — GreenhouseStatus",
  "slots": [
    {
      "id": "UUID",
      "position": { "row": "number", "col": "number" },
      "cropId": "UUID|null",
      "cropName": "string|null",
      "status": "string — SlotStatus",
      "growthStagePercent": "number — 0 to 100",
      "daysUntilHarvest": "number|null",
      "plantedAt": "ISO 8601|null",
      "activeStressTypes": ["string — StressType"],
      "estimatedYieldKg": "number|null"
    }
  ],
  "resources": {
    "waterReservePercent": "number",
    "nutrientReservePercent": "number",
    "energyReservePercent": "number"
  }
}
```

**Errors:**
- `404` — Greenhouse not found

---

### Update greenhouse

`PUT /api/greenhouses/{id}`

**Purpose:** Update greenhouse metadata or resize its grid. Expanding the grid auto-creates new empty slots; shrinking it removes empty slots at the boundary. Only the fields provided are changed.

**Request body:**
```json
{
  "name": "string",
  "description": "string|null",
  "rows": "number — new row count; must not shrink below the highest occupied row",
  "cols": "number — new column count; must not shrink below the highest occupied column"
}
```

**Response (200):**
```json
{
  "id": "UUID",
  "name": "string",
  "description": "string|null",
  "rows": "number",
  "cols": "number",
  "totalSlots": "number",
  "overallStatus": "string — GreenhouseStatus",
  "createdAt": "ISO 8601"
}
```

**Errors:**
- `400` — Invalid fields
- `404` — Greenhouse not found
- `409` — Proposed grid size would orphan one or more occupied slots

---

### Delete greenhouse

`DELETE /api/greenhouses/{id}`

**Purpose:** Remove a greenhouse and all its slots.

**Response (204):** No content.

**Errors:**
- `404` — Greenhouse not found
- `409` — Greenhouse still has active crops; must harvest or clear slots first

---

### Get latest sensor snapshot

`GET /api/greenhouses/{id}/sensors/latest`

**Purpose:** Most recent reading from the sensors inside a specific greenhouse, used for the live dashboard feed.

**Response (200):**
```json
{
  "timestamp": "ISO 8601",
  "temperature": { "value": "number — °C", "status": "string — SensorStatus" },
  "humidity": { "value": "number — %RH", "status": "string — SensorStatus" },
  "lightIntensity": { "value": "number — lux", "status": "string — SensorStatus" },
  "par": { "value": "number — µmol/m²/s, photosynthetically active radiation", "status": "string — SensorStatus" },
  "lightCyclePhase": "string — LightCyclePhase",
  "co2": { "value": "number — ppm", "status": "string — SensorStatus" },
  "waterFlowRate": { "value": "number — L/min", "status": "string — SensorStatus" },
  "waterRecyclingEfficiency": { "value": "number — %, closed-loop water recovery rate", "status": "string — SensorStatus" },
  "nutrientSolution": {
    "ph": { "value": "number — optimal 5.5–6.5", "status": "string — SensorStatus" },
    "ec": { "value": "number — mS/cm, electrical conductivity indicates salinity and nutrient concentration", "status": "string — SensorStatus" },
    "dissolvedOxygen": { "value": "number — mg/L, root zone oxygen level", "status": "string — SensorStatus" }
  }
}
```

**Errors:**
- `404` — Greenhouse not found
- `503` — Sensor subsystem unavailable

---

### Get sensor history

`GET /api/greenhouses/{id}/sensors/history`

**Purpose:** Time-series sensor data for a specific greenhouse, used for charting historical trends.

**Query params:**
- `from` — ISO 8601 start time (required)
- `to` — ISO 8601 end time (required)
- `interval` — `1m|5m|1h` (required)

**Response (200):**
```json
{
  "from": "ISO 8601",
  "to": "ISO 8601",
  "interval": "string",
  "readings": [
    {
      "timestamp": "ISO 8601",
      "temperature": "number",
      "humidity": "number",
      "lightIntensity": "number",
      "par": "number — µmol/m²/s",
      "co2": "number",
      "waterFlowRate": "number",
      "waterRecyclingEfficiency": "number — %",
      "nutrientSolutionPh": "number",
      "nutrientSolutionEc": "number — mS/cm",
      "nutrientSolutionDissolvedOxygen": "number — mg/L"
    }
  ]
}
```

**Errors:**
- `400` — Invalid date range or unrecognized interval value
- `404` — Greenhouse not found

---

## SlotController — `/api/greenhouses/{greenhouseId}/slots`

Slots are the individual growing positions inside a greenhouse. They are created and removed automatically by the greenhouse — see `POST /api/greenhouses` and `PUT /api/greenhouses/{id}`.

### Get slot detail

`GET /api/greenhouses/{greenhouseId}/slots/{slotId}`

**Purpose:** Full detail for a single slot.

**Response (200):**
```json
{
  "id": "UUID",
  "position": { "row": "number", "col": "number" },
  "cropId": "UUID|null",
  "cropName": "string|null",
  "status": "string — SlotStatus",
  "growthStagePercent": "number — 0 to 100",
  "daysUntilHarvest": "number|null",
  "plantedAt": "ISO 8601|null",
  "activeStressTypes": ["string — StressType"],
  "estimatedYieldKg": "number|null — projected yield at harvest based on current growth trajectory"
}
```

**Errors:**
- `404` — Greenhouse or slot not found

---

### Update slot

`PATCH /api/greenhouses/{greenhouseId}/slots/{slotId}`

**Purpose:** Plant a crop in a slot, update its growth state, or clear it after harvest. Only the fields provided are updated.

**Request body:**
```json
{
  "cropId": "UUID|null — set to plant a crop; null to clear the slot",
  "plantedAt": "ISO 8601|null — when the crop was planted",
  "growthStagePercent": "number|null — 0 to 100; updated by the simulation engine as the crop develops",
  "activeStressTypes": ["string — StressType — current stressors; empty array clears all"],
  "estimatedYieldKg": "number|null — projected yield updated by the simulation engine as the crop matures"
}
```

**Response (200):**
```json
{
  "id": "UUID",
  "position": { "row": "number", "col": "number" },
  "cropId": "UUID|null",
  "cropName": "string|null",
  "status": "string — SlotStatus",
  "growthStagePercent": "number — 0 to 100",
  "daysUntilHarvest": "number|null",
  "plantedAt": "ISO 8601|null",
  "activeStressTypes": ["string — StressType"],
  "estimatedYieldKg": "number|null — projected yield at harvest based on current growth trajectory"
}
```

**Errors:**
- `400` — Invalid cropId or malformed body
- `404` — Greenhouse, slot, or crop not found
- `409` — Slot already occupied (when planting) or already empty (when clearing)

---

### Get slot history

`GET /api/greenhouses/{greenhouseId}/slots/{slotId}/history`

**Purpose:** Time series of slot state snapshots between planting and harvest. Enables the agent to reconstruct the full growth trajectory of a crop — correlating sensor conditions, stress events, and interventions with final yield.

**Query params:**
- `from` — ISO 8601 start time (optional; defaults to `plantedAt` of current or most recent crop)
- `to` — ISO 8601 end time (optional; defaults to now)
- `interval` — `1h|6h|1d` (optional; default `1d`)

**Response (200):**
```json
{
  "slotId": "UUID",
  "cropId": "UUID|null",
  "cropName": "string|null",
  "from": "ISO 8601",
  "to": "ISO 8601",
  "interval": "string",
  "snapshots": [
    {
      "timestamp": "ISO 8601",
      "missionDay": "number",
      "status": "string — SlotStatus",
      "growthStagePercent": "number — 0 to 100",
      "estimatedYieldKg": "number|null",
      "activeStressTypes": ["string — StressType"]
    }
  ]
}
```

**Errors:**
- `404` — Greenhouse or slot not found
- `400` — Invalid date range or unrecognised interval

---

## WeatherController — `/api/weather`

### Get current Mars weather

`GET /api/weather/current`

**Purpose:** External Mars atmospheric conditions plus a short forecast. Feeds the weather monitoring widget.

**Response (200):**
```json
{
  "timestamp": "ISO 8601",
  "solarIrradiance": "number — W/m²",
  "dustStormIndex": "number — 0 to 10",
  "externalTemperature": "number — °C",
  "atmosphericPressure": "number — Pa",
  "forecast": [
    {
      "missionDay": "number",
      "dustStormRisk": "string — RiskLevel",
      "solarIrradiance": "number — W/m²"
    }
  ]
}
```

**Errors:**
- `503` — Weather data feed unavailable

---

## AgentController — `/api/agent`

### Get agent activity log

`GET /api/agent/log`

**Purpose:** Paginated list of every autonomous action taken by the AI agent, including its reasoning chain and knowledge base source.

**Query params:**
- `page` — default `1`
- `pageSize` — default `20`
- `simulationId` — optional UUID; filters entries to actions taken during a specific simulation

**Response (200):**
```json
{
  "total": "number",
  "page": "number",
  "pageSize": "number",
  "entries": [
    {
      "id": "UUID",
      "timestamp": "ISO 8601",
      "actionType": "string — e.g. IRRIGATION_ADJUSTED, LIGHT_CYCLE_MODIFIED, NUTRIENT_DOSED",
      "description": "string — human-readable summary",
      "reasoning": "string — agent chain-of-thought",
      "knowledgeBaseSource": "string|null — KB article ID or title referenced",
      "outcome": "string — AgentOutcome"
    }
  ]
}
```

---

### Append agent log entry *(agent only)*

`POST /api/agent/log`

**Purpose:** Agent records an autonomous action it just took, including its reasoning chain and the knowledge base source it used.

**Headers:** `X-Agent-Token: <secret>`

**Request body:**
```json
{
  "actionType": "string — e.g. IRRIGATION_ADJUSTED, LIGHT_CYCLE_MODIFIED, NUTRIENT_DOSED",
  "description": "string — human-readable summary of the action",
  "reasoning": "string — agent chain-of-thought",
  "knowledgeBaseSource": "string|null — KB article ID or title referenced",
  "outcome": "string — AgentOutcome"
}
```

**Response (201):**
```json
{
  "id": "UUID",
  "timestamp": "ISO 8601",
  "actionType": "string",
  "description": "string",
  "reasoning": "string",
  "knowledgeBaseSource": "string|null",
  "outcome": "string — AgentOutcome"
}
```

**Errors:**
- `401` — Missing or invalid `X-Agent-Token`
- `400` — Missing required fields or invalid `outcome` value

---

### Update agent log outcome *(agent only)*

`PATCH /api/agent/log/{id}`

**Purpose:** Agent updates the outcome of a previously logged action, e.g. moving from `PENDING` to `SUCCESS` or `FAILED` once the action completes.

**Headers:** `X-Agent-Token: <secret>`

**Request body:**
```json
{
  "outcome": "string — AgentOutcome"
}
```

**Response (200):**
```json
{
  "id": "UUID",
  "outcome": "string — AgentOutcome"
}
```

**Errors:**
- `400` — Invalid outcome value
- `401` — Missing or invalid `X-Agent-Token`
- `404` — Log entry not found

---

### Get recommendation queue

`GET /api/agent/recommendations`

**Purpose:** Actions the agent wants to take but has deferred to a human because confidence is below the certainty threshold.

**Query params:**
- `status` — `RecommendationStatus` (optional, defaults to `PENDING`)
- `page` — default `1`
- `pageSize` — default `20`

**Response (200):**
```json
{
  "total": "number",
  "page": "number",
  "pageSize": "number",
  "recommendations": [
    {
      "id": "UUID",
      "createdAt": "ISO 8601",
      "actionType": "string",
      "description": "string",
      "reasoning": "string",
      "confidence": "number — 0.0 to 1.0",
      "urgency": "string — Urgency",
      "expiresAt": "ISO 8601|null",
      "status": "string — PENDING|APPROVED|DISMISSED"
    }
  ]
}
```

---

### Push a recommendation *(agent only)*

`POST /api/agent/recommendations`

**Purpose:** Agent creates a pending recommendation when its confidence is below the certainty threshold, deferring the decision to a human operator.

**Headers:** `X-Agent-Token: <secret>`

**Request body:**
```json
{
  "actionType": "string — e.g. CROP_REMOVAL_SUGGESTED, IRRIGATION_INCREASE",
  "description": "string — human-readable description of the proposed action",
  "reasoning": "string — agent chain-of-thought explaining why it is recommending this",
  "confidence": "number — 0.0 to 1.0",
  "urgency": "string — Urgency",
  "expiresAt": "ISO 8601|null — when this recommendation becomes irrelevant"
}
```

**Response (201):**
```json
{
  "id": "UUID",
  "createdAt": "ISO 8601",
  "actionType": "string",
  "description": "string",
  "reasoning": "string",
  "confidence": "number",
  "urgency": "string — Urgency",
  "expiresAt": "ISO 8601|null",
  "status": "PENDING"
}
```

**Errors:**
- `401` — Missing or invalid `X-Agent-Token`
- `400` — Missing required fields, confidence out of 0–1 range, or invalid urgency value

---

### Approve a recommendation

`POST /api/agent/recommendations/{id}/approve`

**Purpose:** Human operator approves a pending recommendation; the agent executes it immediately.

**Request body:** `{}`

**Response (200):**
```json
{
  "id": "UUID",
  "status": "APPROVED",
  "executedAt": "ISO 8601"
}
```

**Errors:**
- `404` — Recommendation not found
- `409` — Already approved or dismissed

---

### Dismiss a recommendation

`POST /api/agent/recommendations/{id}/dismiss`

**Purpose:** Human operator rejects a recommendation and optionally records a reason.

**Request body:**
```json
{
  "reason": "string — optional operator note"
}
```

**Response (200):**
```json
{
  "id": "UUID",
  "status": "DISMISSED"
}
```

**Errors:**
- `404` — Recommendation not found
- `409` — Already approved or dismissed

---

### Get agent configuration

`GET /api/agent/config`

**Purpose:** Current autonomy level, certainty threshold, risk tolerance, and priority weights.

**Response (200):**
```json
{
  "autonomyLevel": "string — AutonomyLevel",
  "certaintyThreshold": "number — 0.0 to 1.0; agent suggests instead of acts when confidence is below this",
  "riskTolerance": "string — RiskTolerance",
  "priorityWeights": {
    "yield": "number — 0.0 to 1.0",
    "diversity": "number — 0.0 to 1.0",
    "resourceConservation": "number — 0.0 to 1.0"
  }
}
```

**Remarks:** `priorityWeights` values must sum to `1.0`. This is the **live runtime config** — changes take effect immediately and apply globally. The `agentConfig` snapshot stored on a simulation object is captured at creation time and is read-only; updating this endpoint does not retroactively change past simulation configs.

---

### Update agent configuration

`PUT /api/agent/config`

**Purpose:** Admin sets a new autonomy level, threshold, tolerance, or priority weights.

**Request body:**
```json
{
  "autonomyLevel": "string — AutonomyLevel",
  "certaintyThreshold": "number — 0.0 to 1.0",
  "riskTolerance": "string — RiskTolerance",
  "priorityWeights": {
    "yield": "number — 0.0 to 1.0",
    "diversity": "number — 0.0 to 1.0",
    "resourceConservation": "number — 0.0 to 1.0"
  }
}
```

**Response (200):**
```json
{
  "autonomyLevel": "string — AutonomyLevel",
  "certaintyThreshold": "number — 0.0 to 1.0",
  "riskTolerance": "string — RiskTolerance",
  "priorityWeights": {
    "yield": "number — 0.0 to 1.0",
    "diversity": "number — 0.0 to 1.0",
    "resourceConservation": "number — 0.0 to 1.0"
  }
}
```

**Errors:**
- `400` — Priority weights do not sum to 1.0
- `422` — Unrecognized enum value

---

## AlertController — `/api/alerts`

### List alerts

`GET /api/alerts`

**Purpose:** Paginated list of plant-stress and incident alerts, optionally filtered by status.

**Query params:**
- `status` — `AlertStatus` (optional, returns all if omitted)
- `page` — default `1`
- `pageSize` — default `20`

**Response (200):**
```json
{
  "total": "number",
  "alerts": [
    {
      "id": "UUID",
      "createdAt": "ISO 8601",
      "resolvedAt": "ISO 8601|null",
      "severity": "string — AlertSeverity",
      "type": "string — AlertType",
      "cropId": "UUID|null",
      "slotId": "UUID|null",
      "greenhouseId": "UUID|null",
      "diagnosis": "string — AI-generated diagnosis",
      "confidence": "number — 0.0 to 1.0",
      "status": "string — AlertStatus",
      "escalatedToHuman": "boolean",
      "suggestedAction": "string"
    }
  ]
}
```

---

### Create alert *(agent only)*

`POST /api/alerts`

**Purpose:** Agent fires an alert when it detects plant stress, equipment failure, or any condition requiring attention. Sets `escalatedToHuman: true` automatically when confidence is below the agent's certainty threshold.

**Headers:** `X-Agent-Token: <secret>`

**Request body:**
```json
{
  "severity": "string — AlertSeverity",
  "type": "string — AlertType",
  "cropId": "UUID|null",
  "slotId": "UUID|null",
  "greenhouseId": "UUID|null",
  "diagnosis": "string — AI-generated diagnosis",
  "confidence": "number — 0.0 to 1.0",
  "suggestedAction": "string"
}
```

**Response (201):**
```json
{
  "id": "UUID",
  "createdAt": "ISO 8601",
  "resolvedAt": null,
  "severity": "string — AlertSeverity",
  "type": "string — AlertType",
  "cropId": "UUID|null",
  "slotId": "UUID|null",
  "greenhouseId": "UUID|null",
  "diagnosis": "string",
  "confidence": "number",
  "status": "OPEN",
  "escalatedToHuman": "boolean — true when confidence is below the agent certainty threshold",
  "suggestedAction": "string"
}
```

**Errors:**
- `401` — Missing or invalid `X-Agent-Token`
- `400` — Missing required fields or invalid enum values
- `404` — Referenced cropId, slotId, or greenhouseId not found

---

### Get alert detail

`GET /api/alerts/{id}`

**Purpose:** Full detail for a single alert.

**Response (200):**
```json
{
  "id": "UUID",
  "createdAt": "ISO 8601",
  "resolvedAt": "ISO 8601|null",
  "severity": "string — AlertSeverity",
  "type": "string — AlertType",
  "cropId": "UUID|null",
  "slotId": "UUID|null",
  "greenhouseId": "UUID|null",
  "diagnosis": "string — AI-generated diagnosis",
  "confidence": "number — 0.0 to 1.0",
  "status": "string — AlertStatus",
  "escalatedToHuman": "boolean",
  "suggestedAction": "string"
}
```

**Errors:**
- `404` — Alert not found

---

### Acknowledge an alert

`POST /api/alerts/{id}/acknowledge`

**Purpose:** Operator signals they are aware of the alert and are investigating.

**Request body:**
```json
{
  "operatorNote": "string — optional"
}
```

**Response (200):**
```json
{
  "id": "UUID",
  "status": "ACKNOWLEDGED"
}
```

**Errors:**
- `404` — Alert not found
- `409` — Alert already resolved

---

### Resolve an alert

`POST /api/alerts/{id}/resolve`

**Purpose:** Operator marks the alert as handled and records what was done.

**Request body:**
```json
{
  "resolution": "string — description of corrective action taken"
}
```

**Response (200):**
```json
{
  "id": "UUID",
  "status": "RESOLVED",
  "resolvedAt": "ISO 8601"
}
```

**Errors:**
- `404` — Alert not found
- `409` — Already resolved

---

## CropController — `/api/crops`

### List crop catalog

`GET /api/crops`

**Purpose:** All crop types the system knows about, with nutritional profiles used by the agent for planning.

**Response (200):**
```json
{
  "crops": [
    {
      "id": "UUID",
      "name": "string",
      "category": "string — CropCategory",
      "growthDays": "number",
      "harvestIndex": "number — 0.0 to 1.0, fraction of total biomass that is edible",
      "typicalYieldPerM2Kg": "number — kg per m² per cycle in CEA systems",
      "waterRequirement": "string — WaterRequirement",
      "environmentalRequirements": {
        "optimalTempMinC": "number",
        "optimalTempMaxC": "number",
        "heatStressThresholdC": "number",
        "optimalHumidityMinPct": "number",
        "optimalHumidityMaxPct": "number",
        "lightRequirementParMin": "number — µmol/m²/s",
        "lightRequirementParMax": "number — µmol/m²/s",
        "optimalCo2PpmMin": "number",
        "optimalCo2PpmMax": "number",
        "optimalPhMin": "number",
        "optimalPhMax": "number"
      },
      "stressSensitivities": ["string — StressType — stress types this crop is most sensitive to"],
      "nutritionalProfile": {
        "caloriesPer100g": "number",
        "proteinG": "number",
        "carbsG": "number",
        "fatG": "number",
        "fiberG": "number",
        "micronutrients": {
          "vitaminAMcg": "number|null",
          "vitaminCMg": "number|null",
          "vitaminKMcg": "number|null",
          "folateMcg": "number|null",
          "ironMg": "number|null",
          "potassiumMg": "number|null",
          "magnesiumMg": "number|null"
        }
      }
    }
  ]
}
```

---

### Get planting queue

`GET /api/crops/planting-queue?greenhouseId=`

**Purpose:** Agent's ranked recommendations for what to plant next, based on nutritional gaps and growth cycles.

**Query params:**
- `greenhouseId` — optional UUID; filters recommendations to slots available in a specific greenhouse

**Response (200):**
```json
{
  "queue": [
    {
      "rank": "number — 1 = highest priority",
      "cropId": "UUID",
      "cropName": "string",
      "greenhouseId": "UUID — greenhouse where this crop should be planted",
      "recommendedPlantDate": "ISO 8601",
      "missionDay": "number",
      "reason": "string — agent explanation",
      "nutritionalGapsAddressed": ["string — e.g. Vitamin C, Protein"]
    }
  ]
}
```

---

### Publish planting queue *(agent only)*

`POST /api/crops/planting-queue`

**Purpose:** Agent replaces the entire planting queue with a freshly computed ranked list. Called whenever the agent recalculates planting priorities based on updated nutritional gaps, growth cycles, or resource forecasts.

**Headers:** `X-Agent-Token: <secret>`

**Request body:**
```json
{
  "queue": [
    {
      "rank": "number — 1 = highest priority",
      "cropId": "UUID",
      "greenhouseId": "UUID — greenhouse where this crop should be planted",
      "recommendedPlantDate": "ISO 8601",
      "missionDay": "number",
      "reason": "string — agent explanation",
      "nutritionalGapsAddressed": ["string — e.g. Vitamin C, Protein"]
    }
  ]
}
```

**Response (200):**
```json
{
  "replacedAt": "ISO 8601",
  "count": "number — number of entries in the new queue"
}
```

**Remarks:** This is a full replacement, not an append. Sending an empty `queue` array clears the queue.

**Errors:**
- `400` — Invalid or missing fields, or a cropId does not exist
- `401` — Missing or invalid `X-Agent-Token`

---

### Get harvest journal

`GET /api/crops/harvest-journal`

**Purpose:** Paginated log of all completed harvests.

**Query params:**
- `page` — default `1`
- `pageSize` — default `20`
- `greenhouseId` — optional UUID; filters to harvests from slots in the given greenhouse
- `cropId` — optional UUID; filters to harvests of a specific crop type

**Response (200):**
```json
{
  "total": "number",
  "harvests": [
    {
      "id": "UUID",
      "harvestedAt": "ISO 8601",
      "missionDay": "number",
      "cropId": "UUID",
      "cropName": "string",
      "yieldKg": "number",
      "slotId": "UUID",
      "greenhouseId": "UUID",
      "notes": "string|null"
    }
  ]
}
```

---

### Log a harvest

`POST /api/crops/harvest-journal`

**Purpose:** Record a completed harvest (triggered manually or by the agent).

**Request body:**
```json
{
  "cropId": "UUID",
  "slotId": "UUID",
  "yieldKg": "number",
  "harvestedAt": "ISO 8601",
  "notes": "string|null"
}
```

**Remarks:** `greenhouseId` is not required in the request — the backend derives it from `slotId`.

**Response (201):**
```json
{
  "id": "UUID",
  "harvestedAt": "ISO 8601",
  "missionDay": "number",
  "cropId": "UUID",
  "cropName": "string",
  "yieldKg": "number",
  "slotId": "UUID",
  "greenhouseId": "UUID",
  "notes": "string|null"
}
```

**Remarks:** Logging a harvest automatically increases the stockpile quantity for the given `cropId` by `yieldKg`. The slot is not automatically cleared — call `PATCH /api/greenhouses/{id}/slots/{slotId}` with `cropId: null` to mark it empty.

**Errors:**
- `400` — Missing required fields or invalid values
- `404` — Crop or slot not found

---

### Update a harvest entry

`PATCH /api/crops/harvest-journal/{id}`

**Purpose:** Correct a harvest record — e.g. adjust yield after reweighing or add operator notes.

**Request body:**
```json
{
  "yieldKg": "number|null — corrected yield",
  "notes": "string|null — operator notes"
}
```

**Response (200):**
```json
{
  "id": "UUID",
  "harvestedAt": "ISO 8601",
  "missionDay": "number",
  "cropId": "UUID",
  "cropName": "string",
  "yieldKg": "number",
  "slotId": "UUID",
  "greenhouseId": "UUID",
  "notes": "string|null"
}
```

**Errors:**
- `400` — Invalid fields
- `404` — Harvest entry not found

---

### Get stockpile

`GET /api/crops/stockpile`

**Purpose:** Current food supply overview — quantities, caloric value, and days-of-supply per crop.

**Response (200):**
```json
{
  "updatedAt": "ISO 8601",
  "items": [
    {
      "cropId": "UUID",
      "cropName": "string",
      "quantityKg": "number",
      "estimatedCalories": "number",
      "daysOfSupply": "number — at current crew consumption rate",
      "expiresInDays": "number|null"
    }
  ],
  "totalEstimatedCalories": "number",
  "totalDaysOfSupply": "number"
}
```

---

## NutritionController — `/api/nutrition`

### Get consumption log

`GET /api/nutrition/consumption`

**Purpose:** Daily calorie and macro intake for the crew over a date range.

**Query params:**
- `from` — ISO 8601 (required)
- `to` — ISO 8601 (required)

**Response (200):**
```json
{
  "from": "ISO 8601",
  "to": "ISO 8601",
  "crewSize": "number",
  "dailyEntries": [
    {
      "date": "ISO 8601",
      "totalCalories": "number",
      "proteinG": "number",
      "carbsG": "number",
      "fatG": "number",
      "fiberG": "number",
      "targetCalories": "number",
      "coveragePercent": "number",
      "micronutrients": {
        "vitaminAMcg": "number",
        "vitaminCMg": "number",
        "vitaminKMcg": "number",
        "folateMcg": "number",
        "ironMg": "number",
        "potassiumMg": "number",
        "magnesiumMg": "number"
      }
    }
  ]
}
```

**Errors:**
- `400` — Invalid date range

---

### Log consumption

`POST /api/nutrition/consumption`

**Purpose:** Record that the crew consumed a quantity of a given crop.

**Request body:**
```json
{
  "date": "ISO 8601",
  "cropId": "UUID",
  "quantityKg": "number"
}
```

**Response (201):**
```json
{
  "id": "UUID",
  "caloriesLogged": "number"
}
```

**Remarks:** Logging consumption automatically decreases the stockpile quantity for the given `cropId` by `quantityKg`. If the stockpile for that crop would go below zero, the request succeeds but `stockpile.quantityKg` is clamped to `0`.

**Errors:**
- `400` — Missing or invalid fields
- `404` — Crop not found

---

### Get nutritional coverage heatmap

`GET /api/nutrition/coverage-heatmap`

**Purpose:** 2D grid (nutrient × mission day) of coverage percentages, powering the heatmap visualization.

**Query params:**
- `fromDay` — mission day to start from (optional; defaults to mission day `1`)
- `toDay` — mission day to end at (optional; defaults to current mission day)

**Response (200):**
```json
{
  "nutrients": ["string — e.g. Vitamin C, Iron, Protein, Calcium"],
  "missionDays": ["number"],
  "coverage": [
    ["number — coverage % for nutrients[i] on missionDays[j]"]
  ]
}
```

**Remarks:** `coverage[i][j]` corresponds to `nutrients[i]` on `missionDays[j]`. Values are 0–100. Only mission days within `[fromDay, toDay]` are returned.

---

## ForecastController — `/api/forecast`

### Get resource forecast

`GET /api/forecast/resources`

**Purpose:** Projected water, nutrient, and energy reserve levels over the next N mission days.

**Query params:**
- `days` — number of mission days to project (optional; 1–365, default `30`)

**Response (200):**
```json
{
  "generatedAt": "ISO 8601",
  "forecastDays": "number",
  "projections": [
    {
      "missionDay": "number",
      "waterReservePercent": "number",
      "nutrientReservePercent": "number",
      "energyReservePercent": "number",
      "riskLevel": "string — RiskLevel"
    }
  ]
}
```

**Errors:**
- `400` — `days` out of range

---

### Get mission timeline

`GET /api/forecast/mission-timeline`

**Purpose:** Key dates and milestones for the mission — harvest windows, planting deadlines, resource risk points, and trip end.

**Response (200):**
```json
{
  "missionStartDate": "ISO 8601",
  "missionEndDate": "ISO 8601",
  "currentMissionDay": "number",
  "totalMissionDays": "number",
  "milestones": [
    {
      "missionDay": "number",
      "date": "ISO 8601",
      "type": "string — MilestoneType",
      "label": "string — human-readable description",
      "cropId": "UUID|null — if harvest/planting related"
    }
  ]
}
```

---

### Set mission dates

`PUT /api/forecast/mission-timeline`

**Purpose:** Configure or update the mission start and end dates. Must be called before any mission-day-relative calculations are meaningful. Changing these dates recalculates all milestone dates but does not change mission-day numbers.

**Request body:**
```json
{
  "missionStartDate": "ISO 8601",
  "missionEndDate": "ISO 8601"
}
```

**Response (200):**
```json
{
  "missionStartDate": "ISO 8601",
  "missionEndDate": "ISO 8601",
  "totalMissionDays": "number"
}
```

**Errors:**
- `400` — `missionEndDate` is not after `missionStartDate`

---

## OnboardingController — `/api/onboarding`

### Get onboarding status

`GET /api/onboarding/status`

**Purpose:** Returns whether the operator has completed the interactive tour, and which steps are done. Used by the frontend to decide whether to show the guide on load.

**Response (200):**
```json
{
  "completed": "boolean",
  "completedSteps": ["string — step key, e.g. GREENHOUSE_OVERVIEW, SENSOR_FEED, AGENT_LOG"],
  "totalSteps": "number"
}
```

---

### Mark onboarding complete

`POST /api/onboarding/complete`

**Purpose:** Operator has finished the interactive tour. Persists completion so the guide does not reappear.

**Request body:** `{}`

**Response (200):**
```json
{
  "completed": true,
  "completedAt": "ISO 8601"
}
```

---

### Mark a step complete

`POST /api/onboarding/steps/{stepKey}/complete`

**Purpose:** Mark a single tour step as done. Allows the frontend to track partial progress and resume the tour from where the operator left off.

**Request body:** `{}`

**Response (200):**
```json
{
  "stepKey": "string",
  "completedSteps": ["string"],
  "allCompleted": "boolean"
}
```

**Errors:**
- `404` — Unknown stepKey

---

### Reset onboarding

`DELETE /api/onboarding/status`

**Purpose:** Resets all onboarding progress so the tour can be replayed from the beginning.

**Response (204):** No content.

---

## SimulationController — `/api/simulations` (Admin)

### List simulations

`GET /api/simulations`

**Purpose:** All past and current simulations with enough parameters to compare runs at a glance without fetching each one individually.

**Response (200):**
```json
{
  "simulations": [
    {
      "id": "UUID",
      "name": "string",
      "learningGoal": "string",
      "status": "string — SimulationStatus",
      "createdAt": "ISO 8601",
      "completedAt": "ISO 8601|null",
      "missionDuration": "number — days",
      "crewSize": "number",
      "yieldTarget": "number — kg",
      "outcomeScore": "number|null — 0 to 100, available when completed",
      "autonomyLevel": "string — AutonomyLevel",
      "riskTolerance": "string — RiskTolerance"
    }
  ]
}
```

---

### Create simulation

`POST /api/simulations`

**Purpose:** Start a new simulation with defined learning goals, resource constraints, and agent config.

**Request body:**
```json
{
  "name": "string",
  "learningGoal": "string — free text description of what this run is testing",
  "missionDuration": "number — days",
  "crewSize": "number",
  "yieldTarget": "number — kg",
  "resourceAvailability": {
    "waterLiters": "number",
    "nutrientKg": "number",
    "energyKwh": "number"
  },
  "agentConfig": {
    "autonomyLevel": "string — AutonomyLevel",
    "certaintyThreshold": "number — 0.0 to 1.0",
    "riskTolerance": "string — RiskTolerance",
    "priorityWeights": {
      "yield": "number",
      "diversity": "number",
      "resourceConservation": "number"
    }
  }
}
```

**Response (201):**
```json
{
  "id": "UUID",
  "status": "RUNNING",
  "createdAt": "ISO 8601"
}
```

**Errors:**
- `400` — Invalid or missing parameters
- `409` — Another simulation is already running

---

### Get simulation detail

`GET /api/simulations/{id}`

**Purpose:** Full detail of a simulation including configuration and current/final metrics.

**Response (200):**
```json
{
  "id": "UUID",
  "name": "string",
  "learningGoal": "string",
  "status": "string — SimulationStatus",
  "createdAt": "ISO 8601",
  "completedAt": "ISO 8601|null",
  "missionDuration": "number — days",
  "crewSize": "number",
  "yieldTarget": "number — kg",
  "outcomeScore": "number|null — 0 to 100, available when completed",
  "resourceAvailability": {
    "waterLiters": "number",
    "nutrientKg": "number",
    "energyKwh": "number"
  },
  "agentConfig": {
    "autonomyLevel": "string — AutonomyLevel",
    "certaintyThreshold": "number — 0.0 to 1.0",
    "riskTolerance": "string — RiskTolerance",
    "priorityWeights": {
      "yield": "number",
      "diversity": "number",
      "resourceConservation": "number"
    }
  },
  "currentMetrics": {
    "missionDay": "number",
    "waterReservePercent": "number",
    "nutrientReservePercent": "number",
    "energyReservePercent": "number",
    "totalYieldKg": "number"
  }
}
```

**Errors:**
- `404` — Simulation not found

---

### Update simulation metadata

`PATCH /api/simulations/{id}`

**Purpose:** Edit the display name or learning goal of a simulation. Does not affect running parameters or agent config.

**Request body:**
```json
{
  "name": "string",
  "learningGoal": "string"
}
```

**Response (200):**
```json
{
  "id": "UUID",
  "name": "string",
  "learningGoal": "string"
}
```

**Errors:**
- `400` — Invalid fields
- `404` — Simulation not found

---

### List injections for a simulation

`GET /api/simulations/{id}/injections`

**Purpose:** All crisis events that have been injected into a given simulation, in chronological order.

**Response (200):**
```json
{
  "injections": [
    {
      "id": "UUID",
      "scenarioId": "UUID",
      "scenarioName": "string",
      "triggeredAt": "ISO 8601",
      "resolvedAt": "ISO 8601|null",
      "intensity": "number — 0.0 to 1.0",
      "status": "string — InjectionStatus"
    }
  ]
}
```

**Errors:**
- `404` — Simulation not found

---

### Inject a crisis event

`POST /api/simulations/{id}/injections`

**Purpose:** Trigger a crisis scenario mid-simulation to test agent resilience. The simulation must be running.

**Request body:**
```json
{
  "scenarioId": "UUID",
  "intensity": "number — 0.0 to 1.0, scales the severity of the event",
  "durationMinutes": "number|null — omit to use the scenario's default duration"
}
```

**Response (201):**
```json
{
  "id": "UUID",
  "scenarioId": "UUID",
  "triggeredAt": "ISO 8601",
  "estimatedResolutionAt": "ISO 8601|null",
  "status": "ACTIVE"
}
```

**Errors:**
- `400` — Missing fields or intensity out of 0–1 range
- `404` — Simulation or scenario not found
- `409` — Simulation is not currently running

---

### Cancel an active injection

`POST /api/simulations/{id}/injections/{injectionId}/cancel`

**Purpose:** Immediately end an active crisis injection before its natural resolution. Use this to abort a scenario mid-event, e.g. manually patching a water leak early.

**Request body:** `{}`

**Response (200):**
```json
{
  "id": "UUID",
  "status": "RESOLVED",
  "resolvedAt": "ISO 8601"
}
```

**Errors:**
- `404` — Simulation or injection not found
- `409` — Injection is already resolved

---

### Pause simulation

`POST /api/simulations/{id}/pause`

**Purpose:** Pause a running simulation.

**Request body:** `{}`

**Response (200):**
```json
{ "id": "UUID", "status": "PAUSED" }
```

**Errors:**
- `404` — Simulation not found
- `409` — Simulation is not currently running

---

### Resume simulation

`POST /api/simulations/{id}/resume`

**Purpose:** Resume a paused simulation.

**Request body:** `{}`

**Response (200):**
```json
{ "id": "UUID", "status": "RUNNING" }
```

**Errors:**
- `404` — Simulation not found
- `409` — Simulation is not currently paused

---

### Stop simulation

`POST /api/simulations/{id}/stop`

**Purpose:** End a running or paused simulation and mark it as completed. Computes the final `outcomeScore` from the simulation state at the time of stopping.

**Request body:** `{}`

**Response (200):**
```json
{
  "id": "UUID",
  "status": "COMPLETED",
  "completedAt": "ISO 8601",
  "outcomeScore": "number — 0 to 100"
}
```

**Errors:**
- `404` — Simulation not found
- `409` — Simulation is already completed

---

### Get simulation timeline

`GET /api/simulations/{id}/timeline`

**Purpose:** Ordered stream of every event that occurred during a simulation — sensor readings, stress detections, agent actions, scenario injections, slot changes, and harvests — in a single chronological feed. Enables full replay and episode-level learning.

**Query params:**
- `from` — ISO 8601 start time (optional)
- `to` — ISO 8601 end time (optional)
- `types` — comma-separated list of `TimelineEventType` values to filter (optional; returns all if omitted)
- `page` — default `1`
- `pageSize` — default `50`

**Response (200):**
```json
{
  "simulationId": "UUID",
  "total": "number",
  "page": "number",
  "pageSize": "number",
  "events": [
    {
      "id": "UUID",
      "timestamp": "ISO 8601",
      "missionDay": "number",
      "type": "string — TimelineEventType",
      "summary": "string — human-readable description of the event",
      "payload": "object — event-specific data (see Remarks)"
    }
  ]
}
```

**Remarks:** `payload` shape varies by `type`:
- `SENSOR_SNAPSHOT` — full sensor reading object
- `SLOT_SNAPSHOT` — slotId, status, growthStagePercent, activeStressTypes, estimatedYieldKg
- `AGENT_ACTION` — agentLogEntry id, actionType, reasoning, outcome
- `STRESS_DETECTED` — slotId, stressType, confidence
- `STRESS_RESOLVED` — slotId, stressType
- `SCENARIO_INJECTED` — injectionId, scenarioType, intensity
- `HARVEST` — harvestId, slotId, cropId, yieldKg

**Errors:**
- `404` — Simulation not found
- `400` — Invalid filter values

---

## ScenarioController — `/api/scenarios` (Admin)

### List scenario types

`GET /api/scenarios`

**Purpose:** All available crisis event types that can be injected into a simulation.

**Response (200):**
```json
{
  "scenarios": [
    {
      "id": "UUID",
      "name": "string — e.g. Water Leak",
      "type": "string — ScenarioType",
      "description": "string",
      "severity": "string — ScenarioSeverity",
      "defaultDurationMinutes": "number|null"
    }
  ]
}
```

---

## AnalyticsController — `/api/analytics` (Admin)

### Get agent performance metrics

`GET /api/analytics/agent-performance`

**Purpose:** Quantitative performance summary for the AI agent. Used both on the live dashboard (current simulation) and the admin panel (any past simulation).

**Query params:**
- `simulationId` — optional UUID; if omitted, defaults to the currently running simulation

**Response (200):**
```json
{
  "simulationId": "UUID",
  "simulationName": "string",
  "status": "string — SimulationStatus",
  "decisionAccuracyPercent": "number",
  "avgResponseTimeMs": "number",
  "resourceEfficiencyScore": "number — 0 to 100",
  "nutritionalTargetHitRate": "number — 0.0 to 1.0",
  "diversityScore": "number — 0 to 100, measures crop variety relative to mission nutritional targets",
  "autonomousActionsCount": "number",
  "humanOverridesCount": "number",
  "crisisResponseScore": "number — 0 to 100"
}
```

**Errors:**
- `404` — Simulation not found
- `409` — `simulationId` omitted and no simulation is currently running

---

## Enums

All enum values are uppercase strings. Use exactly these values in requests and responses.

### GreenhouseStatus
| Value | Meaning |
|---|---|
| `HEALTHY` | All slots within normal thresholds |
| `NEEDS_ATTENTION` | One or more slots have warnings |
| `CRITICAL` | One or more slots are in a critical state |

### SlotStatus
| Value | Meaning |
|---|---|
| `EMPTY` | No crop planted |
| `HEALTHY` | Crop is growing within normal parameters |
| `NEEDS_ATTENTION` | Crop shows early warning signs |
| `CRITICAL` | Crop requires immediate intervention |

### SensorStatus
| Value | Meaning |
|---|---|
| `NORMAL` | Reading is within configured safe range |
| `WARNING` | Reading is outside optimal range but not dangerous |
| `CRITICAL` | Reading is outside safe operating limits |

### LightCyclePhase
| Value | Meaning |
|---|---|
| `DAY` | Lights on — active growth phase |
| `NIGHT` | Lights off — rest phase |

### RiskLevel
| Value | Meaning |
|---|---|
| `LOW` | No significant concern |
| `MODERATE` | Attention recommended |
| `HIGH` | Prompt action required |
| `CRITICAL` | Immediate action required |

### AlertSeverity
| Value | Meaning |
|---|---|
| `INFO` | Informational, no immediate action needed |
| `WARNING` | Requires attention |
| `CRITICAL` | Requires immediate action |

### AlertType
| Value | Meaning |
|---|---|
| `NUTRIENT_DEFICIENCY` | Crop lacking required nutrients |
| `DISEASE` | Disease detected in crop |
| `ENVIRONMENTAL_STRESS` | Environmental conditions outside crop tolerance |
| `EQUIPMENT_FAILURE` | Hardware or sensor failure detected |
| `OTHER` | Does not fit a specific category |

### AlertStatus
| Value | Meaning |
|---|---|
| `OPEN` | Alert is active and unacknowledged |
| `ACKNOWLEDGED` | Operator has seen it and is investigating |
| `RESOLVED` | Issue has been resolved |

### AgentOutcome
| Value | Meaning |
|---|---|
| `SUCCESS` | Action completed successfully |
| `PENDING` | Action is in progress |
| `FAILED` | Action failed |

### RecommendationStatus
| Value | Meaning |
|---|---|
| `PENDING` | Awaiting operator decision |
| `APPROVED` | Operator approved; agent is executing |
| `DISMISSED` | Operator rejected the recommendation |

### Urgency
| Value | Meaning |
|---|---|
| `LOW` | Can wait; not time-sensitive |
| `MEDIUM` | Should be addressed soon |
| `HIGH` | Needs prompt attention |
| `CRITICAL` | Requires immediate operator action |

### AutonomyLevel
| Value | Meaning |
|---|---|
| `FULLY_AUTONOMOUS` | Agent acts on all decisions without asking |
| `SUGGEST_ONLY` | Agent never acts; always defers to operator |
| `HYBRID` | Agent acts when confidence ≥ certaintyThreshold, suggests otherwise |

### RiskTolerance
| Value | Meaning |
|---|---|
| `CONSERVATIVE` | Prioritise safety; avoid any risk to crops or resources |
| `MODERATE` | Balance caution with efficiency |
| `AGGRESSIVE` | Maximise yield even at the cost of higher resource use |

### SimulationStatus
| Value | Meaning |
|---|---|
| `RUNNING` | Simulation is actively progressing |
| `PAUSED` | Simulation is halted but resumable |
| `COMPLETED` | Simulation has finished |

### ScenarioType
| Value | Meaning |
|---|---|
| `WATER_LEAK` | Water supply is leaking or compromised |
| `SOLAR_PANEL_FAILURE` | Energy input is reduced |
| `DISEASE_OUTBREAK` | Pathogen spreading through crops |
| `DUST_STORM` | Reduced sunlight and external pressure changes |
| `EQUIPMENT_MALFUNCTION` | Sensor or actuation hardware failure |

### ScenarioSeverity
| Value | Meaning |
|---|---|
| `LOW` | Minor impact; agent can handle autonomously |
| `MEDIUM` | Noticeable impact; may require operator input |
| `HIGH` | Significant damage expected |
| `CATASTROPHIC` | Mission-threatening event |

### InjectionStatus
| Value | Meaning |
|---|---|
| `ACTIVE` | Event is currently affecting the simulation |
| `RESOLVED` | Event has ended or been corrected |

### CropCategory
| Value | Meaning |
|---|---|
| `VEGETABLE` | Leafy or root vegetables |
| `LEGUME` | Protein-rich beans and pulses |
| `GRAIN` | Calorie-dense grains |
| `HERB` | Flavouring and medicinal plants |

### WaterRequirement
| Value | Meaning |
|---|---|
| `LOW` | Drought-tolerant crop |
| `MEDIUM` | Average water needs |
| `HIGH` | Water-intensive crop |

### StressType
| Value | Meaning |
|---|---|
| `DROUGHT` | Insufficient water supply — stomata close, growth slows |
| `OVERWATERING` | Excess water reducing root zone oxygen, increasing rot risk |
| `HEAT` | Temperature above crop-specific threshold — risk of bolting or yield loss |
| `COLD` | Temperature below optimal range — slowed metabolism, delayed harvest |
| `NUTRIENT_DEFICIENCY_N` | Nitrogen deficiency — yellowing older leaves, reduced protein content |
| `NUTRIENT_DEFICIENCY_K` | Potassium deficiency — leaf edge browning, weak stems |
| `NUTRIENT_DEFICIENCY_FE` | Iron deficiency — interveinal chlorosis of young leaves, common at high pH |
| `SALINITY` | High electrical conductivity (EC) — osmotic stress, stunted growth |
| `LIGHT_INSUFFICIENT` | PAR below crop minimum — etiolation, pale leaves, low biomass |
| `LIGHT_EXCESSIVE` | PAR above crop maximum — photoinhibition, leaf bleaching |
| `CO2_IMBALANCE` | CO₂ outside 800–1200 ppm optimal range |
| `ROOT_HYPOXIA` | Low dissolved oxygen in root zone — root browning, wilting despite moisture |

### TimelineEventType
| Value | Meaning |
|---|---|
| `SENSOR_SNAPSHOT` | Periodic sensor reading recorded |
| `SLOT_SNAPSHOT` | Periodic slot state recorded by agent |
| `AGENT_ACTION` | Agent took an autonomous action |
| `STRESS_DETECTED` | Agent detected a stress condition on a slot |
| `STRESS_RESOLVED` | A stress condition on a slot was resolved |
| `SCENARIO_INJECTED` | A crisis scenario was injected |
| `HARVEST` | A crop was harvested from a slot |

### MilestoneType
| Value | Meaning |
|---|---|
| `HARVEST_WINDOW` | Optimal harvest period for a crop |
| `PLANTING_DEADLINE` | Last date to plant a crop for it to mature before mission end |
| `RESOURCE_CRITICAL` | Projected resource reserve falls below safe threshold |
| `TRIP_END` | Mission end date |

---

## Shared Models

### Greenhouse

| Field | Type | Description |
|---|---|---|
| id | UUID | Unique greenhouse identifier |
| name | string | Display name |
| description | string\|null | Optional description |
| rows | number | Grid rows |
| cols | number | Grid columns |
| totalSlots | number | rows × cols |
| overallStatus | GreenhouseStatus | See Enums |
| createdAt | string | ISO 8601 |

### PlantSlot

| Field | Type | Description |
|---|---|---|
| id | UUID | Unique slot identifier |
| greenhouseId | UUID | Parent greenhouse (FK) |
| position | object | `{ row: number, col: number }` |
| cropId | UUID\|null | Currently planted crop |
| cropName | string\|null | Display name |
| status | SlotStatus | See Enums |
| growthStagePercent | number | 0–100 |
| daysUntilHarvest | number\|null | Estimated days remaining |
| plantedAt | string\|null | ISO 8601 when crop was planted |
| activeStressTypes | StressType[] | Currently detected stressors; empty if healthy |
| estimatedYieldKg | number\|null | Projected yield at harvest based on current growth trajectory |

### AgentLogEntry

| Field | Type | Description |
|---|---|---|
| id | UUID | Unique entry ID |
| timestamp | string | ISO 8601 |
| actionType | string | Machine-readable action identifier |
| description | string | Human-readable summary |
| reasoning | string | Agent chain-of-thought |
| knowledgeBaseSource | string\|null | Referenced KB article |
| outcome | AgentOutcome | See Enums |

### Alert

| Field | Type | Description |
|---|---|---|
| id | UUID | Unique alert ID |
| createdAt | string | ISO 8601 |
| resolvedAt | string\|null | ISO 8601 or null |
| severity | AlertSeverity | See Enums |
| type | AlertType | See Enums |
| cropId | UUID\|null | Affected crop |
| slotId | UUID\|null | Affected slot |
| greenhouseId | UUID\|null | Greenhouse the slot belongs to |
| diagnosis | string | AI-generated diagnosis |
| confidence | number | 0.0–1.0 |
| status | AlertStatus | See Enums |
| escalatedToHuman | boolean | Whether agent escalated this |
| suggestedAction | string | Agent's recommended corrective step |

### Harvest

| Field | Type | Description |
|---|---|---|
| id | UUID | Unique harvest ID |
| harvestedAt | string | ISO 8601 |
| missionDay | number | Mission day number |
| cropId | UUID | Harvested crop |
| cropName | string | Display name |
| yieldKg | number | Kilograms harvested |
| slotId | UUID | Slot that was harvested |
| greenhouseId | UUID | Greenhouse the slot belongs to |
| notes | string\|null | Operator notes |

### Simulation

| Field | Type | Description |
|---|---|---|
| id | UUID | Unique simulation ID |
| name | string | Display name |
| status | SimulationStatus | See Enums |
| createdAt | string | ISO 8601 |
| completedAt | string\|null | ISO 8601 or null |
| missionDuration | number | Total mission days |
| crewSize | number | Number of crew members |
| yieldTarget | number | Target yield in kg |
| outcomeScore | number\|null | Final score 0–100 |
| autonomyLevel | AutonomyLevel | Agent autonomy setting used in this run |
| riskTolerance | RiskTolerance | Risk tolerance setting used in this run |
| diversityScore | number\|null | Crop diversity score 0–100, available when running or completed |

### ScenarioInjection

| Field | Type | Description |
|---|---|---|
| id | UUID | Unique injection ID |
| scenarioId | UUID | Which scenario type |
| simulationId | UUID | Target simulation |
| triggeredAt | string | ISO 8601 |
| resolvedAt | string\|null | ISO 8601 or null |
| intensity | number | 0.0–1.0 |
| status | InjectionStatus | See Enums |
