# Construction Bid Analyzer

AI-powered construction bid package analysis using Claude Sonnet 4.5. Upload a PDF bid document and receive comprehensive analysis covering project basics, contract terms, bid recommendations, risks, and critical questions.

## Features

- **PDF Upload**: Drag-and-drop or browse to upload bid documents
- **Complete Text Extraction**: Extracts all text from PDFs (handles 100+ page documents)
- **AI Analysis**: Expert-level bid analysis powered by Claude Sonnet 4.5
- **Professional Reports**: Structured analysis covering:
  - Project basics (name, location, timeline)
  - Critical contract terms (duration, liquidated damages, bonds, insurance)
  - Bid/No-Bid recommendation with confidence level
  - Top risks identified
  - Critical questions to ask before bidding
- **Secure**: API key stored server-side, never exposed to client
- **Clean Interface**: Modern, responsive design with loading states and error handling

## Deployment

### Deploy to Vercel

1. **Push to GitHub** (if not already done)

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect the configuration

3. **Add Environment Variable**:
   - In Vercel project settings, go to "Environment Variables"
   - Add: `ANTHROPIC_API_KEY` = `your-api-key-here`
   - Apply to all environments (Production, Preview, Development)

4. **Deploy**:
   - Click "Deploy"
   - Your app will be live at `https://your-project.vercel.app`

That's it! The app is production-ready.

## Local Development

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Create `.env` file**:
   ```bash
   ANTHROPIC_API_KEY=your-api-key-here
   ```

3. **Run locally**:
   ```bash
   vercel dev
   ```

4. **Open**: http://localhost:3000

## Usage

1. Open the deployed application
2. Drag and drop a PDF bid package (or click to browse)
3. Click "Analyze Bid Package"
4. Review the comprehensive analysis
5. Click "Analyze Another Bid" to start over

## Architecture

```
Browser → Frontend (index.html + analyzer.js)
              ↓
         Vercel Function (/api/analyze.js)
              ↓
         Anthropic API (Claude Sonnet 4.5)
```

**Security**: API key is stored as a Vercel environment variable, never exposed to the client browser.

## File Structure

```
Bid_Analyzer/
├── index.html          # Main UI
├── analyzer.js         # Frontend logic + PDF extraction
├── styles.css          # Styling
├── api/
│   └── analyze.js      # Serverless function (backend)
├── vercel.json         # Vercel configuration
├── test.js             # Test suite
└── README.md           # Documentation
```

## Testing

Run the test suite to verify everything works:

```bash
node test.js
```

All tests must pass before deployment.

## Technical Details

- **Frontend**: Vanilla JavaScript, HTML, CSS (no framework)
- **PDF Processing**: PDF.js 3.11.174
- **Backend**: Vercel Serverless Functions
- **AI Model**: Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)
- **Max Analysis Tokens**: 4000
- **Function Timeout**: 60 seconds

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Error Handling

The application handles:
- Empty or corrupted PDFs
- API errors with clear messages
- Network failures
- Missing API key configuration
- Invalid requests

## License

MIT License
