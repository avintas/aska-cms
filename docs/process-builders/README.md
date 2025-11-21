# Process Builders Documentation

Complete documentation for the process builder system - automated content generation workflows.

## Quick Links

- [Architecture](./architecture/) - System architecture and design decisions
- [Implementation Guides](./implementation/) - Implementation details and patterns
- [How-To Guides](./guides/) - Testing and usage guides
- [Planning Documents](./planning/) - Future improvements and strategies
- [Historical Context](./history/) - Development history and milestones

## Overview

Process builders automate the creation of trivia sets and other content through recipe-based workflows. They provide:
- Task-based execution
- Auto-discovery of builders
- Complete isolation from CMS code
- Scalable architecture

## Key Documents

### Architecture
- [Final Architecture](./architecture/process-builders-final-architecture.md) - Current architecture
- [Scalable Architecture](./architecture/process-builders-scalable-architecture.md) - Scalability design
- [Isolation Strategy](./implementation/process-builder-isolation-strategy.md) - Isolation approach

### Implementation
- [Implementation Plan](./implementation/PROCESS_BUILDER_IMPLEMENTATION_PLAN.md) - Complete implementation guide
- [Trivia Set Workflow](./implementation/process-builder-trivia-set-workflow.md) - Trivia set generation workflow
- [API vs Server Actions](./implementation/process-builder-api-vs-server-actions.md) - Design decision

### Guides
- [Testing Guide](./guides/testing-process-builder-guide.md) - Comprehensive testing guide
- [Quick Testing](./guides/testing-process-builders-quick.md) - Quick reference

### Planning
- [Improvement Plan](./planning/multiple-choice-builder-improvement-plan.md) - Future improvements
- [Adoption Review](./planning/process-builder-adoption-review.md) - Adoption strategy

## Related Domains

- [Trivia](../trivia/) - Trivia system that process builders generate
- [Content Sourcing](../content-sourcing/) - Source content for generation
- [AI Integration](../ai-integration/) - AI prompts used in generation

