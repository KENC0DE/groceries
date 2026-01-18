# 🛒 Groceries List Manager

A simple React app to manage your groceries with Google Sheets as the database.

## Setup (10 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Google Sheets

**Create a Google Sheet:**
1. Go to https://sheets.google.com and create a new sheet
2. Add these headers in row 1: `ID` | `Name` | `Price` | `Image URL`
3. Copy the Sheet ID from the URL (the long string between `/d/` and `/edit`)

**Set Up Google Apps Script (Acts as Backend - 100% FREE):**

1. **Open Script Editor**
   - In your Google Sheet, click "Extensions" → "Apps Script"
   - A new tab will open with a code editor

2. **Paste This Code**
   - Delete any existing code in the editor
   - Copy and paste this entire code:

```javascript
function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
  
  // Check if we have parameters
  if (!e || !e.parameter) {
    const data = sheet.getDataRange().getValues();
    return ContentService
      .createTextOutput(JSON.stringify({ values: data }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const action = e.parameter.action;
  
  // If no action, return all data
  if (!action) {
    const data = sheet.getDataRange().getValues();
    return ContentService
      .createTextOutput(JSON.stringify({ values: data }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  let result = { status: 'error', message: 'Unknown action' };
  
  // Add new item
  if (action === 'add') {
    try {
      const id = e.parameter.id || '';
      const name = e.parameter.name || '';
      const price = e.parameter.price || '';
      const imageUrl = e.parameter.imageUrl || '';
      
      // Check for duplicate name (case-insensitive)
      const data = sheet.getDataRange().getValues();
      const nameLower = name.toLowerCase().trim();
      
      for (let i = 1; i < data.length; i++) { // Skip header row (i = 1)
        if (data[i][1] && data[i][1].toString().toLowerCase().trim() === nameLower) {
          result = { status: 'error', message: 'Item already exists' };
          return ContentService
            .createTextOutput(JSON.stringify(result))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
      
      sheet.appendRow([id, name, price, imageUrl]);
      result = { status: 'success', action: 'add', data: [id, name, price, imageUrl] };
    } catch (error) {
      result = { status: 'error', message: error.toString() };
    }
  }
  
  // Update existing item
  if (action === 'update') {
    try {
      const id = e.parameter.id || '';
      const name = e.parameter.name || '';
      const price = e.parameter.price || '';
      const imageUrl = e.parameter.imageUrl || '';
      
      // Find the row with matching ID
      const data = sheet.getDataRange().getValues();
      let rowIndex = -1;
      
      for (let i = 1; i < data.length; i++) { // Skip header row
        if (data[i][0] && data[i][0].toString() === id) {
          rowIndex = i + 1; // +1 because sheet rows are 1-based
          break;
        }
      }
      
      if (rowIndex === -1) {
        result = { status: 'error', message: 'Item not found' };
      } else {
        sheet.getRange(rowIndex, 1, 1, 4).setValues([[id, name, price, imageUrl]]);
        result = { status: 'success', action: 'update' };
      }
    } catch (error) {
      result = { status: 'error', message: error.toString() };
    }
  }
  
  // Delete item
  if (action === 'delete') {
    try {
      const id = e.parameter.id || '';
      
      // Find the row with matching ID
      const data = sheet.getDataRange().getValues();
      let rowIndex = -1;
      
      for (let i = 1; i < data.length; i++) { // Skip header row
        if (data[i][0] && data[i][0].toString() === id) {
          rowIndex = i + 1; // +1 because sheet rows are 1-based
          break;
        }
      }
      
      if (rowIndex === -1) {
        result = { status: 'error', message: 'Item not found' };
      } else {
        sheet.deleteRow(rowIndex);
        result = { status: 'success', action: 'delete' };
      }
    } catch (error) {
      result = { status: 'error', message: error.toString() };
    }
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. **Save the Script**
   - Click the 💾 Save icon (disk icon at top) or press Ctrl+S
   - Name it "Groceries API" if asked

4. **Deploy as Web App**
   - Click the "Deploy" button (top right) → "New deployment"
   - Click the gear icon ⚙️ next to "Select type"
   - Choose "Web app"
   - Fill in:
     - Description: "Groceries API"
     - Execute as: "Me"
     - Who has access: **"Anyone"** (IMPORTANT!)
   - Click "Deploy"
   - Click "Authorize access" when prompted
   - Review permissions and click "Allow"
   - **COPY THE WEB APP URL** (looks like: https://script.google.com/macros/s/ABC123.../exec)
   - This is your API endpoint!

**⚠️ Important**: Make sure "Who has access" is set to **"Anyone"** not "Anyone with Google account" - this allows CORS to work properly.

**💰 Cost: 100% FREE**
- No credit card required
- No payment setup needed
- Apps Script is completely free for personal use
- No quotas to worry about

**Get ImgBB API Key (for image uploads - 100% FREE & EASIER!):**

1. **Go to ImgBB API Page**
   - Visit https://api.imgbb.com/
   - You'll see a page with "Get API Key" button

2. **Click "Get API Key"**
   - Click the blue **"Get API Key"** button
   - You'll be taken to a sign-up/login page

3. **Sign Up (30 seconds)**
   - Click "Sign up" if you don't have an account
   - Enter your email and choose a password
   - OR use "Sign in with Google" for instant setup
   - Verify your email if prompted

4. **Get Your API Key**
   - After logging in, you'll automatically see your API key
   - It's a long string that looks like: `abc123def456xyz789`
   - **Copy this API key** (click the copy button or select and Ctrl+C)
   - That's it! No complicated OAuth setup needed!

**💰 Cost: 100% FREE**
- No credit card needed
- No payment info required
- Free tier: Unlimited uploads for personal use
- Images compressed to save data (max 800px, 70% quality)
- Images stored permanently on ImgBB servers

### 3. Configure App

Create a `.env` file:
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```
VITE_APPS_SCRIPT_URL=your_web_app_url_here
VITE_IMGBB_API_KEY=your_imgbb_api_key_here
```

(Paste the URLs/keys you copied from the steps above)

### 4. Run Locally

```bash
npm run dev
```

Open http://localhost:5173

## Deploy to GitHub Pages

1. Update `vite.config.js` - change `base: '/groceries/'` to `base: '/your-repo-name/'`

2. Create `.env.production` with same content as `.env`:
```
VITE_APPS_SCRIPT_URL=your_web_app_url_here
VITE_IMGBB_API_KEY=your_imgbb_api_key_here
```

3. Deploy:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/your-repo-name.git
git push -u origin main

npm run deploy
```

