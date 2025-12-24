// ========================================
// Java MCQ Quiz - Enhanced Script
// ========================================

// State
let quiz = [];
let currentQuestion = 0;
let score = 0;
let responses = [];
let playerName = '';

// Timer Settings
const TIME_PER_QUESTION = 30;
let timerInterval;
let timeLeft;

// API URLs - uses config.js for base URL
const API_URL = getApiUrl('/api/results');
const QUESTIONS_URL = getApiUrl('/api/questions');
const STATE_KEY = 'quizState';

// Save state to localStorage
function saveState() {
    const state = {
        quiz: quiz,
        currentQuestion: currentQuestion,
        score: score,
        responses: responses,
        playerName: playerName,
        timeLeft: timeLeft,
        currentSelection: currentSelection,
        inProgress: true
    };
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

// Load state from localStorage
function loadState() {
    try {
        const saved = localStorage.getItem(STATE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.log('Could not load saved state');
    }
    return null;
}

// Clear saved state
function clearState() {
    localStorage.removeItem(STATE_KEY);
}

// DOM Elements
const screens = {
    start: document.getElementById('startScreen'),
    quiz: document.getElementById('quizScreen'),
    result: document.getElementById('resultScreen'),
    review: document.getElementById('reviewScreen')
};

const elements = {
    playerNameInput: document.getElementById('playerName'),
    startBtn: document.getElementById('startBtn'),
    totalQuestions: document.getElementById('totalQuestions'),
    totalAttempts: document.getElementById('totalAttempts'),
    highScore: document.getElementById('highScore'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),
    currentScore: document.getElementById('currentScore'),
    questionText: document.getElementById('questionText'),
    optionsContainer: document.getElementById('optionsContainer'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    resultIcon: document.getElementById('resultIcon'),
    resultTitle: document.getElementById('resultTitle'),
    finalScore: document.getElementById('finalScore'),
    scoreTotal: document.getElementById('scoreTotal'),
    scorePercent: document.getElementById('scorePercent'),
    resultMessage: document.getElementById('resultMessage'),
    reviewBtn: document.getElementById('reviewBtn'),
    timer: document.getElementById('timer'),

    reviewList: document.getElementById('reviewList'),
    backToResultBtn: document.getElementById('backToResultBtn')
};

// Screen Management
function showScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
}

// Shuffle Array
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Timer Functions
function startTimer() {
    clearInterval(timerInterval);
    timeLeft = TIME_PER_QUESTION;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            handleTimeout();
        }
    }, 1000);
}

function updateTimerDisplay() {
    if (!elements.timer) return;
    elements.timer.textContent = timeLeft;

    // Visual styling
    elements.timer.classList.remove('warning', 'danger');
    if (timeLeft <= 10) elements.timer.classList.add('warning');
    if (timeLeft <= 5) elements.timer.classList.add('danger');
}

function handleTimeout() {
    clearInterval(timerInterval);

    // Disable all options
    const optionBtns = elements.optionsContainer.querySelectorAll('.option-btn');
    optionBtns.forEach(btn => btn.disabled = true);

    // Show next button so they can proceed
    elements.nextBtn.style.display = 'inline-flex';
}

// Load Questions from Server
async function loadQuestions() {
    try {
        const response = await fetch(QUESTIONS_URL);
        if (response.ok) {
            quiz = await response.json();
            elements.totalQuestions.textContent = quiz.length;
        }
    } catch (e) {
        console.log('Using default questions');
        quiz = getDefaultQuestions();
    }

    if (quiz.length === 0) {
        quiz = getDefaultQuestions();
    }
}

// Default Questions
function getDefaultQuestions() {
    return [
        { question: "Which keyword is used to create a class in Java?", options: { A: "class", B: "new", C: "object", D: "create" }, answer: "A" },
        { question: "What is the entry point method of a Java program?", options: { A: "start()", B: "run()", C: "main()", D: "init()" }, answer: "C" },
        { question: "What is the size of int in Java (in bits)?", options: { A: "8", B: "16", C: "32", D: "64" }, answer: "C" },
        { question: "Which is NOT a primitive data type in Java?", options: { A: "int", B: "float", C: "String", D: "boolean" }, answer: "C" },
        { question: "Which keyword creates an object in Java?", options: { A: "class", B: "new", C: "this", D: "object" }, answer: "B" }
    ];
}

