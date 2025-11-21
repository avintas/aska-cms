# Public Multiple Choice Trivia API Documentation

## Overview

Public content API for accessing published multiple-choice trivia questions from Tango CMS. This API is **open and public** - no authentication required. Perfect for consuming content on omnipaki.com or any other application.

---

## Base URL

```
https://your-tango-cms-domain.com/api/public/multiple-choice-trivia
```

---

## Endpoints

### 1. Get Random Multiple Choice Question

Returns a single random published multiple-choice trivia question.

**Endpoint:** `GET /api/public/multiple-choice-trivia/random`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 42,
    "question_text": "Who holds the record for most career goals in the NHL?",
    "correct_answer": "Wayne Gretzky",
    "wrong_answers": ["Mario Lemieux", "Gordie Howe", "Alex Ovechkin"],
    "explanation": "Wayne Gretzky scored 894 goals in his NHL career, the most in NHL history.",
    "category": "Records",
    "theme": "Hockey History",
    "difficulty": "Easy",
    "attribution": "NHL.com"
  }
}
```

**Example Usage:**

```javascript
// Vanilla JS
fetch("https://tango.yoursite.com/api/public/multiple-choice-trivia/random")
  .then((res) => res.json())
  .then((data) => console.log(data.data));

// React
const fetchRandomQuestion = async () => {
  const response = await fetch(
    "https://tango.yoursite.com/api/public/multiple-choice-trivia/random",
  );
  const result = await response.json();
  return result.data;
};
```

---

### 2. Get Latest Multiple Choice Questions

Returns the latest published multiple-choice trivia questions.

**Endpoint:** `GET /api/public/multiple-choice-trivia/latest?limit=10`

**Query Parameters:**

- `limit` (optional) - Number of entries to return (default: 10, max: 100)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 58,
      "question_text": "Which team won the Stanley Cup in 2023?",
      "correct_answer": "Vegas Golden Knights",
      "wrong_answers": [
        "Florida Panthers",
        "Colorado Avalanche",
        "Tampa Bay Lightning"
      ],
      "explanation": "The Vegas Golden Knights defeated the Florida Panthers in the 2023 Stanley Cup Finals.",
      "category": "Recent Events",
      "theme": "Stanley Cup",
      "difficulty": "Medium",
      "attribution": null
    },
    {
      "id": 57,
      "question_text": "How many periods are in a standard NHL game?",
      "correct_answer": "3",
      "wrong_answers": ["2", "4", "5"],
      "explanation": "A standard NHL game consists of three 20-minute periods.",
      "category": "Rules",
      "theme": "Game Format",
      "difficulty": "Easy",
      "attribution": "NHL Official Rules"
    }
  ],
  "count": 2
}
```

**Example Usage:**

```javascript
// Get latest 5 multiple choice questions
fetch(
  "https://tango.yoursite.com/api/public/multiple-choice-trivia/latest?limit=5",
)
  .then((res) => res.json())
  .then((data) => console.log(data.data));
```

---

### 3. Get Multiple Choice Questions with Filters

Returns published multiple-choice questions with optional filters and pagination.

**Endpoint:** `GET /api/public/multiple-choice-trivia?theme=Hockey%20History&difficulty=Easy&limit=20&offset=0`

**Query Parameters:**

- `theme` (optional) - Filter by theme (e.g., "Hockey History", "Current Events")
- `category` (optional) - Filter by category (e.g., "Players", "Teams", "Records")
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
      "question_text": "Which player has the most Stanley Cup championships as a player?",
      "correct_answer": "Henri Richard",
      "wrong_answers": ["Jean Béliveau", "Maurice Richard", "Yvan Cournoyer"],
      "explanation": "Henri Richard won 11 Stanley Cup championships with the Montreal Canadiens.",
      "category": "Records",
      "theme": "Hockey History",
      "difficulty": "Medium",
      "attribution": "Hockey Reference"
    }
  ],
  "count": 1
}
```

**Example Usage:**

```javascript
// Get all easy multiple choice questions
fetch(
  "https://tango.yoursite.com/api/public/multiple-choice-trivia?difficulty=Easy&limit=50",
)
  .then((res) => res.json())
  .then((data) => console.log(data.data));

// Get questions by theme
fetch(
  "https://tango.yoursite.com/api/public/multiple-choice-trivia?theme=Hockey%20History&limit=20",
)
  .then((res) => res.json())
  .then((data) => console.log(data.data));

