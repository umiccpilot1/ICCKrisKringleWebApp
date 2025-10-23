# Kris Kringle Gift Exchange App

End-to-end Secret Santa workflow for Infosoft. The platform pairs employees, collects wishlists, manages photo assets, and coordinates email notifications with live admin progress tracking.

## Architecture

- **Backend**: Node.js (Express) with SQLite, located in `backend/`
	- API surface under `/api`
	- Email notifications, admin utilities, Playwright-powered smoke scripts
- **Frontend**: React + Vite, located in `frontend/`
	- Authenticated employee portal
	- Admin control center with photo mapping modal and cancellable notification jobs
- **Scripts**: PowerShell helpers in `scripts/` and Node maintenance scripts in `backend/scripts/`

## Prerequisites

- Node.js 18+
- PowerShell (Windows) or a shell capable of running the provided scripts
- Recommended: Playwright browsers (`npx playwright install` inside `frontend/`)

## Initial Setup

```powershell
git clone <repo-url>
cd Infosoft

# Backend
cd backend
cp .env.example .env
npm install

# Frontend
cd ../frontend
cp .env.example .env
npm install

# Point the frontend to the API (default dev URL shown)
echo "VITE_API_BASE_URL=http://localhost:3000/api" >> .env
```

## Running Locally

### Option 1: Single command (recommended during development)

```powershell
cd scripts
./restart-services.ps1
```

This PowerShell script restarts the backend (port 3000) and frontend dev server (port 5173) using the locally installed dependencies.

### Option 2: Manual terminals

```powershell
# Terminal 1 – backend
cd backend
npm run dev

# Terminal 2 – frontend
cd frontend
npm run dev
```

## Database Reset & Bootstrapping Workflow

The script `backend/scripts/resetDatabase.js` drops user data while reseeding two admin accounts. After running it:

1. **Upload employee roster** via the Admin Panel (`Upload employees` button). Use an Excel file (`.xlsx`/`.xls`) with `Name`, `Email`, and optional `Admin` columns.
2. **Drop employee photos** into `frontend/public/images/employees`. Filenames should be PNG format and normally match the employee’s last name (e.g., `SMITH.png`).
3. **Open the Admin photo modal** (`Manage employee photos`) to auto-map and manually resolve conflicts. The modal accepts bulk PNG uploads if needed.
4. **Configure wishlist settings** (deadline, sharing) in the Admin Panel.
5. **Generate assignments** (first run only; re-running replaces pairings) and optionally send assignment emails via the cancellable notification modal.
6. **Send wishlist reminders** when incomplete wishlists remain. Progress is visible and stoppable from the same modal UI.

## Admin Panel Highlights

- Live counts of incomplete wishlists with one-click reminder emails.
- Employee photo mapping modal supporting auto-matching, manual overrides, and upload logging.
- Cancellable email notification jobs with per-recipient status feed and progress bar.
- Assignment list with enriched recipient details for quick verification.

## Testing

- Frontend Playwright specs live in `frontend/tests/`. Run them with:

	```powershell
	cd frontend
	npx playwright test
	```

- Backend utility scripts (e.g., `backend/scripts/testMagicLink.js`) exercise individual flows.

## Helpful References

- `scripts/test-assignment-email.ps1` – dispatch sample assignment emails.
- `backend/scripts/debugTokenFlow.js` – inspect link/token lifecycles.
- `SETUP_NEW_COMPUTER.md` – wider onboarding checklist for new machines.

## Deployment Notes

- Build the frontend with `npm run build` (creates `frontend/dist/`).
- Run the backend in production mode with `NODE_ENV=production npm start` from `backend/` (serves API and static frontend).
