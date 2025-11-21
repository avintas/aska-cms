# Public True/False Trivia API Documentation

## Overview

Public content API for accessing published true/false trivia questions from Tango CMS. This API is **open and public** - no authentication required. Perfect for consuming content on omnipaki.com or any other application.

---

## Base URL

```
https://your-tango-cms-domain.com/api/public/true-false-trivia
```

---

## Endpoints

### 1. Get Random True/False Question

Returns a single random published true/false trivia question.

**Endpoint:** `GET /api/public/true-false-trivia/random`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 42,
    "question_text": "The Hart Trophy is awarded annually to the NHL's most valuable player.",
    "is_true": true,
    "explanation": "The Hart Memorial Trophy is given to the player judged most valuable to his team.",
    "category": "Awards",
    "theme": "Hockey History",
    "difficulty": "Easy",
    "attribution": null
  }
}
```

**Example Usage:**

```javascript
// Vanilla JS
fetch("https://tango.yoursite.com/api/public/true-false-trivia/random")
  .then((res) => res.json())
  .then((data) => console.log(data.data));

// React
const fetchRandomQuestion = async () => {
  const response = await fetch(
    "https://tango.yoursite.com/api/public/true-false-trivia/random",
  );
  const result = await response.json();
  return result.data;
};
```

---

### 2. Get Latest True/False Questions

Returns the latest published true/false trivia questions.

**Endpoint:** `GET /api/public/true-false-trivia/latest?limit=10`

**Query Parameters:**

- `limit` (optional) - Number of entries to return (default: 10, max: 100)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 58,
      "question_text": "Connor McDavid signed a contract extension with the Edmonton Oilers in 2023.",
      "is_true": false,
      "explanation": "McDavid signed his eight-year contract extension in 2017, not 2023.",
      "category": "Players",
      "theme": "Current Events",
      "difficulty": "Medium",
      "attribution": null
    },
    {
      "id": 57,
      "question_text": "The Stanley Cup is the oldest professional sports trophy in North America.",
      "is_true": true,
      "explanation": "The Stanley Cup was first awarded in 1893, making it the oldest trophy.",
      "category": "History",
      "theme": "Hockey History",
      "difficulty": "Easy",
      "attribution": "NHL Official History"
    }
  ],
  "count": 2
}
```

**Example Usage:**

```javascript
// Get latest 5 true/false questions
fetch("https://tango.yoursite.com/api/public/true-false-trivia/latest?limit=5")
  .then((res) => res.json())
  .then((data) => console.log(data.data));
```

---

### 3. Get True/False Questions with Filters

Returns published true/false questions with optional filters and pagination.

**Endpoint:** `GET /api/public/true-false-trivia?theme=Hockey%20History&difficulty=Easy&limit=20&offset=0`

**Query Parameters:**

- `theme` (optional) - Filter by theme (e.g., "Hockey History", "Current Events")
- `category` (optional) - Filter by category (e.g., "Players", "Awards", "History")
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
      "question_text": "Wayne Gretzky holds the record for most career goals in the NHL.",
      "is_true": false,
      "explanation": "Wayne Gretzky holds the record for most career points, but not goals. That record belongs to him with 894 goals.",
      "category": "Records",
      "theme": "Hockey History",
      "difficulty": "Medium",
      "attribution": "NHL.com"
    }
  ],
  "count": 1
}
```

**Example Usage:**

```javascript
// Get all easy true/false questions
fetch(
  "https://tango.yoursite.com/api/public/true-false-trivia?difficulty=Easy&limit=50",
)
  .then((res) => res.json())
  .then((data) => console.log(data.data));

// Get questions by theme
fetch(
  "https://tango.yoursite.com/api/public/true-false-trivia?theme=Hockey%20History&limit=20",
)
  .then((res) => res.json())
  .then((data) => console.log(data.data));

