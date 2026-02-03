// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// State management
let currentFile = null;

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const removeBtn = document.getElementById('removeBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const resultsContent = document.getElementById('resultsContent');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const retryBtn = document.getElementById('retryBtn');
const newAnalysisBtn = document.getElementById('newAnalysisBtn');

// Event listeners
uploadArea.addEventListener('click', () => fileInput.click());
browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
});
fileInput.addEventListener('change', handleFileSelect);
removeBtn.addEventListener('click', removeFile);
analyzeBtn.addEventListener('click', analyzeBid);
retryBtn.addEventListener('click', () => {
    errorSection.style.display = 'none';
    document.querySelector('.upload-section').style.display = 'block';
});
newAnalysisBtn.addEventListener('click', () => {
    resultsSection.style.display = 'none';
    removeFile();
    document.querySelector('.upload-section').style.display = 'block';
});

// Drag and drop handlers
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
        handleFile(files[0]);
    }
});

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
        handleFile(file);
    }
}

function handleFile(file) {
    currentFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);

    uploadArea.style.display = 'none';
    fileInfo.style.display = 'flex';
    analyzeBtn.disabled = false;
}

function removeFile() {
    currentFile = null;
    fileInput.value = '';
    uploadArea.style.display = 'flex';
    fileInfo.style.display = 'none';
    analyzeBtn.disabled = true;
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function analyzeBid() {
    if (!currentFile) return;

    // Hide upload section and show loading
    document.querySelector('.upload-section').style.display = 'none';
    loadingSection.style.display = 'block';
    resultsSection.style.display = 'none';
    errorSection.style.display = 'none';

    try {
        // Extract text from PDF
        const pdfText = await extractTextFromPDF(currentFile);

        if (!pdfText || pdfText.trim().length === 0) {
            throw new Error('Could not extract text from PDF. The file may be scanned images or empty.');
        }

        // Call Anthropic API
        const analysis = await analyzeWithClaude(pdfText);

        // Display results
        displayResults(analysis);

    } catch (error) {
        console.error('Analysis error:', error);
        showError(error.message);
    }
}

async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';
    const totalPages = pdf.numPages;

    // Extract text from all pages
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Combine all text items from the page
        const pageText = textContent.items
            .map(item => item.str)
            .join(' ');

        fullText += pageText + '\n\n';
    }

    return fullText.trim();
}

async function analyzeWithClaude(pdfText) {
    const apiKey = getApiKey();

    if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY not found. Please set your API key in the browser console: localStorage.setItem("ANTHROPIC_API_KEY", "your-key-here")');
    }

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
    return data.content[0].text;
}

function getApiKey() {
    // Try to get API key from localStorage
    return localStorage.getItem('ANTHROPIC_API_KEY') || '';
}

function displayResults(analysisText) {
    loadingSection.style.display = 'none';
    resultsSection.style.display = 'block';

    // Parse and format the analysis
    const formattedHTML = formatAnalysis(analysisText);
    resultsContent.innerHTML = formattedHTML;
}

function formatAnalysis(text) {
    // Split into sections and format with HTML
    let html = '<div class="analysis-content">';

    // Replace markdown-style formatting with HTML
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Split by numbered sections
    const sections = text.split(/(?=\d+\.\s+[A-Z\s]+)/);

    sections.forEach(section => {
        if (!section.trim()) return;

        // Check if this is a major section (starts with number and caps)
        const sectionMatch = section.match(/^(\d+)\.\s+([A-Z][A-Z\s]+)\n/);

        if (sectionMatch) {
            const sectionTitle = sectionMatch[2].trim();
            const sectionContent = section.substring(sectionMatch[0].length);

            // Determine section class for styling
            let sectionClass = 'section';
            if (sectionTitle.includes('BID DECISION')) {
                sectionClass = 'section bid-decision';
            } else if (sectionTitle.includes('RISKS')) {
                sectionClass = 'section risks';
            }

            html += `<div class="${sectionClass}">`;
            html += `<h3>${sectionTitle}</h3>`;
            html += formatSectionContent(sectionContent);
            html += '</div>';
        } else {
            html += formatSectionContent(section);
        }
    });

    html += '</div>';
    return html;
}

function formatSectionContent(content) {
    let html = '';
    const lines = content.split('\n');
    let inList = false;

    lines.forEach(line => {
        line = line.trim();
        if (!line) {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            return;
        }

        // Check for bullet points or dashes
        if (line.match(/^[-•\*]\s+/) || line.match(/^\d+\.\s+/)) {
            if (!inList) {
                html += '<ul>';
                inList = true;
            }
            const itemText = line.replace(/^[-•\*\d\.]\s+/, '');
            html += `<li>${itemText}</li>`;
        } else {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            html += `<p>${line}</p>`;
        }
    });

    if (inList) {
        html += '</ul>';
    }

    return html;
}

function showError(message) {
    loadingSection.style.display = 'none';
    errorSection.style.display = 'block';
    errorMessage.textContent = message;
}

// Show API key setup message on load
console.log('%c Construction Bid Analyzer ', 'background: #2563eb; color: white; font-size: 16px; padding: 10px;');
console.log('%c To use this analyzer, set your Anthropic API key: ', 'font-size: 12px; color: #374151;');
console.log('%c localStorage.setItem("ANTHROPIC_API_KEY", "your-api-key-here"); ', 'font-size: 12px; color: #2563eb; background: #f3f4f6; padding: 5px;');
