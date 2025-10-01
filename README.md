# Fineprnt

**Fineprnt** is an open-source AI-powered platform for uploading, processing, and conversing with documents. Upload any document, ask questions, and get precise answers with citations. The application combines a React frontend, Supabase backend, Mistral and OpenAI models to deliver document chat with retrieval-augmented generation (RAG).

## Features

- **Document Processing** – Upload any document (PDF, images, etc.) with automatic OCR, text extraction, and semantic chunking
- **AI Chat Assistant** – Ask questions about your documents and get precise answers with citations and page references
- **Smart Search** – Hybrid search combining semantic similarity and keyword matching for accurate results
- **No Authentication Required** – Simple setup without user accounts or complex authentication
- **Real-time Processing** – Monitor document processing status with detailed progress tracking
- **Responsive Design** – Modern UI built with Tailwind CSS and shadcn/ui components
- **Dark/Light Themes** – Automatic theme switching with system preference detection

## Tech Stack

### Frontend
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (bootstrapped with [Vite](https://vitejs.dev/))
- [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/) for styling
- [TanStack Query](https://tanstack.com/query/latest) for data fetching and caching
- [React Router](https://reactrouter.com/) for client-side routing
- [AI SDK](https://sdk.vercel.ai/) for AI chat functionality

### Backend
- [Supabase](https://supabase.com/) for authentication, database, storage, and Edge Functions
- [PostgreSQL](https://www.postgresql.org/) with [pgvector](https://github.com/pgvector/pgvector) for vector search
- [OpenAI](https://openai.com/) for embeddings and chat completion
- [Mistral AI](https://mistral.ai/) for OCR and document processing

### Infrastructure
- [Vercel](https://vercel.com/) for frontend deployment
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions) for serverless backend
- [Supabase Storage](https://supabase.com/docs/guides/storage) for document storage

## Project Structure

```
├── docs/                     # Documentation and refactor plans
├── public/                   # Static assets and favicons
├── src/
│   ├── components/
│   │   ├── admin/            # User and organization management
│   │   ├── auth/             # Authentication components
│   │   ├── layout/           # App layout, sidebar, headers
│   │   ├── navigation/       # Navigation utilities
│   │   └── ui/               # shadcn/ui component library
│   ├── contexts/             # React contexts (Auth, Theme)
│   ├── hooks/                # Custom React hooks
│   ├── integrations/
│   │   └── supabase/         # Supabase client and types
│   ├── lib/                  # Utilities, constants, and helpers
│   ├── pages/                # Application pages and routes
│   └── types/                # TypeScript type definitions
├── supabase/
│   ├── functions/            # Edge Functions for document processing
│   ├── migrations/           # Database schema migrations
│   └── config.toml           # Supabase CLI configuration
└── package.json              # Dependencies and scripts
```

## Supabase Edge Functions

The document processing pipeline is powered by several Edge Functions in `supabase/functions/`:

### Document Processing Pipeline
1. **ingest_upload_metadata** – Validates document uploads, checks for duplicates, and stores metadata
2. **ocr_and_annotation** – Performs OCR using Mistral AI and extracts structured annotations
3. **chunk_and_embed** – Creates semantic chunks and generates embeddings using OpenAI

### Chat & Search
4. **chat_rag** – Handles chat requests with hybrid search (semantic + keyword) and streams responses

### Communication (Optional)
5. **send-feedback** – Sends user feedback emails via Resend (optional)
6. **send-support** – Handles support ticket submissions (optional)

### Utilities
- Shared utilities in `_shared/` directory
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
- Supabase account and project
- OpenAI API key
- Mistral AI API key (for OCR)

### No Authentication Required
This open-source version runs without user authentication, making it perfect for personal use, demos, or small teams. All documents and chat sessions are shared across all users.

### Installation

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
   - Create a new Supabase project
   - Run the migrations in `supabase/migrations/`
   - Deploy the Edge Functions
   - **Important**: The database is configured for no authentication - all data is shared

4. **Configure environment variables**
   - Copy `env.example` to `.env.local`
   - Set up your Supabase project URL and keys
   - Set up your OpenAI API key
   - Set up your Mistral AI API key

5. **Run locally**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173` - start uploading documents immediately!

6. **Build for production**
   ```bash
   npm run build
   npm run preview
   ```

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

