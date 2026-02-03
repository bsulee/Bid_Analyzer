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
    const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            pdfText: pdfText
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.analysis;
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

// Construction Bid Analyzer loaded
console.log('%c Construction Bid Analyzer ', 'background: #2563eb; color: white; font-size: 16px; padding: 10px;');
console.log('%c Ready to analyze bid packages ', 'font-size: 12px; color: #374151;');
