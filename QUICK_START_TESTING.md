# Quick Start Guide - Christmas Email Testing

## 🚀 Fast Testing (5 minutes)

### Prerequisites
✅ Backend server running on port 3000  
✅ Frontend server running on port 5173  
✅ SMTP credentials configured in `backend/.env`  
✅ At least 2 employees in database (non-admin)

---

## Step-by-Step Testing

### 1️⃣ Start Servers
```powershell
# From project root
.\scripts\restart-services.ps1
```

Wait for:
- Backend: "Server running on port 3000"
- Frontend: "Local: http://localhost:5173"

---

### 2️⃣ Login as Admin
1. Open browser: `http://localhost:5173`
2. Enter admin email: `charles.daitol@infosoft.com.ph`
3. Click "Send Magic Link"
4. Check email inbox
5. Click magic link to login

---

### 3️⃣ Add Test Employees (if needed)
1. In Admin Panel, click "Upload Employees"
2. Or use Excel upload feature
3. Ensure at least 2 non-admin employees exist

---

### 4️⃣ Generate Assignments
1. In Admin Panel, scroll to "Secret Santa Assignments"
2. Click "Generate Assignments" button
3. Confirm in modal
4. Wait for success message

---

### 5️⃣ Send Assignment Emails
1. Click "Send Assignment Emails" button
2. Wait for completion (sends 1 email per employee)
3. Success toast appears

---

### 6️⃣ Check Email
Open your email inbox and look for:
- **Subject**: 🎄 Your INFOSOFT Kris Kringle Assignment 🎅
- **From**: Your SMTP sender address
- **Design**: Red/green Christmas theme with Infosoft logo

---

### 7️⃣ Test Magic Link
1. Click "View My Dashboard 🎄" button in email
2. Verify auto-login (no password prompt)
3. Dashboard should load immediately

---

### 8️⃣ Test Recipient Lock
1. Look at "Assignment status" section
2. Should show: "Your Assignment Awaits!" with 🎁 icon
3. Message: "Complete your wishlist above to reveal..."
4. Recipient details should be HIDDEN

---

### 9️⃣ Complete Wishlist
1. Scroll to "Your Wishlist" section
2. Add 1-3 gift items with descriptions
3. Optionally add product links
4. Click "Save Wishlist"
5. Wait for success toast

---

### 🔟 Verify Recipient Reveal
1. Wishlist section collapses automatically
2. Assignment section enlarges
3. Recipient card now shows full details
4. Hover to reveal name, email, photo, wishlist

---

## 🧪 Automated Testing

### Test Email Template Only
```powershell
cd backend
node scripts/testAssignmentEmail.js
```

This sends a test email without generating actual assignments.

### Full Test Suite
```powershell
# From project root
.\scripts\test-assignment-email.ps1
```

---

## 🐛 Troubleshooting

### Email Not Sending
❌ **Problem**: "Unable to send email"  
✅ **Solution**: Check `backend/.env` has valid SMTP credentials

❌ **Problem**: Email stuck in spam  
✅ **Solution**: Add sender to safe senders list

### Magic Link Not Working
❌ **Problem**: "Magic link expired"  
✅ **Solution**: Links expire after 48 hours - generate new assignment

❌ **Problem**: Redirect to login page  
✅ **Solution**: Check `FRONTEND_URL` in `backend/.env` matches actual port

### Recipient Not Showing
❌ **Problem**: Recipient visible before wishlist  
✅ **Solution**: Clear browser cache and reload

❌ **Problem**: Recipient never appears  
✅ **Solution**: Check browser console for errors

### Assignment Generation Fails
❌ **Problem**: "Not enough employees"  
✅ **Solution**: Need at least 2 non-admin employees

❌ **Problem**: Admins in assignment list  
✅ **Solution**: Fixed - admins automatically excluded

---

## 📊 Expected Results

### ✅ Email Should Have:
- [x] Subject with 🎄 and 🎅 emojis
- [x] Infosoft logo at top
- [x] Red/green color scheme
- [x] Recipient name in gold box
- [x] "View My Dashboard 🎄" button
- [x] 48-hour validity notice
- [x] Infosoft footer

### ✅ Dashboard Should Have:
- [x] Wishlist form at top (initially)
- [x] Recipient section with lock message
- [x] 🎁 icon in locked state
- [x] After save: Recipient details revealed
- [x] Wishlist collapses, recipient enlarges

### ✅ Magic Link Should:
- [x] Work for 48 hours
- [x] Be clickable multiple times
- [x] Auto-login without password
- [x] Redirect to employee dashboard
- [x] Not require manual login

---

## 🎯 Key Metrics

### Performance
- Email send time: ~2 seconds per recipient
- Magic link generation: ~100ms
- Dashboard load time: <1 second

### User Experience
- **Before wishlist**: Clear call-to-action to complete
- **After wishlist**: Smooth reveal animation
- **Email design**: Festive, professional, branded
- **Mobile friendly**: Responsive layout works on all devices

---

## 📝 Sample Test Data

### Test Employee 1
- Name: Charles Daitol
- Email: charles.daitol@infosoft.com.ph
- Role: Admin (excluded from assignments)

### Test Employee 2
- Name: Jamaica Admin
- Email: jamaica.admin@infosoft.com.ph
- Role: Admin (excluded from assignments)

### Test Employee 3 (Add this)
- Name: Arbill Aque
- Email: arbill.aque@infosoft.com.ph
- Role: Employee (participates in Secret Santa)

### Test Employee 4 (Add this)
- Name: Test User
- Email: test.user@infosoft.com.ph
- Role: Employee (participates in Secret Santa)

---

## 🎄 Happy Testing!

Questions or issues? Check:
1. `CHRISTMAS_EMAIL_IMPLEMENTATION.md` - Full technical details
2. `EMAIL_VISUAL_REFERENCE.md` - Design specifications
3. Backend console logs for errors
4. Frontend browser console for errors

**Tip**: Use Chrome DevTools Network tab to inspect API calls if debugging issues.
