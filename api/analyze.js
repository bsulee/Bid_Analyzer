export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get API key from environment
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    // Validate request body
    const { pdfText } = req.body;
    if (!pdfText || typeof pdfText !== 'string' || pdfText.trim().length === 0) {
        return res.status(400).json({ error: 'Invalid or missing pdfText' });
    }

    // System prompt for Claude
    const systemPrompt = `You are a top 0.1% construction project manager with 20 years of experience analyzing bid packages.

Analyze this bid document and provide a structured report covering:

1. PROJECT BASICS
- Project name, location, owner
- Bid due date and timeline
- Architect/engineer

2. CRITICAL CONTRACT TERMS
- Contract duration (substantial + final completion)
- Liquidated damages (both amounts, calculate total per day)
- Retainage percentage
- Performance/payment bond requirements
- Insurance requirements

3. BID DECISION
- Should we bid? (BID / NO-BID / CLARIFY)
- Confidence level (0-100%)
- 2-3 sentence explanation

4. TOP RISKS
- List 3-5 highest risks

5. QUESTIONS TO ASK
- List 3-5 critical questions before bidding

Be thorough but concise. Focus on what actually matters for the bid/no-bid decision.`;

    try {
        // Call Anthropic API
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-5-20250929',
                max_tokens: 4000,
                system: systemPrompt,
                messages: [{
                    role: 'user',
                    content: `Please analyze this construction bid document:\n\n${pdfText}`
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const analysisText = data.content[0].text;

        // Return analysis
        return res.status(200).json({ analysis: analysisText });

    } catch (error) {
        console.error('Analysis error:', error);
        return res.status(500).json({ error: error.message || 'Analysis failed' });
    }
}
