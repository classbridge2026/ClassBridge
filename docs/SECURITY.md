# ClassBridge — Security

Security is a first-class product requirement. ClassBridge holds education records across institutions; a tenant leak is a product-ending failure.

---

## 1. Threat model (summary)

| Threat | Example | Control |
| --- | --- | --- |
| Broken tenant isolation | Institution Admin A reads Institution B students | `institutionId` from session on every query; isolation tests |
| Horizontal privilege | Student calls start-class API | RBAC + resource ownership checks |
| Vertical privilege | Lecturer publishes as Super Admin | Role from membership, not client |
| Credential stuffing | Login brute force | Rate limit, generic errors, hashing |
| Session theft | XSS stealing tokens | HTTP-only cookies, CSP, no secrets in JS |
| IDOR | Guess UUID of unpublished recording | Authz before fetch; published + enrollment |
| CSRF | Hidden form start-class | Same-site cookies + Next.js CSRF patterns for cookies |
| Upload abuse | Malware/exe as “PDF” | Type/size validation, signed storage, no executable types |
| Secret leak | `LIVEKIT_API_SECRET` in client bundle | Server-only env; lint/review |
| Recording without consent | Auto-record | Explicit lecturer action only |
| Log leakage | Passwords in audit metadata | Redaction policy |

---

## 2. Authentication

- Never store plaintext passwords. Use a slow hash (Argon2id preferred; bcrypt acceptable).
- Sessions: HTTP-only, Secure (production), SameSite=Lax (or Strict where compatible).
- `AUTH_SECRET` server-only, high entropy.
- Login identifier: email globally; student number **plus institution context** — do not create a global student-number login that collides across tenants. If the login form is “email or student ID”, require institution selector **or** email-only on the public login and student-ID only on an institution-branded URL later. **Decision to confirm in Phase 4:** default v1 = **email login** to avoid cross-tenant identifier attacks; student ID displayed in-app and usable for admin search.
- Generic auth errors (“Invalid email or password”).
- Deactivated user / inactive institution: cannot obtain a working session.
- Password reset: hashed tokens, expiry, single use, rate limited.
- Logout: invalidate session server-side.

---

## 3. Authorization and RBAC

Every protected operation:

```text
Authenticated? → Correct institution? → Correct role? → Correct permission?
  → Resource in tenant and accessible to this user? → Allow
```

- Frontend hiding is UX, not security.
- Super Admin is not an implicit bypass of “download all student PII” without an audited, purpose-limited path.
- Lecturer actions require **course assignment** or **class.lecturerUserId** (or CourseLecturer), not merely role = LECTURER.
- Student classroom and recordings require **active enrollment** and correct class/recording status.

---

## 4. Multi-tenancy

- Session `institutionId` is the only tenant key for tenant APIs.
- Reject requests that send a different `institutionId` in the body if it does not match the session (or ignore client institutionId entirely).
- Prisma queries: always `where: { id, institutionId }` for tenant resources.
- Super Admin institution list is platform scope; opening an institution for support later must be explicit and audited.

**Mandatory tests:**

- Student A cannot access Student B private data (profile beyond public class roster policy, submissions, results).
- Institution A cannot access Institution B data (users, courses, classes, recordings).

These tests are as important as login tests.

---

## 5. Classroom and LiveKit

- LiveKit JWTs minted **only** on the server after ClassBridge authz.
- Short TTL; room name not guessable as authorization (still check membership even if room name leaks).
- Lecturer-only grants: recording egress, end room, mute/kick if we enable them.
- Students cannot obtain lecturer tokens.
- Webhooks from LiveKit/storage: verify signatures/secrets; never trust unsigned callbacks to mark recordings published.

---

## 6. Recordings and files

- Unpublished/processing recordings: lecturer/admin only.
- Published: enrolled students (and staff per policy).
- Direct object URLs: short-lived signed GET; buckets private.
- Upload: allowlist MIME and extensions, max size, malware scanning later if required.
- Profile photos: same pipeline, tighter size limits.

---

## 7. Input validation and errors

- Zod on Server Actions and Route Handlers.
- Parameterized Prisma only (no raw SQL string concatenation).
- User-facing errors without stack traces or SQL.
- Pagination caps to reduce scraping and load.

---

## 8. HTTP, CSRF, headers

- HTTPS in production.
- Security headers (CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Frame-Ancestors` as appropriate).
- CSRF: cookie sessions + SameSite; Server Actions follow Next.js recommendations.
- CORS: default deny for credentialed APIs except known web origin; mobile token strategy designed in Phase 21 without loosening web cookie rules.

---

## 9. Rate limiting

- Login, password reset, token minting: rate limit by IP + identifier.
- Start with in-process limiter for single-instance dev; Redis when running multiple app instances.

---

## 10. Secrets and configuration

Never expose to the browser:

```text
DATABASE_URL
AUTH_SECRET
LIVEKIT_API_SECRET
STORAGE_SECRET_KEY
```

- `.env` gitignored; `.env.example` keys only.
- Production secrets in the host secret manager, not in the repo.

---

## 11. Audit logging

Log: institution created, user created/deactivated, course created/modified, enrollment, class scheduled/started/ended, recording started/stopped/published.

Include: actor, institution, action, resource type/id, timestamp.  
Do not log passwords, tokens, full card data (when billing exists), or raw access keys.

---

## 12. Privacy

- Minimize PII in logs and client payloads.
- Roster visibility: students may see names of classmates in a live class; they must not see other students’ emails/phones/IDs unless policy says so.
- Export/delete institutional data: design for later (GDPR-style) without implementing in Phase 0–4.

---

## 13. Dependency and operational security

- Keep Next.js and auth libraries updated.
- `npm audit` in CI later.
- DB backups encrypted at rest (hosting).
- Least-privilege DB user for the app (no superuser in production).

---

## 14. Security test checklist (minimum)

| Test | Phase |
| --- | --- |
| Login success/failure, deactivated user | 4 |
| Role cannot open another role’s layout **and** APIs | 4–7 |
| Tenant isolation Institution A vs B | 6+ (repeat every phase that adds tables) |
| Student cannot start class / start recording | 12–13 |
| Student cannot GET unpublished recording metadata or bytes | 13 |
| Enrollment required to join class | 12 |
| Attendance not granted by enrollment alone | 14 |

---

## 15. Phase 0 decisions to keep

1. Email-first login in v1 (student number is an identifier, not a global username).
2. Shared DB + `institutionId` tenancy (no schema-per-tenant in v1).
3. Explicit recording only.
4. Server-minted LiveKit tokens.
5. Isolation tests required before calling a phase “done.”
