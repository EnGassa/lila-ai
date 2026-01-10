# Deployment Guide (Vercel)

This guide outlines how to deploy the `lila-monorepo` to Vercel. We use **pnpm** and **Turborepo** to manage deployments for `apps/web` and `apps/marketing`.

## 1. Project Structure

The monorepo contains two deployable applications:

| Application | Path in Repo | Vercel Project Name (Suggestion) |
| :--- | :--- | :--- |
| **Web App** | `apps/web` | `lila-app` |
| **Marketing Site** | `apps/marketing` | `lila-marketing` |

---

## 2. Vercel Configuration Settings

**Since you already have existing Vercel projects:**
1.  Go to your existing `lila-app` and `lila-website` projects.
2.  Go to **Settings > Git** and disconnect/reconnect the repository if needed (to ensure it points to `lila-monorepo` now).
3.  Update the **Project Settings** as follows.

### A. Web App (`apps/web`)

Go to **Project Settings** and configure the following:

- **Root Directory:** `apps/web`
- **Framework Preset:** `Next.js`
- **Build Command:** `pnpm build` (runs `next build` via package.json script).
- **Install Command:** `pnpm install` (Vercel should detect pnpm via `lockfile`).
- **Ignored Build Step:**
   - *Status:* **Configured via `vercel.json`** (No manual action needed).
   - Command (Reference): `pnpm dlx turbo-ignore`

#### Environment Variables (Web)
Copy these from your local `.env.local`:

| Variable | Description |
| :--- | :--- |
| **Supabase** | |
| `NEXT_PUBLIC_SUPABASE_URL` | Public API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** Service Role for backend scripts |
| **Supabase Storage (S3)** | |
| `SUPABASE_S3_ACCESS_KEY_ID` | Storage Access Key |
| `SUPABASE_S3_SECRET_ACCESS_KEY` | Storage Secret Key |
| `SUPABASE_S3_ENDPOINT` | Storage Endpoint URL |
| `SUPABASE_S3_REGION` | Storage Region |
| `SUPABASE_S3_BUCKET` | Bucket Name |
| **Analytics & AI** | |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog API Key |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog Host |
| `GOOGLE_API_KEY` | Gemini API Key |
| **Integrations** | |
| `DISCORD_WEBHOOK_URL` | Notification Webhook |
| `DISCORD_INTAKE_WEBHOOK_URL` | Intake Form Webhook |
| `DISCORD_FEEDBACK_WEBHOOK_URL` | Feedback Webhook |
| `GITHUB_PAT` | Personal Access Token for Actions |
| `GITHUB_OWNER` | Repo Owner |
| `GITHUB_REPO` | Repo Name |

---

### B. Marketing Site (`apps/marketing`)

Go to **Project Settings** and configure the following:

- **Root Directory:** `apps/marketing`
- **Framework Preset:** `Next.js`
- **Build Command:** `pnpm build` (runs `next build`).
- **Install Command:** `pnpm install`
- **Ignored Build Step:**
   - *Status:* **Configured via `vercel.json`** (No manual action needed).
   - Command (Reference): `pnpm dlx turbo-ignore`

#### Environment Variables (Marketing)
Copy these from your local `.env.local`:

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog API Key |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog Host |

---

## 3. General Monorepo Settings

In your **Vercel Team > General Settings**, ensure usage is optimized:
- **Enable Remote Caching (Optional):** If you run `pnpm dlx turbo link`, you can share build caches between Vercel and your local machine.

## 4. Troubleshooting

**"Build failed because pnpm-lock.yaml version..."**
- Ensure your local `pnpm` version matches what Vercel expects (Corepack is usually enabled by default on Vercel Node 18+).
- Use `engines` in `package.json` to enforce Node version.

**"Missing Dependencies..."**
- If a build fails saying a package is missing, verify accessing it within the `apps/*/package.json` workspace dependencies section.
