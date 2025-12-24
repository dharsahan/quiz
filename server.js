const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Configuration from environment
const PORT = process.env.PORT || 8080;
const RESULTS_FILE = path.join(__dirname, 'results.json');
const QUESTIONS_FILE = path.join(__dirname, 'questions.json');
const SETTINGS_FILE = path.join(__dirname, 'settings.json');

// GitHub Models API configuration (optional - for AI features)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_MODELS_ENDPOINT = 'https://models.inference.ai.azure.com/chat/completions';

// MIME types for serving static files
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json'
};

// Admin credentials from environment (REQUIRED)
const ADMIN_CREDENTIALS = {
    username: process.env.ADMIN_USERNAME || 'kalai',
    password: process.env.ADMIN_PASSWORD || 'kalai100'
};

// Default questions (fallback)
const defaultQuestions = [
    { question: "Which keyword is used to create a class in Java?", options: { A: "class", B: "new", C: "object", D: "create" }, answer: "A" },
    { question: "What is the entry point method of a Java program?", options: { A: "start()", B: "run()", C: "main()", D: "init()" }, answer: "C" },
    { question: "What is the size of int in Java (in bits)?", options: { A: "8", B: "16", C: "32", D: "64" }, answer: "C" },
    { question: "Which of the following is NOT a primitive data type in Java?", options: { A: "int", B: "float", C: "String", D: "boolean" }, answer: "C" },
    { question: "Which keyword is used to create an object in Java?", options: { A: "class", B: "new", C: "this", D: "object" }, answer: "B" }
];

// Initialize results.json if it doesn't exist
function initResultsFile() {
    if (!fs.existsSync(RESULTS_FILE)) {
        const initialData = {
            quizInfo: {
                title: "Java MCQ Quiz",
                totalQuestions: 5,
                createdDate: new Date().toISOString().split('T')[0]
            },
            statistics: {
                totalAttempts: 0,
                averageScore: 0,
                highestScore: 0,
                lowestScore: 0
            },
            results: []
        };
        fs.writeFileSync(RESULTS_FILE, JSON.stringify(initialData, null, 2));
    }
}

// Initialize questions.json
function initQuestionsFile() {
    if (!fs.existsSync(QUESTIONS_FILE)) {
        fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(defaultQuestions, null, 2));
    }
}

// Read results from file
function readResults() {
    try {
        const data = fs.readFileSync(RESULTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        initResultsFile();
        return readResults();
    }
}

// Read questions from file
function readQuestions() {
    try {
        const data = fs.readFileSync(QUESTIONS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        initQuestionsFile();
        return defaultQuestions;
    }
}

// Save results to file
function saveResults(data) {
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(data, null, 2));
}

// Save questions to file
function saveQuestions(questions) {
    fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(questions, null, 2));
}

