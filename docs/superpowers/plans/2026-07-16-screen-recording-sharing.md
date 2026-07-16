# Screen Recording and Sharing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Loom-inspired web application for Google-authenticated screen recording, deliberate sharing through public links, and retention-managed video storage.

**Architecture:** A Next.js application serves the recorder, dashboards, authenticated route handlers, and public pages. Browser capture creates a local `Blob`; the user explicitly confirms sharing before the browser uploads directly to private R2 through a short-lived presigned URL. Neon Postgres persists metadata via Prisma, while a Cloudflare Worker cron deletes expired R2 objects and database metadata.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Better Auth, Google OAuth, Prisma, Neon Postgres, Cloudflare R2/S3 API, Zod, Vitest, React Testing Library, Playwright, Cloudflare Workers.

---

## Target File Structure

```text
app/
  (auth)/signin/page.tsx                 Google-login entry page
  (app)/page.tsx                         recorder home
  (app)/videos/page.tsx                  user video library and folders
  (app)/settings/profile/page.tsx        profile editor
  (app)/admin/page.tsx                   single-admin control panel
  v/[publicId]/page.tsx                  public video page
  api/auth/[...all]/route.ts             Better Auth handler
  api/videos/upload-intent/route.ts      authorize direct R2 uploads
  api/videos/complete/route.ts           create shared video metadata
  api/videos/[videoId]/route.ts          update/delete owned video
  api/videos/[videoId]/publish/route.ts  private/public transition
  api/videos/[videoId]/comments/route.ts create one-level comments
  api/comments/[commentId]/route.ts      delete a comment
  api/folders/route.ts                   create folders
  api/folders/[folderId]/route.ts        rename/delete folders
  api/profile/route.ts                   update display profile
  api/admin/settings/route.ts            update retention default
components/
  recorder/recorder-shell.tsx            capture state machine and review UI
  recorder/media-recorder.ts             browser MediaRecorder wrapper
  videos/video-table.tsx                 metadata/action table
  videos/video-actions.tsx               visibility, move, delete controls
  videos/folder-sidebar.tsx              user folder navigation
  comments/comment-list.tsx              public comment display/form
  profile/profile-form.tsx               name/avatar editor
  admin/admin-dashboard.tsx              settings and all-video list
lib/
  auth.ts                                Better Auth configuration
  authz.ts                               session, ownership, admin policies
  db.ts                                  Prisma singleton
  r2.ts                                  R2 client, keys, signed upload URL
  videos.ts                              video visibility/retention policy
  validation.ts                          Zod schemas and limits
  rate-limit.ts                          mutation rate-limit adapter
prisma/schema.prisma                     relational data model
worker/src/index.ts                      daily expired-video cleanup worker
tests/                                   unit/integration/component tests
e2e/                                     browser tests
```

### Task 1: Scaffold the application and test tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `playwright.config.ts`
- Create: `app/layout.tsx`, `app/globals.css`, `app/page.tsx`
- Create: `tests/setup.ts`, `tests/smoke.test.tsx`
- Create: `.env.example`, `.gitignore`

- [ ] **Step 1: Create the Next.js project and install runtime packages**

Run:

```bash
npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir=false --import-alias='@/*' --use-npm
npm install better-auth @better-auth/prisma-adapter @prisma/client zod @aws-sdk/client-s3 @aws-sdk/s3-request-presigner lucide-react
npm install -D prisma vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event playwright
```

Expected: `package.json`, App Router files, TypeScript, and Tailwind configuration exist.

- [ ] **Step 2: Add a failing smoke test**

Create `tests/smoke.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

it("renders the recorder entry point", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { name: /record\. share\. done\./i })).toBeInTheDocument();
});
```

Run: `npm test -- --run tests/smoke.test.tsx`

Expected: FAIL because the home page has not been implemented.

- [ ] **Step 3: Implement the unauthenticated recorder entry page**

Create the minimal `app/page.tsx`:

```tsx
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center p-6 text-center">
      <p className="mb-5 text-sm font-semibold text-indigo-600">capture</p>
      <h1 className="text-5xl font-bold tracking-tight">Record. Share. Done.</h1>
      <p className="mt-4 text-zinc-600">Sign in to record a screen, an app, or a tab.</p>
      <a className="mt-8 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white" href="/signin">Continue with Google</a>
    </main>
  );
}
```

