# Construction Bid Analyzer

An AI-powered tool for analyzing construction bid packages using Claude Sonnet 4.5. Upload a PDF bid document and receive a comprehensive analysis covering project basics, contract terms, bid recommendations, risks, and critical questions.

## Features

- **PDF Upload**: Drag-and-drop or browse to upload bid documents
- **Complete Text Extraction**: Uses PDF.js to extract all text from PDFs (handles 100+ page documents)
- **AI Analysis**: Powered by Claude Sonnet 4.5 for expert-level bid analysis
- **Professional Reports**: Structured analysis covering:
  - Project basics (name, location, timeline)
  - Critical contract terms (duration, liquidated damages, bonds, insurance)
  - Bid/No-Bid recommendation with confidence level
  - Top risks identified
  - Critical questions to ask before bidding
- **Clean Interface**: Modern, responsive design with loading states and error handling

## Setup

### 1. Set Your API Key

Since this is a client-side application, you need to set your Anthropic API key in localStorage:

1. Open the application in your browser
2. Open the browser console (F12 or right-click > Inspect > Console)
3. Run this command:
   ```javascript
   localStorage.setItem("ANTHROPIC_API_KEY", "your-api-key-here");
   ```

**Security Note**: This stores your API key in browser localStorage. For production use, implement a backend proxy to keep API keys secure.

### 2. Open the Application

Simply open `index.html` in a modern web browser (Chrome, Firefox, Edge, Safari).

## Usage

1. **Upload PDF**: Drag and drop a bid package PDF or click to browse
2. **Analyze**: Click "Analyze Bid Package" button
3. **Review**: Read the comprehensive analysis provided by Claude
4. **Analyze Another**: Click "Analyze Another Bid" to start over

## Technical Details

- **No Framework**: Pure vanilla JavaScript, HTML, and CSS
- **No Backend Required**: Runs entirely in the browser
- **PDF Processing**: Uses PDF.js 3.11.174 from CDN
- **AI Model**: Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)
- **Max Tokens**: 4000 tokens for comprehensive analysis

## File Structure

```
Bid_Analyzer/
├── index.html      # Main UI with upload and results sections
├── analyzer.js     # PDF extraction and Anthropic API integration
├── styles.css      # Professional styling and responsive design
└── README.md       # Documentation
```

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Error Handling

The application handles:
- Empty or corrupted PDFs
- API errors with clear messages
- Network failures
- Missing API key warnings

## Development

To modify the system prompt or analysis parameters, edit the `analyzeWithClaude()` function in `analyzer.js`.

## License

MIT License - Feel free to modify and use for your construction business.
