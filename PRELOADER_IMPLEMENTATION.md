# Uniform Preloader Implementation

## Overview
This document outlines the implementation of a uniform preloader system across the Schomas frontend application to maintain consistency in loading states.

## Components Created

### 1. Main Preloader Component (`/src/components/ui/preloader.tsx`)

A comprehensive, reusable preloader component with multiple variants:

#### Variants:
- **`spinner`** (default): Shows a spinning Loader2 icon with optional text
- **`skeleton`**: Shows skeleton placeholders for content loading
- **`dots`**: Shows animated dots with optional text
- **`text`**: Shows simple loading text

#### Sizes:
- **`sm`**: Small (h-4 w-4)
- **`md`**: Medium (h-8 w-8) - default
- **`lg`**: Large (h-12 w-12)

#### Props:
- `variant`: Preloader style
- `size`: Component size
- `text`: Custom loading message (default: "Loading...")
- `className`: Additional CSS classes
- `centered`: Whether to center the preloader (default: true)
- `rows`: Number of skeleton rows (skeleton variant only)
- `height`: Container height
- `fullScreen`: Full screen overlay mode

### 2. Specialized Preloader Components

#### `TablePreloader`
Pre-configured for table loading states with proper colspan support.

```tsx
<TablePreloader colSpan={6} text="Loading data..." />
```

#### `CardPreloader`
Pre-configured for card/container loading states.

```tsx
<CardPreloader height="16rem" text="Loading content..." />
```

#### `PagePreloader`
Pre-configured for full page loading states.

```tsx
<PagePreloader text="Loading page..." />
```

#### `FullScreenPreloader`
Pre-configured for modal/overlay loading states.

```tsx
<FullScreenPreloader text="Processing..." />
```

## Files Updated

### Teacher Pages:
- `TeacherStudents.tsx` - Card preloader for student list
- `Teachers.tsx` - Table preloader for teacher list
- `TeacherCourses.tsx` - Skeleton preloader for course cards
- `TeacherExams.tsx` - Table preloader for exam list
- `TeacherAllExams.tsx` - Table preloader for all exams
- `TeacherDetails.tsx` - Page preloader for teacher details
- `TeacherAttendance.tsx` - Skeleton preloader for attendance form
- `SubmitGrades.tsx` - Skeleton preloader for grade submission
- `CourseTermScheme.tsx` - Table preloader for schemes
- `AggregatedResults.tsx` - Table preloader for results

### Student Pages:
- `Students.tsx` - Table preloader for student list
- `StudentForm.tsx` - Page preloader for student form
- `StudentMaterials.tsx` - Page preloader for materials
- `StudentCourses.tsx` - Page preloader for courses

### Dashboard:
- `DashboardCharts.tsx` - Multiple spinner and skeleton preloaders for different chart sections

### Schedule Pages:
- `schedules.tsx` - Spinner preloader for schedule loading
- `Schedule.tsx` - Spinner preloader for schedule loading

## Usage Examples

### Basic Spinner
```tsx
<Preloader variant="spinner" size="md" text="Loading data..." />
```

### Skeleton Loading
```tsx
<Preloader variant="skeleton" rows={5} className="space-y-4" />
```

### Table Loading
```tsx
<TableBody>
  {loading ? (
    <TablePreloader colSpan={6} text="Loading records..." />
  ) : (
    // table content
  )}
</TableBody>
```

### Full Page Loading
```tsx
if (loading) {
  return <PagePreloader text="Loading dashboard..." />;
}
```

## Benefits

1. **Consistency**: All loading states now use the same visual design language
2. **Reusability**: Single component handles multiple use cases
3. **Maintainability**: Easy to update loading behavior across the entire app
4. **Flexibility**: Multiple variants and customization options
5. **Performance**: Optimized imports and tree-shaking friendly
6. **Accessibility**: Consistent loading states improve UX

## Migration Summary

- **Before**: Mixed loading implementations (custom spinners, skeleton code, simple text)
- **After**: Uniform preloader component with consistent styling and behavior
- **Coverage**: 20+ pages updated with new preloader system
- **Build Status**: ✅ All builds successful with no breaking changes

## Future Enhancements

- Add animation customization options
- Implement progress bar variant
- Add loading state management hooks
- Consider lazy loading for large datasets