- [ ] **Step 4: Run quality gates**

Run: `npm test -- --run tests/smoke.test.tsx && npm run lint && npm run build`

Expected: PASS with no TypeScript, lint, or build errors.

- [ ] **Step 5: Commit the scaffold**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts vitest.config.ts playwright.config.ts app tests .env.example .gitignore
git commit -m "chore: scaffold recording application"
```

### Task 2: Model data and implement authentication/authorization

**Files:**
- Create: `prisma/schema.prisma`, `lib/db.ts`, `lib/auth.ts`, `lib/authz.ts`, `app/api/auth/[...all]/route.ts`
- Create: `tests/authz.test.ts`
- Modify: `.env.example`

- [ ] **Step 1: Write failing ownership and admin policy tests**

Create `tests/authz.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { canDeleteComment, isAdmin } from "@/lib/authz";

describe("authorization", () => {
  it("recognizes only the configured email as admin", () => {
    expect(isAdmin("admin@example.com", "admin@example.com")).toBe(true);
    expect(isAdmin("user@example.com", "admin@example.com")).toBe(false);
  });

  it("allows the author, video owner, or admin to delete a comment", () => {
    expect(canDeleteComment({ actorId: "author", commentAuthorId: "author", videoOwnerId: "owner", admin: false })).toBe(true);
    expect(canDeleteComment({ actorId: "owner", commentAuthorId: "author", videoOwnerId: "owner", admin: false })).toBe(true);
    expect(canDeleteComment({ actorId: "other", commentAuthorId: "author", videoOwnerId: "owner", admin: false })).toBe(false);
  });
});
```

- [ ] **Step 2: Run the authorization test**

Run: `npm test -- --run tests/authz.test.ts`

Expected: FAIL because `lib/authz.ts` does not exist.

- [ ] **Step 3: Add the Prisma schema and migration**

Define Better Auth's required `User`, `Session`, `Account`, and `Verification` models plus these application models: `Profile`, `Video`, `Folder`, `Comment`, `AppSetting`, and `CleanupJob`. Give `Video` nullable `folderId`, nullable `publicId`, `visibility` enum values `PUBLIC`/`PRIVATE`, `deletedAt`, and indexed `expiresAt` fields. Add foreign keys with folder deletion setting `folderId` to null and video deletion cascading comments.

Run:

```bash
npx prisma migrate dev --name initial_schema
npx prisma generate
```

Expected: migration created under `prisma/migrations/` and Prisma Client generated.

- [ ] **Step 4: Implement Better Auth and policies**

Create `lib/authz.ts`:

```ts
export function isAdmin(email: string | null | undefined, adminEmail = process.env.ADMIN_EMAIL) {
  return Boolean(email && adminEmail && email.toLowerCase() === adminEmail.toLowerCase());
}

export function canDeleteComment(input: { actorId: string; commentAuthorId: string; videoOwnerId: string; admin: boolean }) {
  return input.admin || input.actorId === input.commentAuthorId || input.actorId === input.videoOwnerId;
}
```

Configure `lib/auth.ts` with Better Auth, `prismaAdapter(db, { provider: "postgresql" })`, Google OAuth credentials, and the application base URL. Export its handler from `app/api/auth/[...all]/route.ts`.

- [ ] **Step 5: Add required environment documentation and rerun tests**

List `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_EMAIL`, R2 values, and worker credentials in `.env.example` without values.

Run: `npm test -- --run tests/authz.test.ts && npm run lint`

Expected: PASS.

- [ ] **Step 6: Commit the data/auth foundation**

```bash
git add prisma lib app/api/auth tests/authz.test.ts .env.example
git commit -m "feat: add authentication and application data model"
```

### Task 3: Add R2 upload intents and video policy

**Files:**
- Create: `lib/r2.ts`, `lib/videos.ts`, `lib/validation.ts`, `app/api/videos/upload-intent/route.ts`, `app/api/videos/complete/route.ts`
- Create: `tests/videos.test.ts`, `tests/upload-intent.test.ts`

- [ ] **Step 1: Write failing video-policy tests**

Create `tests/videos.test.ts`:

```ts
import { expect, it } from "vitest";
import { createPublicId, getExpiresAt, rotatePublicId } from "@/lib/videos";

it("snapshots expiry from the retention setting", () => {
  expect(getExpiresAt(new Date("2026-07-16T00:00:00.000Z"), 30).toISOString()).toBe("2026-08-15T00:00:00.000Z");
});