// Pagination example (page 2, 20 per page)
fetch(
  "https://tango.yoursite.com/api/public/multiple-choice-trivia?limit=20&offset=20",
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

| Field            | Type           | Description                                                 |
| ---------------- | -------------- | ----------------------------------------------------------- |
| `id`             | number         | Unique question ID                                          |
| `question_text`  | string         | The multiple-choice question statement                      |
| `correct_answer` | string         | The correct answer                                          |
| `wrong_answers`  | string[]       | Array of 3 incorrect answers (distractors)                  |
| `explanation`    | string \| null | Optional explanation for why the correct answer is correct  |
| `category`       | string \| null | Category classification (e.g., "Players", "Teams", "Rules") |
| `theme`          | string \| null | Theme classification (e.g., "Hockey History")               |
| `difficulty`     | string \| null | Difficulty level ("Easy", "Medium", "Hard")                 |
| `attribution`    | string \| null | Source attribution (e.g., "NHL.com", "Hockey Reference")    |

**Note:** Internal fields like `status`, `created_at`, `updated_at`, `source_content_id`, `used_in`, `tags`, etc. are NOT exposed in the public API.

---

## Error Responses

**No Published Questions Found:**

```json
{
  "success": false,
  "error": "No published multiple choice trivia questions found"
}
```

**Server Error:**

```json
{
  "success": false,
  "error": "Failed to fetch multiple choice trivia questions"
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
      "https://tango.yoursite.com/api/public/multiple-choice-trivia/random",
    );
    const result = await response.json();

    if (result.success) {
      const question = result.data;
      document.getElementById("trivia-question").textContent =
        question.question_text;

      // Display all answer options (shuffled)
      const allOptions = [
        question.correct_answer,
        ...question.wrong_answers,
      ].sort(() => Math.random() - 0.5);

      const optionsHtml = allOptions
        .map((option, index) => {
          return `
          <button class="option-btn" data-answer="${option}">
            ${String.fromCharCode(65 + index)}) ${option}
          </button>
        `;
        })
        .join("");

      document.getElementById("trivia-options").innerHTML = optionsHtml;

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

### Example: Interactive Trivia Quiz Widget

```html
<div id="trivia-quiz">
  <h3>Hockey Trivia Challenge</h3>
  <p id="question"></p>
  <div id="options" class="options-grid"></div>
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
      "https://tango.yoursite.com/api/public/multiple-choice-trivia/random",
    );
    const result = await response.json();

    if (result.success) {
      currentQuestion = result.data;
      document.getElementById("question").textContent =
        currentQuestion.question_text;

      // Shuffle all options
      const allOptions = [
        currentQuestion.correct_answer,
        ...currentQuestion.wrong_answers,
      ].sort(() => Math.random() - 0.5);

      // Display options
      const optionsHtml = allOptions
        .map(
          (option, index) => `
        <button class="option-btn" onclick="checkAnswer('${option}')">
          ${String.fromCharCode(65 + index)}) ${option}
        </button>
      `,
        )
        .join("");

      document.getElementById("options").innerHTML = optionsHtml;
      document.getElementById("feedback").style.display = "none";
    }
  }

  function checkAnswer(userAnswer) {
    if (!currentQuestion) return;

    const isCorrect = userAnswer === currentQuestion.correct_answer;
    const feedbackDiv = document.getElementById("feedback");
    const resultText = document.getElementById("result-text");
    const explanationText = document.getElementById("explanation");

    resultText.textContent = isCorrect
      ? "✓ Correct!"
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

interface MultipleChoiceQuestion {
  id: number;
  question_text: string;
  correct_answer: string;
  wrong_answers: string[];
  explanation?: string | null;
  difficulty?: string | null;
  theme?: string | null;
  attribution?: string | null;
}

export default function RandomTriviaQuestion() {
  const [question, setQuestion] = useState<MultipleChoiceQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const fetchQuestion = async () => {
    try {
      setLoading(true);
      setSelectedAnswer(null);
      setShowResult(false);
      const response = await fetch(
        "https://tango.yoursite.com/api/public/multiple-choice-trivia/random",
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

  // Shuffle options
  const allOptions = [question.correct_answer, ...question.wrong_answers].sort(
    () => Math.random() - 0.5,
  );

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setShowResult(true);
  };

  const isCorrect = selectedAnswer === question.correct_answer;

  return (
    <div className="trivia-widget p-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg text-white">
      <h3 className="text-xl font-bold mb-4">Hockey Trivia</h3>

      <p className="text-lg mb-4">{question.question_text}</p>

      {question.difficulty && (
        <span className="text-xs bg-white/20 px-2 py-1 rounded">
          {question.difficulty}
        </span>
      )}

      <div className="mt-4 space-y-2">
        {allOptions.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(option)}
            disabled={showResult}
            className={`w-full text-left px-4 py-2 rounded-md font-semibold transition-colors ${
              showResult && option === question.correct_answer
                ? "bg-green-500 text-white"
                : showResult && option === selectedAnswer
                  ? "bg-red-500 text-white"
                  : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            {String.fromCharCode(65 + index)}) {option}
          </button>
        ))}
      </div>

      {showResult && (
        <div className="mt-4 p-4 bg-white/10 rounded-md">
          <p className="font-bold">
            {isCorrect ? "✓ Correct!" : "✗ Incorrect!"}
          </p>
          {question.explanation && (
            <p className="text-sm mt-2 opacity-90">{question.explanation}</p>
          )}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={fetchQuestion}
          className="px-4 py-2 bg-white text-indigo-600 rounded-md font-semibold hover:bg-gray-100"
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
// Multiple Choice Trivia Question Type
export interface MultipleChoiceTriviaQuestion {
  id: number;
  question_text: string;
  correct_answer: string;
  wrong_answers: string[];
  explanation?: string | null;
  category?: string | null;
  theme?: string | null;
  difficulty?: string | null;
  attribution?: string | null;
}

// API Response Types
export interface MultipleChoiceTriviaApiResponse {
  success: boolean;
  data?: MultipleChoiceTriviaQuestion | MultipleChoiceTriviaQuestion[];
  count?: number;
  error?: string;
}

// Fetch Params
export interface MultipleChoiceTriviaFetchParams {
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
    "https://tango.yoursite.com/api/public/multiple-choice-trivia/random",
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
