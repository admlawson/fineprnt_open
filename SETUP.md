# Fineprnt Setup Guide

This guide will help you set up Fineprnt from scratch in just a few minutes.

## Prerequisites

- Node.js 18+ and npm
- A Supabase account (free at [supabase.com](https://supabase.com))
- An OpenAI API key (get one at [platform.openai.com](https://platform.openai.com))
- A Mistral AI API key (get one at [console.mistral.ai](https://console.mistral.ai))

## Quick Setup (5 minutes)

### 1. Clone and Install

```bash
git clone https://github.com/admlawson/fineprnt_open.git
cd fineprnt_open
npm install
```

### 2. Run Setup Script

```bash
./setup.sh
```

This will:
- Install dependencies
- Install Supabase CLI
- Create your `.env` file

### 3. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for it to be fully provisioned (2-3 minutes)
3. Go to Settings → API and copy:
   - Project URL (e.g., `https://xyzabc123.supabase.co`)
   - anon public key (starts with `eyJ...`)

### 4. Configure Environment

Edit your `.env` file:

```env
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
VITE_APP_BASE_URL="http://localhost:5173"
```

### 5. Set Up Database

```bash
# Link your Supabase project (replace with your project ID)
supabase link --project-ref your-project-id

# Run the database migration
supabase db push
```

### 6. Deploy Edge Functions

```bash
supabase functions deploy
```

### 7. Set Up API Keys

```bash
# Required: OpenAI API key for embeddings
supabase secrets set OPENAI_API_KEY="sk-your-openai-key"

# Required: Mistral API key for OCR
supabase secrets set MISTRAL_API_KEY="your-mistral-key"

# Optional: Resend API key for email functionality
supabase secrets set RESEND_API_KEY="re_your-resend-key"
```

### 8. Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and start uploading documents!

## What Gets Set Up

### Database Tables
- `documents` - Document metadata and status
- `document_vectors` - Vector embeddings for search
- `document_text` - Extracted text content
- `chat_sessions` - Chat conversation sessions
- `chat_messages` - Individual chat messages
- `processing_jobs` - Document processing pipeline

### Edge Functions
- `ingest_upload_metadata` - Handles document uploads
- `ocr_and_annotation` - Performs OCR using Mistral AI
- `chunk_and_embed` - Creates embeddings using OpenAI
- `chat_rag` - Handles chat with document search
- `send-feedback` - Optional email feedback
- `send-support` - Optional support tickets

### Storage
- `documents` bucket for file storage
- Proper access policies configured

## Verification

After setup, verify everything is working:

1. **Database**: Go to Supabase → Table Editor and see all tables
2. **Functions**: Go to Supabase → Edge Functions and see all functions deployed
3. **Storage**: Go to Supabase → Storage and see the `documents` bucket
4. **App**: Upload a document and start chatting!

## Troubleshooting

### Common Issues

**"Missing authorization header"**
- Check your `VITE_SUPABASE_ANON_KEY` in `.env`
- Ensure the key starts with `eyJ`

**"OpenAI embeddings failed"**
- Verify `OPENAI_API_KEY` is set in Supabase secrets
- Check the key starts with `sk-`

**"Mistral API error"**
- Verify `MISTRAL_API_KEY` is set in Supabase secrets
- Ensure you have credits in your Mistral account

**Database connection issues**
- Verify `VITE_SUPABASE_URL` is correct
- Check your Supabase project is active

### Getting Help

- Check the [main README](README.md) for detailed instructions
- Review [Supabase documentation](https://supabase.com/docs)
- Open an issue on [GitHub](https://github.com/admlawson/fineprnt_open/issues)

## Production Deployment

### Frontend (Vercel)

1. Install Vercel CLI: `npm install -g vercel`
2. Deploy: `vercel`
3. Set environment variables in Vercel dashboard
4. Update `VITE_APP_BASE_URL` to your production domain

### Backend (Supabase)

Your Supabase project is already production-ready! No additional setup needed.

## Cost Estimation

### Free Tier Limits
- **Supabase**: 500MB database, 1GB bandwidth, 2GB storage
- **OpenAI**: $5 free credit (enough for ~1000 documents)
- **Mistral**: Free tier available

### Typical Usage
- **Small team (10 users)**: ~$20-50/month
- **Medium team (50 users)**: ~$100-200/month
- **Large team (200+ users)**: ~$300-500/month

Costs scale with document volume and chat usage.
