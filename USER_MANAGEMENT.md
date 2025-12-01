# User Management via Neon Dashboard

Since you're not technical, user management (login changes, adding users) will be done via the Neon database dashboard instead of through the application.

## Accessing Neon Dashboard

1. Go to: https://console.neon.tech/
2. Log in with your Neon account
3. Select your project: **ep-green-art-ag6od1nb**
4. Click on **"Tables"** in the left sidebar
5. Click on the **"User"** table

## Changing a User's Password

### Method 1: Using Prisma Studio (Recommended)

1. In your terminal, run:
   ```bash
   cd /home/ayoub/Portal-cvs/portal
   npx prisma studio
   ```

2. Browser will open at http://localhost:5555
3. Click on **"User"** table
4. Find the user you want to edit
5. Click on the password field
6. Generate a new bcrypt hash:
   - Open a new terminal
   - Run: `node -e "console.log(require('bcrypt').hashSync('NEW_PASSWORD_HERE', 10))"`
   - Copy the hash (it starts with `$2b$10$...`)
7. Paste the hash into the password field in Prisma Studio
8. Click **Save** (the green checkmark icon)

### Method 2: Using Neon SQL Editor

1. In Neon dashboard, go to **"SQL Editor"** tab
2. Run this query to update a password:
   ```sql
   UPDATE "User" 
   SET password = '$2b$10$PASTE_BCRYPT_HASH_HERE' 
   WHERE email = 'user@email.nl';
   ```

**To generate bcrypt hash for the SQL method:**
```bash
node -e "console.log(require('bcrypt').hashSync('YOUR_NEW_PASSWORD', 10))"
```

## Changing a User's Email

1. In Prisma Studio or Neon SQL Editor
2. Update the email field:
   ```sql
   UPDATE "User" 
   SET email = 'newemail@company.nl' 
   WHERE email = 'oldemail@company.nl';
   ```

## Adding a New User

### Using Prisma Studio:
1. Open Prisma Studio: `npx prisma studio`
2. Click **"User"** table
3. Click **"Add record"** button
4. Fill in:
   - **id**: Leave empty (auto-generated)
   - **email**: user@company.nl
   - **password**: Generate hash with `node -e "console.log(require('bcrypt').hashSync('password123', 10))"`
   - **role**: Either `admin` or `reviewer`

### Using Neon SQL Editor:
```sql
INSERT INTO "User" (email, password, role)
VALUES (
  'newuser@company.nl',
  '$2b$10$PASTE_BCRYPT_HASH_HERE',
  'reviewer'
);
```

## Removing a User

⚠️ **Warning**: This is permanent!

```sql
DELETE FROM "User" WHERE email = 'user@company.nl';
```

## Viewing All Users

In Neon SQL Editor:
```sql
SELECT id, email, role FROM "User";
```

(Password hashes are hidden for security)

## Quick Reference: Password Hashing

Always use this command to create password hashes:
```bash
node -e "console.log(require('bcrypt').hashSync('YOUR_PASSWORD', 10))"
```

**Example output:**
```
$2b$10$rQZK9J3X4Y5Z6A7B8C9D0eF1G2H3I4J5K6L7M8N9O0P1Q2R3S4T5U6
```

This is what you paste into the database.

## Important Notes

- **Never store plain passwords** - always use bcrypt hashes
- **Current users:**
  - anissa@elmarservices.nl (role: admin)
  - reviewer@elmarservices.nl (role: reviewer)
- **Email Notifications** are still managed in the app settings page
- **Only credentials** need to be managed via Neon

## Need Help?

If you're stuck:
1. Don't panic
2. Run `npx prisma studio` - it's the easiest way
3. The password hash always starts with `$2b$10$`
4. Ask me if you need guidance

---

**Pro Tip**: Bookmark this page for quick access! 🚀
