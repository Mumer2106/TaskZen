# Security Fixes: Password Hashing + Admin Roles

## Summary of Changes

### 🔐 Password Security (bcrypt)
All passwords are now hashed with **bcryptjs (12 rounds)** before storage. No plaintext passwords exist anywhere in the system.

| What changed | File |
|---|---|
| `createUser` hashes password before INSERT | `src/lib/db.js` |
| `findUser` uses `bcrypt.compare` for login | `src/lib/db.js` |
| `updateUser` hashes new password before UPDATE | `src/lib/db.js` |
| Legacy plaintext passwords auto-migrated to bcrypt on next login (JSON adapter) | `src/lib/db.js` |

### 🍪 Cookie Hygiene
| What changed | File |
|---|---|
| `user_info` cookie no longer includes password | `src/app/api/auth/login/route.js` |
| `user_info` now includes `role` for frontend display | `src/app/api/auth/login/route.js` |
| Profile update cookie refresh also strips password | `src/app/api/user/update/route.js` |
| `auth_session` remains HttpOnly | Both |

### 👮 API Security — Password Exposure Eliminated
| Endpoint | Before | After |
|---|---|---|
| `GET /api/user/me` | returned `password` hash | never returns password |
| `GET /api/user/update` | stored plaintext, leaked in cookie | hashes via db layer, no leak |

### 🛡️ Admin Authorization — Role-Based (RBAC)
The hardcoded `ADMIN_SECRET` has been removed entirely.

| What changed | File |
|---|---|
| `users` table has `role TEXT DEFAULT 'user'` | `scripts/setup-db.js` |
| Admin API checks `auth_session` cookie + `role === 'admin'` | `src/app/api/admin/data/route.js` |
| Admin portal auto-fetches on mount; shows "Access Denied" if not admin | `src/app/admin-portal/page.js` |
| Dashboard auth now uses `/api/user/me` (server-validated) | `src/app/dashboard/page.js` |

---

## Promoting a User to Admin

### JSON adapter (local dev)
```bash
npm run promote-admin user@example.com
# or by ID
npm run promote-admin 1714500000000
```

### Postgres adapter
```bash
npm run promote-admin user@example.com
```

The script auto-detects the adapter from your `.env.local`.

---

## Database Migration (Postgres)

If you have an existing Postgres database, run:
```bash
npm run setup-db
```
This adds the `role TEXT DEFAULT 'user'` column via `ALTER TABLE IF NOT EXISTS`.

---

## Verification Checklist

- [ ] Registration creates a `$2b$` bcrypt hash in storage
- [ ] Login works with bcrypt hash comparison
- [ ] `GET /api/user/me` response contains no `password` field
- [ ] `user_info` cookie contains no `password` field
- [ ] `/admin-portal` returns "Access Denied" for non-admin session
- [ ] Promoting a user via `npm run promote-admin <email>` grants admin access
- [ ] Admin portal loads correctly for the promoted user
