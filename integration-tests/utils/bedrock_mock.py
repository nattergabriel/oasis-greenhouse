"""Mock AWS Bedrock responses for testing."""

from typing import Dict, Any, List


class BedrockMock:
    """Mock Bedrock LLM responses for integration tests."""

    # Mock response for plan node (initial crop assignments)
    PLAN_INITIAL_RESPONSE = {
        "crop_assignments": {
            0: "potato", 1: "potato", 2: "potato", 3: "potato",
            4: "lettuce", 5: "lettuce", 6: "lettuce", 7: "lettuce",
            8: "beans", 9: "beans", 10: "beans", 11: "beans",
            12: "radish", 13: "radish", 14: "herbs", 15: "herbs"
        },
        "temperature": 20.0,
        "reasoning": "Balanced mix prioritizing calories (potato), protein (beans), fast cycles (lettuce, radish), and variety (herbs)."
    }

    # Mock response for plan node (scheduled review, no changes)
    PLAN_NO_CHANGE_RESPONSE = {
        "actions": [],
        "reasoning": "Current crop distribution is optimal. No changes needed at this time."
    }

    # Mock response for plan node (minor adjustments)
    PLAN_ADJUST_RESPONSE = {
        "actions": [
            {"type": "water_adjust", "slot_id": 0, "multiplier": 1.2},
            {"type": "water_adjust", "slot_id": 4, "multiplier": 0.9},
            {"type": "light_toggle", "slot_id": 8, "enabled": True}
        ],
        "reasoning": "Increasing water for potatoes showing early stress. Reducing water for overwatered lettuce. Enabling supplemental light for beans in low-light period."
    }

    # Mock response for react node (water recycling degradation)
    REACT_WATER_CRISIS_RESPONSE = {
        "actions": [
            {"type": "water_adjust", "slot_id": i, "multiplier": 0.7}
            for i in range(16)
        ],
        "reasoning": "Water recycling at 60% efficiency. Reducing water allocation across all slots to 70% to conserve reserves until repair."
    }

    # Mock response for react node (temperature control failure)
    REACT_TEMPERATURE_CRISIS_RESPONSE = {
        "actions": [
            {"type": "set_temperature", "temperature": 18.0}
        ] + [
            {"type": "light_toggle", "slot_id": i, "enabled": False}
            for i in range(16)
        ],
        "reasoning": "Temperature control failure causing overheating. Lowering target temp and disabling all artificial lighting to reduce heat generation."
    }

    # Mock response for react node (crop health crisis)
    REACT_HEALTH_CRISIS_RESPONSE = {
        "actions": [
            {"type": "set_crop", "slot_id": 0, "crop_type": "radish"},
            {"type": "water_adjust", "slot_id": 0, "multiplier": 1.5}
        ],
        "reasoning": "Slot 0 crops failing. Replacing with fast-growing radish and increasing water to stabilize."
    }

    # Mock response for reflect node (strategy update)
    REFLECT_RESPONSE = {
        "strategy_update": """# Updated Strategy

## Key Learnings from Run

1. **Crop Balance**: Potato-heavy allocation provided strong calorie baseline
2. **Water Management**: Conservative approach (0.8-1.0 multipliers) prevented crises
3. **Crisis Response**: Quick reaction to water degradation event saved the mission
4. **Protein Coverage**: Beans allocation met protein targets consistently

## Adjustments for Next Run

- Increase beans from 4 to 5 slots for better protein margin
- Reduce lettuce from 4 to 3 slots (fast cycle but low nutrition)
- Maintain 4 potato slots (calorie backbone)
- Keep 2 radish for emergency fast harvests
- Keep 2 herbs for micronutrient diversity

## Risk Mitigation

- Monitor water levels closely (trigger at 20% instead of 15%)
- Respond to temperature events immediately with lighting adjustments
- Maintain 10% water buffer for unexpected events
""",
        "reasoning": "Run achieved 78% calorie coverage and 82% protein coverage. Strategy adjustments will improve protein margin and reduce water risk."
    }

    @staticmethod
    def get_plan_response(context: str = "initial") -> Dict[str, Any]:
        """
        Get mock plan response based on context.

        Args:
            context: Context for the plan ("initial", "no_change", "adjust")

        Returns:
            Mock LLM response dict
        """
        if context == "initial":
            return BedrockMock.PLAN_INITIAL_RESPONSE
        elif context == "no_change":
            return BedrockMock.PLAN_NO_CHANGE_RESPONSE
        elif context == "adjust":
            return BedrockMock.PLAN_ADJUST_RESPONSE
        else:
            return BedrockMock.PLAN_NO_CHANGE_RESPONSE

    @staticmethod
    def get_react_response(event_type: str) -> Dict[str, Any]:
        """
        Get mock react response based on event type.

        Args:
            event_type: Event type that triggered reaction

        Returns:
            Mock LLM response dict
        """
        if "water" in event_type.lower():
            return BedrockMock.REACT_WATER_CRISIS_RESPONSE
        elif "temperature" in event_type.lower():
            return BedrockMock.REACT_TEMPERATURE_CRISIS_RESPONSE
        elif "health" in event_type.lower():
            return BedrockMock.REACT_HEALTH_CRISIS_RESPONSE
        else:
            return BedrockMock.REACT_WATER_CRISIS_RESPONSE

    @staticmethod
    def get_reflect_response() -> Dict[str, Any]:
        """
        Get mock reflect response.

        Returns:
            Mock LLM response dict
        """
        return BedrockMock.REFLECT_RESPONSE


class MockBedrockClient:
    """Mock Bedrock client for testing."""

    def __init__(self):
        """Initialize mock client."""
        self.call_count = 0
        self.calls = []

    def converse(self, messages: List[Dict[str, Any]], **kwargs) -> Dict[str, Any]:
        """
        Mock converse API call.

        Args:
            messages: Conversation messages
            **kwargs: Additional arguments

        Returns:
            Mock response
        """
        self.call_count += 1
        self.calls.append({"messages": messages, "kwargs": kwargs})

        # Determine response type from message content
        if messages and len(messages) > 0:
            content = str(messages[-1].get("content", "")).lower()

            # Plan responses
            if "initial" in content or "crop assignments" in content:
                response_data = BedrockMock.PLAN_INITIAL_RESPONSE
            elif "review" in content or "current state" in content:
                response_data = BedrockMock.PLAN_NO_CHANGE_RESPONSE

            # React responses
            elif "water" in content and "degradation" in content:
                response_data = BedrockMock.REACT_WATER_CRISIS_RESPONSE
            elif "temperature" in content and "failure" in content:
                response_data = BedrockMock.REACT_TEMPERATURE_CRISIS_RESPONSE
            elif "health" in content or "stress" in content:
                response_data = BedrockMock.REACT_HEALTH_CRISIS_RESPONSE

            # Reflect response
            elif "reflect" in content or "mission complete" in content:
                response_data = BedrockMock.REFLECT_RESPONSE

            # Default
            else:
                response_data = BedrockMock.PLAN_NO_CHANGE_RESPONSE

            return {
                "output": {
                    "message": {
                        "content": [
                            {"text": str(response_data)}
                        ]
                    }
                }
            }

        return {
            "output": {
                "message": {
                    "content": [
                        {"text": "{}"}
                    ]
                }
            }
        }

    def reset(self):
        """Reset call tracking."""
        self.call_count = 0
        self.calls = []
