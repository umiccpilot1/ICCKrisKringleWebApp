# Step-by-Step Test Guide for Magic Link Fix

## âœ… Current Status
- Backend running on: http://localhost:3060
- Frontend running on: http://localhost:5173
- Database: Ready with test employees
- Email server: Configured (Office 365 SMTP)

---

## ðŸ§ª Test Procedure

### Option 1: Full End-to-End Test (Recommended)

**Step 1: Access Admin Panel**
1. Open browser to: `http://localhost:5173/login`
2. Enter admin email: `charles.daitol@infosoft.com.ph`
3. Click "Send Magic Link"
4. Check your email for login link
5. Click link to access admin panel

**Step 2: Send Reminder Emails**
1. In Admin Panel, look for "Incomplete Wishlists" section
2. Note the count of employees without wishlists
3. Click "Send Reminders" button
4. Wait for success modal showing results
5. Close modal

**Step 3: Check Email**
1. Open email inbox (charles.daitol+[name]@infosoft.com.ph)
2. Find email with subject: "Reminder: Complete your INFOSOFT Kris Kringle Wishlist!"
3. Note the magic link URL format

**Step 4: Click Magic Link**
1. Click "Confirm Wishlist" button in email
2. **Expected Results**:
   - âœ… Page redirects to `http://localhost:5173/portal?showWishlist=true`
   - âœ… Shows toast: "Please complete your wishlist below"
   - âœ… Wishlist form is automatically expanded
   - âœ… NO "Magic link expired" error
   - âœ… NO "Invalid magic link token" error

**Step 5: Verify Wishlist Form**
1. Wishlist section should be visible
2. Can add items with descriptions and links
3. Can save wishlist
4. Form collapses after save

---

### Option 2: Quick Database Test

**Step 1: Clean Database State**
```powershell
cd backend
node scripts/checkMagicLinks.js
```
Expected: Shows recent magic links, all should be valid

**Step 2: Generate New Magic Link**
```powershell
node scripts/testMagicLink.js charles.daitol+test@infosoft.com.ph
```
Expected: Creates new magic link, invalidates old ones

**Step 3: Verify Single Link Per Employee**
```powershell
node scripts/debugTokenFlow.js
```
Expected: Step 7 should show NO duplicate valid links

---

### Option 3: API Test (No Email Required)

**Step 1: Create Test Scenario**
```powershell
cd backend
node -e "const {db} = require('./src/config/database'); db.prepare('DELETE FROM wishlists WHERE employee_id = 3').run(); console.log('Deleted wishlist for employee 3');"
```

**Step 2: Test API Endpoint**
```powershell
# Note: This will fail auth, but shows endpoint is accessible
Invoke-WebRequest -Uri http://localhost:3060/api/admin/wishlists/incomplete -UseBasicParsing
```

**Step 3: Run Complete Flow Test**
```powershell
node scripts/testCompleteReminderFlow.js
```
Expected: All steps show âœ…, no errors

---

## ðŸ” Troubleshooting Guide

### Issue: "Magic link expired"
**Diagnosis:**
```powershell
node scripts/checkTokenExpiry.js
```
- If shows "EXPIRED": Token actually expired (wait 4 hours from creation)
- If shows "VALID": Problem is elsewhere (check logs)

**Solution:**
1. Send new reminder email
2. Click link within 4 hours
3. Link should work now

---

### Issue: "Invalid magic link token"
**Diagnosis:**
```powershell
node scripts/debugTokenFlow.js
```
Look at Step 7: Check for duplicate magic links

**Solution:**
This should NOT happen anymore with the fix. If it does:
1. Check if old code is still running (restart backend)
2. Verify auth.routes.js has the loop checking all links
3. Check backend logs for bcrypt errors

---

### Issue: Backend not responding
**Check:**
```powershell
netstat -ano | findstr :3000
```

**Restart:**
```powershell
cd scripts
.\restart-services.ps1
```

---

## ðŸ“Š Verification Checklist

After testing, verify:

- [ ] Clicked magic link from reminder email
- [ ] Successfully authenticated (no errors)
- [ ] Redirected to `/portal?showWishlist=true`
- [ ] Saw success toast message
- [ ] Wishlist form was expanded
- [ ] Can add/edit wishlist items
- [ ] Database shows link marked as used
- [ ] No duplicate valid links in database

---

## ðŸŽ¯ Expected Behavior Summary

### Before Fix:
- âŒ Multiple valid magic links per employee
- âŒ Auth only checked most recent link
- âŒ Clicking older email links failed
- âŒ Error: "Magic link expired" (even when valid)

### After Fix:
- âœ… Only one valid magic link per employee
- âœ… Auth checks ALL valid links
- âœ… Any recent valid link works
- âœ… Old links auto-invalidated on new creation
- âœ… Clear, accurate error messages

---

## ðŸ“ Notes

1. **Token Format**: 
   - Email URL: 64-character hex string
   - Database: 60-character bcrypt hash ($2b$10$...)

2. **Expiry**: 
   - Magic links expire 4 hours after creation
   - Timezone: UTC (SQLite datetime('now'))

3. **One-Time Use**: 
   - Links marked as used after successful auth
   - Cannot reuse same link

4. **Multiple Reminders**: 
   - If admin sends reminders twice, only newest link works
   - Old links automatically invalidated

---

## ðŸš€ Ready to Test!

1. Make sure both backend and frontend are running
2. Choose one of the test options above
3. Follow the steps carefully
4. Check off the verification checklist
5. Report any issues with exact error messages

---

*Last Updated: 2025-10-22*
*Backend Status: âœ… Running on port 3000*
*Frontend Status: âœ… Running on port 5173*
