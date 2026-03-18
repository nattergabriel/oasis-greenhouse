# Martian Greenhouse AI Agent — Feature List

## User Dashboard

### Core Dashboard
- Animated greenhouse overview with plant status indicators (healthy, needs attention, critical)
- Live sensor data feed (temperature, humidity, light, CO2, water levels)
- Resource statistics (water, nutrients, energy reserves)
- External Mars weather monitoring

### Autonomous Agent
- Agent Activity Log — every autonomous action with timestamp, reasoning chain, and referenced knowledge base source
- Recommended Actions queue for non-autonomous decisions under certain certainty threshold

### Greenhouse Environment Information
- Live readouts for temperature, humidity, light intensity/cycle, CO2 levels, water flow rate

### Alert and Incident System
- Plant stress detection with AI diagnosis (nutrient deficiency, disease, environmental stress)
- Escalation to human operator when confidence is low in ## Autonomous Agent

### Crop and Harvest Management
- Planting queue/calendar: agent recommends what to plant next based on nutritional gaps and growth cycles
- Harvest journal
- Supply/Stockpile overview

### Nutrition and Consumption
- Consumption tracker: calorie intake
- Nutritional Coverage Heatmap

### Forecasting
- Resource Forecast — projected water, nutrient, and energy reserves over next x mission days
- Mission Timeline/Calendar — trip end date, predicted harvest windows, critical milestones

### Onboarding
- Interactive User Guide / Tour

---

## Admin Panel

### Simulation Management
- Start new simulations with defined learning goals
- Configure simulation parameters (yield targets, resource availability, crew size, mission duration)
- View past simulations with parameters and outcomes

### Scenario Injection
- Trigger crisis events mid-simulation: water leak, solar panel failure, disease outbreak, dust storm, equipment malfunction
- Based on Greenhouse Operational Scenarios dataset

### Agent Configuration
- Set autonomy level (fully autonomous / suggest-only / hybrid)
- Adjust risk tolerance and priority weights (yield vs. diversity vs. resource conservation)

### Analytics
- Agent Performance Metrics — decision accuracy, response time, resource efficiency score, nutritional target hit rate

---

## Simulation Objectives
- Maximize harvest yield
- Maximize food diversity
- Maintain healthy stockpile levels
- Optimize resource consumption (water, nutrients, energy)
- Minimize crew nutritional gaps
- Maximize system resilience under crisis scenarios