// Load Stats from Server
async function loadStats() {
    try {
        const response = await fetch(API_URL);
        if (response.ok) {
            const data = await response.json();
            elements.totalAttempts.textContent = data.statistics.totalAttempts;
            elements.highScore.textContent = data.statistics.highestScore;
        }
    } catch (e) {
        console.log('Could not load stats');
    }
}

// Save Result to Server
async function saveResult(result) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result)
        });
        return response.ok;
    } catch (e) {
        return false;
    }
}

// Update Progress
function updateProgress() {
    const progress = ((currentQuestion + 1) / quiz.length) * 100;
    elements.progressBar.style.width = progress + '%';
    elements.progressText.textContent = `${currentQuestion + 1}/${quiz.length}`;
}

// Update Score Display (only if element exists)
function updateScoreDisplay() {
    if (elements.currentScore) {
        elements.currentScore.textContent = score;
    }
}

// Load Question
function loadQuestion() {
    const q = quiz[currentQuestion];
    elements.questionText.textContent = q.question;
    elements.questionText.style.opacity = '1';

    // Check if already answered
    if (responses[currentQuestion]) {
        // Question completed - stop timer and lock
        clearInterval(timerInterval);
        elements.timer.textContent = '--';
        elements.timer.classList.remove('warning', 'danger');

        // Restore selection and lock options
        currentSelection = responses[currentQuestion].selected;

        const optionBtns = elements.optionsContainer.querySelectorAll('.option-btn');
        optionBtns.forEach(btn => {
            const option = btn.dataset.option;
            btn.querySelector('.option-text').textContent = q.options[option];

            // Reset classes
            btn.classList.remove('selected', 'correct', 'wrong');

            // Highlight selected
            if (option === currentSelection) {
                btn.classList.add('selected');
            }

            // Disable button
            btn.disabled = true;
        });

        // Show next button
        elements.nextBtn.style.display = 'inline-flex';
    } else {
        // New question - start timer
        startTimer();

        // Update options normally
        const optionBtns = elements.optionsContainer.querySelectorAll('.option-btn');
        optionBtns.forEach(btn => {
            const option = btn.dataset.option;
            btn.querySelector('.option-text').textContent = q.options[option];
            btn.classList.remove('selected', 'correct', 'wrong');
            btn.disabled = false;
        });

        currentSelection = null;
        elements.nextBtn.style.display = 'none';
    }

    updateProgress();
    elements.prevBtn.style.display = currentQuestion > 0 ? 'inline-flex' : 'none';
}

// Handle Option Click - allows changing answer
let currentSelection = null;

function handleOptionClick(e) {
    const btn = e.currentTarget;
    const selectedOption = btn.dataset.option;
    const q = quiz[currentQuestion];

    // If clicking same option, do nothing
    if (currentSelection === selectedOption) return;

    // Update selection
    currentSelection = selectedOption;

    // Highlight selected
    const optionBtns = elements.optionsContainer.querySelectorAll('.option-btn');
    optionBtns.forEach(b => {
        b.classList.remove('selected');
    });
    btn.classList.add('selected');

    // Show next button
    elements.nextBtn.style.display = 'inline-flex';
}

// Handle Next Click
// Handle Previous Click
function handlePrevClick() {
    if (currentQuestion > 0) {
        currentQuestion--;
        loadQuestion();
    }
}

// Calculate Score from Responses
function calculateScore() {
    score = responses.reduce((acc, curr) => acc + (curr && curr.isCorrect ? 1 : 0), 0);
    updateScoreDisplay();
}

// Handle Next Click
function handleNextClick() {
    clearInterval(timerInterval);
    // Store the response at current index
    const q = quiz[currentQuestion];
    responses[currentQuestion] = {
        question: q.question,
        options: q.options,
        selected: currentSelection,
        correctAnswer: q.answer,
        isCorrect: currentSelection === q.answer
    };

    // Only increment score if this is a new answer or changed result
    // Note: Simple score tracking gets complex with back/forth. 
    // Re-calculating score from all responses is safer.
    calculateScore();

    currentQuestion++;

    // Save progress
    saveState();

    if (currentQuestion < quiz.length) {
        // Animate question transition
        elements.questionText.style.opacity = '0';
        setTimeout(() => {
            loadQuestion();
            elements.questionText.style.opacity = '1';
        }, 200);
    } else {
        // Quiz complete - clear saved state
        clearState();
        showResults();
    }
}

