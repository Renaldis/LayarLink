# Screen Recording and Sharing Design

## Goal

Build a cross-platform web application that lets authenticated users record a
screen, application window, or browser tab for up to 10 minutes. Users review
the recording locally before explicitly sharing it. Shared videos receive an
unlisted public URL; viewers do not need an account, while commenters do.

## Scope

The first release includes Google authentication, recording, local preview,
direct video upload, public sharing, private/draft state, folders, profiles,
single-level comments, an admin dashboard, and configurable video retention.

The application does not include native desktop capture, video trimming,
transcoding, threaded comments, search indexing, or public video discovery.

## Technology Choices

| Area | Choice | Reason |
| --- | --- | --- |
| Full-stack app | Next.js and TypeScript | Provides the web UI, server endpoints, and share pages in one project. |
| UI | Tailwind CSS, shadcn/ui, Lucide | Flexible Loom-inspired components without a large UI runtime. |
| Browser capture | `getDisplayMedia` and `MediaRecorder` | Native browser APIs for screen, window, tab, microphone, and available source audio. |
| Authentication | Better Auth with Google OAuth | Google login, secure cookie sessions, and Prisma integration. |
| Database | Neon Postgres | Managed Postgres independent of Supabase. |
| ORM | Prisma | Typed database access and repeatable schema migrations. |
| Object storage | Cloudflare R2 | Low-cost storage for video and custom profile images. |
| Expiry worker | Cloudflare Worker Cron Trigger | Runs scheduled cleanup close to R2 and does not rely on a sleeping app process. |

Cloudflare R2 is used directly in the first release, with videos stored in the
browser-generated format. Cloudflare Stream or Mux can be added later if
transcoding, thumbnails, or adaptive streaming are required.

## Roles and Access

### Visitor

A visitor can view a public video URL without signing in. A visitor cannot
create videos, access dashboards, change profiles, or post comments.

### User

A user signs in with Google. They can record and share videos, manage only
their own videos and folders, edit their profile, and comment on public videos.
Users can delete their own comments.

### Admin

One Google email address configured through `ADMIN_EMAIL` is the admin. The
admin can view and delete all videos and comments, and change the default video
retention period. The application has no role-management interface.

## Recording and Sharing Flow

1. A signed-in user starts a recording.
2. The browser's required picker lets the user choose a monitor, application
   window, or tab. The app never selects a source automatically.
3. The browser records the selected video, microphone audio, and source audio
   when the selected browser and OS make it available.
4. A visible timer warns near the 10-minute limit and stops recording at
   exactly 10 minutes.
5. On stop, the result remains a local browser `Blob`. The user may preview it,
   set its title and folder, or discard it with "Record again".
6. No storage object, database video row, public URL, or expiry time exists
   until the user presses "Share video".
7. The app authorizes an upload and returns a short-lived R2 presigned upload
   URL. The browser uploads directly to R2 without proxying the video through
   the Next.js server.
8. After upload confirmation, the backend creates a video row, calculates
   `expiresAt` from the retention setting at that moment, and creates a random
   public ID. The UI then shows the public URL and copy action.

The share action must be idempotent so a retry cannot create duplicate videos
for the same completed upload.

## Video Visibility and Deletion

Videos begin as `public` after a successful share. A public video has a random,
unguessable share URL at `/v/{publicId}`. It is unlisted: the application does
not provide a browse page or sitemap listing public videos.

The video owner can make a video private. The existing `publicId` is invalidated
immediately and the share page returns unavailable. The file remains in R2 and
the owner can still view it from their dashboard. Publishing a private video
again generates a new public ID so a previously leaked link cannot work again.

The owner may delete their own video. The admin may delete any video. Deletion
immediately marks the row deleted and disables the share URL; the application
then removes the R2 object, associated comments, and any generated profile or
preview assets related to the video. The delete operation is safe to retry.

## Retention and Cleanup

`app_setting.defaultRetentionDays` stores the admin-selected default. When a
new video is shared, the backend snapshots that setting into the video by
calculating and storing an immutable `expiresAt` timestamp.

Changing the default from 30 to 7 days affects only videos shared after the
change. Existing video `expiresAt` timestamps are never recomputed.

A Cloudflare Worker scheduled job runs at least daily. It finds non-deleted
videos where `expiresAt <= now`, marks their share URLs unavailable, deletes
their R2 objects, removes dependent metadata, and records cleanup failures for
safe retry. The public page also checks expiry before serving a video, so a job
delay cannot expose an expired recording.

## Folders

