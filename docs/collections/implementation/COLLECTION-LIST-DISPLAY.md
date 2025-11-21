# Collection List Display Code

This document shows the code used to display the hero collections list in the CMS interface with a two-column layout: collections list on the left, preview panel on the right.

---

## TypeScript Interfaces

```typescript
interface HeroCollection {
  id: number;
  name: string;
  description: string | null;
  content_items: ContentItem[];
  active: boolean;
  display_order: number;
}

interface ContentItem {
  id: number;
  content_text: string;
  content_type: string;
  theme: string;
}
```

---

## State Management

```typescript
const [collections, setCollections] = useState<HeroCollection[]>([]);
const [selectedCollection, setSelectedCollection] = useState<number | null>(
  null,
);
const [previewContent, setPreviewContent] = useState<ContentItem[]>([]);
```

---

## Helper Functions

### Emoji Mapping by Content Type

```typescript
const getContentTypeEmoji = (type: string) => {
  const emojiMap: Record<string, string> = {
    motivational: "🔥",
    statistics: "📊",
    wisdom: "💎",
    greeting: "👋",
    trivia: "🏒",
  };
  return emojiMap[type] || "📝";
};
```

### Preview Collection Handler

```typescript
const previewCollection = async (
  collectionId: number,
  contentItems: ContentItem[],
) => {
  setSelectedCollection(collectionId);
  setError(null);
  setPreviewContent(contentItems);
};
```

---

## Main Layout: Two-Column Grid

```tsx
{
  /* Collections Grid */
}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  {/* Left Column: Collections List */}
  <div>{/* Collection list code here */}</div>

  {/* Right Column: Preview Panel */}
  <div>{/* Preview panel code here */}</div>
</div>;
```

---

## Left Column: Collections List

```tsx
{
  /* Collections List */
}
<div>
  <Heading level={2} className="mb-4">
    Collections ({collections.length})
  </Heading>

  <div className="space-y-2">
    {collections.map((collection) => (
      <div
        key={collection.id}
        className={`p-4 rounded-lg border-2 transition-colors cursor-pointer ${
          selectedCollection === collection.id
            ? "border-indigo-500 bg-indigo-500/10"
            : "border-gray-700 bg-gray-800 hover:border-gray-600"
        }`}
        onClick={() =>
          previewCollection(collection.id, collection.content_items)
        }
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-white">{collection.name}</h3>
            {collection.description && (
              <p className="text-sm text-gray-400 mt-1">
                {collection.description}
              </p>
            )}
          </div>
          <div className="text-right ml-4">
            <p className="text-sm text-gray-400">
              {collection.content_items.length} items
            </p>
            {collection.active && (
              <span className="text-xs text-green-400">● Active</span>
            )}
          </div>
        </div>
      </div>
    ))}

    {collections.length === 0 && (
      <div className="p-8 text-center text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
        No collections yet. Generate your first one!
      </div>
    )}
  </div>
</div>;
```

### Collection Card Breakdown:

**Card States:**

- **Default**: Gray border, dark background
- **Selected**: Indigo border, indigo-tinted background
- **Hover**: Lighter gray border

**Card Content:**

- **Name** (bold white text)
- **Description** (smaller gray text, optional)
- **Item count** (right side, gray)
- **Active indicator** (green dot, only if active)

---

## Right Column: Preview Panel

```tsx
{
  /* Preview Panel */
}
<div>
  <Heading level={2} className="mb-4">
    {showNewForm
      ? "Preview: New Collection"
      : selectedCollection
        ? `Preview: ${collections.find((c) => c.id === selectedCollection)?.name}`
        : "Select a collection to preview"}
  </Heading>

  {previewContent.length > 0 ? (
    <div className="space-y-3">
      {previewContent.map((item, index) => (
        <div
          key={item.id}
          className="p-4 rounded-lg bg-gray-800 border border-gray-700"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">
              {getContentTypeEmoji(item.content_type)}
            </span>
            <div className="flex-1">
              <p className="text-white">{item.content_text}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-gray-500">#{index + 1}</span>
                <span className="text-xs text-indigo-400">
                  {item.content_type}
                </span>
                {item.theme && (
                  <span className="text-xs text-gray-500">• {item.theme}</span>
                )}
                <span className="text-xs text-gray-600">ID: {item.id}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="p-8 text-center text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
      {showNewForm
        ? "Generate a collection to preview"
        : "Click on a collection to preview its content"}
    </div>
  )}
</div>;
```

### Preview Card Breakdown:

**Each Content Item Shows:**

