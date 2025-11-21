# OnlyHockey API Integration Guide

## 🎯 Quick Start

Tango CMS now provides a **public API** for consuming wisdom content on OnlyHockey.com. No authentication needed, no database access required.

---

## 📍 API Base URL

**Production:** `https://[YOUR-TANGO-DOMAIN]/api/public/wisdom`

**Replace `[YOUR-TANGO-DOMAIN]`** with your actual Tango CMS deployment URL.

---

## 🚀 Getting Started in 3 Steps

### Step 1: Test the API

Open your browser and visit:

```
https://[YOUR-TANGO-DOMAIN]/api/public/wisdom/random
```

You should see JSON like this:

```json
{
  "success": true,
  "data": {
    "id": 5,
    "title": "The Ripple Effect",
    "musing": "Draisaitl says McDavid is 'irreplaceable.'...",
    "from_the_box": "A missing tooth is easily replaced...",
    "theme": "Awards & Honors",
    "category": null,
    "attribution": "Penalty Box Philosopher"
  }
}
```

✅ If you see this, the API is working!

---

### Step 2: Copy the TypeScript Types

Copy the file `onlyhockey-api-types.ts` (included in this handoff) into your OnlyHockey project.

This gives you type safety for API responses.

---

### Step 3: Use the Example Code

See `onlyhockey-examples/` folder for:

- Vanilla JavaScript examples
- React component examples
- Next.js page examples

Pick what fits your stack and customize!

---

## 📚 Available Endpoints

### 1. Get Random Wisdom

```
GET /api/public/wisdom/random
```

**Use Case:** Homepage widget, daily wisdom, random quotes

**Example:**

```javascript
fetch("https://[YOUR-TANGO-DOMAIN]/api/public/wisdom/random")
  .then((res) => res.json())
  .then((result) => {
    const wisdom = result.data;
    console.log(wisdom.title);
    console.log(wisdom.musing);
    console.log(wisdom.from_the_box);
  });
```

---

### 2. Get Latest Wisdom

```
GET /api/public/wisdom/latest?limit=10
```

**Use Case:** "Recent Wisdom" sections, wisdom archive page

**Example:**

```javascript
fetch("https://[YOUR-TANGO-DOMAIN]/api/public/wisdom/latest?limit=20")
  .then((res) => res.json())
  .then((result) => {
    const wisdomList = result.data; // Array of wisdom entries
    wisdomList.forEach((wisdom) => {
      console.log(wisdom.title);
    });
  });
```

---

### 3. Get Wisdom with Filters

```
GET /api/public/wisdom?theme=Players&limit=20&offset=0
```

**Use Case:** Filtered views, themed collections, pagination

**Query Parameters:**

- `theme` - Filter by theme ("Players", "Awards & Honors", "Leadership & Staff", etc.)
- `category` - Filter by category
- `limit` - Items per page (max 100)
- `offset` - Skip N items (for pagination)

**Example:**

```javascript
// Get all "Players" themed wisdom
fetch("https://[YOUR-TANGO-DOMAIN]/api/public/wisdom?theme=Players&limit=50")
  .then((res) => res.json())
  .then((result) => {
    console.log(`Found ${result.count} wisdom entries`);
    console.log(result.data);
  });
```

---

## 📦 What You Get in Each Response

```typescript
{
  id: number; // Unique ID
  title: string; // Wisdom title
  musing: string; // Full philosophical text
  from_the_box: string; // Key quote/summary
  theme: string | null; // Theme (e.g., "Players")
  category: string | null;
  attribution: string | null; // e.g., "Penalty Box Philosopher"
}
```

---

## 🎨 Example UI Components

### Homepage Random Wisdom Widget

```html
<div id="wisdom-widget">
  <h3 id="wisdom-title"></h3>
  <p id="wisdom-musing"></p>
  <blockquote id="wisdom-quote"></blockquote>
  <span id="wisdom-theme"></span>
</div>

<script>
  async function loadRandomWisdom() {
    const res = await fetch(
      "https://[YOUR-TANGO-DOMAIN]/api/public/wisdom/random",
    );
    const result = await res.json();
    const wisdom = result.data;

    document.getElementById("wisdom-title").textContent = wisdom.title;
    document.getElementById("wisdom-musing").textContent = wisdom.musing;
    document.getElementById("wisdom-quote").textContent = wisdom.from_the_box;
    document.getElementById("wisdom-theme").textContent = wisdom.theme;
  }

  loadRandomWisdom();
</script>
```

---

### Wisdom Archive Page

```html
<div id="wisdom-archive"></div>

<script>
  async function loadWisdomArchive() {
    const res = await fetch(
      "https://[YOUR-TANGO-DOMAIN]/api/public/wisdom/latest?limit=50",
    );
    const result = await res.json();

    const container = document.getElementById("wisdom-archive");

    result.data.forEach((wisdom) => {
      const card = `
        <article class="wisdom-card">
          <h3>${wisdom.title}</h3>
          <p class="musing"><em>"${wisdom.musing}"</em></p>
          <blockquote>From the box: ${wisdom.from_the_box}</blockquote>
          <div class="meta">
            <span class="theme">${wisdom.theme || ""}</span>
            <span class="attribution">${wisdom.attribution || ""}</span>
          </div>
        </article>
      `;
      container.innerHTML += card;
    });
  }

  loadWisdomArchive();
</script>
```

---

## ⚡ Performance Tips

1. **Cache responses** - Wisdom doesn't change frequently, cache for 5-10 minutes
2. **Use `latest` for lists** - More efficient than fetching random multiple times
3. **Pagination** - Use `limit` and `offset` for large lists
4. **Error handling** - Always check `result.success` before using `result.data`

---

## 🔧 Troubleshooting

### CORS Error?

The API should have CORS enabled. If you get CORS errors, contact the Tango team.

### 404 Error?

Check that you're using the correct domain and path:

- ✅ `https://tango.example.com/api/public/wisdom/random`
- ❌ `https://tango.example.com/wisdom/random`

### Empty Response?

Make sure wisdom entries are **published** in Tango CMS (not draft or archived).

---

## 📞 Questions?

If you need:

- New endpoints (e.g., search, by ID)
- Additional data fields
- Different response formats
- Rate limiting adjustments

Contact the Tango CMS team!

---

## 🎁 Included Files

1. `ONLYHOCKEY-API-HANDOFF.md` - This guide
2. `onlyhockey-api-types.ts` - TypeScript types
3. `onlyhockey-examples/` - Code examples
4. `docs/test-api.html` - Simple test page

---

## ✅ Next Steps

1. Replace `[YOUR-TANGO-DOMAIN]` with actual domain
2. Test the API endpoints in browser
3. Copy TypeScript types into your project
4. Use example code to build your features
5. Deploy and enjoy not managing database connections! 🎉
