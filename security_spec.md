# Security Specification: KlangPanya Knowledge Hub

## 1. Data Invariants
1. **User Identity & Role Protection**: Normal users cannot self-assign the `admin` or `moderator` role upon creation or update. Only existing admins can promote or demote users or suspend them.
2. **Resource Ownership**: Only the authenticated author of a resource or an admin/moderator can update or delete that resource. Authors cannot change `authorId` or `createdAt` after creation.
3. **Public Viewing & Visibility**: Published resources (`status == 'published'`) can be read by anyone (public/guest). Hidden or deleted resources can only be viewed by their author or admins/moderators.
4. **Favorites Security**: A member can only create, list, and delete their own favorites (`userId == request.auth.uid`).
5. **Reporting Integrity**: Any authenticated member can submit a report against a resource. However, only admins and moderators can read all reports, update their resolution status, or dismiss them.
6. **Audit & Moderation Logs**: Only admins and moderators can write to `moderationLogs`, and logs cannot be deleted or forged by arbitrary users.
7. **Site Settings & Categories**: Any visitor can read the site settings (`/settings/general`), but only admins can modify site title, announcement, or custom categories.

## 2. The "Dirty Dozen" Payloads (Designed to Fail)
1. **Privilege Escalation on Signup**: Guest registers with `{ uid: "evil_user", email: "evil@example.com", role: "admin", status: "active" }` -> MUST FAIL.
2. **Resource Identity Spoofing**: User A creates a resource with `authorId: "user_b_uid"` -> MUST FAIL (`incoming().authorId == request.auth.uid`).
3. **Resource Hijacking**: User B attempts to edit User A's resource title or description -> MUST FAIL.
4. **Unauthenticated Resource Publishing**: An anonymous/unauthenticated user tries to write to `/resources/{id}` -> MUST FAIL (`request.auth != null`).
5. **Over-sized Resource Title Payload (Denial of Wallet)**: A user submits a resource with a 50,000 character string in `title` -> MUST FAIL (`title.size() <= 200`).
6. **Self-Unbanning Attack**: A suspended user attempts to update their own `users/{userId}` record with `status: "active"` -> MUST FAIL.
7. **Favorite Spoofing / Snooping**: User A queries User B's favorites or inserts a favorite with `userId: "user_b_uid"` -> MUST FAIL.
8. **Malicious Report Modification**: A regular user tries to alter the `status` of a report to `dismissed` or delete the report -> MUST FAIL.
9. **Tampering With Global Settings**: A regular member attempts to overwrite `/settings/general` to change the site title -> MUST FAIL.
10. **Forging Moderation Logs**: A non-admin writes a fake entry into `/moderationLogs` -> MUST FAIL.
11. **Altering Immutable Timestamps**: Author tries to update `createdAt` timestamp on an existing resource -> MUST FAIL (`incoming().createdAt == existing().createdAt`).
12. **Status Bypass to Hidden/Published by Suspended Account**: A suspended user attempts to publish a new resource -> MUST FAIL (`get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status == 'active'`).
