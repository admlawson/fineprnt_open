# Mock Mode Setup

When your Supabase project is paused, you can run Fineprnt in mock mode to allow users to explore the UI without database access.

## Setup

1. **Enable Mock Mode**
   ```bash
   # Add to your .env file
   VITE_MOCK_MODE=true
   ```

2. **Start the Development Server**
   ```bash
   npm run dev
   ```

## What Mock Mode Provides

- **Sample Documents**: 5 pre-configured documents (lease, employment contract, medical bill, etc.)
- **Sample Chat Sessions**: 3 example conversations with realistic Q&A
- **UI Functionality**: All interface elements work (navigation, forms, etc.)
- **Simulated Responses**: Chat shows mock AI responses with streaming effect
- **No Database Access**: All Supabase calls are intercepted and return mock data

## Mock Data

The mock data includes:
- Documents with various statuses (completed, processing, failed)
- Chat sessions with realistic conversation flows
- Processing jobs to demonstrate the workflow
- File upload simulation (disabled in mock mode)

## Switching Back to Real Mode

1. **Resume Supabase Project**
   - Go to your Supabase dashboard
   - Settings → General → Resume project

2. **Disable Mock Mode**
   ```bash
   # Remove or set to false in .env
   VITE_MOCK_MODE=false
   ```

3. **Restart Development Server**
   ```bash
   npm run dev
   ```

## Benefits

- **No Security Risk**: No real data is exposed
- **Full UI Experience**: Users can explore all features
- **Easy Toggle**: Simple environment variable switch
- **Realistic Demo**: Mock data matches real application structure
- **Cost Effective**: No Supabase charges while paused

## Limitations

- File uploads are disabled
- Real AI responses are not available
- Data changes are not persisted
- Real-time updates are disabled

## For Developers

The mock mode implementation is **non-destructive** - it doesn't modify existing Supabase code. Instead, it provides:

- `src/lib/mockData.ts` - Mock data and service functions
- `src/lib/mockMode.ts` - Utility functions for checking mock mode
- Environment variable `VITE_MOCK_MODE` to toggle between modes

All original Supabase functionality remains intact for when you want to use your own database.
