# Public Who Am I Trivia API Documentation

## Overview

Public content API for accessing published Who Am I trivia questions from Tango CMS. This API is **open and public** - no authentication required. Perfect for consuming content on omnipaki.com or any other application.

---

## Base URL

```
https://your-tango-cms-domain.com/api/public/who-am-i-trivia
```

---

## Endpoints

### 1. Get Random Who Am I Question

Returns a single random published Who Am I trivia question.

**Endpoint:** `GET /api/public/who-am-i-trivia/random`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 42,
    "question_text": "I hold the record for most career points in NHL history. I played for four teams but am most famous for my time with the Edmonton Oilers. Who am I?",
    "correct_answer": "Wayne Gretzky",
    "explanation": "Wayne Gretzky scored 2,857 career points (894 goals, 1,963 assists), the most in NHL history.",
    "category": "Players",
    "theme": "Records",
    "difficulty": "Easy",
    "attribution": "NHL Records"
  }
}
```

**Example Usage:**

```javascript
// Vanilla JS
fetch("https://tango.yoursite.com/api/public/who-am-i-trivia/random")
  .then((res) => res.json())
  .then((data) => console.log(data.data));

// React
const fetchRandomQuestion = async () => {
  const response = await fetch(
    "https://tango.yoursite.com/api/public/who-am-i-trivia/random",
  );
  const result = await response.json();
  return result.data;
};
```

---

### 2. Get Latest Who Am I Questions

Returns the latest published Who Am I trivia questions.

**Endpoint:** `GET /api/public/who-am-i-trivia/latest?limit=10`

**Query Parameters:**

- `limit` (optional) - Number of entries to return (default: 10, max: 100)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 58,
      "question_text": "I am known as 'The Great One.' Who am I?",
      "correct_answer": "Wayne Gretzky",
      "explanation": "Wayne Gretzky earned the nickname 'The Great One' for his legendary hockey career.",
      "category": "Players",
      "theme": "Nicknames",
      "difficulty": "Easy",
      "attribution": null
    },
    {
      "id": 57,
      "question_text": "I won the Stanley Cup five times with the Edmonton Oilers in the 1980s. Who am I?",
      "correct_answer": "Mark Messier",
      "explanation": "Mark Messier won five Stanley Cups with Edmonton (1984, 1985, 1987, 1988, 1990).",
      "category": "Players",
      "theme": "Championships",
      "difficulty": "Medium",
      "attribution": "NHL History"
    }
  ],
  "count": 2
}
```

**Example Usage:**

```javascript
// Get latest 5 Who Am I questions
fetch("https://tango.yoursite.com/api/public/who-am-i-trivia/latest?limit=5")
  .then((res) => res.json())
  .then((data) => console.log(data.data));
```

---

### 3. Get Who Am I Questions with Filters

Returns published Who Am I questions with optional filters and pagination.

**Endpoint:** `GET /api/public/who-am-i-trivia?theme=Records&difficulty=Easy&limit=20&offset=0`

**Query Parameters:**

- `theme` (optional) - Filter by theme (e.g., "Records", "Nicknames", "Championships")
- `category` (optional) - Filter by category (e.g., "Players", "Teams", "Historical")
- `difficulty` (optional) - Filter by difficulty (e.g., "Easy", "Medium", "Hard")
- `limit` (optional) - Number of entries per page (default: 20, max: 100)
- `offset` (optional) - Number of entries to skip for pagination (default: 0)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 23,
      "question_text": "I am the oldest trophy awarded in North American professional sports. Who am I?",
      "correct_answer": "The Stanley Cup",
      "explanation": "The Stanley Cup was first awarded in 1893, making it the oldest trophy in North American pro sports.",
      "category": "Historical",
      "theme": "Records",
      "difficulty": "Medium",
      "attribution": "NHL History"
    }
  ],
  "count": 1
}
```

**Example Usage:**

```javascript
// Get all easy Who Am I questions
fetch(
  "https://tango.yoursite.com/api/public/who-am-i-trivia?difficulty=Easy&limit=50",
)
  .then((res) => res.json())
  .then((data) => console.log(data.data));

// Get questions by theme
fetch(
  "https://tango.yoursite.com/api/public/who-am-i-trivia?theme=Records&limit=20",
)
  .then((res) => res.json())
  .then((data) => console.log(data.data));

// Pagination example (page 2, 20 per page)
fetch(
  "https://tango.yoursite.com/api/public/who-am-i-trivia?limit=20&offset=20",
)
  .then((res) => res.json())
  .then((data) => console.log(data.data));