it("rotates a public identifier when publishing again", () => {
  const oldId = createPublicId();
  expect(rotatePublicId(oldId)).not.toBe(oldId);
});
```

- [ ] **Step 2: Run the policy test and implement the smallest policy module**

Run: `npm test -- --run tests/videos.test.ts`

Expected: FAIL because `lib/videos.ts` does not exist.

Implement opaque IDs using `crypto.randomUUID().replaceAll("-", "")`; reject retention values outside `1..365`; calculate expiry by adding UTC calendar days.

- [ ] **Step 3: Implement a validated upload intent**

Use Zod to accept title (1-120 characters), optional folder ID, MIME type `video/webm` or `video/mp4`, positive byte size no greater than `500 * 1024 * 1024`, and duration no greater than 600 seconds. Require a session, validate folder ownership, generate an R2 key such as `videos/{userId}/{uuid}.webm`, persist an upload intent with a 15-minute expiry, and return a presigned `PutObject` URL.

The complete route must validate the intent ownership/expiry, use `HeadObject` to verify the R2 object exists and size matches, snapshot `AppSetting.defaultRetentionDays`, create the video with `PUBLIC` visibility and a new `publicId`, then consume the intent in one transaction.

- [ ] **Step 4: Test rejection and successful intent behavior**

Create `tests/upload-intent.test.ts` with mocked session, database, and R2 client. Assert that an anonymous request is 401, a 601-second duration is 400, another user's folder is 403, and a valid upload returns a 15-minute signed URL and randomized object key.

Run: `npm test -- --run tests/videos.test.ts tests/upload-intent.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the upload boundary**

```bash
git add lib app/api/videos tests/videos.test.ts tests/upload-intent.test.ts prisma
git commit -m "feat: add direct video upload flow"
```

### Task 4: Build the browser recording and local review experience

**Files:**
- Create: `components/recorder/media-recorder.ts`, `components/recorder/recorder-shell.tsx`, `app/(app)/page.tsx`
- Create: `tests/media-recorder.test.ts`, `tests/recorder-shell.test.tsx`

- [ ] **Step 1: Write the failing recorder state test**

Test the state sequence `idle -> recording -> reviewing -> uploading -> shared` and `reviewing -> idle` for record again. Mock `navigator.mediaDevices.getDisplayMedia`, `MediaRecorder`, and timer functions. Assert the `stop` callback produces a local Blob and does not call `fetch`.

- [ ] **Step 2: Run the test**

Run: `npm test -- --run tests/media-recorder.test.ts tests/recorder-shell.test.tsx`

Expected: FAIL because recorder modules do not exist.

- [ ] **Step 3: Implement a browser-only recorder wrapper**

`startCapture` calls `getDisplayMedia({ video: true, audio: true })`, conditionally combines a microphone stream, records chunks, and stops after `600_000` milliseconds. Always stop all tracks after the final Blob is created. Surface `NotAllowedError`, unsupported APIs, and unavailable audio as user-readable states.

- [ ] **Step 4: Implement review-before-upload UI**

The shell must render a Loom-inspired start CTA, elapsed timer, stop control, local `URL.createObjectURL(blob)` preview, editable title, folder selector, `Record again`, and `Share video`. Revoke the object URL when replaced or discarded. Disable share while upload is pending. Send the intent request, `PUT` the blob directly to returned URL while showing progress, then complete the upload and show Copy link only after success.

- [ ] **Step 5: Rerun recorder tests and perform a browser check**

Run:

```bash
npm test -- --run tests/media-recorder.test.ts tests/recorder-shell.test.tsx
npm run dev
```

Expected: tests PASS; in Chrome/Edge desktop, source picker appears, stop reveals local preview, Record again does not issue a network upload, and Share starts upload.

- [ ] **Step 6: Commit recording UX**

```bash
git add app components tests
git commit -m "feat: add reviewable browser screen recording"
```

### Task 5: Implement folders and owned video management

**Files:**
- Create: `app/api/folders/route.ts`, `app/api/folders/[folderId]/route.ts`, `app/api/videos/[videoId]/route.ts`, `app/api/videos/[videoId]/publish/route.ts`
- Create: `components/videos/folder-sidebar.tsx`, `components/videos/video-table.tsx`, `components/videos/video-actions.tsx`, `app/(app)/videos/page.tsx`
- Create: `tests/folders.test.ts`, `tests/video-actions.test.ts`

