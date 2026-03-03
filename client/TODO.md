# Frontend To-Do List (Updated)

## ✅ Done
- [x] Profile: show `createdAt` (Member since) when API returns it
- [x] QA page: Auth links to /login, /signup, /profile
- [x] Settings: Change password form + API
- [x] Settings: Delete account form + API + redirect to login
- [x] DiscussionDetail: fallback comment updated (remove when backend has GET by id)
- [x] WeeklySnapshot: "See More" → navigate to /sessions
- [x] ActivityDetail: "•••", Heart, MessageCircle, Share buttons wired
- [x] ActivityCard: Share uses `navigator.share`; comments/session fetch send Authorization header
- [x] All Header nav and Create dropdown links
- [x] Login/Signup → save token, navigate to /profile
- [x] fetchApi: Bearer token, 401 → clear token + redirect to /login, VITE_API_URL + prod fallback
- [x] RequireAuth on /profile
- [x] Logo: inline SVG (or add logo.png to client/public for custom image)
- [x] Footer: support email + app version

---

## Backend (server)
- [ ] **POST /api/auth/register** — accept `{ email, password, name }`, return token; store `displayName` from `name`
- [ ] **POST /api/auth/login** — accept `{ email, password }`, return `{ accessToken, ...user }`
- [ ] **GET /api/auth/me** — require Bearer token, return `{ user: { id, email, displayName?, name?, createdAt? } }`
- [ ] **POST /api/settings/change-password** — body `{ currentPassword, newPassword }`
- [ ] **DELETE /api/settings/account** — body `{ password }` (or use POST if server doesn’t support DELETE body)
- [ ] **GET /api/profile/summary** — for Profile page stats (optional; app has fallback)
- [ ] **GET /api/community/discussions/:id** — so DiscussionDetail can drop list fallback
- [ ] CORS: allow frontend origin (e.g. Vercel URL) in production

---

## Optional / Later
- [ ] **Upgrade / Billing** — enable "Upgrade" button and wire to payment when ready
- [ ] **Java SDK** — add `changeDockCameraPosition` in core/Dock.java, JNI, and Demo [109] if using the Java client
- [ ] **Custom logo** — put `logo.png` in `client/public/` to replace inline SVG
- [ ] **Edit display name** — already in Settings; optional: add deep link from Profile
- [ ] **DELETE /api/settings/account** — if backend rejects DELETE with body, add POST delete endpoint and call it from frontend

---

## Quick reference
| Item                    | Status   | Notes                          |
|-------------------------|----------|---------------------------------|
| Auth (login/signup/me)  | Frontend ✅ | Needs backend endpoints         |
| Profile + Settings      | Done     | Change password / delete need API |
| All buttons/links       | Done     | Wired and checked               |
| API base + auth header   | Done     | VITE_API_URL, Bearer, 401 handling |
| Discussion by id         | Fallback | Remove when backend has GET :id |
