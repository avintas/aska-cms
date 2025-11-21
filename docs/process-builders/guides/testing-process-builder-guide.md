# Testing Process Builder: Build Trivia Set

## 🎯 Testing Steps

### Step 1: Start Development Server

```bash
npm run dev
```

**Wait for:** `Ready on http://localhost:3000`

---

### Step 2: Access the Process Builder

1. **Login to CMS** (if not already logged in):
   - Go to: `http://localhost:3000/cms`

2. **Navigate to Process Builder**:
   - Look for "Build Trivia Set" in the sidebar under "Processing" section
   - Or go directly to: `http://localhost:3000/cms/process-builders/build-trivia-set`

---

### Step 3: Test with Sample Data

#### Test Case 1: Basic Trivia Set (Recommended First Test)

**Input:**

- **Theme (Goal):** `hockey`
- **Question Types:** ✅ TMC, ✅ TFT
- **Number of Questions:** `10`
- **Distribution Strategy:** `Weighted by Availability`
- **Cooldown Days:** `30`
- **Allow Partial Sets:** ❌ (unchecked)

**Expected Result:**

- Status: Success
- Trivia set created with ID
- 10 questions selected (or fewer if not enough available)

---

#### Test Case 2: Specific Theme

**Input:**

- **Theme (Goal):** `December`
- **Question Types:** ✅ TMC
- **Number of Questions:** `5`
- **Distribution Strategy:** `Even Split`
- **Allow Partial Sets:** ✅ (checked)

**Expected Result:**

- Status: Success or Partial
- Up to 5 multiple choice questions about December

---

#### Test Case 3: No Matches (Error Handling)

**Input:**

- **Theme (Goal):** `xyz123nonexistent`
- **Question Types:** ✅ TMC
- **Number of Questions:** `10`

**Expected Result:**

- Status: Error
- Error message: "No candidates match the requested question types" or "No questions found"

---

### Step 4: Verify Results

After successful creation, check:

1. **In the UI:**
   - ✅ Success message appears
   - ✅ Trivia Set ID is shown
   - ✅ Task progress shows all tasks completed
   - ✅ No errors (or only expected warnings)

2. **In Supabase Dashboard:**
   - Go to Table Editor → `trivia_sets`
   - Find the newly created record
   - Check:
     - ✅ Title is correct
     - ✅ Slug is unique
     - ✅ Question count matches
     - ✅ `question_data` has array of questions
     - ✅ Status is 'draft'
     - ✅ Visibility is 'Private'

---

## 🐛 Common Issues & Solutions

### Issue 1: "No candidates found"

**Cause:** No questions match the theme, or no published questions in database

**Solutions:**

- Use a broader theme (e.g., "hockey" instead of "December Hockey")
- Check if questions exist: Run in Supabase SQL Editor:
  ```sql
  SELECT COUNT(*) FROM trivia_multiple_choice WHERE status = 'published';
  SELECT COUNT(*) FROM trivia_true_false WHERE status = 'published';
  ```
- If no questions exist, add some test questions first

---

### Issue 2: "Insufficient questions available"

**Cause:** Not enough questions for the requested count

**Solutions:**

- Reduce question count
- Enable "Allow Partial Sets"
- Add more questions to the database

---

### Issue 3: "Slug already exists"

**Cause:** A trivia set with that slug already exists

**Solutions:**

- Use a different theme
- Delete the existing set in Supabase
- Or modify the slug generation to add timestamp/random suffix

---

### Issue 4: Process Builder link not showing

**Cause:** Build might be needed to update navigation

**Solutions:**

```bash
# Restart dev server
npm run dev
```

---

## 🧪 Testing Checklist

### Basic Functionality

- [ ] Page loads without errors
- [ ] Form displays all fields
- [ ] Can enter theme
- [ ] Can select question types
- [ ] Can set question count
- [ ] Submit button works

### Task Execution

- [ ] Task 1: Queries database successfully
- [ ] Task 2: Selects and balances questions
- [ ] Task 3: Generates metadata
- [ ] Task 4: Assembles question data
- [ ] Task 5: Creates database record
- [ ] Task 6: Validates successfully

### Error Handling

- [ ] Shows error if no questions found
- [ ] Shows error if invalid input
- [ ] Shows warnings appropriately
- [ ] Displays error messages clearly

### Database Verification

- [ ] Record created in `trivia_sets` table
- [ ] All fields populated correctly
- [ ] Question data is valid JSONB
- [ ] Constraints respected (unique slug, question_count > 0)

---

## 📊 Expected Results by Test Case

### Test Case 1 (Basic - hockey, 10 questions)

```
Expected Output:
✓ Status: success
✓ Process: Build Trivia Set
✓ Execution Time: < 5000ms
✓ Tasks Executed: 6
✓ Trivia Set ID: [number]
```

### Test Case 2 (Partial - December, 5 questions)

```
Expected Output:
✓ Status: success or partial
✓ Questions: up to 5 (may be fewer)
✓ Warning: May show if fewer than requested
```

### Test Case 3 (Error - nonexistent theme)

```
Expected Output:
✗ Status: error
✗ Error: NO_MATCHING_CANDIDATES
✗ Message: "No candidates match the requested question types"
```

---

## 🚀 Next Steps After Testing

If tests pass:

1. ✅ Process Builder is working!
2. Consider enhancements (caching, relevance scoring, etc.)
3. Create more process builders for other workflows

If tests fail:

1. Check error messages
2. Verify database has published questions
3. Check Supabase connection
4. Review logs

---

## 💡 Testing Tips

1. **Start with broad theme** (e.g., "hockey") before specific (e.g., "December Hockey")
2. **Enable "Allow Partial Sets"** for testing to avoid errors when few questions exist
3. **Check browser console** for detailed error messages
4. **Check Supabase logs** if database errors occur
5. **Test with small question counts** first (5-10)

---

## 📞 If You Need Help

If something doesn't work:

1. Share the error message from the UI
2. Share any console errors
3. Share the theme and settings you used
4. I can help debug!

---

## ✅ Quick Start Test

**Simplest test to verify everything works:**

1. Go to: `http://localhost:3000/cms/process-builders/build-trivia-set`
2. Enter: "hockey"
3. Check: ✅ TMC, ✅ TFT
4. Set: 5 questions
5. Enable: ✅ Allow Partial Sets
6. Click: "Build Trivia Set"

**Expected:** Should create a trivia set (or show clear error if no questions exist).
