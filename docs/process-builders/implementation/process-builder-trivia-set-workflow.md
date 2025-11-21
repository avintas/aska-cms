# Process Builder: Trivia Set Creation Workflow

## Process Definition: PB1 - Build Trivia Set

### Input Parameters

```
Goal: "Create Trivia Set game with following theme - December Hockey"
Rules:
  - Use TMC (trivia_multiple_choice) and TFT (trivia_true_false) question types
  - Total: 10 questions
```

---

## Pseudo-Code Workflow

```pseudocode
FUNCTION BuildTriviaSet(goal, rules):

  // Extract parameters from Goal and Rules
  theme = EXTRACT_THEME(goal)  // "December Hockey"
  questionTypes = EXTRACT_TYPES(rules)  // ["TMC", "TFT"]
  questionCount = EXTRACT_COUNT(rules)  // 10

  // TASK 1: Query Source Questions
  FUNCTION Task1_QuerySourceQuestions(theme, questionTypes):
    candidates = []

    IF "TMC" IN questionTypes:
      tmcQuestions = QUERY_DATABASE(
        table: "trivia_multiple_choice",
        filter: MATCH_THEME(theme),  // Match by tags, theme field, or content
        status: "published"
      )
      candidates.ADD_ALL(tmcQuestions)

    IF "TFT" IN questionTypes:
      tftQuestions = QUERY_DATABASE(
        table: "trivia_true_false",
        filter: MATCH_THEME(theme),
        status: "published"
      )
      candidates.ADD_ALL(tftQuestions)

    RETURN candidates
  END FUNCTION

  // TASK 2: Select & Balance Questions
  FUNCTION Task2_SelectAndBalance(candidates, questionCount, questionTypes):
    selectedQuestions = []

    // Determine distribution (e.g., 50/50 split or based on availability)
    tmcCount = CALCULATE_SPLIT(questionCount, questionTypes, "TMC")
    tftCount = CALCULATE_SPLIT(questionCount, questionTypes, "TFT")

    // Select TMC questions
    tmcCandidates = FILTER_BY_TYPE(candidates, "multiple-choice")
    selectedTMC = RANDOM_SELECT(tmcCandidates, count: tmcCount)
    selectedQuestions.ADD_ALL(selectedTMC)

    // Select TFT questions
    tftCandidates = FILTER_BY_TYPE(candidates, "true-false")
    selectedTFT = RANDOM_SELECT(tftCandidates, count: tftCount)
    selectedQuestions.ADD_ALL(selectedTFT)

    // Shuffle final selection
    selectedQuestions = SHUFFLE(selectedQuestions)

    RETURN selectedQuestions
  END FUNCTION

  // TASK 3: Generate Set Metadata
  FUNCTION Task3_GenerateMetadata(theme, selectedQuestions):
    metadata = {
      title: GENERATE_TITLE(theme),  // "December Hockey Trivia"
      slug: GENERATE_SLUG(theme),    // "december-hockey-trivia"
      description: GENERATE_DESCRIPTION(theme),
      category: DETERMINE_CATEGORY(theme),  // e.g., "Seasonal"
      theme: theme,  // "December Hockey"
      tags: EXTRACT_TAGS(selectedQuestions) + [theme],
      difficulty: CALCULATE_AVERAGE_DIFFICULTY(selectedQuestions)  // Optional
    }

    RETURN metadata
  END FUNCTION

  // TASK 4: Assemble Question Data
  FUNCTION Task4_AssembleQuestionData(selectedQuestions):
    questionData = []

    FOR EACH question IN selectedQuestions:
      transformedQuestion = {
        question_text: question.question_text,
        question_type: question.question_type,  // "multiple-choice" or "true-false"
        correct_answer: question.correct_answer,
        wrong_answers: question.wrong_answers,
        explanation: question.explanation,  // If available
        tags: question.tags  // If available
      }
      questionData.ADD(transformedQuestion)
    END FOR

    // Optional: Randomize order
    questionData = SHUFFLE(questionData)

    RETURN questionData
  END FUNCTION

  // TASK 5: Create Trivia Set Record
  FUNCTION Task5_CreateTriviaSetRecord(metadata, questionData, questionCount):
    triviaSet = {
      title: metadata.title,
      slug: metadata.slug,
      description: metadata.description,
      category: metadata.category,
      theme: metadata.theme,
      tags: metadata.tags,
      difficulty: metadata.difficulty,
      question_data: questionData,  // JSONB array
      question_count: questionCount,  // 10
      status: "draft",  // Default, can be overridden by rules
      visibility: "Unlisted",  // Default for review, can be overridden
      created_at: NOW(),
      updated_at: NOW()
    }

    // Insert into database
    result = INSERT_INTO_DATABASE(
      table: "trivia_sets",
      data: triviaSet
    )

    RETURN result
  END FUNCTION

  // TASK 6: Validate & Finalize
  FUNCTION Task6_ValidateAndFinalize(triviaSet, questionCount):
    validationErrors = []

    // Validate question count
    IF LENGTH(triviaSet.question_data) != questionCount:
      validationErrors.ADD("Question count mismatch")
    END IF

    // Validate required fields
    IF MISSING(triviaSet.title) OR MISSING(triviaSet.slug):
      validationErrors.ADD("Missing required metadata")
    END IF

    // Validate question structure
    FOR EACH question IN triviaSet.question_data:
      IF MISSING(question.question_text) OR
         MISSING(question.question_type) OR
         MISSING(question.correct_answer):
        validationErrors.ADD("Invalid question structure")
        BREAK
      END IF
    END FOR

    // If validation passes, optionally update status
    IF validationErrors.EMPTY():
      // Optionally auto-publish or keep as draft
      // UPDATE_STATUS(triviaSet.id, "published")  // If rule allows
      RETURN { success: true, triviaSet: triviaSet }
    ELSE:
      RETURN { success: false, errors: validationErrors }
    END IF
  END FUNCTION

  // MAIN EXECUTION FLOW
  BEGIN
    candidates = Task1_QuerySourceQuestions(theme, questionTypes)

    IF candidates.EMPTY():
      RETURN ERROR("No questions found matching theme")
    END IF

    selectedQuestions = Task2_SelectAndBalance(candidates, questionCount, questionTypes)

    IF LENGTH(selectedQuestions) < questionCount:
      RETURN ERROR("Insufficient questions available")
    END IF

    metadata = Task3_GenerateMetadata(theme, selectedQuestions)
    questionData = Task4_AssembleQuestionData(selectedQuestions)

    triviaSetRecord = Task5_CreateTriviaSetRecord(metadata, questionData, questionCount)

    validationResult = Task6_ValidateAndFinalize(triviaSetRecord, questionCount)

    IF validationResult.success:
      RETURN {
        status: "success",
        triviaSetId: triviaSetRecord.id,
        message: "Trivia set created successfully"
      }
    ELSE:
      RETURN {
        status: "error",
        errors: validationResult.errors
      }
    END IF
  END

END FUNCTION
```