Folders belong to exactly one user. A user can create, rename, and delete their
own folders. A video belongs to zero or one folder; an unassigned video appears
in "All videos". Moving a video between folders does not affect visibility,
public ID, timestamps, or expiry.

Deleting a folder does not delete its videos. It sets their `folderId` to null.

## Profiles

On first Google sign-in, Better Auth stores the provider name and image as the
initial display profile. Users can edit their display name and upload a custom
profile image. Custom images are stored in R2. Profiles show on comments and
the user's own dashboard; emails are never displayed on public pages.

## Comments

Public video pages show comments. Viewing remains anonymous, but adding a
comment requires a Google-authenticated session. Comments are one level only:
there is no reply or `parentCommentId` relationship.

Each comment displays the author's current public display name, profile image,
and creation time. The comment author, video owner, and admin can delete a
comment. Comments are unavailable on private, deleted, or expired videos.

## Data Model

Core Prisma models:

- `User`, `Session`, `Account`, and `Verification`: Better Auth records.
- `Profile`: user display name, custom avatar key, and update timestamp.
- `Video`: owner ID, optional folder ID, title, R2 object key, MIME type, byte
  size, duration, creation timestamp, immutable `expiresAt`, visibility,
  public ID, and deletion timestamp.
- `Folder`: owner ID, name, creation/update timestamps.
- `Comment`: video ID, author ID, body, creation timestamp, and deletion
  timestamp.
- `AppSetting`: singleton record holding `defaultRetentionDays`.
- `CleanupJob`: idempotency and failure records for expiration/deletion work.

Use foreign keys and indexes for `Video(ownerId, createdAt)`,
`Video(publicId)`, `Video(expiresAt, deletedAt)`, `Folder(ownerId)`, and
`Comment(videoId, createdAt)`.

## Application Surfaces

### Recorder Home

The signed-in home page uses a clean, bright, Loom-inspired layout with a
single dominant "Start recording" action. It explains source selection,
optional audio, and the 10-minute maximum.

### Recording and Review

During recording, the page shows elapsed time, available audio state, and stop
control. The review page shows the local video preview, title, folder selector,
record-again action, and Share video action. Upload progress begins only after
Share video is chosen.

### My Videos

Users see their videos in a folder-aware list, with title, duration, size,
created timestamp, expiry timestamp, visibility, and actions for view, copy
link, move, make private/publish, rename, and delete.

### Public Video Page

The share page plays the video, displays its title and owner display name, and
contains a single-level comment list. Anonymous viewers see a sign-in prompt in
place of the comment form.

### Admin Panel

The admin sees aggregate storage usage, all videos, their owners and expiry
times, immediate deletion actions, and a setting for default retention days.

## Security and Reliability

- Require authenticated server-side authorization for every mutation.
- Enforce ownership on video, folder, profile, and comment actions; apply the
  `ADMIN_EMAIL` override only on the server.
- Validate request bodies with Zod, enforce title/comment length limits, and
  sanitize comment rendering by rendering text only.
- Issue R2 upload URLs only after validating the user, video size limit, MIME
  type, and an unexpired upload intent. Restrict R2 CORS to the app origin.
- Use random non-sequential IDs and private R2 object keys.
- Rate-limit login-sensitive mutations, upload-intent creation, and comment
  creation to limit abuse even though Google login is required.
- Check `visibility`, `deletedAt`, and `expiresAt` server-side before exposing
  share playback or comments.
- Report unsupported browser capture or unavailable system audio clearly rather
  than silently falling back.
- Handle interrupted upload, R2 confirmation failure, cleanup retry, and
  expired/deleted content with explicit recoverable UI states.

## Verification Plan

- Unit test retention snapshot calculation, private-to-public ID rotation,
  ownership policy, expiry checks, and folder deletion behavior.
- Integration test Better Auth callbacks, authorized upload-intent generation,
  video creation, publish/private/delete flows, comment permissions, and cron
  cleanup retries using a test database and mocked R2 client.
- Browser test the recorder state machine with mocked media streams: start,
  timer auto-stop, local preview, record again, share/upload progress, and
  failure recovery.
- Browser test public playback and comment access as anonymous, commenter,
  video owner, and admin.
- Manually test Chrome and Edge on supported desktop OSes for source selection,
  microphone audio, source audio availability, 10-minute stop, and playback.

## Open Deployment Inputs

Implementation requires the owner to supply the Google OAuth client ID/secret,
Better Auth secret, Neon connection strings, R2 credentials/bucket, R2 public
delivery strategy or worker domain, `ADMIN_EMAIL`, and the deployed app URL.
