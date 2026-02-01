## Orchid (educational recreation)

This repository is an **educational, non-commercial recreation** inspired by the product and UX of **`orchid.ai`**.

<img width="1896" height="1038" alt="image" src="https://github.com/user-attachments/assets/54f977b5-f632-49ac-b53e-b02b95165016" />

- **Attribution / rights**: All product concepts, branding, and original work belong to the Orchid team. **All rights reserved to them.**
- **Intent**: This repo exists to learn from great engineering and product design. We are not affiliated with them Orchid.
- **Not production-ready**: This codebase is **not intended for production use**. It’s a learning project and is not organized/structured for that.

## What this repo focuses on

- **Issue creation and management**: an inbox-style workflow to create, review, and manage issues.
- **AI chats that create artifacts**: the AI can generate structured “rtifacts (e.g. issue/bug writeups) as part of the conversation.
- **AI tools**: the AI can use tools to search existing issues in the inbox and to run web searches when needed.
- **Local-first sync**: local-first patterns and replication so the app stays responsive and usable while syncing.
- **GitHub sync**: issues created in the app are **automatically synced** to this GitHub repo.

## Tech stack

- **Next.js**
- **Convex**
- **Vercel AI SDK**
- **Replicate** (`@trestleinc/replicate`)
- **Bun**

## Authentication

This project intentionally has **no authentication** (or only minimal identity) because it’s built as an educational recreation and a sandbox for exploring local-first + issue workflows.

## Requirements

- **Bun** installed (`bun --version`)
- A **Convex** project (you’ll set it up via `bunx convex dev`)

## Setup (straightforward)

1) Install dependencies

```bash
bun install
```

2) Set up Convex (run in a second terminal)

```bash
bunx convex dev
```

3) Configure environment variables

- Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

The `.env.example` template includes keys for Convex, optional AI gateway access, uploads (R2), and GitHub integration.

- After running `bunx convex dev`, make sure you set at least:
  - `CONVEX_DEPLOYMENT`
  - `NEXT_PUBLIC_CONVEX_URL`


**Important**: the `GITHUB_*` variables are for **Convex (server-side)** functions, not the Next.js client. In real deployments, set them in your Convex environment (dashboard / CLI) rather than relying on local `.env.local`.

4) Run the app

```bash
bun dev
```

Then open `http://localhost:3000`.

## Scripts

- **dev**: `bun dev`
- **build**: `bun build`
- **start**: `bun start`
- **lint**: `bun lint`
