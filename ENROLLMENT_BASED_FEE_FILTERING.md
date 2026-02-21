# Enrollment-Based Fee Filtering

## Problem Statement

Students who join mid-year (e.g., in Term 2 instead of Term 1) are incorrectly showing fees for terms before their enrollment date. This creates several issues:

1. **Incorrect Total Expected Fees**: The system includes fees from terms before student enrollment
2. **Misleading Financial Reports**: Auditing becomes difficult when payments are allocated to pre-enrollment terms
3. **Payment Allocation Issues**: Money may be allocated to terms the student shouldn't be paying for

### Example Issue

**Student: Sarah Waweru**
- **Joined**: Term 2 (2025-2026) - January 5, 2026
- **Current Display**:
  - Total Expected: MK 1,000,000 (includes Term 1 + Term 2 + Term 3)
  - Term 1 Expected: MK 500,000 (Student wasn't enrolled!)
  - Term 2 Expected: MK 200,000
  - Term 3 Expected: MK 300,000
  
- **Should Display**:
  - Total Expected: MK 500,000 (only Term 2 + Term 3)
  - Term 1: Should not appear
  - Term 2 Expected: MK 200,000
  - Term 3 Expected: MK 300,000

## Frontend Solution

### Changes Made to `StudentFinancialDetailsModal.tsx`

#### 1. Extended Interface
Added enrollment tracking fields to the `StudentFinancialDetails` interface:

```typescript
interface StudentFinancialDetails {
  student: {
    // ... existing fields
    enrollmentTermId?: string; // Term when student enrolled
    enrollmentDate?: string; // Date when student enrolled
  };
  // ... rest of interface
}
```

#### 2. Filtering Function
Implemented `filterAndRecalculateFinancialDetails()` that:
- Identifies the enrollment term in the term breakdown
- Filters out terms before enrollment
- Filters transaction history to only include applicable terms
- Recalculates:
  - Total Expected (sum of filtered terms)
  - Total Paid (sum of filtered terms)
  - Total Outstanding (sum of filtered terms)
  - Payment Percentage (based on filtered amounts)

```typescript
const filterAndRecalculateFinancialDetails = (data: StudentFinancialDetails): StudentFinancialDetails => {
  // Returns original data if no enrollment term specified
  if (!data.student.enrollmentTermId) return data;
  
  // Find enrollment term index
  const enrollmentTermIndex = data.termBreakdown.findIndex(
    term => term.termId === data.student.enrollmentTermId
  );
  
  // Filter terms from enrollment onwards
  const filteredTermBreakdown = data.termBreakdown.filter(
    (_, index) => index >= enrollmentTermIndex
  );
  
  // Recalculate all totals based on filtered terms
  // ...
}
```

#### 3. Visual Indicators
Added UI elements to inform users:
- **Enrollment Information Box**: Shows which term the student enrolled in
- **Toast Notification**: Appears when filtering is applied
- **Card Description**: Updates to show filtered term count
- **Console Logging**: Logs filtering actions for debugging

## Backend Requirements

For this frontend solution to work correctly, the backend API endpoint `/finance/student-financial-details/{studentId}` **MUST** include enrollment information:

```json
{
  "student": {
    "id": "uuid",
    "firstName": "Sarah",
    "lastName": "Waweru",
    "studentId": "260038",
    "email": "stu046@schomas.test",
    "className": "Form One",
    "enrollmentTermId": "term-2-uuid-here",  // ← Optional field - if provided, filtering will be applied. If not provided, no filtering occurs.
    "enrollmentDate": "2026-01-05"           // ← Optional (recommended for future use)
  },
  "summary": { /* ... */ },
  "termBreakdown": [ /* ... */ ],
  // ...
}
```

### Backend Implementation Recommendations

The backend should:

1. **Store Enrollment Information**:
   - Add `enrollment_term_id` or `enrollment_date` to student records
   - Track which term/date the student first enrolled

2. **Filter Terms on Backend**:
   - When generating `termBreakdown`, only include terms from enrollment onwards
   - Don't send pre-enrollment terms to frontend at all

3. **Validate Payment Allocations**:
   - Prevent payments from being allocated to terms before enrollment
   - Add validation checks when recording new payments

4. **Recalculate Totals**:
   - Ensure `totalExpectedAllTerms` only includes applicable terms
   - Recalculate all summary fields based on filtered terms

### Example Backend Query Logic

```sql
-- Get only terms from student enrollment onwards
SELECT t.*
FROM terms t
WHERE t.academic_calendar_id = :calendar_id
  AND t.start_date >= (
    SELECT enrollment_date 
    FROM students 
    WHERE id = :student_id
  )
ORDER BY t.term_number ASC;
```

## Testing

### Test Cases

1. **Student Enrolled in Term 1**:
   - Should show all terms
   - No filtering applied
   - No enrollment notice shown

2. **Student Enrolled in Term 2**:
   - Should show only Term 2, Term 3, etc.
   - Term 1 should not appear
   - Totals should reflect only applicable terms
   - Enrollment notice should appear

3. **Backend Doesn't Send `enrollmentTermId`**:
   - Frontend shows all data as received (no filtering)
   - No errors or crashes
   - Graceful degradation

### Manual Testing Steps

1. Open student financial details modal for a mid-year enrollee
2. Verify enrollment information box appears (if backend sends data)
3. Check term breakdown shows only applicable terms
4. Verify totals are correctly calculated
5. Check transaction history only shows payments for applicable terms

## Migration Notes

### Immediate Impact
- Frontend will continue to work with existing backend
- If backend doesn't send `enrollmentTermId`, no filtering occurs
- **Backward compatible** - no breaking changes

### Full Solution Timeline
1. **Phase 1 (Current)**: Frontend defensive filtering
2. **Phase 2 (Backend)**: Add enrollment tracking to student model
3. **Phase 3 (Backend)**: Implement backend filtering in API endpoints
4. **Phase 4 (Backend)**: Add payment allocation validation
5. **Phase 5 (Testing)**: End-to-end testing with real data

## Known Limitations

1. **Frontend-Only Fix**: Filtering happens after data is received
   - Backend still includes incorrect terms in calculations
   - Other pages using same endpoints may show incorrect data

2. **Requires Backend Changes**: Full fix requires backend implementation
   - Frontend filter is a mitigation, not complete solution
   - Backend must eventually provide `enrollmentTermId`

3. **Historical Data**: May not retroactively fix existing incorrect allocations
   - Data cleanup may be needed for historical records

## Related Files

- `src/components/StudentFinancialDetailsModal.tsx` - Main implementation
- `src/pages/finance/Finance.tsx` - Finance summary page (uses same backend APIs)
- `src/pages/finance/PaymentForm.tsx` - Payment recording (should validate term eligibility)

## Contact

For questions or issues related to this feature:
- Check backend API response format
- Verify `enrollmentTermId` is being sent
- Review console logs for filtering operations
