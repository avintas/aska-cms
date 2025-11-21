# Who Am I Question Data - Extended Format with Future Features

## Basic Structure (Use Now)

```typescript
interface WhoAmIQuestionData {
  // Required fields (use now)
  question_id: string; // Unique ID "q-123-0"
  source_id: number; // Reference to trivia_who_am_i table
  question_text: string; // The Who Am I question/clues
  correct_answer: string; // The answer

  // Optional fields (use now if available)
  explanation?: string; // Why this is correct
  tags?: string[]; // Keywords
  difficulty?: number; // 1-3 (easy/medium/hard)
  points?: number; // Points awarded
  time_limit?: number; // Seconds to answer

  // Future features (optional, ready for when you need them)
  clues?: string[]; // Progressive clues (reveal one at a time)
  hints?: string[]; // Hints player can request
  image_url?: string; // Image of the person/thing
  thumbnail_url?: string; // Thumbnail version
}
```

---

## Future Feature: Progressive Clues

**Concept:** Multiple clues that get progressively easier

```json
{
  "question_text": "Who am I?",
  "clues": [
    "I scored 894 goals in my NHL career.",
    "I played for the Edmonton Oilers.",
    "They call me 'The Great One'.",
    "I wore number 99."
  ],
  "correct_answer": "Wayne Gretzky",
  "points": 20
}
```

**Gameplay:** Show clue 1 → guess wrong → show clue 2 → repeat  
**Scoring:** More clues used = fewer points awarded

---

## Future Feature: Hints System

**Concept:** Optional hints player can request (costs points)

```json
{
  "question_text": "I won the Stanley Cup 11 times. Who am I?",
  "hints": [
    "I played for the Montreal Canadiens.",
    "My brother was also famous.",
    "I was known as the 'Pocket Rocket'."
  ],
  "correct_answer": "Henri Richard",
  "points": 30
}
```

**Gameplay:** Player can request hints (each costs points)

---

## Future Feature: Image Support

**Concept:** Show image (blurred, zoomed, or pixelated)

```json
{
  "question_text": "Who am I?",
  "image_url": "https://cdn.example.com/players/mystery-99.jpg",
  "thumbnail_url": "https://cdn.example.com/players/thumbs/mystery-99.jpg",
  "clues": [
    "I revolutionized the defenseman position.",
    "I won the Norris Trophy 8 times.",
    "I scored 'The Goal' while flying through the air."
  ],
  "correct_answer": "Bobby Orr",
  "points": 20
}
```

**Gameplay options:**

- Blurred image → gets clearer
- Zoomed in → zooms out
- Pixelated → becomes clearer
- Silhouette → reveals color

---

## All Fields Optional - Ready When You Need Them

**Current usage:**

```json
{
  "question_text": "I scored 894 goals. Who am I?",
  "correct_answer": "Wayne Gretzky"
}
```

**With future features (when ready):**

```json
{
  "question_text": "Who am I?",
  "clues": ["...", "..."],
  "hints": ["...", "..."],
  "image_url": "...",
  "correct_answer": "Wayne Gretzky"
}
```

All optional - use what you need, when you need it!