// Pagination example (page 2, 20 per page)
fetch(
  "https://tango.yoursite.com/api/public/true-false-trivia?limit=20&offset=20",
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

| Field           | Type           | Description                                              |
| --------------- | -------------- | -------------------------------------------------------- |
| `id`            | number         | Unique question ID                                       |
| `question_text` | string         | The true/false question statement                        |
| `is_true`       | boolean        | The correct answer (true or false)                       |
| `explanation`   | string \| null | Optional explanation for the answer                      |
| `category`      | string \| null | Category classification (e.g., "Players", "Awards")      |
| `theme`         | string \| null | Theme classification (e.g., "Hockey History")            |
| `difficulty`    | string \| null | Difficulty level ("Easy", "Medium", "Hard")              |
| `attribution`   | string \| null | Source attribution (e.g., "NHL.com", "Hockey Reference") |

**Note:** Internal fields like `status`, `created_at`, `updated_at`, `source_content_id`, `used_in`, `tags`, etc. are NOT exposed in the public API.

---

## Error Responses

**No Published Questions Found:**

```json
{
  "success": false,
  "error": "No published true/false trivia questions found"
}
```

**Server Error:**

```json
{
  "success": false,
  "error": "Failed to fetch true/false trivia questions"
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
      "https://tango.yoursite.com/api/public/true-false-trivia/random",
    );
    const result = await response.json();

    if (result.success) {
      const question = result.data;
      document.getElementById("trivia-question").textContent =
        question.question_text;
      document.getElementById("trivia-answer").textContent = question.is_true
        ? "TRUE"
        : "FALSE";

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

### Example: Daily Trivia Challenge Widget

```html
<div id="trivia-challenge">
  <h3>Daily True/False Challenge</h3>
  <p id="question"></p>
  <div class="answer-buttons">
    <button onclick="checkAnswer(true)">TRUE</button>
    <button onclick="checkAnswer(false)">FALSE</button>
  </div>
  <div id="result" style="display:none;">
    <p id="result-text"></p>
    <p id="explanation"></p>
  </div>
  <button onclick="loadNewQuestion()">Next Question</button>
</div>

<script>
  let currentQuestion = null;

  async function loadNewQuestion() {
    const response = await fetch(
      "https://tango.yoursite.com/api/public/true-false-trivia/random",
    );
    const result = await response.json();

    if (result.success) {
      currentQuestion = result.data;
      document.getElementById("question").textContent =
        currentQuestion.question_text;
      document.getElementById("result").style.display = "none";
    }
  }

  function checkAnswer(userAnswer) {
    if (!currentQuestion) return;

    const isCorrect = userAnswer === currentQuestion.is_true;
    const resultDiv = document.getElementById("result");
    const resultText = document.getElementById("result-text");
    const explanationText = document.getElementById("explanation");

    resultText.textContent = isCorrect ? "✓ Correct!" : "✗ Incorrect!";
    resultText.className = isCorrect ? "correct" : "incorrect";

    if (currentQuestion.explanation) {
      explanationText.textContent = currentQuestion.explanation;
    }

    resultDiv.style.display = "block";
  }

  // Load first question
  loadNewQuestion();
</script>
```

### Example: Trivia Quiz Builder

```javascript
// Build a quiz from multiple true/false questions
async function buildTriviaQuiz(count = 10) {
  const response = await fetch(
    `https://tango.yoursite.com/api/public/true-false-trivia/latest?limit=${count}`,
  );
  const result = await response.json();

  const quiz = result.data.map((question, index) => ({
    number: index + 1,
    question: question.question_text,
    correctAnswer: question.is_true,
    explanation: question.explanation,
    difficulty: question.difficulty,
  }));

  return quiz;
}

// Usage
buildTriviaQuiz(10).then((quiz) => {
  console.log(`Created quiz with ${quiz.length} questions`);
  displayQuiz(quiz);
});
```

---

## React/Next.js Integration

### Example: Random Trivia Component

```tsx
"use client";

import { useState, useEffect } from "react";

interface TriviaQuestion {
  id: number;
  question_text: string;
  is_true: boolean;
  explanation?: string | null;
  difficulty?: string | null;
  theme?: string | null;
  attribution?: string | null;
}

export default function RandomTriviaQuestion() {
  const [question, setQuestion] = useState<TriviaQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);

  const fetchQuestion = async () => {
    try {
      setLoading(true);
      setShowAnswer(false);
      const response = await fetch(
        "https://tango.yoursite.com/api/public/true-false-trivia/random",
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

  return (
    <div className="trivia-widget p-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg text-white">
      <h3 className="text-xl font-bold mb-4">True or False?</h3>

      <p className="text-lg mb-4">{question.question_text}</p>

      {question.difficulty && (
        <span className="text-xs bg-white/20 px-2 py-1 rounded">
          {question.difficulty}
        </span>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setShowAnswer(true)}
          className="px-4 py-2 bg-white text-indigo-600 rounded-md font-semibold hover:bg-gray-100"
        >
          Show Answer
        </button>
        <button
          onClick={fetchQuestion}
          className="px-4 py-2 bg-white/10 text-white rounded-md font-semibold hover:bg-white/20"
        >
          Next Question
        </button>
      </div>

      {showAnswer && (
        <div className="mt-4 p-4 bg-white/10 rounded-md">
          <p className="font-bold">
            Answer: {question.is_true ? "TRUE ✓" : "FALSE ✗"}
          </p>
          {question.explanation && (
            <p className="text-sm mt-2 opacity-90">{question.explanation}</p>
          )}
        </div>
      )}
    </div>
  );
}
```

### Example: Filtered Trivia List

```tsx
"use client";

import { useState, useEffect } from "react";

interface TriviaQuestion {
  id: number;
  question_text: string;
  is_true: boolean;
  explanation?: string | null;
  difficulty?: string | null;
  theme?: string | null;
}

interface TriviaListProps {
  difficulty?: string;
  theme?: string;
  limit?: number;
}

export default function TriviaList({
  difficulty,
  theme,
  limit = 10,
}: TriviaListProps) {
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        let url = `https://tango.yoursite.com/api/public/true-false-trivia/latest?limit=${limit}`;
        if (difficulty) url += `&difficulty=${encodeURIComponent(difficulty)}`;
        if (theme) url += `&theme=${encodeURIComponent(theme)}`;

        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
          setQuestions(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch trivia questions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [difficulty, theme, limit]);

  if (loading) {
    return <div>Loading trivia questions...</div>;
  }

  return (
    <div className="trivia-list space-y-4">
      <h2 className="text-2xl font-bold">
        {difficulty || theme ? `${difficulty || ""} ${theme || ""} ` : ""}
        True/False Trivia
      </h2>
      <div className="grid gap-4">
        {questions.map((question) => (
          <div key={question.id} className="p-4 bg-white rounded-lg shadow">
            <p className="text-lg font-semibold">{question.question_text}</p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`text-sm px-2 py-1 rounded ${
                  question.is_true
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {question.is_true ? "TRUE" : "FALSE"}
              </span>
              {question.difficulty && (
                <span className="text-xs text-gray-600">
                  {question.difficulty}
                </span>
              )}
            </div>
            {question.explanation && (
              <p className="text-sm text-gray-600 mt-2">
                {question.explanation}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## TypeScript Types

```typescript
// True/False Trivia Question Type
export interface TrueFalseTriviaQuestion {
  id: number;
  question_text: string;
  is_true: boolean;
  explanation?: string | null;
  category?: string | null;
  theme?: string | null;
  difficulty?: string | null;
  attribution?: string | null;
}

// API Response Types
export interface TrueFalseTriviaApiResponse {
  success: boolean;
  data?: TrueFalseTriviaQuestion | TrueFalseTriviaQuestion[];
  count?: number;
  error?: string;
}

// Fetch Params
export interface TrueFalseTriviaFetchParams {
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
    "https://tango.yoursite.com/api/public/true-false-trivia/random",
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
