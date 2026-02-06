# Deployment Guide - Novelist AI with Authentication & Database

This guide covers deploying the full-stack Novelist AI application with user authentication and Postgres database.

## Prerequisites

1. **Vercel Account** - https://vercel.com
2. **Neon Postgres Database** - https://neon.tech (free tier available)
3. **Anthropic API Key** - https://console.anthropic.com/
4. **Google OAuth Credentials** (optional) - https://console.cloud.google.com/

## Step 1: Set Up Neon Postgres Database

1. Go to https://neon.tech and create a free account
2. Create a new project
3. Copy your connection string (it will look like: `postgresql://user:password@host/database?sslmode=require`)
4. In the Neon SQL Editor, run the schema from `lib/db/schema.sql`:
   - Copy the entire contents of `lib/db/schema.sql`
   - Paste into the SQL Editor
   - Click "Run" to create all tables, indexes, and triggers

## Step 2: Generate NextAuth Secret

Run this command in your terminal:
```bash
openssl rand -base64 32
```

Copy the output - you'll need it for `NEXTAUTH_SECRET`.

## Step 3: Set Up Google OAuth (Optional)

If you want to enable Google sign-in:

1. Go to https://console.cloud.google.com/
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - For local: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://your-domain.vercel.app/api/auth/callback/google`
7. Copy the Client ID and Client Secret

## Step 4: Deploy to Vercel

### Option A: Deploy via GitHub (Recommended)

1. Push your code to GitHub (already done if following this guide)
2. Go to https://vercel.com/new
3. Import your GitHub repository
4. Configure environment variables (see below)
5. Click "Deploy"

### Option B: Deploy via Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

## Step 5: Configure Environment Variables in Vercel

In your Vercel project settings → Environment Variables, add:

### Required Variables

```
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=<your_generated_secret_from_step_2>
AI_PROVIDER=ANTHROPIC
ANTHROPIC_API_KEY=<your_anthropic_api_key>
```

### Optional Variables (for Google OAuth)

```
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>
```

**Important:** Make sure to add these variables to all environments (Production, Preview, Development).

## Step 6: Redeploy

After adding environment variables:
1. Go to Deployments tab
2. Click the three dots on the latest deployment
3. Click "Redeploy"

## Step 7: Verify Deployment

1. Visit your deployed URL
2. You should be redirected to the sign-in page
3. Create a new account
4. Verify you can access the dashboard
5. Try creating a new book project

## Troubleshooting

### "Database connection failed"
- Verify `DATABASE_URL` is correct
- Check that the Neon database is active
- Ensure the schema was run successfully

### "NextAuth configuration error"
- Verify `NEXTAUTH_URL` matches your deployed URL (no trailing slash)
- Ensure `NEXTAUTH_SECRET` is set and is a valid base64 string
- Check that all environment variables are set in Vercel

### "Unauthorized" errors
- Clear browser cookies and try again
- Check browser console for errors
- Verify middleware is not blocking auth routes

### Google OAuth not working
- Verify redirect URIs in Google Console match your deployed URL
- Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Check that Google+ API is enabled

## Database Migrations

If you need to update the database schema:

1. Connect to your Neon database via the SQL Editor
2. Run your migration SQL
3. No need to redeploy the app unless code changes are required

## Monitoring

- **Vercel Logs**: Check deployment logs in Vercel dashboard
- **Neon Monitoring**: Monitor database usage in Neon dashboard
- **Error Tracking**: Check browser console and Vercel function logs

## Security Checklist

- ✅ `NEXTAUTH_SECRET` is a strong random string
- ✅ Database connection uses SSL (`?sslmode=require`)
- ✅ API routes are protected with `requireAuth()`
- ✅ Passwords are hashed with bcrypt (12 rounds)
- ✅ Environment variables are not committed to Git

## Performance Tips

1. **Database Indexes**: Already included in schema for common queries
2. **Connection Pooling**: Neon handles this automatically
3. **Caching**: Consider adding Redis for session caching (future enhancement)

## Backup Strategy

1. **Neon Automatic Backups**: Enabled by default (point-in-time recovery)
2. **Manual Backups**: Use Neon's backup feature or `pg_dump`
3. **Export User Data**: Implement export functionality for users

## Next Steps After Deployment

1. Test all features (signup, login, create book, generate chapters)
2. Monitor error logs for the first few days
3. Set up custom domain (optional)
4. Configure email provider for password resets (future enhancement)
5. Add analytics (optional)

## Support

- Vercel Docs: https://vercel.com/docs
- Neon Docs: https://neon.tech/docs
- NextAuth Docs: https://next-auth.js.org/

---

**Deployment completed successfully!** 🎉

Your Novelist AI app is now live with:
- ✅ User authentication (email/password + Google OAuth)
- ✅ Postgres database persistence
- ✅ Multi-device sync
- ✅ Secure, production-ready infrastructure