```

---

## Features

✅ **Public & Open** - No authentication required  
✅ **CORS Enabled** - Works from any domain  
✅ **Published Only** - Only returns published questions (never drafts or archived)  
✅ **Clean Data** - Returns display-ready fields only  
✅ **Rate Limiting** - Max 100 entries per request to prevent abuse  
✅ **Cross-Origin** - Perfect for omnipaki.com or any external site

---

## Data Fields

All endpoints return these fields:

| Field            | Type           | Description                                                      |
| ---------------- | -------------- | ---------------------------------------------------------------- |
| `id`             | number         | Unique question ID                                               |
| `question_text`  | string         | The Who Am I riddle/clues                                        |
| `correct_answer` | string         | The correct answer (person, team, thing, etc.)                   |
| `explanation`    | string \| null | Optional explanation for why the answer is correct               |
| `category`       | string \| null | Category classification (e.g., "Players", "Teams", "Historical") |
| `theme`          | string \| null | Theme classification (e.g., "Records", "Nicknames")              |
| `difficulty`     | string \| null | Difficulty level ("Easy", "Medium", "Hard")                      |
| `attribution`    | string \| null | Source attribution (e.g., "NHL.com", "Hockey Reference")         |

**Note:** Internal fields like `status`, `created_at`, `updated_at`, `source_content_id`, `used_in`, `tags`, etc. are NOT exposed in the public API.

---

## Error Responses

**No Published Questions Found:**

```json
{
  "success": false,
  "error": "No published Who Am I trivia questions found"
}
```

**Server Error:**

```json
{
  "success": false,
  "error": "Failed to fetch Who Am I trivia questions"
}
```

---

## Usage on omnipaki.com

### Example: Display Random Question on Homepage

```javascript
// omnipaki.com Homepage
async function loadRandomTrivia() {
  try {
    const response = await fetch(
      "https://tango.yoursite.com/api/public/who-am-i-trivia/random",
    );
    const result = await response.json();

    if (result.success) {
      const question = result.data;
      document.getElementById("trivia-question").textContent =
        question.question_text;
      document.getElementById("trivia-answer").textContent =
        question.correct_answer;

      if (question.explanation) {
        document.getElementById("trivia-explanation").textContent =
          question.explanation;
      }
    }
  } catch (error) {
    console.error("Failed to load trivia question:", error);
  }
}

loadRandomTrivia();
```

### Example: Interactive Who Am I Quiz Widget

```html
<div id="trivia-quiz">
  <h3>Who Am I?</h3>
  <p id="question"></p>
  <input type="text" id="user-answer" placeholder="Type your answer..." />
  <button onclick="checkAnswer()">Submit Answer</button>
  <div id="feedback" style="display:none;">
    <p id="result-text"></p>
    <p id="explanation"></p>
  </div>
  <button onclick="loadNewQuestion()">Next Question</button>
</div>

<script>
  let currentQuestion = null;

  async function loadNewQuestion() {
    const response = await fetch(
      "https://tango.yoursite.com/api/public/who-am-i-trivia/random",
    );
    const result = await response.json();

    if (result.success) {
      currentQuestion = result.data;
      document.getElementById("question").textContent =
        currentQuestion.question_text;
      document.getElementById("user-answer").value = "";
      document.getElementById("feedback").style.display = "none";
    }
  }

  function checkAnswer() {
    if (!currentQuestion) return;

    const userAnswer = document
      .getElementById("user-answer")
      .value.trim()
      .toLowerCase();
    const correctAnswer = currentQuestion.correct_answer.toLowerCase();

    const isCorrect =
      userAnswer === correctAnswer || userAnswer.includes(correctAnswer);

    const feedbackDiv = document.getElementById("feedback");
    const resultText = document.getElementById("result-text");
    const explanationText = document.getElementById("explanation");

    resultText.textContent = isCorrect
      ? `✓ Correct! The answer is: ${currentQuestion.correct_answer}`
      : `✗ Incorrect! The correct answer is: ${currentQuestion.correct_answer}`;
    resultText.className = isCorrect ? "correct" : "incorrect";

    if (currentQuestion.explanation) {
      explanationText.textContent = currentQuestion.explanation;
    }

    feedbackDiv.style.display = "block";
  }

  // Load first question
  loadNewQuestion();
</script>
```

---

## React/Next.js Integration

### Example: Random Trivia Component

```tsx
"use client";

import { useState, useEffect } from "react";

interface WhoAmIQuestion {
  id: number;
  question_text: string;
  correct_answer: string;
  explanation?: string | null;
  difficulty?: string | null;
  theme?: string | null;
  attribution?: string | null;
}