- **Emoji** (2xl size, based on content type)
- **Content text** (white, main content)
- **Metadata row** (smaller text):
  - Position number (#1, #2, etc.)
  - Content type (indigo color)
  - Theme (gray, optional)
  - Content ID (gray)

---

## Complete Standalone Component

Here's a reusable component you can adapt:

```tsx
import { useState } from "react";

interface Collection {
  id: number;
  name: string;
  description?: string;
  items: any[];
  active: boolean;
}

interface CollectionListProps {
  collections: Collection[];
  onSelect: (collection: Collection) => void;
}

export function CollectionList({ collections, onSelect }: CollectionListProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleSelect = (collection: Collection) => {
    setSelectedId(collection.id);
    onSelect(collection);
  };

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-bold text-white mb-4">
        Collections ({collections.length})
      </h2>

      {collections.map((collection) => (
        <div
          key={collection.id}
          className={`
            p-4 rounded-lg border-2 transition-colors cursor-pointer
            ${
              selectedId === collection.id
                ? "border-indigo-500 bg-indigo-500/10"
                : "border-gray-700 bg-gray-800 hover:border-gray-600"
            }
          `}
          onClick={() => handleSelect(collection)}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-white">{collection.name}</h3>
              {collection.description && (
                <p className="text-sm text-gray-400 mt-1">
                  {collection.description}
                </p>
              )}
            </div>
            <div className="text-right ml-4">
              <p className="text-sm text-gray-400">
                {collection.items.length} items
              </p>
              {collection.active && (
                <span className="text-xs text-green-400">● Active</span>
              )}
            </div>
          </div>
        </div>
      ))}

      {collections.length === 0 && (
        <div className="p-8 text-center text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
          No collections yet. Create your first one!
        </div>
      )}
    </div>
  );
}
```

---

## Styling Reference

### Tailwind Classes Used

**Layout:**

- `grid grid-cols-1 lg:grid-cols-2 gap-8` - Responsive two-column grid
- `space-y-2` / `space-y-3` - Vertical spacing between items
- `flex items-center justify-between` - Horizontal layout with space between

**Card Styling:**

- `p-4` - Padding
- `rounded-lg` - Rounded corners
- `border-2` - Border width
- `transition-colors` - Smooth color transitions
- `cursor-pointer` - Show pointer on hover

**Colors (Dark Theme):**

- `bg-gray-800` - Card background
- `border-gray-700` - Default border
- `border-indigo-500` - Selected border
- `bg-indigo-500/10` - Selected background (10% opacity)
- `hover:border-gray-600` - Hover state border
- `text-white` - Primary text
- `text-gray-400` - Secondary text
- `text-gray-500` - Tertiary text
- `text-indigo-400` - Accent text
- `text-green-400` - Active indicator

---

## CSS Variables Alternative

If you want to use CSS variables for theming:

```css
.collection-card {
  --card-bg: #1f2937;
  --card-border: #374151;
  --card-border-hover: #4b5563;
  --card-border-active: #6366f1;
  --card-bg-active: rgba(99, 102, 241, 0.1);
  --text-primary: #ffffff;
  --text-secondary: #9ca3af;
  --text-accent: #818cf8;
  --text-success: #4ade80;
}

.collection-card {
  padding: 1rem;
  background: var(--card-bg);
  border: 2px solid var(--card-border);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.collection-card:hover {
  border-color: var(--card-border-hover);
}

.collection-card.active {
  border-color: var(--card-border-active);
  background: var(--card-bg-active);
}
```

---

## Responsive Breakpoints

**Mobile (< 768px):**

- Single column layout
- Full width cards
- Stacked preview below list

**Desktop (>= 768px):**

- Two column layout
- List on left, preview on right
- Equal width columns with gap

```css
/* Mobile First */
.collection-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

/* Desktop */
@media (min-width: 1024px) {
  .collection-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
  }
}
```

---

## Accessibility Considerations

1. **Keyboard Navigation**: Cards should be focusable

```tsx
<div
  tabIndex={0}
  role="button"
  onKeyPress={(e) => e.key === 'Enter' && handleSelect(collection)}
>
```

2. **ARIA Labels**: Add descriptive labels

```tsx
<div
  aria-label={`Collection: ${collection.name}, ${collection.items.length} items`}
  aria-selected={selectedId === collection.id}
>
```

3. **Screen Reader Text**: Add hidden helper text

```tsx
<span className="sr-only">
  {collection.active ? "Active collection" : "Inactive collection"}
</span>
```

---

## Animation Variants

### Smooth Expand on Selection

```tsx
<div
  className={`
    transition-all duration-200
    ${selected ? 'scale-[1.02] shadow-lg' : 'scale-100'}
  `}
>
```

### Slide In Effect

```tsx
<div
  className="animate-slide-in"
  style={{ animationDelay: `${index * 50}ms` }}
>
```

```css
@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out forwards;
}
```

---

## Integration with OnlyHockey

To adapt this for OnlyHockey.com:

1. **Replace Tailwind with your CSS framework**
2. **Adjust color scheme** to match your brand
3. **Add your social sharing buttons** to preview cards
4. **Customize emoji mapping** for your content types
5. **Add your analytics tracking** on selection
6. **Implement your loading states**

---

**File Location:** `app/cms/hero-collections/page.tsx` (lines 278-383)
**Last Updated:** October 28, 2025
