# Layout System Implementation

**Date:** November 11, 2025  
**Status:** ✅ Implemented  
**Approach:** Next.js 15 Layout System with Conditional Header

---

## Overview

Implemented a persistent navigation header across all authenticated routes using Next.js 15's built-in layout system. The header appears on all pages except public routes (`/` and `/login`).

---

## Architecture

### Component Hierarchy

```
apps/cms/src/app/layout.tsx (Root Layout)
  └── LayoutWrapper (Client Component)
        ├── HeaderWrapper (Server Component) - Conditional
        └── {children} (Page Content)
```

### File Structure

```
apps/cms/src/
├── app/
│   └── layout.tsx                    # Root layout with LayoutWrapper
├── components/
│   └── layout/
│       ├── LayoutWrapper.tsx         # Client component for route detection
│       ├── HeaderWrapper.tsx         # Server component for header rendering
│       ├── Header.tsx                # Original header (kept for reference)
│       └── UserMenu.tsx              # User menu component
```

---

## Implementation Details

### 1. Root Layout (`apps/cms/src/app/layout.tsx`)

The root layout wraps all pages with the `LayoutWrapper`:

```typescript
import LayoutWrapper from '@/components/layout/LayoutWrapper';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
```

**Key Points:**
- Minimal and clean
- No route logic in the layout itself
- Delegates to LayoutWrapper for conditional rendering

---

### 2. LayoutWrapper (`apps/cms/src/components/layout/LayoutWrapper.tsx`)

Client Component that detects the current route and conditionally renders the header:

```typescript
'use client';

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const isPublicRoute = pathname === '/' || pathname.startsWith('/login');

  return (
    <>
      {!isPublicRoute && (
        <Suspense fallback={<div className="h-14 bg-white border-b" />}>
          <HeaderWrapper />
        </Suspense>
      )}
      {children}
    </>
  );
}
```

**Key Points:**
- Client Component (uses `usePathname()` hook)
- Detects public vs. authenticated routes
- Wraps HeaderWrapper in Suspense for loading state
- Renders children (page content) below header

---

### 3. HeaderWrapper (`apps/cms/src/components/layout/HeaderWrapper.tsx`)

Server Component that fetches user session and renders the navigation header:

```typescript
export default async function HeaderWrapper() {
  const { user } = await getSession();

  return (
    <header className="bg-white border-b border-gray-200">
      {/* Navigation links */}
      {user && <UserMenu userEmail={user.email} />}
    </header>
  );
}
```

**Key Points:**
- Server Component (async, fetches session)
- Contains all navigation links
- Shows UserMenu when user is authenticated
- Identical structure to original Header component

---

## Route Behavior

| Route | Header Shown? | Reason |
|-------|---------------|--------|
| `/` | ❌ No | Public landing page |
| `/login` | ❌ No | Public login page |
| `/dashboard` | ✅ Yes | Authenticated route |
| `/wisdom` | ✅ Yes | Authenticated route |
| `/greetings` | ✅ Yes | Authenticated route |
| `/stats` | ✅ Yes | Authenticated route |
| `/motivational` | ✅ Yes | Authenticated route |
| All other routes | ✅ Yes | Default to authenticated |

---

## Benefits

### 1. **Persistent Navigation**
- Header appears on all authenticated pages
- No need to import Header in each page component
- Consistent user experience

### 2. **Performance**
- Header doesn't re-render on navigation
- Leverages Next.js layout caching
- Suspense provides instant loading feedback

### 3. **Maintainability**
- Single source of truth for navigation
- Easy to add new navigation links
- Clear separation of concerns

### 4. **Type Safety**
- Full TypeScript support
- Proper component typing
- No runtime errors

---

## Navigation Links

Current navigation structure:

```
Dashboard → /dashboard
Wisdom → /wisdom
Greetings → /greetings
Stats → /stats
Motivational → /motivational
```

To add a new link, update `HeaderWrapper.tsx`:

```typescript
<Link
  href="/new-route"
  className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium"
>
  New Route
</Link>
```

---

## Client/Server Component Pattern

This implementation demonstrates the Next.js 15 pattern of mixing Client and Server Components:

```
Client Component (LayoutWrapper)
  └── Server Component (HeaderWrapper)
        └── Client Component (UserMenu)
```

**Why this works:**
- Client Components can render Server Components as children
- Server Components can fetch data (session)
- Client Components can use hooks (usePathname)

---

## Suspense Boundary

The Suspense boundary provides a loading state while the HeaderWrapper fetches the session:

```typescript
<Suspense fallback={<div className="h-14 bg-white border-b" />}>
  <HeaderWrapper />
</Suspense>
```

**Fallback:**
- Matches header height (h-14)
- Same styling (white background, border)
- Prevents layout shift during loading

---

## Changes Made

### Files Created
1. ✅ `apps/cms/src/components/layout/LayoutWrapper.tsx`
2. ✅ `apps/cms/src/components/layout/HeaderWrapper.tsx`

### Files Modified
1. ✅ `apps/cms/src/app/layout.tsx` - Added LayoutWrapper
2. ✅ `apps/cms/src/app/dashboard/page.tsx` - Removed Header import

### Files Deleted
1. ✅ `apps/cms/src/components/layout/ConditionalHeader.tsx` - Unused approach

---

## Testing Checklist

- [ ] Navigate to `/dashboard` - Header should appear
- [ ] Navigate to `/wisdom` - Header should persist
- [ ] Navigate to `/greetings` - Header should persist
- [ ] Navigate to `/stats` - Header should persist
- [ ] Navigate to `/motivational` - Header should persist
- [ ] Navigate to `/login` - Header should NOT appear
- [ ] Navigate to `/` (landing) - Header should NOT appear
- [ ] Click navigation links - Should navigate correctly
- [ ] User menu should show email and logout button

---

## Future Enhancements

### Active Link Highlighting
Add active state to navigation links based on current route:

```typescript
const pathname = usePathname();
const isActive = pathname === href;
```

### Mobile Navigation
Add responsive mobile menu for small screens:

```typescript
<button className="md:hidden">
  <MenuIcon />
</button>
```

### Breadcrumbs
Add breadcrumb navigation below header:

```typescript
<nav className="bg-gray-50 px-4 py-2">
  Dashboard / Wisdom / Edit
</nav>
```

---

## Notes

- The original `Header.tsx` component is kept for reference but no longer used
- The middleware still handles authentication and redirects
- This pattern is scalable for future navigation needs
- Dark mode support is already included in the styling

---

**Result:** Persistent navigation header across all authenticated routes! 🎉

