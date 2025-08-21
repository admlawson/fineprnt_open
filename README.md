# Clause Chat Sim

Clause Chat Sim (also branded as **OmniClause**) is an AI‑powered platform for uploading, processing, and conversing with organizational documents such as medical contracts. The application combines a React front‑end, Supabase backend, and OpenAI models to deliver document chat with retrieval‑augmented generation (RAG).

## Features

- **Authentication & Profiles** – Email or Azure AD login with profile management, avatars, and domain‑based organization assignment.
- **Document Library** – Upload contracts, monitor processing (OCR, chunking, embedding), rename or delete files, and retry failed jobs.
- **Chat Assistant** – Ask questions about a specific document; answers are grounded in indexed content via a Supabase Edge Function.
- **Subscription Gating** – Enterprise features and limits enforced with trial/enterprise status checks.
- **Administration** – Invite users, edit roles, and manage organization or platform settings through protected routes.
- **Responsive UI** – Tailwind CSS and shadcn‑ui components provide a consistent design across dark/light themes.

## Tech Stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (bootstrapped with [Vite](https://vitejs.dev/))
- [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- [Supabase](https://supabase.com/) for auth, database, storage, and Edge Functions
- [TanStack Query](https://tanstack.com/query/latest) for data fetching and caching
- [OpenAI](https://openai.com/) for embeddings and chat completion

## Project Structure

```
├── docs/                     # Additional documentation (e.g., email setup)
├── public/                   # Static assets
├── src/
│   ├── components/
│   │   ├── admin/            # User management dialogs
│   │   ├── auth/             # Auth-related components (subscription gate, profile)
│   │   ├── layout/           # App layout, sidebar, top bar
│   │   └── ui/               # shadcn-ui building blocks
│   ├── contexts/             # Auth and theme providers
│   ├── hooks/                # Custom React hooks (chat sessions, org data, jobs)
│   ├── integrations/
│   │   └── supabase/         # Supabase client and generated types
│   ├── lib/                  # Utilities and constants (Supabase keys, helpers)
│   ├── pages/                # Application pages (Chat, Documents, Admin, etc.)
│   └── main.tsx, App.tsx     # App entry and routing configuration
├── supabase/
│   ├── functions/            # Edge Functions for document pipeline & chat
│   ├── migrations/           # SQL migrations for the Supabase database
│   └── config.toml           # Supabase CLI configuration
└── package.json              # NPM scripts and dependencies
```

## Supabase Edge Functions

Document processing and chat rely on a series of Edge Functions located in `supabase/functions/`:

1. **ingest_upload_metadata** – Validates uploads, checks duplicates, and stores metadata.
2. **ocr_and_annotation** – Performs OCR and annotates documents.
3. **chunk_and_embed** – Chunks text and generates embeddings for search.
4. **chat_rag** – Serves chat requests, performs hybrid search, and streams OpenAI responses.
5. **00_mistral_test** – Example/test function for model calls.

Shared utilities live in `supabase/functions/_shared` and `import_map.json` defines edge runtime imports.

## Available Scripts

| Command           | Description                                 |
|-------------------|---------------------------------------------|
| `npm run dev`     | Start development server with Vite          |
| `npm run build`   | Build production assets                     |
| `npm run build:dev` | Development build (no minification)      |
| `npm run lint`    | Run ESLint over the entire project          |
| `npm run preview` | Preview the production build                |

## Getting Started

1. **Prerequisites** – Node.js and npm installed.
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure Supabase**
   - The default project points to demo credentials in `src/lib/constants.ts`.
   - For your own project, update `SUPABASE_URL` and `SUPABASE_ANON_KEY` or load them from environment variables.
4. **Run locally**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173` by default.
5. **Lint the code**
   ```bash
   npm run lint
   ```
6. **Build for production**
   ```bash
   npm run build
   npm run preview
   ```

## Related Documentation

- [Email setup guide](docs/email-setup.md) – Configure Resend for custom auth emails.

## Contributing

1. Fork and clone the repository.
2. Create commits against the main branch (no feature branches required here).
3. Ensure `npm run lint` completes without errors.
4. Submit a pull request with a clear description of your changes.

## License

This project does not yet specify a license.

//just getting vercel to pickup the repo switch

