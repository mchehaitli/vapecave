# Transfer Guide - Vape Cave Website

This guide will help you set up this application in a new Replit account after remixing it.

## Step 1: Make This Project Public

**Current Owner Steps:**

1. Click on the project name in the top left corner of your Replit workspace
2. Toggle the project visibility to **Public**
3. Share the Replit URL with the new owner
4. The new owner can then click "Fork" or "Remix" to create their own copy

> **Note:** Making the project public will expose your code but NOT your secrets/environment variables. The database is also not transferred.

## Step 2: What Gets Transferred vs. What Doesn't

### ✅ What Gets Transferred (Automatically)
- All source code files
- Package dependencies (package.json)
- Database schema definitions (in `shared/schema.ts`)
- Configuration files

### ❌ What Does NOT Get Transferred (Must Be Set Up Manually)
- Secrets and environment variables
- Database data (only schema, not the actual data)
- Running deployments/published apps
- Integration configurations (like Google Mail)

## Step 3: Set Up the Database

**New Owner Steps:**

1. In your Replit workspace, look for the **Database** icon in the left sidebar (Tools section)
2. Click it and select **Create PostgreSQL Database**
3. Replit will automatically provision a PostgreSQL database and set these environment variables:
   - `DATABASE_URL`
   - `PGDATABASE`
   - `PGHOST`
   - `PGPORT`
   - `PGUSER`
   - `PGPASSWORD`

4. After the database is created, push the schema to create all tables:
   ```bash
   npm run db:push
   ```

5. The database will be empty. You'll need to:
   - Create an admin user through the app
   - Add store locations, brands, products, blog posts, etc. through the admin panel
   - Or import data if the previous owner provides a database export

## Step 4: Set Up Required Secrets

You need to set up one critical secret in the **Secrets** tab (lock icon in left sidebar):

### SESSION_SECRET
- **What it is:** A random string used to encrypt user sessions
- **How to create:** Generate a random string (32+ characters)
- **Example:** `your-super-secret-random-string-here-min-32-chars`

**To add it:**
1. Click the **Secrets** icon (🔒) in the left sidebar
2. Click **+ New Secret**
3. Key: `SESSION_SECRET`
4. Value: Your generated random string
5. Click **Add Secret**

> **Tip:** You can generate a random string using this command in the Shell:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

## Step 5: Set Up Google Mail Integration (Optional)

This app uses Gmail to send emails from contact forms and newsletter subscriptions.

**New Owner Steps:**

1. In the left sidebar, look for **Integrations** or **Tools**
2. Find **Google Mail** integration and click **Set Up**
3. Follow the OAuth flow to connect your Gmail account
4. The integration will automatically configure the necessary credentials

> **What this does:** Allows the contact form and newsletter to send emails to your specified Gmail address (currently configured for `vapecavetx@gmail.com` - you can change this in the code if needed).

### Files to Update (if changing email address):
- `server/routes.ts` - Search for `vapecavetx@gmail.com` and replace with your email

## Step 6: Configure Environment (Optional)

These are optional environment variables you might want to set:

### For Production Deployment:
- `NODE_ENV=production` (automatically set when you deploy)

### For Custom Admin Credentials:
You can create your first admin user through the login page signup, or configure defaults in the code.

## Step 7: Install Dependencies and Run

1. Dependencies should install automatically, but if needed:
   ```bash
   npm install
   ```

2. Start the application:
   ```bash
   npm run dev
   ```

3. The app should start on port 5000. You'll see it in the Webview panel.

## Step 8: Initial Setup Checklist

Once the app is running, complete these steps:

- [ ] Database is provisioned and schema is pushed (`npm run db:push`)
- [ ] `SESSION_SECRET` is set in Secrets
- [ ] Google Mail integration is configured (if using email features)
- [ ] App starts successfully with `npm run dev`
- [ ] Navigate to `/login` and create your admin account
- [ ] Log in and access the admin panel at `/admin`
- [ ] Add your store locations (Admin > Stores)
- [ ] Add brand categories (Admin > Brands > Add Category)
- [ ] Add brands (Admin > Brands > Add Brand)
- [ ] Add product categories (Admin > Products > Categories)
- [ ] Add products (Admin > Products > Add Product)
- [ ] Test the contact form (should send email if Gmail is configured)
- [ ] Test newsletter subscription (should send email if Gmail is configured)

## Step 9: Populate Your Data

Since the database data doesn't transfer, you have a few options:

### Option A: Manual Entry (Recommended for small datasets)
Use the admin panel to add all your content:
- Store locations
- Brand categories and brands
- Product categories and products
- Blog posts

### Option B: Database Export/Import (For large datasets)
If the previous owner can provide a database export:

1. Get a SQL dump from the previous owner
2. In your Replit workspace, open the Shell
3. Import the data:
   ```bash
   psql $DATABASE_URL < data-export.sql
   ```

### Option C: Seed Script (For development)
Create a seed script to populate sample data (useful for testing).

## Step 10: Publishing/Deployment

When you're ready to make your app live:

1. Click the **Deploy** button in the top right
2. Configure deployment settings:
   - Build command: `npm run build`
   - Run command: `npm start`
3. Ensure environment is set to production
4. Deploy!

The app will be available at your `*.replit.app` domain.

## Troubleshooting

### Database Connection Errors
- Verify `DATABASE_URL` is set (should be automatic after creating database)
- Run `npm run db:push` to ensure schema is up to date

### Session/Login Issues
- Verify `SESSION_SECRET` is set in Secrets
- Check browser console for errors

### Email Not Sending
- Verify Google Mail integration is set up
- Check the Logs for any email-related errors
- Confirm your Gmail account has the necessary permissions

### App Won't Start
- Check the Console/Logs for error messages
- Verify all dependencies are installed: `npm install`
- Ensure database is provisioned and schema is pushed

## Getting Help

If you encounter issues:
1. Check the Console/Logs in Replit
2. Review error messages carefully
3. Verify all secrets and environment variables are set
4. Ensure database is provisioned and accessible

## Important Files Reference

- `shared/schema.ts` - Database schema definitions
- `server/storage.ts` - Database operations
- `server/routes.ts` - API endpoints (includes email configuration)
- `server/index.ts` - Server entry point
- `client/src/App.tsx` - React app routing
- `DEPLOYMENT.md` - Production deployment guide

## What to Do With This File

After you've successfully transferred and set up the app:
- Keep this file for reference
- Share it with future owners if you transfer again
- Update it if you make significant changes to the setup process
