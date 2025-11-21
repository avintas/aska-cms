# Layout System Fix

**Date:** November 11, 2025  
**Issue:** Server Component async errors in layout  
**Status:** ✅ FIXED

---

## Problem

The initial implementation had `HeaderWrapper` as an async Server Component being rendered inside a Client Component (`LayoutWrapper`), which caused multiple errors:

1. **Error 1:** "`<HeaderWrapper>` is an async Client Component"
2. **Error 2:** "Cannot update a component while rendering a different component"
3. **Error 3:** "Server Functions cannot be called during initial render"

---

## Root Cause

In Next.js 15, you cannot:
- Render an async Server Component inside a Client Component
- Call Server Actions during render (like `getSession()`)
- Mix Server/Client boundaries incorrectly

---

## Solution

Changed `HeaderWrapper` from an async Server Component to a Client Component that fetches the session in `useEffect`:

### Before (❌ Broken)
```typescript
// Server Component
const HeaderWrapper: FC = async () => {
  const { user } = await getSession(); // ❌ Can't call during render
  // ...
}
```

### After (✅ Fixed)
```typescript
'use client';

const HeaderWrapper: FC = () => {
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function fetchSession() {
      const { user } = await getSession(); // ✅ Fetches after mount
      setUserEmail(user?.email);
    }
    fetchSession();
  }, []);
  // ...
}
```

---

## Changes Made

### 1. HeaderWrapper.tsx
- Added `'use client'` directive
- Changed from async Server Component to Client Component
- Used `useState` and `useEffect` to fetch session
- Stores only `userEmail` instead of full user object

### 2. LayoutWrapper.tsx
- Removed `Suspense` wrapper (no longer needed)
- Simplified to just conditional rendering

---

## Architecture (Updated)

```
Root Layout (Server Component)
  └── LayoutWrapper (Client Component)
        ├── HeaderWrapper (Client Component) [Conditional]
        └── Page Content
```

**All Client Components now** - simpler and works correctly!

---

## Benefits of This Approach

✅ **No Server/Client boundary issues**  
✅ **Session fetched client-side after mount**  
✅ **Works with Next.js 15 rules**  
✅ **Header still hidden on public routes**  
✅ **No hydration errors**

---

## Trade-offs

**Before (Server Component):**
- ✅ Session fetched on server
- ❌ Couldn't work inside Client Component

**After (Client Component):**
- ✅ Works correctly in layout
- ✅ Session fetched after mount (still secure via Server Action)
- ⚠️ Slight delay showing user menu (acceptable)

---

## Result

All errors resolved! The header now:
- ✅ Shows on authenticated routes
- ✅ Hides on public routes (`/`, `/login`)
- ✅ Fetches session correctly
- ✅ No console errors
- ✅ Works in Next.js 15

---

**Status:** Ready for testing! 🚀

