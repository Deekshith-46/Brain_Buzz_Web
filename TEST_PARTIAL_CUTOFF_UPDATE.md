# Partial Cutoff Update Functionality Test

This document verifies that the partial cutoff update functionality works correctly.

## Issue Addressed

Previously, when updating cutoff values, if an admin only wanted to update one value (e.g., general cutoff), they had to provide all values. This was inconvenient and error-prone.

## Solution Implemented

The update function now supports partial updates where admins can send only the fields they want to change, and the existing values for other fields will be preserved.

## Test Cases

### Test Case 1: Initial Cutoff Setting
1. Admin sets initial cutoff values:
   ```json
   {
     "general": 15,
     "obc": 14,
     "sc": 13,
     "st": 13
   }
   ```
2. All values are stored correctly.

### Test Case 2: Partial Update - Single Field
1. Admin updates only the general cutoff:
   ```json
   {
     "general": 16
   }
   ```
2. Expected result:
   - general: 16 (updated)
   - obc: 14 (preserved)
   - sc: 13 (preserved)
   - st: 13 (preserved)

### Test Case 3: Partial Update - Multiple Fields
1. Admin updates general and obc cutoffs:
   ```json
   {
     "general": 17,
     "obc": 15
   }
   ```
2. Expected result:
   - general: 17 (updated)
   - obc: 15 (updated)
   - sc: 13 (preserved)
   - st: 13 (preserved)

### Test Case 4: Full Update
1. Admin updates all cutoff values:
   ```json
   {
     "general": 18,
     "obc": 16,
     "sc": 14,
     "st": 14
   }
   ```
2. Expected result:
   - All values updated to new values

## Implementation Details

The solution uses MongoDB's `$set` operator with dot notation to update specific nested fields:

```javascript
// Build update object with only provided values
const updateFields = {};
if (general !== undefined) updateFields['cutoff.general'] = general;
if (obc !== undefined) updateFields['cutoff.obc'] = obc;
if (sc !== undefined) updateFields['cutoff.sc'] = sc;
if (st !== undefined) updateFields['cutoff.st'] = st;

// Update cutoff with only provided fields
const cutoff = await Cutoff.findOneAndUpdate(
  { testSeries: seriesId, testId: testId },
  { $set: updateFields },
  { new: true }
);
```

This approach ensures:
1. Only specified fields are updated
2. Existing values for unspecified fields are preserved
3. Database operations are efficient
4. The API is intuitive for admin users

## Benefits

1. **Usability**: Admins can update single values without needing to know/resend all values
2. **Safety**: Reduces risk of accidentally resetting values
3. **Efficiency**: Less data transfer between client and server
4. **Flexibility**: Supports both partial and full updates based on admin needs

This enhancement makes the cutoff management system much more practical for real-world administrative use.