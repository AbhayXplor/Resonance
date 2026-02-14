# API Setup Guide

This guide provides step-by-step instructions for obtaining all necessary API keys and setting up external services for the Call Monitoring & Emotion Intelligence System.

## Required API Keys

You will need the following API keys:
1. Supabase (Database & Authentication)
2. Hume AI (Emotion Detection)
3. Google Gemini (Conversation Analysis)
4. Deepgram (Transcription)

---

## 1. Supabase Setup

**What it's for:** Database storage, authentication, and real-time features

### Steps:

1. **Go to Supabase**
   - Visit: https://supabase.com
   - Click "Start your project" or "Sign In"

2. **Create Account**
   - Sign up with GitHub, Google, or email
   - Verify your email if required

3. **Create New Project**
   - Click "New Project"
   - Choose your organization (or create one)
   - Fill in project details:
     - **Project Name:** `call-monitoring-system` (or your choice)
     - **Database Password:** Create a strong password (SAVE THIS!)
     - **Region:** Choose closest to you
     - **Pricing Plan:** Select "Free" tier
   - Click "Create new project"
   - Wait 2-3 minutes for project to initialize

4. **Get Your API Keys**
   - Once project is ready, go to **Settings** (gear icon in sidebar)
   - Click **API** in the settings menu
   - You'll see:
     - **Project URL:** `https://xxxxx.supabase.co`
     - **anon/public key:** `eyJhbGc...` (long string)
     - **service_role key:** `eyJhbGc...` (different long string)
   
5. **Copy These Values:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... (the anon key)
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (the service_role key)
   ```

6. **Enable Authentication (Optional but Recommended)**
   - Go to **Authentication** in sidebar
   - Click **Providers**
   - Enable "Email" provider
   - Configure email templates if desired

### Free Tier Limits:
- ✅ 500MB database storage
- ✅ 2GB bandwidth per month
- ✅ 50MB file storage
- ✅ Unlimited API requests
- **More than enough for hackathon demo!**

---

## 2. Hume AI Setup

**What it's for:** Voice emotion detection from audio

### Steps:

1. **Go to Hume AI**
   - Visit: https://www.hume.ai
   - Click "Get Started" or "Sign Up"

2. **Create Account**
   - Sign up with email
   - Verify your email

3. **Access Developer Portal**
   - After login, go to: https://platform.hume.ai
   - Or click "Platform" in the navigation

4. **Create API Key**
   - Go to **API Keys** section
   - Click "Create new API key"
   - Give it a name: `call-monitoring-dev`
   - Click "Create"
   - **IMPORTANT:** Copy the API key immediately (you won't see it again!)

5. **Copy This Value:**
   ```
   HUME_AI_API_KEY=your-api-key-here
   ```

### Free Tier Limits:
- Check current limits on their pricing page
- Typically includes free credits for testing
- **Backup Plan:** If limits are too restrictive, we can use mock data or a simpler emotion detection library

### Alternative (If Hume AI doesn't work):
You can use a simpler sentiment analysis library like:
- `sentiment` npm package (basic text sentiment)
- Or mock emotion data for demo purposes

---

## 3. Google Gemini Setup

**What it's for:** Conversation analysis, context understanding, and suggestion generation

### Steps:

1. **Go to Google AI Studio**
   - Visit: https://makersuite.google.com/app/apikey
   - Or go to: https://aistudio.google.com

2. **Sign In**
   - Use your Google account
   - Accept terms of service

3. **Create API Key**
   - Click "Get API Key" or "Create API Key"
   - Select "Create API key in new project" (or use existing project)
   - Click "Create API key"
   - Copy the key immediately

4. **Copy This Value:**
   ```
   GOOGLE_GEMINI_API_KEY=your-api-key-here
   ```

### Free Tier Limits:
- ✅ 60 requests per minute
- ✅ 1,500 requests per day
- ✅ Free tier includes Gemini 1.5 Flash
- **Perfect for hackathon demo with 2-3 concurrent calls!**

### Testing Your Key:
You can test it quickly:
```bash
curl "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

---

## 4. Deepgram Setup

**What it's for:** Real-time audio transcription

### Steps:

1. **Go to Deepgram**
   - Visit: https://deepgram.com
   - Click "Sign Up" or "Get Started"

2. **Create Account**
   - Sign up with email or GitHub
   - Verify your email

3. **Get Free Credits**
   - New accounts get **$200 in free credits**
   - No credit card required for free tier
   - Credits don't expire for 12 months

4. **Create API Key**
   - After login, go to: https://console.deepgram.com
   - Click **API Keys** in the sidebar
   - Click "Create a New API Key"
   - Give it a name: `call-monitoring`
   - Select permissions: "Member" (default)
   - Click "Create Key"
   - **Copy the key immediately!**

