# Gemini API Key Issue - How to Fix

## Problem
Your current API key doesn't have access to Gemini models. This is likely because:
- The API key is from an older version of the Gemini API
- The Gemini API isn't enabled for your Google Cloud project
- The key has expired or been revoked

## Solution: Get a New Gemini API Key

### Step 1: Visit Google AI Studio
Go to: **https://aistudio.google.com/app/apikey**

### Step 2: Create a New API Key
1. Click "Create API Key"
2. Select "Create API key in new project" (recommended)
3. Copy the generated API key

### Step 3: Update Your .env.local File
Replace the current key in `.env.local`:

```env
GEMINI_API_KEY=YOUR_NEW_API_KEY_HERE
```

### Step 4: Restart the Dev Server
```bash
npm run dev
```

## Alternative: Use OpenAI Instead

If you have an OpenAI API key, you can use that instead:

### Step 1: Get OpenAI API Key
Visit: **https://platform.openai.com/api-keys**

### Step 2: Update .env.local
```env
AI_PROVIDER=OPENAI
OPENAI_API_KEY=your_openai_key_here
```

### Step 3: Restart
```bash
npm run dev
```

## Verify Your Setup

After updating your API key, test it by:
1. Opening http://localhost:3000
2. Pasting a sample whitepaper
3. Clicking "Generate Story Bible"

If you still see errors, check the browser console (F12) for detailed error messages.
