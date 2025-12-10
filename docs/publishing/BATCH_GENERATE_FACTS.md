# Batch Generate Facts Automated Processing

## Overview

The Batch Generate Facts feature is an automated processing system that sequentially processes multiple source content pieces to generate facts using AI (Gemini). It's part of the Main Generator workspace and allows bulk content generation rather than processing sources one-by-one manually.

## Location

- **Page**: `/main-generator` 
- **Component**: `FactsBatchProcessingPanel` (within `MainGeneratorWorkspace`)
- **Section**: "Automated Processing" → "Batch Generate Facts"

---

## What It Does

### Core Functionality
1. **Finds Unprocessed Sources**: Automatically identifies source content that hasn't been processed for facts generation
2. **Sequential Processing**: Processes sources one-by-one with a 2-second cooldown between requests
3. **AI Generation**: Uses the 'facts' track with Gemini to generate fact content from each source
4. **Progress Tracking**: Provides real-time feedback on processing status and results
5. **Usage Tracking**: Updates source records to mark them as processed for facts

### Processing Logic
- Queries `source_content_ingested` table for active sources
- Excludes sources that already have `'fact'` in their `used_for` array
- Excludes sources that already exist in `collection_facts` table
- Processes sources in ID order (ascending)
- Stops early if no more unprocessed sources are available

---

## User Interface

### Available Sources Display
- **Available Sources Count**: Shows number of unprocessed sources ready for facts generation
- **Total Sources**: Shows total active sources in the system
- **Visual Indicator**: Gradient card with document icon

### Configuration Input
- **Number of Sources to Process**: 
  - Input field (number type)
  - Default: 10
  - Range: 1 to available sources count
  - Auto-caps at maximum available sources

### Action Button
- **"Start Processing X Source(s)"**: Initiates the batch processing
- **"Processing..."**: Shows during active processing
- **Disabled States**: When processing, no sources available, or invalid count

### Progress Display
- **Processing Indicator**: Blue card with "Processing..." message during active processing
- **Warning**: Advises not to close the page during processing

### Results Display
After completion, shows:
- **Status Summary**: Success/failure message with color coding (green/amber)
- **Statistics Grid**: 
  - Requested: Number originally requested
  - Processed: Successfully processed sources
  - Failed: Sources that failed processing
- **Detailed Results**: Scrollable list showing each source's outcome with:
  - Source ID
  - Success/failure status
  - Result message
  - Item count (for successful generations)

---

## Technical Implementation

### API Calls
- `getUnprocessedSourcesCountForFacts()`: Gets available source counts
- `batchGenerateFactsAction(count)`: Executes the batch processing

### Processing Flow
1. **Source Discovery**: `findNextUnprocessedSourceForFacts()` finds next eligible source
2. **Content Generation**: `generateContentAction({ trackKey: 'facts', sourceId })` processes the source
3. **Usage Update**: `updateSourceUsage(sourceId, 'fact')` marks source as processed
4. **Delay**: 2-second wait between sources (rate limiting)
5. **Repeat**: Continue until count reached or no more sources

### Database Operations
- **Reads**: `source_content_ingested`, `collection_facts` tables
- **Writes**: Updates `used_for` field in `source_content_ingested`
- **Inserts**: Creates new records in `collection_facts` table

### Error Handling
- **Source Not Found**: Stops processing early if no unprocessed sources available
- **Generation Failure**: Logs failure but continues with next source
- **Network Issues**: Individual source failures don't stop the entire batch

---

## Output Results

### Success Scenarios
- **Full Success**: All requested sources processed successfully
- **Partial Success**: Some sources processed, others failed or unavailable
- **Early Stop**: Fewer sources available than requested (still considered success if no failures)

### Generated Content
Each successful source generates:
- **Fact Records**: Inserted into `collection_facts` table
- **Source Tracking**: `used_for` array updated with 'fact'
- **Metadata**: Source content ID, creation timestamps, status fields

### Result Messages
- `"Successfully processed all X requested source(s)."`
- `"Processed X source(s) (all available). Requested Y, but only Z unprocessed source(s) were found."`
- `"Processed X source(s), Y failed. Z source(s) were skipped due to errors."`

---

## Usage Workflow

1. **Navigate** to `/main-generator` page
2. **Scroll** to "Batch Generate Facts" section
3. **Review** available sources count
4. **Set** number of sources to process (default 10)
5. **Click** "Start Processing" button
6. **Wait** for processing to complete (do not close page)
7. **Review** results summary and detailed outcomes
8. **Repeat** as needed with remaining sources

---

## Rate Limiting & Performance

- **2-Second Delay**: Between each source processing
- **Sequential Processing**: One source at a time (not parallel)
- **Timeout Considerations**: Each source may take 10-30 seconds for AI generation
- **Total Time**: Approximately (count × 30 seconds) + (count × 2 seconds) for full batch

---

## Integration Points

### Related Systems
- **Main Generator**: Individual source processing
- **Source Content**: Ingested content management
- **Collection Facts**: Generated facts storage
- **AI Generation**: Gemini API integration
- **Publishing**: Facts can be used in shareable collections

### Similar Features
- `MotivationalBatchProcessingPanel`
- `WisdomBatchProcessingPanel`
- `TrueFalseBatchProcessingPanel`
- `WhoAmIBatchProcessingPanel`
- `GreetingsBatchProcessingPanel`

All follow the same pattern with different content types and database tables.