// Show Results
async function showResults() {
    const percentage = Math.round((score / quiz.length) * 100);

    // Update result display
    elements.finalScore.textContent = score;
    elements.scoreTotal.textContent = '/' + quiz.length;
    elements.scorePercent.textContent = percentage + '%';

    // Set icon and message based on score
    if (percentage >= 80) {
        elements.resultIcon.textContent = '🏆';
        elements.resultTitle.textContent = 'Excellent!';
        elements.resultMessage.textContent = "Outstanding performance! You're a Java expert!";
        elements.scorePercent.style.color = '#10b981';
    } else if (percentage >= 60) {
        elements.resultIcon.textContent = '🎉';
        elements.resultTitle.textContent = 'Good Job!';
        elements.resultMessage.textContent = 'Great effort! Keep practicing to master Java.';
        elements.scorePercent.style.color = '#06b6d4';
    } else if (percentage >= 40) {
        elements.resultIcon.textContent = '💪';
        elements.resultTitle.textContent = 'Keep Trying!';
        elements.resultMessage.textContent = "You're making progress. Review and try again!";
        elements.scorePercent.style.color = '#f59e0b';
    } else {
        elements.resultIcon.textContent = '📚';
        elements.resultTitle.textContent = 'Study More!';
        elements.resultMessage.textContent = 'Review Java basics and try again. You got this!';
        elements.scorePercent.style.color = '#ef4444';
    }

    // Save result
    const result = {
        id: Date.now(),
        name: playerName || 'Anonymous',
        score: score,
        total: quiz.length,
        percentage: percentage,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        timestamp: new Date().toISOString(),
        responses: responses.map(r => ({
            question: r.question,
            yourAnswer: r.selected || 'Not answered',
            correctAnswer: r.correctAnswer,
            result: r.isCorrect ? 'Correct' : 'Wrong'
        }))
    };

    await saveResult(result);

    showScreen('result');
}

// Show Review
function showReview() {
    elements.reviewList.innerHTML = '';

    responses.forEach((r, i) => {
        if (!r) return; // Skip if empty (shouldn't happen)
        const item = document.createElement('div');
        item.className = 'review-item' + (r.isCorrect ? '' : ' wrong');

        let optionsHtml = '';
        for (let key in r.options) {
            let optionClass = 'review-option';
            let marker = '';

            if (key === r.correctAnswer) {
                optionClass += ' correct-answer';
                marker = ' ✓';
            }
            if (key === r.selected && !r.isCorrect) {
                optionClass += ' user-wrong';
                marker = ' ✗';
            }

            optionsHtml += `<div class="${optionClass}">${key}. ${r.options[key]}${marker}</div>`;
        }

        item.innerHTML = `
            <div class="review-question">Q${i + 1}: ${r.question}</div>
            <div class="review-options">${optionsHtml}</div>
        `;

        elements.reviewList.appendChild(item);
    });

    showScreen('review');
}

// Start Quiz
function startQuiz() {
    playerName = elements.playerNameInput.value.trim() || 'Anonymous';
    currentQuestion = 0;
    score = 0;
    responses = [];
    currentSelection = null;

    shuffle(quiz);
    updateScoreDisplay();
    loadQuestion();
    saveState(); // Save initial state
    showScreen('quiz');
}



// Event Listeners
elements.startBtn.addEventListener('click', startQuiz);
elements.nextBtn.addEventListener('click', handleNextClick);
elements.prevBtn.addEventListener('click', handlePrevClick);
elements.reviewBtn.addEventListener('click', showReview);

elements.backToResultBtn.addEventListener('click', () => showScreen('result'));

// Option buttons
elements.optionsContainer.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', handleOptionClick);
});

// Enter key to start
elements.playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') startQuiz();
});

// Initialize
async function init() {
    await loadQuestions();
    await loadStats();

    // Check for saved progress
    const savedState = loadState();
    if (savedState && savedState.inProgress && savedState.quiz && savedState.quiz.length > 0) {
        // Restore saved state
        quiz = savedState.quiz;
        currentQuestion = savedState.currentQuestion;
        score = savedState.score;
        responses = savedState.responses || [];
        playerName = savedState.playerName || 'Anonymous';
        currentSelection = savedState.currentSelection || null;

        // Resume quiz
        loadQuestion();
        showScreen('quiz');
        console.log('✅ Restored quiz progress');
    } else {
        showScreen('start');
    }
}

init();