4. Enable GitHub Pages:
   - Go to your repo → Settings → Pages
   - Source: Select `gh-pages` branch
   - Save

Your app will be live at: `https://YOUR_USERNAME.github.io/your-repo-name/`

## Usage

- **Add Item**: Click "+ Add New Item", fill name and price, click Add
- **Edit Item**: Click "Edit" on any card, modify, click "Save"
- **Delete Item**: Click "Delete" on any card, confirm
- **Search**: Type at least 2 letters in the search bar - results update instantly
  - Searches anywhere in the item name (beginning, middle, or end)
  - Items starting with your search appear at the top
  - Shows result count while searching

## Features

### 📷 Image Upload (New!)
- Click "Upload Image" button when adding/editing items
- Select image from your computer
- Automatically compressed (max 800px, 70% quality to save data)
- Uploads to ImgBB (free, permanent hosting)
- Or paste any image URL manually
- Image preview before saving

### 🚀 Smart Caching
- Data is cached in your browser (localStorage)
- First visit loads from Google Sheets
- Subsequent visits load instantly from cache
- Only syncs with Google Sheets when you add/edit/delete items
- Works offline after initial load!

### 🔍 Intelligent Search
- Real-time search as you type (min 2 characters)
- Searches anywhere in item names
- Smart sorting: items starting with your query appear first
- Shows "X results" counter
- Clear search to see all items

## Sample Data

Add this to your Google Sheet to test:

```
ID              Name      Price   Image URL
1701234567890   Tomatoes  45.50   https://images.unsplash.com/photo-1546470427-227e9b3b4223?w=300
1701234567891   Onions    30.00   https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300
1701234567892   Potatoes  25.00   https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?w=300
```

## Troubleshooting

**"Failed to load groceries" or CORS error**
- Check Apps Script URL in `.env` is correct
- Make sure Apps Script is deployed with "Who has access" = **"Anyone"** (not "Anyone with Google account")
- If you changed it, go to Apps Script → Deploy → Manage deployments → Edit → Change to "Anyone" → Deploy
- Open the Apps Script URL directly in browser - should show JSON data

**"Failed to update item"**
- Sheet must be set to "Editor" not "Viewer"

**"Failed to upload image"**
- Check your ImgBB API Key in `.env` is correct
- Make sure image file is under 10MB
- Try a different image format (JPG, PNG)
- Check browser console for detailed error
- Make sure you copied the full API key (no spaces)

**Want to clear cache?**
- Open browser console (F12)
- Type: `localStorage.clear()`
- Refresh the page

**Images not loading**
- Use direct image URLs (ending in .jpg, .png)
- Try Unsplash or Imgur URLs
- Must be https:// not http://

## That's it!

MIT License - Use freely!