export default function RandomWhoAmIQuestion() {
  const [question, setQuestion] = useState<WhoAmIQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);

  const fetchQuestion = async () => {
    try {
      setLoading(true);
      setUserAnswer("");
      setShowResult(false);
      const response = await fetch(
        "https://tango.yoursite.com/api/public/who-am-i-trivia/random",
      );
      const result = await response.json();

      if (result.success) {
        setQuestion(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch trivia question:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestion();
  }, []);

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!question) {
    return null;
  }

  const handleSubmit = () => {
    setShowResult(true);
  };

  const isCorrect =
    userAnswer.trim().toLowerCase() === question.correct_answer.toLowerCase();

  return (
    <div className="trivia-widget p-6 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg text-white">
      <h3 className="text-xl font-bold mb-4">Who Am I?</h3>

      <p className="text-lg mb-4">{question.question_text}</p>

      {question.difficulty && (
        <span className="text-xs bg-white/20 px-2 py-1 rounded">
          {question.difficulty}
        </span>
      )}

      <div className="mt-4">
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Type your answer..."
          disabled={showResult}
          className="w-full px-4 py-2 rounded-md text-gray-900"
        />
      </div>

      {!showResult ? (
        <button
          onClick={handleSubmit}
          className="mt-4 px-4 py-2 bg-white text-indigo-600 rounded-md font-semibold hover:bg-gray-100"
        >
          Submit Answer
        </button>
      ) : (
        <div className="mt-4 p-4 bg-white/10 rounded-md">
          <p className="font-bold">
            {isCorrect ? "✓ Correct!" : `✗ Incorrect!`}
          </p>
          {!isCorrect && (
            <p className="mt-2">
              The answer is: <strong>{question.correct_answer}</strong>
            </p>
          )}
          {question.explanation && (
            <p className="text-sm mt-2 opacity-90">{question.explanation}</p>
          )}
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={fetchQuestion}
          className="px-4 py-2 bg-white/10 text-white rounded-md font-semibold hover:bg-white/20"
        >
          Next Question
        </button>
      </div>
    </div>
  );
}
```

---

## TypeScript Types

```typescript
// Who Am I Trivia Question Type
export interface WhoAmITriviaQuestion {
  id: number;
  question_text: string;
  correct_answer: string;
  explanation?: string | null;
  category?: string | null;
  theme?: string | null;
  difficulty?: string | null;
  attribution?: string | null;
}

// API Response Types
export interface WhoAmITriviaApiResponse {
  success: boolean;
  data?: WhoAmITriviaQuestion | WhoAmITriviaQuestion[];
  count?: number;
  error?: string;
}

// Fetch Params
export interface WhoAmITriviaFetchParams {
  theme?: string;
  category?: string;
  difficulty?: string;
  limit?: number;
  offset?: number;
}
```

---

## Performance Tips

1. **Caching**: Cache responses for 5-10 minutes to reduce API calls
2. **Pagination**: Use `limit` and `offset` for large result sets
3. **Filtering**: Pre-filter by difficulty or theme for targeted content
4. **Random Question Pool**: Fetch multiple questions and shuffle locally to reduce API calls

```javascript
// Example: Simple caching
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let cache = { data: null, timestamp: 0 };

async function getCachedQuestion() {
  const now = Date.now();

  if (cache.data && now - cache.timestamp < CACHE_DURATION) {
    return cache.data;
  }

  const response = await fetch(
    "https://tango.yoursite.com/api/public/who-am-i-trivia/random",
  );
  const result = await response.json();

  cache = { data: result.data, timestamp: now };
  return result.data;
}
```

---

## Troubleshooting

### CORS Errors

The API has CORS enabled. If you get CORS errors:

1. Check that you're using the correct API domain
2. Verify your request doesn't include authentication headers
3. Test the endpoint directly in your browser

### No Results Returned

If you get an empty array:

1. Check that questions are published (not draft/archived) in Tango CMS
2. Verify the filter parameters match existing data
3. Try the `/random` endpoint first to confirm questions exist

### Rate Limiting

- Maximum 100 results per request
- Consider implementing client-side caching
- Use pagination for large datasets

---

## Questions?

This is a public content API - feel free to use it however you like! The API automatically filters to only show published content, so you never have to worry about seeing drafts or internal data.

For questions about the Tango CMS or adding new trivia questions, contact the CMS team.

---

**Last Updated:** October 30, 2025  
**Status:** Production Ready  
**API Version:** 1.0
