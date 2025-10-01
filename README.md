# Fineprnt Open

**Fineprnt** is an open-source project making legal and business documents accessible, transparent, and easy to understand.  

Contracts, leases, job offers, medical bills — they’re written to confuse you. Fineprnt flips the power back: upload any file, ask in plain English, and get answers backed by **receipts** (citations).

---

## Why Fineprnt?

- **Because the fine print is where people get trapped.**  
- **Because AI shouldn’t be a black box.**  
- **Because clarity is a right, not a privilege.**

Fineprnt is open, transparent, and community-driven. No walled gardens. No pay-to-play. Everyone should be able to read what they sign.

---

## How It Works

- **Upload any document** → PDFs, scans, or images.  
- **Ask questions in plain English** → “When is rent due?” “What fees apply?”  
- **Get answers with receipts** → Page + section citations so you can trust every response.  

Behind the scenes, Fineprnt uses **retrieval-augmented generation (RAG)** to separate:
- **Facts from your document** (with citations)  
- **Helpful general guidance** (context, not hallucination)  

This “two-lane” approach makes Fineprnt uniquely reliable.

---

## Our Approach to Market (GTM)

Fineprnt is not a SaaS tool hidden behind a paywall. It’s three things at once:

1. **🛠️ Open Source Project** - Free, transparent, and community-owned. Self-host it, fork it, improve it.  
2. **📦 SDK (coming soon)** - Use Fineprnt’s parsing, OCR, and RAG pipeline in your own apps.  
3. **☁️ Fineprnt Cloud (coming soon)** - For those who just want to upload and ask without touching code. Hosted, secure, and always in sync with the open repo.  

---

## Features

- **Two-Lane RAG** → Separate contract facts vs. general context  
- **Receipts, not guesses** → Every claim backed by citations  
- **Document type detection** → Leases, offers, medical bills, and more  
- **Automatic OCR** → Scans and images processed into searchable text  
- **Open Source by default** → Transparent pipeline, free forever  

---

## Roadmap

- [ ] SDK for developers (drop-in parsing + RAG)  
- [ ] Fineprnt Cloud (hosted version)  
- [ ] More specialized models for different contract types  
- [ ] Multi-document support  

---

## Tech Stack

