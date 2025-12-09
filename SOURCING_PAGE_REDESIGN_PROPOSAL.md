# Sourcing Page Redesign Proposal

## Design Inspiration Analysis

Based on the reference image, the key design patterns to adopt:

1. **Progressive Workflow**: Clear numbered steps (1, 2, 3) that guide users through the process
2. **Visual Separation**: Each step in its own distinct card/section
3. **State-Driven UI**: Sections appear/enable based on workflow progress
4. **Metadata Preview**: Show extracted metadata before final submission
5. **Tag Visualization**: Display tags as interactive pills/chips
6. **Clear Action Hierarchy**: Primary actions are prominent and contextual

## Proposed Structure

### **Step 1: Content Input**
- **Card Title**: "1. Content Input"
- **Layout**: 
  - Large textarea for pasting content
  - Quick action buttons: "Paste from Clipboard" and "Clear" (top-right)
  - Word/character count display (bottom-left)
  - Primary action: "Process Content" button (bottom-right, prominent)
- **State**: Always visible, active when no content processed yet

### **Step 2: AI Processing & Review**
- **Card Title**: "2. AI Processing & Review"
- **Layout**:
  - **Processing State**: Shows animated loading indicator with "Gemini is extracting structured metadata..." when processing
  - **Review State**: Once processed, displays:
    - Extracted title (prominent, editable)
    - Key tags as interactive pills (theme, category, tags)
    - Summary preview (collapsible)
    - Link to "Review & Edit Full Content" (opens modal/expanded view)
- **State**: 
  - Hidden until Step 1 is submitted
  - Shows loading during processing
  - Shows review UI once metadata is extracted
- **Visual**: Tags displayed as colored pills/chips, clickable to edit

### **Step 3: Metadata Finalization**
- **Card Title**: "3. Metadata Finalization"
- **Layout**:
  - **CMS Title**: Required field (overrides AI-generated title)
  - **Category**: Dropdown or input (pre-filled from AI)
  - **Tags/Keywords**: 
    - Shows existing tags as removable pills
    - "+ Add Tag" button for adding new ones
  - **Author/Source**: Input field
  - **Additional Metadata**: Theme, summary (editable)
  - Actions: "Reset" (secondary) and "Publish to Drafts" (primary, green)
- **State**: 
  - Hidden until Step 2 completes
  - Pre-populated with AI-extracted values
  - All fields editable before final submission

## Key UX Improvements

### 1. **Progressive Disclosure**
- Steps unlock sequentially as user progresses
- Clear visual indicators of current step
- Completed steps can be collapsed/expanded

### 2. **Visual Hierarchy**
- Numbered step badges (1, 2, 3) with connecting lines or visual flow
- Each step card has distinct styling but cohesive design
- Primary actions are color-coded (blue for process, green for publish)

### 3. **State Management**
- Track workflow state: `input` → `processing` → `review` → `finalization`
- Auto-advance through steps when appropriate
- Allow users to go back and edit previous steps

### 4. **Metadata Visualization**
- Tags as interactive pills (can remove, add, edit)
- Extracted title shown prominently with edit capability
- Summary in collapsible section
- Key stats (word count, character count) displayed contextually

### 5. **Mode Integration**
- Keep Manual/Auto toggle but integrate into Step 1
- Auto mode: Skip to Step 2 after clipboard ingestion
- Manual mode: User clicks "Process Content" to advance

## Technical Considerations

### State Structure
```typescript
type WorkflowStep = 'input' | 'processing' | 'review' | 'finalization';
type ProcessingState = 'idle' | 'processing' | 'complete' | 'error';
```

### Component Structure
- `StepCard` wrapper component for numbered steps
- `TagPill` component for tag visualization
- `MetadataReview` component for Step 2
- `MetadataEditor` component for Step 3
- Conditional rendering based on workflow state

### Visual Flow
- Step cards stack vertically with spacing
- Active step highlighted (border, shadow, or accent color)
- Completed steps show checkmark or muted styling
- Connecting visual elements (lines, arrows) optional but could enhance flow

## Benefits

1. **Clearer Mental Model**: Users understand they're in a multi-step process
2. **Better Feedback**: Processing state is explicit and visible
3. **Review Before Commit**: Users can review AI extraction before finalizing
4. **Reduced Cognitive Load**: One step at a time, clear actions
5. **Professional Feel**: More polished, enterprise-like workflow

## Migration Path

- Keep existing functionality intact
- Add workflow state management layer
- Restructure UI into step components
- Maintain backward compatibility with current actions
- Progressive enhancement approach

