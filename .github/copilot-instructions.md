# Copilot Instructions

- [x] Verify that `copilot-instructions.md` exists in `.github/`.
- [x] Clarify project requirements (photo mapping workflow, manual overrides, notification jobs).
- [x] Scaffold project (repo already contains full structure after clone).
- [x] Customize project (admin photo mapping, cancellable notification jobs, modal UI).
- [x] Install required extensions (none requested).
- [x] Compile project (backend/frontend dependencies installed; frontend build verified).
- [x] Create and run task (not required; PowerShell scripts manage services).
- [x] Launch project (`scripts/restart-services.ps1`).
- [x] Ensure documentation is complete (README updated with architecture, workflow, and setup guidance).

## Execution Guidelines

- Use project root (`.`) as working directory unless told otherwise.
- Prefer provided PowerShell scripts (`scripts/restart-services.ps1`, etc.) for service control.
- Avoid installing unrequested VS Code extensions or adding media assets.
- Keep explanations concise; summarize command outputs instead of dumping them.
- Do not revert user-authored changes; coordinate if unexpected diffs appear.

## Development Workflow (Quick Reference)

1. Install dependencies in both `backend/` and `frontend/` (`npm install`).
2. Copy `.env.example` to `.env` in each workspace; set `VITE_API_BASE_URL` for the frontend.
3. Start services via `scripts/restart-services.ps1` (backend on 3000, frontend on 5173).
4. After `backend/scripts/resetDatabase.js`, remind admins to:
   - Upload employee roster (Excel) through the Admin Panel.
   - Place PNG photos in `frontend/public/images/employees`.
   - Map photos using the Admin modal and resolve conflicts.
   - Configure wishlist settings, generate assignments, and use notification modal for emails.
5. Use Playwright tests from `frontend/` (`npx playwright test`) when validating UI automation.

## Communication Reminders

- Mirror the user's tone; ask clarifying questions only when needed.
- Highlight risks, bugs, or missing tests before offering enhancements.
- Suggest natural next steps (tests, deploy, docs) after substantial changes.