### Frontend
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (bootstrapped with [Vite](https://vitejs.dev/))
- [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/) for styling
- [TanStack Query](https://tanstack.com/query/latest) for data fetching and caching
- [React Router](https://reactrouter.com/) for client-side routing
- [AI SDK](https://sdk.vercel.ai/) for AI chat functionality

### Backend
- [Supabase](https://supabase.com/) for database, storage, and Edge Functions
- [PostgreSQL](https://www.postgresql.org/) with [pgvector](https://github.com/pgvector/pgvector) for vector search
- [OpenAI](https://openai.com/) for embeddings and chat completion
- [Mistral AI](https://mistral.ai/) for OCR and document processing

### Infrastructure
- [Vercel](https://vercel.com/) for frontend deployment
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions) for serverless backend
- [Supabase Storage](https://supabase.com/docs/guides/storage) for document storage
- [Supabase Database](https://supabase.com/docs/guides/database/overview) for Database storage

## Project Structure

```
├── docs/                     # Documentation and guides
├── public/                   # Static assets and favicons
├── src/
│   ├── components/
│   │   ├── layout/           # App layout, sidebar, headers
│   │   ├── navigation/       # Navigation utilities
│   │   └── ui/               # shadcn/ui component library
│   ├── contexts/             # React contexts (Theme)
│   ├── hooks/                # Custom React hooks
│   ├── integrations/
│   │   └── supabase/         # Supabase client and types
│   ├── lib/                  # Utilities, constants, and helpers
│   ├── pages/                # Application pages and routes
│   └── types/                # TypeScript type definitions
├── supabase/
│   ├── functions/            # Edge Functions for document processing
│   │   ├── _shared/          # Shared utilities and contracts
│   │   ├── chat_rag/         # RAG chat with two-lane approach
│   │   ├── chunk_and_embed/  # Document chunking and embedding
│   │   ├── ingest_upload_metadata/ # Document upload handling
│   │   ├── ocr_and_annotation/ # OCR and document processing
│   │   ├── send-feedback/    # Optional email feedback
│   │   └── send-support/     # Optional support tickets
│   ├── migrations/           # Database schema migrations
│   └── config.toml           # Supabase CLI configuration
├── .env.example              # Environment variables template
├── setup.sh                  # Automated setup script
├── SETUP.md                  # Detailed setup guide
└── package.json              # Dependencies and scripts
```

## Two-Lane RAG Approach

Fineprnt's unique approach to RAG (Retrieval-Augmented Generation) separates document-specific facts from general guidance:

### From your document
- Contains **only** claims strictly supported by the provided context chunks
- Every sentence ends with a citation in the format `[p{page}, "{section}"]`
- Quotes exact language for numbers, definitions, timeframes, obligations, and penalties
- Never includes outside knowledge or speculation

### General guidance (non-document)
- Contains optional coaching based on general legal and business knowledge
- **Never** asserts facts about the specific contract
- **Never** includes citations to the user's document
- Provides helpful context when document information is missing

This approach ensures you get accurate, grounded information from your actual contract while receiving helpful context when needed.

## Supabase Edge Functions

The document processing pipeline is powered by several Edge Functions in `supabase/functions/`:

### Document Processing Pipeline
1. **ingest_upload_metadata** – Validates document uploads, checks for duplicates, and stores metadata
2. **ocr_and_annotation** – Performs OCR using Mistral AI and extracts structured annotations
3. **chunk_and_embed** – Creates semantic chunks and generates embeddings using OpenAI

### Chat & Search
4. **chat_rag** – Handles chat requests with hybrid search (semantic + keyword) and streams responses using the two-lane approach

### Communication (Optional)
5. **send-feedback** – Sends user feedback emails via Resend (optional)
6. **send-support** – Handles support ticket submissions (optional)

### Utilities
- Shared utilities in `_shared/` directory including contract type detection
- `import_map.json` defines edge runtime imports

## Available Scripts

| Command           | Description                                 |
|-------------------|---------------------------------------------|
| `npm run dev`     | Start development server with Vite          |
| `npm run build`   | Build production assets                     |
| `npm run build:dev` | Development build (no minification)      |
| `npm run lint`    | Run ESLint over the entire project          |
| `npm run preview` | Preview the production build                |

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Docker Desktop (required for Supabase Edge Functions)
- Supabase account and project
- OpenAI API key
- Mistral AI API key (for OCR)

### No Authentication Required
This open-source version runs without user authentication, making it perfect for personal use, demos, or small teams. All documents and chat sessions are shared across all users.

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/admlawson/fineprnt_open.git
   cd fineprnt_open
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Go to your project dashboard → Settings → API
   - Copy your Project URL and anon public key
   - Install the Supabase CLI: `npm install -g supabase`
   - **Important**: Make sure Docker Desktop is running
   - Link your project: `supabase link --project-ref your-project-id`
   - Run the database migration: `supabase db push`
   - Deploy Edge Functions: `supabase functions deploy`

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL="https://your-project-id.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
   ```

5. **Set up API keys in Supabase**
   - Go to your Supabase project → Settings → Edge Functions
   - Add the following secrets:
     ```bash
     supabase secrets set OPENAI_API_KEY="your-openai-api-key"
     supabase secrets set MISTRAL_API_KEY="your-mistral-api-key"
     ```
   - Optional: Add Resend API key for feedback/support emails:
     ```bash
     supabase secrets set RESEND_API_KEY="your-resend-api-key"
     ```

6. **Run locally**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173` - start uploading documents immediately!

### Detailed Setup Instructions

#### 1. Supabase Project Setup

1. **Create a new Supabase project**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Choose a region close to your users
   - Wait for the project to be fully provisioned

2. **Get your project credentials**
   - Go to Settings → API
   - Copy your Project URL (e.g., `https://xyzabc123.supabase.co`)
   - Copy your anon public key (starts with `eyJ...`)

3. **Install and configure Supabase CLI**
   ```bash
   npm install -g supabase
   supabase login
   # Make sure Docker Desktop is running before linking
   supabase link --project-ref your-project-id
   ```

#### 2. Database Setup

1. **Run the database migration**
   ```bash
   supabase db push
   ```
   This will create all necessary tables, indexes, and functions.

2. **Verify the setup**
   - Go to your Supabase dashboard → Table Editor
   - You should see tables: `documents`, `document_vectors`, `chat_sessions`, etc.
   - Go to Database → Extensions and verify `vector` extension is enabled

#### 3. Edge Functions Setup

1. **Deploy all Edge Functions**
   ```bash
   # Make sure Docker Desktop is running
   supabase functions deploy
   ```

2. **Set up API keys as secrets**
   ```bash
   # Required: OpenAI API key for embeddings
   supabase secrets set OPENAI_API_KEY="sk-..."
   
   # Required: Mistral API key for OCR
   supabase secrets set MISTRAL_API_KEY="..."
   
   # Optional: Resend API key for email functionality
   supabase secrets set RESEND_API_KEY="re_..."
   ```

#### 4. Storage Setup

1. **Create storage bucket**
   - Go to Storage in your Supabase dashboard
   - The migration should have created a `documents` bucket
   - If not, create it manually with public access disabled

2. **Configure storage policies**
   - The migration includes storage policies
   - Verify they're working by checking Storage → Policies

#### 5. Frontend Configuration

1. **Create environment file**
   ```bash
   cp .env.example .env
   ```

2. **Update environment variables**
   ```env
   VITE_SUPABASE_URL="https://your-project-id.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-key"
   VITE_APP_BASE_URL="http://localhost:5173"
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

### Production Deployment

#### Frontend (Vercel)

1. **Deploy to Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Set environment variables in Vercel**
   - Go to your Vercel project settings
   - Add the same environment variables as your `.env` file
   - Update `VITE_APP_BASE_URL` to your production domain

#### Backend (Supabase)

1. **Your Supabase project is already production-ready**
   - Edge Functions are deployed
   - Database is set up
   - Storage is configured

2. **Optional: Custom domain**
   - Go to Supabase Settings → Custom Domains
   - Add your custom domain for Edge Functions

### Troubleshooting

#### Common Issues

1. **"Missing authorization header" errors**
   - Ensure your `VITE_SUPABASE_ANON_KEY` is correct
   - Check that the key starts with `eyJ`

2. **"OpenAI embeddings failed" errors**
   - Verify your `OPENAI_API_KEY` is set in Supabase secrets
   - Check that the key starts with `sk-`

3. **"Mistral API error" errors**
   - Verify your `MISTRAL_API_KEY` is set in Supabase secrets
   - Ensure you have credits in your Mistral account

4. **Database connection issues**
   - Verify your `VITE_SUPABASE_URL` is correct
   - Check that your Supabase project is active

5. **Storage upload failures**
   - Ensure the `documents` storage bucket exists
   - Check storage policies are correctly configured

6. **Edge Functions deployment failures**
   - Ensure Docker Desktop is running
   - Check that Docker is accessible from the command line
   - Try restarting Docker Desktop if functions fail to deploy

#### Getting Help

- Check the [Supabase documentation](https://supabase.com/docs)
- Review [OpenAI API documentation](https://platform.openai.com/docs)
- Check [Mistral AI documentation](https://docs.mistral.ai/)
- Open an issue on [GitHub](https://github.com/admlawson/fineprnt_open/issues)

## Contributing

We welcome contributions to Fineprnt! Here's how you can help:

1. **Fork the repository** and clone your fork
2. **Create a feature branch** for your changes
3. **Make your changes** and ensure they work properly
4. **Run the linter** to check for code quality issues:
   ```bash
   npm run lint
   ```
5. **Submit a pull request** with a clear description of your changes

### Development Guidelines

- Follow the existing code style and patterns
- Add tests for new features when possible
- Update documentation for any API changes
- Ensure all linting checks pass

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: Check the `docs/` directory for detailed guides
- **Issues**: Report bugs and request features via [GitHub Issues](https://github.com/admlawson/fineprnt_open/issues)
- **Discussions**: Join the conversation in [GitHub Discussions](https://github.com/admlawson/fineprnt_open/discussions)

## Acknowledgments

- Built with [Supabase](https://supabase.com/) for backend infrastructure
- Powered by [OpenAI](https://openai.com/) for AI capabilities
- OCR processing by [Mistral AI](https://mistral.ai/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)

