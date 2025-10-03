# Supabase Setup Instructions

Your Cashflow app is now configured to use Supabase! Follow these steps to complete the setup.

## 1. Get Your Supabase Credentials

1. Visit your Supabase project: https://supabase.com/dashboard/project/uhajvtfzhsfikamuznkg
2. Go to **Settings** → **API**
3. Copy the following values:
   - **Project URL**: `https://uhajvtfzhsfikamuznkg.supabase.co`
   - **anon public key**: (looks like `eyJhbGciOiJIUzI1NI6...`)

## 2. Create Environment Variables File

Create a file named `.env.local` in your project root and add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://uhajvtfzhsfikamuznkg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace `your-anon-key-here` with the actual anon key from step 1.

## 3. Run the Database Migration

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire contents of `supabase/migrations/001_initial_schema.sql`
5. Click **Run** to execute the SQL

This will create:
- `payment_items` table for storing expenses/income
- `user_financials` table for available funds and savings
- Row Level Security (RLS) policies to protect user data
- Automatic triggers for timestamp updates
- Function to initialize financials for new users

## 4. Configure Email Authentication

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider (should be enabled by default)
3. Configure email templates (optional):
   - Go to **Authentication** → **Email Templates**
   - Customize the confirmation and password reset emails

## 5. Test the Setup

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:9002
3. Click **Sign In** button in the top right
4. Create a new account with your email
5. Check your email for verification link (check spam folder)
6. After verification, sign in and start using the app!

## 6. Data Migration from localStorage (Optional)

If you have existing data in localStorage:

1. **Before signing in**, open your browser console
2. Run these commands to export your data:
   ```javascript
   const items = localStorage.getItem('cashflow_items_v2');
   const financials = localStorage.getItem('cashflow_financials_v2');
   console.log(JSON.stringify({ items: JSON.parse(items), financials: JSON.parse(financials) }));
   ```
3. Copy the JSON output
4. Sign in to your account
5. Use the **Import Data** feature from the dropdown menu
6. Create a `.json` file with the copied data and import it

## Features Now Available

✅ **Multi-device sync** - Access your data from any device
✅ **Secure authentication** - Email/password with verification
✅ **Data isolation** - Each user has their own private data
✅ **Automatic backups** - Supabase handles backups
✅ **Real-time updates** - Data syncs across open tabs
✅ **Export/Import** - Still works for data portability

## Troubleshooting

### "Failed to load data from Supabase"
- Check that your `.env.local` file has the correct values
- Verify the SQL migration ran successfully
- Check browser console for specific error messages

### "Authentication Required" message
- Make sure you're signed in
- Check that email verification was completed

### Tables don't exist
- Re-run the SQL migration in Supabase SQL Editor
- Check for any error messages in the SQL execution

### RLS Policy errors
- Ensure you're signed in
- Check that the policies were created in the migration
- Verify `auth.uid()` matches your user ID

## Next Steps

- **Add OAuth providers**: Enable Google/GitHub sign-in in Supabase Auth settings
- **Customize email templates**: Make verification emails match your brand
- **Set up backups**: Configure automatic backups in Supabase settings
- **Monitor usage**: Check the Supabase dashboard for usage stats

## Support

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Your project: https://supabase.com/dashboard/project/uhajvtfzhsfikamuznkg


