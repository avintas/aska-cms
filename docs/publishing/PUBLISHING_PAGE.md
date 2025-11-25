# Publishing Page Description

## What the Publishing Page Does

The Publishing page (`/publishing`) allows users to create and publish collections of content items (motivational quotes or facts) as shareable sets.

## Page Layout

### Header
- **Title**: "Publishing"
- **Description**: "Create and manage published shareable collections for your content"
- **Category**: Listed under "Operations"

### Main Sections

1. **Content Type Selector**
2. **Statistics Panel**  
3. **Random Set Generator**
4. **Selected Items Manager** (appears when items are selected)

---

## Inputs

### Content Type Selector
- **Input**: Dropdown selection
- **Options**: 
  - "Motivational" (default)
  - "Facts"
- **Effect**: Changes which content collection is used for all operations

### Random Set Generator
- **Input**: Number input field labeled "Number of Items"
- **Default Value**: 10
- **Range**: 1 to total available items
- **Button**: "Generate Set" / "Generating..." (when loading)

### Selected Items Actions
- **Regenerate Button**: Clears current selection and generates new random set
- **Publish Set Button**: Publishes the entire collection
- **Individual Item Actions**: Each item card has buttons for copy, status changes, remove, delete

---

## What It Does

### 1. Statistics Display
- Fetches and displays statistics via `/api/shareables/stats?type={contentType}`
- Shows 5 metrics in a grid:
  - **Total Records**: Total items in the collection
  - **Published**: Items with published status
  - **Unpublished**: Items not published or archived  
  - **Archived**: Items with archived status
  - **Published Sets**: Number of published collections created

### 2. Random Item Generation
- Calls `/api/shareables/random` with POST request
- Request body: `{ content_type, count }`
- Generates random selection of items from the chosen content type
- Populates the Selected Items section

### 3. Item Management
- Displays selected items as individual cards
- Each card shows: ID, status badge, content text, author (if applicable), context, attribution
- Provides action buttons for each item

### 4. Collection Publishing
- Publishes the entire selected set via `/api/shareables/publish`
- Creates a collection record in `pub_shareables_motivational` or `pub_shareables_facts` table
- Updates individual item statuses to "published" via PATCH requests to `/api/motivational/{id}` or `/api/facts/{id}`
- Refreshes statistics after successful publishing

---

## Outputs

### Immediate UI Outputs
- **Statistics Display**: Real-time counts of content status
- **Generated Items**: List of randomly selected content items
- **Status Updates**: Visual feedback on item status changes
- **Error Messages**: Displayed when operations fail
- **Loading States**: Spinners and disabled states during API calls

### Database Outputs
1. **Published Collection Record**: Creates new record in `pub_shareables_*` table with JSONB array of items
2. **Individual Item Status Updates**: Updates `status` field to "published" for each item in the set
3. **Timestamps**: Sets `published_at` timestamps on individual items

### API Calls Made
- `GET /api/shareables/stats?type={contentType}` - Fetch statistics
- `POST /api/shareables/random` - Generate random item selection
- `POST /api/shareables/publish` - Create published collection
- `PATCH /api/motivational/{id}` or `PATCH /api/facts/{id}` - Update individual item status

---

## User Workflow

1. **Select Content Type** (motivational or facts)
2. **View Statistics** for that content type
3. **Set Item Count** (default 10)
4. **Generate Random Set** of items
5. **Review Selected Items** in the list
6. **Modify Selection** (remove items, change status, etc.)
7. **Publish Set** to create a shareable collection
8. **View Updated Statistics** reflecting the published items

The page automatically refreshes statistics and clears the selection after successful publishing.