---

## Execution Flow Diagram

```
START
  ↓
[Extract Goal & Rules]
  ↓
[Task 1: Query Source Questions]
  ├─ Query trivia_multiple_choice (TMC)
  └─ Query trivia_true_false (TFT)
  ↓
[Task 2: Select & Balance]
  ├─ Calculate split (e.g., 5 TMC + 5 TFT)
  ├─ Random select from each type
  └─ Shuffle final selection
  ↓
[Task 3: Generate Metadata]
  ├─ Title: "December Hockey Trivia"
  ├─ Slug: "december-hockey-trivia"
  ├─ Description, Category, Tags
  └─ Difficulty (optional)
  ↓
[Task 4: Assemble Question Data]
  ├─ Transform to TriviaQuestionData format
  └─ Create JSONB array
  ↓
[Task 5: Create Record]
  └─ INSERT INTO trivia_sets table
  ↓
[Task 6: Validate & Finalize]
  ├─ Check question count = 10
  ├─ Validate structure
  └─ Set final status
  ↓
[Result Set]
  └─ Store in Trivia Sets table
  ↓
END
```

---

## Helper Functions (Examples)

```pseudocode
FUNCTION MATCH_THEME(theme):
  // Match questions where:
  // - tags CONTAINS theme keywords
  // - theme field MATCHES theme
  // - question_text CONTAINS theme keywords
  RETURN filter_condition
END FUNCTION

FUNCTION CALCULATE_SPLIT(totalCount, types, targetType):
  // Simple 50/50 split if both types present
  IF types.length == 2:
    RETURN totalCount / 2
  ELSE:
    RETURN totalCount  // All of one type
  END IF
END FUNCTION

FUNCTION GENERATE_TITLE(theme):
  RETURN theme + " Trivia"
END FUNCTION

FUNCTION GENERATE_SLUG(theme):
  RETURN LOWERCASE(REPLACE_SPACES_WITH_HYPHENS(theme)) + "-trivia"
END FUNCTION
```
