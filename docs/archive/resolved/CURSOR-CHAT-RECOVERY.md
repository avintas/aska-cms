# Cursor Chat History Recovery Guide

## The Problem

When you rename a project folder, Cursor may lose track of chat history if it uses absolute paths to store conversation data.

## Where Cursor Stores Chat History

Cursor stores chat history in its application data folder, **not** in your project folder:

### Windows
```
%APPDATA%\Cursor\Chats\
or
%LOCALAPPDATA%\Cursor\Chats\
```

### macOS
```
~/Library/Application Support/Cursor/Chats/
```

### Linux
```
~/.config/Cursor/Chats/
```

## Recovery Steps

### Step 1: Find Cursor's Chat Storage

1. **Windows:**
   - Press `Win + R`
   - Type: `%APPDATA%\Cursor`
   - Look for `Chats` folder

2. **macOS:**
   - Open Finder
   - Press `Cmd + Shift + G`
   - Type: `~/Library/Application Support/Cursor`
   - Look for `Chats` folder

3. **Linux:**
   - Open terminal
   - Run: `ls ~/.config/Cursor/Chats/`

### Step 2: Check Chat Files

Chat files are typically stored as:
- JSON files
- SQLite databases
- Or in a `workspaces` folder with workspace-specific chats

Look for files that reference your old folder path.

### Step 3: Restore Chat History

**Option A: Rename Folder Back**
- Temporarily rename your project folder back to the original name
- Open Cursor and check if chats appear
- Export/backup chats if possible
- Then rename folder again

**Option B: Update Cursor's Workspace Path**
- If Cursor stores workspace paths, you may be able to update them
- Check Cursor's settings for workspace management
- Look for workspace path configuration

**Option C: Manual Recovery**
- If chats are in JSON files, you can manually edit the paths
- **Backup first!** Copy the entire Cursor data folder
- Search for old folder path in chat files
- Replace with new folder path

### Step 4: Prevent Future Loss

1. **Use Git Commits for Important Context**
   - Commit code changes with descriptive messages
   - Use commit messages to track conversation context

2. **Export Important Chats**
   - If Cursor has export functionality, use it
   - Copy important conversation snippets to notes

3. **Use Workspace Names Instead of Folder Names**
   - Cursor may track by workspace name, not folder path
   - Keep workspace names consistent

4. **Backup Before Renaming**
   - Copy Cursor's chat data folder before major changes
   - Or use version control for important conversations

## Alternative: Recreate Context

If chat history can't be recovered:

1. **Use Git History**
   - Review commit messages and diffs
   - Reconstruct what was discussed

2. **Use Project Documentation**
   - Check `docs/` folder for context
   - Review code comments

3. **Start Fresh**
   - Sometimes starting fresh is faster than recovery
   - Use this as opportunity to document better

## Contact Cursor Support

If nothing works:
- Contact Cursor support: support@cursor.sh
- They may have recovery tools or suggestions
- Provide details about when chats were lost

## Prevention Checklist

Before renaming project folders:

- [ ] Check Cursor's chat storage location
- [ ] Backup Cursor's data folder
- [ ] Export important conversations
- [ ] Commit all code changes to Git
- [ ] Document important decisions in `docs/`
- [ ] Test with a test folder first

---

**Note:** This is based on general knowledge of how IDEs store workspace data. Cursor's actual implementation may vary. Check Cursor's documentation or support for specific details.