- [ ] **Step 1: Write failing folder lifecycle tests**

Cover creating a folder for the current user, rejecting another user's rename, and deleting a folder while retaining videos with `folderId: null`.

- [ ] **Step 2: Run tests and implement folder route handlers**

Run: `npm test -- --run tests/folders.test.ts`

Expected: FAIL, then PASS after route handlers require a session, validate names from 1 to 60 characters, and use `updateMany({ data: { folderId: null } })` before deleting an owned folder.

- [ ] **Step 3: Implement video actions and policies**

Allow an owner or admin to rename, move, and delete a video. A private action sets `visibility: PRIVATE` and `publicId: null`. A publish action only accepts an owned private video and assigns a newly generated `publicId`; it never reuses the old link. Delete marks `deletedAt` first and queues R2 deletion.

- [ ] **Step 4: Implement the video library UI**

Render folders and All videos in a sidebar. Each row must show thumbnail placeholder, title, duration, byte size, created timestamp, expiry timestamp, visibility, folder, and menu actions: View, Copy link when public, Make private/Publish, Move, Rename, Delete. Do not show videos belonging to another user.

- [ ] **Step 5: Test and commit**

Run: `npm test -- --run tests/folders.test.ts tests/video-actions.test.ts && npm run lint`

Expected: PASS.

```bash
git add app/api/folders app/api/videos app/'(app)'/videos components/videos tests
git commit -m "feat: manage video folders and visibility"
```

### Task 6: Build public playback and one-level comments

**Files:**
- Create: `app/v/[publicId]/page.tsx`, `app/api/videos/[videoId]/comments/route.ts`, `app/api/comments/[commentId]/route.ts`, `components/comments/comment-list.tsx`
- Create: `tests/public-video.test.ts`, `tests/comments.test.ts`

- [ ] **Step 1: Write failing visibility and comment permission tests**

Assert a public non-expired video resolves, private/deleted/expired videos do not resolve, an anonymous comment request is 401, and only the comment author, video owner, or admin can delete a comment.

- [ ] **Step 2: Implement secure playback lookup**

The public page queries by `publicId` and only returns a video whose visibility is `PUBLIC`, `deletedAt` is null, and `expiresAt > now`. Generate a short-lived R2 read URL only after that check; do not expose raw R2 keys. Configure the player with `controls` and no download UI guarantee.

- [ ] **Step 3: Implement one-level comments**

Use a Zod body schema of trimmed text length 1 to 1,000. The create route requires a session and a viewable public video; it creates no parent ID. The delete route calls `canDeleteComment` using the current actor, comment author, video owner, and admin state. Render plain text, profile name/image, timestamp, and a Delete action only for permitted actors.

- [ ] **Step 4: Run tests and commit**

Run: `npm test -- --run tests/public-video.test.ts tests/comments.test.ts`

Expected: PASS.

```bash
git add app/v app/api/videos app/api/comments components/comments tests
git commit -m "feat: add public video pages and comments"
```

### Task 7: Add editable profiles and the single-admin dashboard

**Files:**
- Create: `app/(app)/settings/profile/page.tsx`, `app/api/profile/route.ts`, `components/profile/profile-form.tsx`
- Create: `app/(app)/admin/page.tsx`, `app/api/admin/settings/route.ts`, `components/admin/admin-dashboard.tsx`
- Create: `tests/profile.test.ts`, `tests/admin.test.ts`

- [ ] **Step 1: Write failing profile and admin tests**

Cover rejecting profile mutation when logged out, accepting a 1-80 character display name for the owner, rejecting non-admin retention changes, and ensuring a retention setting update does not mutate existing Video records.

- [ ] **Step 2: Implement profile updates**

The profile route requires a session, validates display name, and updates only the authenticated user's `Profile`. For a custom avatar, obtain a separate presigned R2 upload intent limited to JPEG/PNG/WebP and 2 MB; save only its object key after storage verification. Show the Google-derived image until a custom image exists.

- [ ] **Step 3: Implement admin controls**

Guard the page and settings route with `isAdmin(session.user.email)`. Show aggregate active-video storage bytes, an all-video table with owner/created/expiry metadata, a delete action, and a validated 1-365 day `defaultRetentionDays` field. Update only `AppSetting`; never bulk-update `Video.expiresAt`.

