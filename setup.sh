#!/bin/bash

# Fineprnt Setup Script
# This script helps set up Fineprnt for development

set -e

echo "🚀 Fineprnt Setup Script"
echo "========================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "📦 Installing Supabase CLI..."
    npm install -g supabase
else
    echo "✅ Supabase CLI already installed"
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
    echo "⚠️  Please edit .env and add your Supabase credentials"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Create a Supabase project at https://supabase.com"
echo "2. Edit .env and add your Supabase URL and anon key"
echo "3. Link your Supabase project: supabase link --project-ref your-project-id"
echo "4. Run database migration: supabase db push"
echo "5. Deploy Edge Functions: supabase functions deploy"
echo "6. Set up API keys:"
echo "   supabase secrets set OPENAI_API_KEY=\"your-openai-key\""
echo "   supabase secrets set MISTRAL_API_KEY=\"your-mistral-key\""
echo "7. Start development server: npm run dev"
echo ""
echo "For detailed instructions, see the README.md file."