// Generate questions using GitHub Models API
async function generateQuestionsWithAI(topic = "Java", count = 5) {
    return new Promise((resolve, reject) => {
        const prompt = `Generate ${count} multiple choice questions about ${topic} programming. 
        
Return ONLY a valid JSON array with this exact format, no other text:
[
  {
    "question": "Question text here?",
    "options": { "A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D" },
    "answer": "A"
  }
]

Requirements:
- Questions should be about ${topic} programming concepts
- Each question must have exactly 4 options (A, B, C, D)
- The answer field must be a single letter (A, B, C, or D)
- Mix difficulty levels (easy, medium, hard)
- Cover different topics like syntax, OOP, data types, loops, etc.`;

        const requestData = JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a programming quiz generator. Return only valid JSON arrays, no markdown or extra text." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 2000
        });

        const options = {
            hostname: 'models.inference.ai.azure.com',
            path: '/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Content-Length': Buffer.byteLength(requestData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    if (res.statusCode !== 200) {
                        console.log('API Error:', res.statusCode, data);
                        reject(new Error(`API returned status ${res.statusCode}`));
                        return;
                    }

                    const response = JSON.parse(data);
                    const content = response.choices[0].message.content;

                    // Extract JSON from response (handle markdown code blocks)
                    let jsonStr = content;
                    if (content.includes('```')) {
                        const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
                        if (match) jsonStr = match[1].trim();
                    }

                    const questions = JSON.parse(jsonStr);

                    if (Array.isArray(questions) && questions.length > 0) {
                        resolve(questions);
                    } else {
                        reject(new Error('Invalid questions format'));
                    }
                } catch (e) {
                    console.log('Parse error:', e.message);
                    reject(e);
                }
            });
        });

        req.on('error', (e) => {
            console.log('Request error:', e.message);
            reject(e);
        });

        req.write(requestData);
        req.end();
    });
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // API: Get Settings
    if (req.url === '/api/settings' && req.method === 'GET') {
        fs.readFile(SETTINGS_FILE, 'utf8', (err, data) => {
            if (err) {
                // Default settings if file doesn't exist
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ duration: 10 })); // Default 10 minutes
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(data);
            }
        });
        return;
    }

    // API: Save Settings
    if (req.url === '/api/settings' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            fs.writeFile(SETTINGS_FILE, body, (err) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false }));
                } else {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                }
            });
        });
        return;
    }

    // API: Login
    if (req.url === '/api/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { username, password } = JSON.parse(body);

                if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
                    console.log(`✅ Admin login successful: ${username}`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: 'Login successful' }));
                } else {
                    console.log(`❌ Failed login attempt: ${username}`);
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Invalid username or password' }));
                }
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Invalid request' }));
            }
        });
        return;
    }

    // API: Get questions
    if (req.url === '/api/questions' && req.method === 'GET') {
        const questions = readQuestions();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(questions));
        return;
    }

    // API: Save/Update all questions
    if (req.url === '/api/questions' && req.method === 'PUT') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const questions = JSON.parse(body);
                if (Array.isArray(questions)) {
                    saveQuestions(questions);
                    console.log(`📝 Saved ${questions.length} questions`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: 'Questions saved', count: questions.length }));
                } else {
                    throw new Error('Invalid format');
                }
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: e.message }));
            }
        });
        return;
    }

    // API: Generate new questions with AI
    if (req.url.startsWith('/api/generate') && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { topic = 'Java', count = 5 } = body ? JSON.parse(body) : {};

                console.log(`🤖 Generating ${count} ${topic} questions using GitHub Models...`);

                const questions = await generateQuestionsWithAI(topic, count);

                // Save to questions.json
                saveQuestions(questions);

                console.log(`✅ Generated ${questions.length} questions successfully!`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: `Generated ${questions.length} questions about ${topic}`,
                    questions: questions
                }));
            } catch (e) {
                console.log('❌ AI generation failed:', e.message);

                // Return default questions on error
                const questions = defaultQuestions;

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: 'AI generation failed, using default questions. Check your GITHUB_TOKEN.',
                    error: e.message,
                    questions: questions
                }));
            }
        });
        return;
    }

    // API: Get all results
    if (req.url === '/api/results' && req.method === 'GET') {
        const results = readResults();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(results));
        return;
    }

    // API: Save new result
    if (req.url === '/api/results' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const newResult = JSON.parse(body);
                const data = readResults();

                // Add new result
                data.results.push(newResult);

                // Update statistics
                const scores = data.results.map(r => r.score);
                data.statistics = {
                    totalAttempts: data.results.length,
                    averageScore: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
                    highestScore: Math.max(...scores),
                    lowestScore: Math.min(...scores)
                };
                data.lastUpdated = new Date().toISOString();

                // Save to file
                saveResults(data);

                console.log(`✅ Result saved for: ${newResult.name} (Score: ${newResult.score}/${newResult.total})`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Result saved to results.json', data: data }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: e.message }));
            }
        });
        return;
    }

    // API: Clear all results
    if (req.url === '/api/results/clear' && req.method === 'POST') {
        const data = readResults();
        data.results = [];
        data.statistics = { totalAttempts: 0, averageScore: 0, highestScore: 0, lowestScore: 0 };
        data.lastUpdated = new Date().toISOString();
        saveResults(data);
        console.log('🗑️ All results cleared');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'All results cleared' }));
        return;
    }

    // API: Delete single result
    if (req.url.startsWith('/api/results') && req.method === 'DELETE') {
        const urlParams = new URLSearchParams(req.url.split('?')[1]);
        const id = urlParams.get('id');

        if (id) {
            const data = readResults();
            const initialLength = data.results.length;
            data.results = data.results.filter(r => r.id.toString() !== id);

            if (data.results.length !== initialLength) {
                // Update stats
                const scores = data.results.map(r => r.score);
                data.statistics = {
                    totalAttempts: data.results.length,
                    averageScore: scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0,
                    highestScore: scores.length ? Math.max(...scores) : 0,
                    lowestScore: scores.length ? Math.min(...scores) : 0
                };

                saveResults(data);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Result not found' }));
            }
        } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Missing ID' }));
        }
        return;
    }

    // Serve static files
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, filePath);

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'text/plain';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('File not found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

// Initialize and start server
initResultsFile();
initQuestionsFile();
server.listen(PORT, () => {
    console.log('');
    console.log('🎮 Java MCQ Quiz Server Running!');
    console.log('================================');
    console.log(`📍 Open in browser: http://localhost:${PORT}`);
    console.log(`📁 Results stored in: ${RESULTS_FILE}`);
    console.log(`📝 Questions stored in: ${QUESTIONS_FILE}`);
    console.log('');
    console.log('🤖 AI Question Generation: Enabled');
    console.log('   Set GITHUB_TOKEN env variable for AI features');
    console.log('');
    console.log('Press Ctrl+C to stop the server');
    console.log('');
});
