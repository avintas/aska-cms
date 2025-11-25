# M-Gen System Design: Bench Boss & Captain Heart

## Overview
M-Gen is a unified content generation hub that produces motivational and greeting messages through two distinct character personas, both writing to the same database table.

## Core Architecture

### Single Table Approach
- **Table**: `collection_hockey_motivate`
- **Rationale**: Motivational messages and greetings share similar emotional tone and purpose, making a unified table structure appropriate
- **Attribution Field**: Used to mark which character generated each message ("Bench Boss" or "Captain Heart")

### M-Gen Hub
- **Function**: Central interface for content generation
- **User Selection**: Manual selection via character icons
  - Bench Boss icon
  - Captain Heart icon
- **Workflow**: Single lookup process with two alternative routes based on character selection

## Character Personas

### Bench Boss
- **Tone**: Tough, fair, disciplinarian
- **Style**: Direct, no-nonsense motivation
- **Use Case**: When users need tough love and accountability

### Captain Heart
- **Tone**: Supportive, emotional motivation
- **Style**: Warm, encouraging, empathetic
- **Use Case**: When users need emotional support and gentle encouragement

## Prompt Management

### Storage
- **Table**: `collection_prompts`
- **Identification**: Uses `prompt_name` field to distinguish prompts
  - "Bench Boss" prompt
  - "Captain Heart" prompt
- **Shared Source**: Both characters pull from the same prompts table, differentiated only by prompt name

### Generation Flow
1. User selects character (Bench Boss or Captain Heart icon)
2. M-Gen queries `collection_prompts` where `prompt_name` matches selected character
3. System calls Gemini API with the character-specific prompt
4. Generated content is saved to `collection_hockey_motivate` with appropriate attribution

## Key Design Decisions

1. **Unified Table**: Motivational and greeting content stored together due to similar emotional characteristics
2. **Manual Selection**: User chooses character route rather than automated selection
3. **Shared Infrastructure**: Same table, same process flow, differentiated by prompt and attribution
4. **Character Differentiation**: Achieved through prompt tone/vibe, not separate systems

## Open Questions / Considerations

- Prompt name exact values (e.g., "Bench Boss" vs "bench_boss")
- Error handling if prompt not found for selected character
- UI feedback/confirmation after generation
- Whether each character has single prompt or multiple variations
- Any character-specific Gemini API parameters (temperature, tokens, etc.)

