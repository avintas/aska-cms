# API Design

API design patterns and specifications for inter-app communication.

## Overview

APIs enable communication between:
- **CMS ↔ Workers**: Job triggering and status updates
- **Web ↔ CMS**: Content fetching (if needed)
- **Workers ↔ Database**: Direct database access for processing

## API Response Format

All APIs use a standardized response format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

## Endpoints

### CMS → Workers

_To be documented as endpoints are designed._

### Workers → CMS

_To be documented as endpoints are designed._

### Web → CMS

_To be documented as endpoints are designed._

## Authentication

_To be documented as auth is implemented._

## Rate Limiting

_To be documented as rate limiting is implemented._

