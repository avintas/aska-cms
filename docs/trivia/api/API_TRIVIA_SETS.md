# Trivia Sets Public API Documentation

## Overview

This API provides access to published trivia sets for OnlyHockey.com. All endpoints are public (no authentication required) and return only published sets with Public visibility.

**Base URL:** `https://onlyhockey.com/api/public/trivia-sets`

## Endpoints

### 1. List True/False Trivia Sets

**GET** `/api/public/trivia-sets/true-false`

Returns a list of published true/false trivia sets.

#### Query Parameters

| Parameter    | Type    | Required | Default | Description                                    |
| ------------ | ------- | -------- | ------- | ---------------------------------------------- |
| `limit`      | integer | No       | 20      | Number of sets to return (max 100)             |
| `offset`     | integer | No       | 0       | Pagination offset                              |
| `category`   | string  | No       | -       | Filter by category (e.g., "Player Spotlight")  |
| `theme`      | string  | No       | -       | Filter by theme (e.g., "Players")              |
| `difficulty` | string  | No       | -       | Filter by difficulty: "easy", "medium", "hard" |

#### Example Request

```bash
GET /api/public/trivia-sets/true-false?limit=10&category=Player%20Spotlight
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": 6,
      "title": "Know Your Team - 11/9/2025",
      "slug": "know-your-team-1762740128644",
      "description": "Daily trivia set for November 9th, 2025",
      "category": "Player Spotlight",
      "theme": "Players",
      "difficulty": "easy",
      "tags": [],
      "question_count": 7,
      "created_at": "2025-11-09T12:00:00Z",
      "published_at": "2025-11-09T12:00:00Z"
    }
  ],
  "count": 1,
  "limit": 10,
  "offset": 0
}
```

---

### 2. Get Single True/False Trivia Set

**GET** `/api/public/trivia-sets/true-false/[id]`

Returns a complete trivia set with all questions.

#### Path Parameters

| Parameter | Type    | Required | Description       |
| --------- | ------- | -------- | ----------------- |
| `id`      | integer | Yes      | The trivia set ID |

#### Example Request

```bash
GET /api/public/trivia-sets/true-false/6
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "id": 6,
    "title": "Know Your Team - 11/9/2025",
    "slug": "know-your-team-1762740128644",
    "description": "Daily trivia set for November 9th, 2025",
    "category": "Player Spotlight",
    "theme": "Players",
    "difficulty": "easy",
    "tags": [],
    "question_count": 7,
    "question_data": [
      {
        "question_text": "Jake Ratzlaff was drafted in the first round of the 2020 NHL Draft.",
        "question_type": "true-false",
        "correct_answer": "False",
        "wrong_answers": [],
        "explanation": "Jake Ratzlaff was not drafted in the first round.",
        "source_id": 123,
        "difficulty": 1,
        "points": 10,
        "time_limit": 30
      }
    ],
    "created_at": "2025-11-09T12:00:00Z",
    "published_at": "2025-11-09T12:00:00Z"
  }
}
```

#### Question Data Structure

Each question in `question_data` contains:

- `question_text` (string): The statement/question text
- `question_type` (string): Always "true-false"
- `correct_answer` (string): Either "True" or "False"
- `wrong_answers` (array): Empty array for true/false questions
- `explanation` (string, optional): Explanation of the answer
- `source_id` (number, optional): Internal reference ID
- `difficulty` (number, optional): 1=easy, 2=medium, 3=hard
- `points` (number, optional): Points value for the question
- `time_limit` (number, optional): Time limit in seconds

---

### 3. List Multiple Choice Trivia Sets

**GET** `/api/public/trivia-sets/multiple-choice`

Same structure as true/false endpoint, but returns multiple-choice sets.

#### Example Request

```bash
GET /api/public/trivia-sets/multiple-choice?limit=10
```

#### Question Data Structure (Multiple Choice)

For multiple-choice questions, `question_data` contains:

- `question_text` (string): The question text
- `question_type` (string): Always "multiple-choice"
- `correct_answer` (string): The correct answer text
- `wrong_answers` (array): Array of 3 incorrect answer strings
- `explanation` (string, optional): Explanation of the answer
- Other fields same as true/false

---

### 4. Get Single Multiple Choice Trivia Set

**GET** `/api/public/trivia-sets/multiple-choice/[id]`

Same structure as true/false single set endpoint.

---

## Response Format

All endpoints return JSON with the following structure:

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "count": 10,  // For list endpoints
  "limit": 20,  // For list endpoints
  "offset": 0   // For list endpoints
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message here"
}
```

## HTTP Status Codes

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (set doesn't exist or not publicly available)
- `500` - Server Error

## CORS

All endpoints include CORS headers:

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET`
- `Access-Control-Allow-Headers: Content-Type`

## Security

- Only published sets (`status: "published"`) are returned
- Only sets with Public visibility (`visibility: "Public"`) are returned
- No authentication required
- No rate limiting currently (may be added in future)

## Example Usage

### JavaScript/TypeScript

```typescript
// Fetch a specific trivia set
async function getTriviaSet(setId: number) {
  const response = await fetch(
    `https://onlyhockey.com/api/public/trivia-sets/true-false/${setId}`,
  );
  const result = await response.json();

  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}

// Fetch latest trivia sets
async function getLatestTriviaSets(limit = 10) {
  const response = await fetch(
    `https://onlyhockey.com/api/public/trivia-sets/true-false?limit=${limit}`,
  );
  const result = await response.json();

  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}
```

### cURL

```bash
# Get specific set
curl https://onlyhockey.com/api/public/trivia-sets/true-false/6

# Get latest sets
curl "https://onlyhockey.com/api/public/trivia-sets/true-false?limit=10"
```

## Finding Your Trivia Set

To find the ID of "Know Your Team - 11/9/2025":

1. List all true/false sets: `GET /api/public/trivia-sets/true-false`
2. Search for the set by title or slug in the response
3. Use the `id` field to fetch the complete set

Or check the CMS at `/cms/trivia-sets-true-false-library` - the URL will show the ID when viewing a set.

## Notes

- Sets are ordered by `created_at` descending (newest first)
- Question data is included in single-set responses but excluded from list responses for performance
- All timestamps are in ISO 8601 format (UTC)
- The API is read-only - no POST/PUT/DELETE endpoints
