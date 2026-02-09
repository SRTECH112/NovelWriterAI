# Database Timeout Fix

## Problem
Database connections are timing out during page generation, especially on the 2nd+ generation attempt.

## Solution
Add connection timeout parameters to your DATABASE_URL in `.env.local`:

### Update your DATABASE_URL
Add these parameters to the end of your DATABASE_URL:

```
?sslmode=require&connect_timeout=60&statement_timeout=60000
```

### Example
**Before:**
```
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

**After:**
```
DATABASE_URL=postgresql://user:password@host/database?sslmode=require&connect_timeout=60&statement_timeout=60000
```

### Parameters Explained
- `connect_timeout=60` - 60 seconds to establish connection
- `statement_timeout=60000` - 60 seconds (60000ms) for query execution

### Steps
1. Open `.env.local`
2. Find your `DATABASE_URL` line
3. Add the timeout parameters to the end
4. Restart the dev server
5. Try generating pages again

This will give your database operations enough time to complete without timing out.