5. **Copy This Value:**
   ```
   DEEPGRAM_API_KEY=your-api-key-here
   ```

### Free Tier Limits:
- ✅ $200 free credits (very generous!)
- ✅ ~$0.0043 per minute for pre-recorded audio
- ✅ ~$0.0125 per minute for streaming audio
- **$200 = ~46,000 minutes of transcription!**
- **More than enough for hackathon!**

### Alternative (If you prefer):
- **Google Speech-to-Text:** 60 minutes free per month
  - Visit: https://cloud.google.com/speech-to-text
  - More complex setup (requires Google Cloud project)
  - Deepgram is recommended for easier setup

---

## 5. Environment Variables Setup

Once you have all API keys, create a `.env.local` file in your project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Hume AI
HUME_AI_API_KEY=your-hume-api-key

# Google Gemini
GOOGLE_GEMINI_API_KEY=your-gemini-api-key

# Deepgram
DEEPGRAM_API_KEY=your-deepgram-api-key

# Optional: For development
NODE_ENV=development
```

### Security Notes:
- ✅ Never commit `.env.local` to git (it's in `.gitignore` by default)
- ✅ Use `NEXT_PUBLIC_` prefix only for client-side variables
- ✅ Keep service role keys and API keys server-side only
- ✅ For production, use environment variables in your hosting platform

---

## 6. Verify Setup

### Quick Verification Checklist:

1. **Supabase:**
   - [ ] Can access project dashboard
   - [ ] Have project URL and anon key
   - [ ] Database is initialized

2. **Hume AI:**
   - [ ] Have API key
   - [ ] Can access platform dashboard
   - [ ] Know your usage limits

3. **Google Gemini:**
   - [ ] Have API key
   - [ ] Tested with curl command (optional)
   - [ ] Know rate limits (60/min)

4. **Deepgram:**
   - [ ] Have API key
   - [ ] See $200 credits in dashboard
   - [ ] Know pricing per minute

### Test Connection Script:

Create a test file `test-apis.js`:

```javascript
// Test Supabase
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testAPIs() {
  console.log('Testing Supabase...');
  const { data, error } = await supabase.from('calls').select('count');
  console.log(error ? '❌ Supabase Error' : '✅ Supabase Connected');
  
  // Add more tests as you implement each service
}

testAPIs();
```

---

## 7. Cost Tracking

### Expected Costs for Hackathon Demo:

**Supabase:** $0 (free tier)
**Hume AI:** ~$0-5 (depends on free tier)
**Google Gemini:** $0 (free tier, 60 req/min is plenty)
**Deepgram:** ~$0-2 (from $200 free credits)

**Total Expected Cost: $0-7 for entire hackathon**

### Tips to Stay Within Free Tiers:

1. **Cache API responses** when possible
2. **Use mock data** for repeated testing
3. **Batch process** instead of real-time during development
4. **Monitor usage** in each platform's dashboard
5. **Set up alerts** if available (Deepgram has this)

---

## 8. Troubleshooting

### Common Issues:

**"Invalid API Key" Error:**
- Double-check you copied the entire key
- Make sure no extra spaces or newlines
- Verify the key is for the correct environment

**"Rate Limit Exceeded":**
- Wait a minute and try again
- Implement exponential backoff in code
- Consider caching responses

**"CORS Error" (Supabase):**
- Make sure you're using `NEXT_PUBLIC_` prefix for client-side keys
- Check Supabase project settings for allowed origins

**"Insufficient Credits" (Deepgram/Hume):**
- Check your dashboard for remaining credits
- Fall back to mock data for demo
- Use pre-recorded calls instead of live processing

---

## 9. Ready to Start!

Once you have all API keys:

1. Create `.env.local` file with all keys
2. Run `npm install` to install dependencies
3. Run `npm run dev` to start development server
4. Begin with Task 1 from the implementation plan

### Need Help?

If you encounter issues getting any API key:
- Check the service's documentation
- Look for "Getting Started" or "Quickstart" guides
- Most services have Discord/Slack communities for support
- Ask me if you get stuck!

---

## Quick Reference

| Service | Dashboard URL | Documentation |
|---------|--------------|---------------|
| Supabase | https://app.supabase.com | https://supabase.com/docs |
| Hume AI | https://platform.hume.ai | https://docs.hume.ai |
| Google Gemini | https://aistudio.google.com | https://ai.google.dev/docs |
| Deepgram | https://console.deepgram.com | https://developers.deepgram.com |

---

**You're all set! Let me know when you have the API keys and we can start implementing!** 🚀
