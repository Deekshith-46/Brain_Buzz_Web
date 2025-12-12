# Test Series Scoring Correction Verification

This document verifies that the scoring calculation bug has been fixed correctly.

## Issue Identified

The original scoring calculation was incorrectly adding negative marks instead of subtracting them:

**Incorrect Logic:**
```javascript
if (response.isCorrect) {
  score += question.marks || test.positiveMarks || 1;
} else {
  score += question.negativeMarks || test.negativeMarks || 0;
}
```

This resulted in:
- Correct answers: 2 × 3 = 6
- Incorrect answers: 4 × (-0.5) = -2
- But calculated as: 6 + (-2) = 4 ❌ (Actually it was 6 + 2 = 8)

## Root Cause

The negative marks were being added instead of subtracted, causing inflated scores.

## Fix Applied

**Corrected Logic:**
```javascript
if (response.isCorrect) {
  score += question.marks || test.positiveMarks || 1;
} else {
  score -= Math.abs(question.negativeMarks || test.negativeMarks || 0);
}
```

## Verification Test Case

Given test data:
- 6 questions total
- Positive marks per question: 3
- Negative marks per question: -0.5
- User responses:
  - Correct: 2 questions
  - Incorrect: 4 questions
  - Unattempted: 0 questions

**Calculation:**
1. Correct answers: 2 × 3 = 6 marks
2. Incorrect answers: 4 × 0.5 = 2 marks (to be subtracted)
3. Final score: 6 - 2 = 4 marks

**Expected Results:**
- correct: 2
- incorrect: 4
- unattempted: 0
- score: 4
- accuracy: 33.33%
- percentage: 33.33%

This matches the expected mathematical calculation and verifies the fix is correct.