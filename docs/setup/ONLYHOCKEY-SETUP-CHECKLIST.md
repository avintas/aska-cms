# OnlyHockey Setup Checklist

## ✅ Pre-Flight Checklist

Before you start integrating the Tango Wisdom API into OnlyHockey, go through this checklist:

---

## 1. Get Your API URL

**Action:** Get the production URL for your Tango CMS from your deployment/hosting.

- [ ] I have the Tango CMS URL: `https://___________________`
- [ ] I've replaced `[YOUR-TANGO-DOMAIN]` in all example files

**Example URLs:**

- If deployed on Vercel: `https://tango-cms.vercel.app`
- If custom domain: `https://cms.onlyhockey.com`
- If localhost (testing only): `http://localhost:3000`

---

## 2. Test the API

**Action:** Verify the API is working before writing any code.

### Option A: Use Browser

- [ ] Open browser and visit: `https://[YOUR-TANGO-DOMAIN]/api/public/wisdom/random`
- [ ] I see valid JSON response (not 404 error)
- [ ] Response has `success: true` and a `data` object

### Option B: Use Test HTML File

- [ ] Open `docs/test-api.html` in browser
- [ ] Update the API URL in the form
- [ ] Click "Test: Random Wisdom"
- [ ] I see green success message with wisdom data

### Option C: Use curl/Postman

```bash
curl https://[YOUR-TANGO-DOMAIN]/api/public/wisdom/random
```

---

## 3. Copy Files to Your Project

**Action:** Copy the provided files into your OnlyHockey project.

- [ ] Copy `onlyhockey-api-types.ts` to your project (e.g., `src/types/` or `lib/types/`)
- [ ] Update import paths if you put it in a different location
- [ ] Review example code in `onlyhockey-examples/` folder

**File Locations (customize for your project):**

```
onlyhockey/
├── src/
│   ├── types/
│   │   └── onlyhockey-api-types.ts  ✅ Copy here
│   ├── components/
│   │   └── WisdomWidget.tsx         ← Adapt from examples
│   └── lib/
│       └── api/
│           └── wisdom.ts             ← Adapter functions
```

---

## 4. Choose Your Integration Approach

**Action:** Decide how you'll consume the API based on your tech stack.

- [ ] **Vanilla JS** - Use `vanilla-js-example.js` as reference
- [ ] **React/Next.js** - Use `react-example.tsx` components
- [ ] **Other Framework** - Adapt the fetch() calls to your framework

---

## 5. Build Your First Feature

**Action:** Start simple - add one wisdom feature to OnlyHockey.

### Recommended First Feature: Homepage Random Wisdom Widget

**Steps:**

1. [ ] Copy `RandomWisdomWidget` component from examples
2. [ ] Update API_BASE constant with your Tango URL
3. [ ] Add component to your homepage
4. [ ] Test in development environment
5. [ ] Style it to match OnlyHockey design

**Expected Result:**

- Homepage shows a random wisdom on load
- Refresh button loads a new random wisdom
- No console errors

---

## 6. Handle Errors Gracefully

**Action:** Make sure your integration handles API errors.

- [ ] Added loading states (spinners/skeletons)
- [ ] Added error states (friendly error messages)
- [ ] Added fallback content if API is down
- [ ] Tested with incorrect API URL to verify error handling

---

## 7. Performance Optimization (Optional)

**Action:** Optimize API calls for production.

- [ ] Add caching (e.g., cache for 5-10 minutes)
- [ ] Use server-side rendering for initial load (Next.js)
- [ ] Add loading skeletons for better UX
- [ ] Consider adding rate limiting if making many requests

---

## 8. Deploy & Test in Production

**Action:** Deploy to production and verify everything works.

- [ ] Deployed OnlyHockey with wisdom integration
- [ ] Verified API calls work from production domain
- [ ] Checked browser console for CORS errors (should be none)
- [ ] Verified wisdom displays correctly on live site

---

## 🎉 Success Criteria

You've successfully integrated the Tango Wisdom API when:

✅ OnlyHockey homepage displays random wisdom  
✅ No direct database connections needed  
✅ No errors in browser console  
✅ Wisdom loads within 2 seconds  
✅ Refresh/reload works smoothly  
✅ Mobile responsive and looks good

---

## 🆘 Troubleshooting

### Problem: CORS Error

**Solution:** Contact Tango team - API should have CORS headers enabled

### Problem: 404 Not Found

**Solution:** Double-check API URL - should be `/api/public/wisdom/random`

### Problem: Empty Response

**Solution:** Make sure wisdom entries are published (not draft) in Tango CMS

### Problem: Slow Loading

**Solution:** Add caching, or contact Tango team about API performance

---

## 📞 Need Help?

If you get stuck:

1. Check `ONLYHOCKEY-API-HANDOFF.md` for detailed documentation
2. Review example code in `onlyhockey-examples/` folder
3. Test API with `docs/test-api.html` to isolate issues
4. Contact Tango CMS team for API-related issues

---

## 🚀 Next Steps After First Integration

Once your first wisdom feature is working:

- [ ] Add more wisdom features (archive page, themed collections)
- [ ] Request additional endpoints (greetings, motivational, stats)
- [ ] Optimize caching strategy
- [ ] Add analytics to track wisdom views
- [ ] Consider adding social share buttons for wisdom quotes

---

## 📝 Quick Reference

**API Endpoints:**

- Random: `GET /api/public/wisdom/random`
- Latest: `GET /api/public/wisdom/latest?limit=10`
- Filtered: `GET /api/public/wisdom?theme=Players`

**Response Format:**

```json
{
  "success": true,
  "data": { ... }
}
```

**Fields You Get:**

- `id`, `title`, `musing`, `from_the_box`, `theme`, `category`, `attribution`

Good luck! 🏒