- [ ] **Step 4: Run tests and commit**

Run: `npm test -- --run tests/profile.test.ts tests/admin.test.ts && npm run lint`

Expected: PASS.

```bash
git add app/'(app)'/settings app/'(app)'/admin app/api/profile app/api/admin components/profile components/admin tests
git commit -m "feat: add profiles and admin retention controls"
```

### Task 8: Implement expiration cleanup and operational safeguards

**Files:**
- Create: `worker/package.json`, `worker/wrangler.toml`, `worker/src/index.ts`, `worker/src/cleanup.ts`
- Create: `tests/cleanup.test.ts`, `lib/rate-limit.ts`
- Modify: `README.md`, `.env.example`

- [ ] **Step 1: Write failing cleanup tests**

Mock database/R2 adapters and assert a video at or before `now` is made inaccessible, its R2 object delete is requested, cleanup failure is recorded, and rerunning cleanup retries rather than exposing the video again.

- [ ] **Step 2: Implement cleanup as an idempotent worker**

The cron handler queries batches of expired, non-deleted videos. For each, set `deletedAt` before deleting R2, then delete comments and metadata after successful object removal. If R2 deletion fails, persist an error in `CleanupJob`, leave the row inaccessible, and retry on the next run. Configure a daily cron trigger in `wrangler.toml`.

- [ ] **Step 3: Add rate limiting at mutation boundaries**

Implement a keyed adapter for upload-intent and comment creation. Return HTTP 429 with `Retry-After` when the configured window is exceeded. Use an in-memory adapter only in development/tests; configure a durable Cloudflare/Redis implementation before production deployment.

- [ ] **Step 4: Run cleanup tests and full suite**

Run:

```bash
npm test -- --run tests/cleanup.test.ts
npm test -- --run
npm run lint
npm run build
```

Expected: all commands PASS.

- [ ] **Step 5: Document deployment and commit**

Document Google OAuth callback URL, Neon migrations, R2 CORS for the deployed origin, private bucket policy, R2/worker bindings, Cron deployment, and required environment variables in `README.md`.

```bash
git add worker lib/rate-limit.ts tests/cleanup.test.ts README.md .env.example
git commit -m "feat: expire videos with scheduled cleanup"
```

### Task 9: Perform end-to-end validation and accessibility pass

**Files:**
- Create: `e2e/recording.spec.ts`, `e2e/library-and-comments.spec.ts`
- Modify: components and pages only where validation identifies an issue

- [ ] **Step 1: Create Playwright flows with mocked media capture**

`e2e/recording.spec.ts` must authenticate a test user, stub `getDisplayMedia`, start/stop recording, verify preview is visible before any upload request, select Record again, repeat, choose Share, and assert the share URL appears after mocked R2 completion.

`e2e/library-and-comments.spec.ts` must verify folder creation/move, date displays, private video inaccessible by prior link, republish changes the link, anonymous viewer cannot submit a comment, and authenticated viewer can submit one.

- [ ] **Step 2: Run browser tests**

Run: `npx playwright test`

Expected: PASS in Chromium with deterministic mocked recording APIs.

- [ ] **Step 3: Manually validate real browser permissions**

Run: `npm run dev`

In Chrome and Edge desktop, select a window and a screen from the browser picker, test microphone on/off, observe unavailable source audio messaging where applicable, record until the 10-minute auto-stop in a test environment with a shortened configurable timer, preview, discard, share, open the public link logged out, and confirm an expired/private link is unavailable.

- [ ] **Step 4: Commit final validation adjustments**

```bash
git add e2e app components lib tests
git commit -m "test: verify recording and sharing workflows"
```

## Plan Self-Review

Spec coverage: Tasks 1-4 deliver the app, Google access, capture limit, local review, direct upload, public URL, and immutable expiry. Tasks 5-7 deliver folders, private/public links, deletes, profile, comments, and admin controls. Tasks 8-9 deliver cleanup, abuse controls, deployment requirements, browser tests, and manual permission validation.

No-placeholder check: all tasks name concrete files, expected commands, validations, and implementation boundaries. Type consistency: `publicId`, `expiresAt`, `visibility`, `folderId`, `deletedAt`, `defaultRetentionDays`, and the `PUBLIC`/`PRIVATE` enum are used consistently throughout.
