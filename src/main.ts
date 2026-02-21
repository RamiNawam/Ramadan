// Ramadan calendar configuration (Lebanon)
const LEBANON_TIMEZONE = 'Asia/Beirut';
const RAMADAN_START_DATE = { year: 2026, month: 2, day: 17 }; // Feb 17, 2026 (Tuesday)
const RAMADAN_DAYS = 29;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Quiz data structure
interface QuizQuestion {
    question: string;
    type: 'multiple-choice' | 'true-false' | 'fill-blank';
    options?: string[]; // For multiple-choice and true-false
    correctAnswer: number | string; // Index for multiple-choice/true-false, string for fill-blank
}

interface QuizData {
    day: number;
    lessonName: string;
    lesson: string;
    questions: QuizQuestion[];
}

interface QuizDataFile {
    days: QuizData[];
}

// Global variable to store loaded quiz data
let QUIZ_DATA: { [day: number]: QuizData } = {};

// Track answers for current quiz
let currentQuizAnswers: (boolean | null)[] = [];
let lastAvailableRamadanDay = -1;

// Load quiz data from JSON file
async function loadQuizData(): Promise<void> {
    try {
        const response = await fetch('quiz-data.json', { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('Failed to load quiz data');
        }
        const data: QuizDataFile = await response.json();
        
        // Convert array to object for easy lookup
        data.days.forEach(dayData => {
            QUIZ_DATA[dayData.day] = {
                day: dayData.day,
                lessonName: dayData.lessonName,
                lesson: dayData.lesson,
                questions: dayData.questions
            };
        });
    } catch (error) {
        console.error('Error loading quiz data:', error);
    }
}

// Get the day of the week for the first day of Ramadan
function getFirstDayOfWeek(): number {
    return new Date(Date.UTC(RAMADAN_START_DATE.year, RAMADAN_START_DATE.month - 1, RAMADAN_START_DATE.day)).getUTCDay();
}

function getDatePartsInTimeZone(timeZone: string, date: Date = new Date()): { year: number; month: number; day: number } {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(date);

    const getPart = (type: string): number => Number(parts.find((part) => part.type === type)?.value || '0');

    return {
        year: getPart('year'),
        month: getPart('month'),
        day: getPart('day')
    };
}

function toEpochDay(dateParts: { year: number; month: number; day: number }): number {
    return Math.floor(Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day) / (1000 * 60 * 60 * 24));
}

function getAvailableRamadanDayInLebanon(): number {
    const todayInLebanon = getDatePartsInTimeZone(LEBANON_TIMEZONE);
    const todayEpoch = toEpochDay(todayInLebanon);
    const ramadanStartEpoch = toEpochDay(RAMADAN_START_DATE);
    const dayNumber = todayEpoch - ramadanStartEpoch + 1;

    if (dayNumber < 1) {
        return 0;
    }

    if (dayNumber > RAMADAN_DAYS) {
        return RAMADAN_DAYS;
    }

    return dayNumber;
}

function getTodayRamadanDayInLebanon(): number | null {
    const availableDay = getAvailableRamadanDayInLebanon();
    if (availableDay < 1 || availableDay > RAMADAN_DAYS) {
        return null;
    }
    return availableDay;
}

// Navigate to quiz page
function navigateToQuiz(day: number): void {
    const availableDay = getAvailableRamadanDayInLebanon();
    if (day > availableDay) {
        return;
    }

    window.location.hash = `quiz-${day}`;
    loadQuizData().then(() => {
        showQuizPage(day);
    });
}

// Show quiz page
function showQuizPage(day: number): void {
    const calendarPage = document.getElementById('calendar-page');
    const quizPage = document.getElementById('quiz-page');
    
    if (calendarPage) calendarPage.style.display = 'none';
    if (quizPage) {
        quizPage.style.display = 'flex';
        loadQuiz(day);
    }
}

// Show calendar page
function showCalendarPage(): void {
    const calendarPage = document.getElementById('calendar-page');
    const quizPage = document.getElementById('quiz-page');
    
    if (calendarPage) calendarPage.style.display = 'flex';
    if (quizPage) quizPage.style.display = 'none';
    hideScoreModal();
    window.location.hash = '';
}

// Handle multiple choice or true/false answer selection
function handleAnswerClick(questionIndex: number, optionIndex: number, correctAnswer: number | string, button: HTMLButtonElement, questionDiv: HTMLElement): void {
    // Disable all buttons in this question
    const optionsDiv = questionDiv.querySelector('.options');
    if (optionsDiv) {
        const allButtons = optionsDiv.querySelectorAll('.option-btn');
        allButtons.forEach(btn => {
            (btn as HTMLButtonElement).disabled = true;
        });
    }
    
    // Remove any existing feedback
    const existingFeedback = questionDiv.querySelector('.answer-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }
    
    // Create feedback element
    const feedback = document.createElement('div');
    feedback.className = 'answer-feedback';
    
    const correctAnswerIndex = typeof correctAnswer === 'number' ? correctAnswer : -1;
    const isCorrect = optionIndex === correctAnswerIndex;
    
    // Track the answer
    currentQuizAnswers[questionIndex] = isCorrect;
    
    if (isCorrect) {
        // Correct answer
        button.classList.add('correct');
        feedback.classList.add('correct-feedback');
        feedback.innerHTML = '<span class="feedback-icon">✓</span> Correct! Well done.';
    } else {
        // Wrong answer
        button.classList.add('wrong');
        feedback.classList.add('wrong-feedback');
        feedback.innerHTML = '<span class="feedback-icon">✗</span> Incorrect. The correct answer is highlighted.';
        
        // Highlight the correct answer
        if (optionsDiv && correctAnswerIndex >= 0) {
            const correctButton = optionsDiv.querySelectorAll('.option-btn')[correctAnswerIndex] as HTMLButtonElement;
            if (correctButton) {
                correctButton.classList.add('correct');
            }
        }
    }
    
    questionDiv.appendChild(feedback);
    
    // Check if all questions are answered
    checkQuizComplete();
}

// Handle fill-in-the-blank answer submission
function handleFillBlankSubmit(questionIndex: number, userAnswer: string, correctAnswer: string, input: HTMLInputElement, submitButton: HTMLButtonElement, questionDiv: HTMLElement): void {
    // Disable input and button
    input.disabled = true;
    submitButton.disabled = true;
    
    // Remove any existing feedback
    const existingFeedback = questionDiv.querySelector('.answer-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }
    
    // Normalize answers for comparison (trim, lowercase)
    const normalizedUserAnswer = userAnswer.trim().toLowerCase();
    const normalizedCorrectAnswer = correctAnswer.trim().toLowerCase();
    
    // Create feedback element
    const feedback = document.createElement('div');
    feedback.className = 'answer-feedback';
    
    const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
    
    // Track the answer
    currentQuizAnswers[questionIndex] = isCorrect;
    
    if (isCorrect) {
        // Correct answer
        input.classList.add('correct');
        feedback.classList.add('correct-feedback');
        feedback.innerHTML = '<span class="feedback-icon">✓</span> Correct! Well done.';
    } else {
        // Wrong answer
        input.classList.add('wrong');
        feedback.classList.add('wrong-feedback');
        feedback.innerHTML = `<span class="feedback-icon">✗</span> Incorrect. The correct answer is: <strong>${correctAnswer}</strong>`;
    }
    
    questionDiv.appendChild(feedback);
    
    // Check if all questions are answered
    checkQuizComplete();
}

// Check if all questions are answered and show score
function checkQuizComplete(): void {
    // Check if all 3 questions are answered
    if (currentQuizAnswers.length === 3 && currentQuizAnswers.every(answer => answer !== null)) {
        // Calculate score
        const correctCount = currentQuizAnswers.filter(answer => answer === true).length;
        const score = `${correctCount}/3`;
        
        // Show score modal
        showScoreModal(score, correctCount);
    }
}

// Show score modal
function showScoreModal(score: string, correctCount: number): void {
    const modal = document.getElementById('score-modal');
    const scoreText = document.getElementById('score-text');
    const scoreMessage = document.getElementById('score-message');
    
    if (modal && scoreText && scoreMessage) {
        scoreText.textContent = score;
        
        // Set message based on score
        if (correctCount === 3) {
            scoreMessage.textContent = 'Perfect! You got all questions correct! 🌟';
        } else if (correctCount === 2) {
            scoreMessage.textContent = 'Great job! Almost perfect! 👍';
        } else if (correctCount === 1) {
            scoreMessage.textContent = 'Good effort! Keep learning! 💪';
        } else {
            scoreMessage.textContent = 'Keep practicing! You\'ll get better! 📚';
        }
        
        modal.style.display = 'flex';
    }
}

// Hide score modal
function hideScoreModal(): void {
    const modal = document.getElementById('score-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Load quiz content for a specific day
function loadQuiz(day: number): void {
    // Reset answers tracking
    currentQuizAnswers = [null, null, null];
    
    const dayTitle = document.getElementById('quiz-day-title');
    const quizContent = document.getElementById('quiz-content');
    
    if (quizContent) {
        // Get quiz data for this day, or use default if not available
        const quizData = QUIZ_DATA[day];
        
        if (dayTitle) {
            dayTitle.textContent = quizData?.lessonName || `Lesson ${day}`;
        }
        
        if (!quizData) {
            quizContent.innerHTML = `
                <div class="quiz-intro">
                    <p>Quiz data for Day ${day} is not available yet. Please check the quiz-data.json file.</p>
                </div>
            `;
            return;
        }
        
        let questionsHTML = `
            <div class="quiz-intro">
                <p>${quizData.lesson}</p>
            </div>
            <div class="quiz-questions">
        `;
        
        quizData.questions.forEach((q, questionIndex) => {
            questionsHTML += `
                <div class="question" data-question-index="${questionIndex}" data-question-type="${q.type}">
                    <h3>السؤال ${questionIndex + 1}</h3>
                    <p>${q.question}</p>
            `;
            
            if (q.type === 'multiple-choice' && q.options) {
                // Multiple choice - 4 options
                questionsHTML += `<div class="options">`;
                q.options.forEach((option, optionIndex) => {
                    questionsHTML += `
                        <button class="option-btn" data-option-index="${optionIndex}">${option}</button>
                    `;
                });
                questionsHTML += `</div>`;
            } else if (q.type === 'true-false' && q.options) {
                // True/False - 2 options
                questionsHTML += `<div class="options true-false-options">`;
                q.options.forEach((option, optionIndex) => {
                    questionsHTML += `
                        <button class="option-btn true-false-btn" data-option-index="${optionIndex}">${option}</button>
                    `;
                });
                questionsHTML += `</div>`;
            } else if (q.type === 'fill-blank') {
                // Fill in the blank - text input
                questionsHTML += `
                    <div class="fill-blank-container">
                        <input type="text" class="fill-blank-input" placeholder="Type your answer here..." />
                        <button class="submit-answer-btn">Submit Answer</button>
                    </div>
                `;
            }
            
            questionsHTML += `</div>`;
        });
        
        questionsHTML += `
            </div>
        `;
        
        quizContent.innerHTML = questionsHTML;
        
        // Prevent right-click context menu on quiz content (anti-cheat)
        quizContent.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });
        
        // Add event listeners based on question type
        const questions = quizContent.querySelectorAll('.question');
        questions.forEach((questionDiv, questionIndex) => {
            const questionData = quizData.questions[questionIndex];
            const questionType = questionDiv.getAttribute('data-question-type');
            
            if (questionType === 'multiple-choice' || questionType === 'true-false') {
                // Multiple choice or True/False
                const buttons = questionDiv.querySelectorAll('.option-btn');
                buttons.forEach((button, optionIndex) => {
                    button.addEventListener('click', () => {
                        handleAnswerClick(
                            questionIndex,
                            optionIndex,
                            questionData.correctAnswer as number,
                            button as HTMLButtonElement,
                            questionDiv as HTMLElement
                        );
                    });
                });
            } else if (questionType === 'fill-blank') {
                // Fill in the blank
                const input = questionDiv.querySelector('.fill-blank-input') as HTMLInputElement;
                const submitButton = questionDiv.querySelector('.submit-answer-btn') as HTMLButtonElement;
                
                if (input && submitButton) {
                    const handleSubmit = () => {
                        if (input.value.trim()) {
                            handleFillBlankSubmit(
                                questionIndex,
                                input.value,
                                questionData.correctAnswer as string,
                                input,
                                submitButton,
                                questionDiv as HTMLElement
                            );
                        }
                    };
                    
                    submitButton.addEventListener('click', handleSubmit);
                    input.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            handleSubmit();
                        }
                    });
                }
            }
        });
    }
}

// Create the calendar
function createCalendar(): void {
    const calendar = document.getElementById('calendar');
    if (!calendar) return;

    calendar.innerHTML = '';

    const availableDay = getAvailableRamadanDayInLebanon();
    const todayDay = getTodayRamadanDayInLebanon();
    const firstDayOfWeek = getFirstDayOfWeek();
    
    // Add day labels
    DAY_LABELS.forEach(label => {
        const labelDiv = document.createElement('div');
        labelDiv.className = 'day-label';
        labelDiv.textContent = label;
        calendar.appendChild(labelDiv);
    });
    
    // Add empty cells before the first day to align with the correct day of week
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'day-cell empty';
        calendar.appendChild(emptyDiv);
    }
    
    // Add the 29 days of Ramadan
    for (let day = 1; day <= RAMADAN_DAYS; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day-cell';
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day.toString();
        dayDiv.appendChild(dayNumber);
        
        if (day > availableDay) {
            dayDiv.classList.add('locked');
        } else {
            dayDiv.classList.add('open');
            dayDiv.style.cursor = 'pointer';
            dayDiv.addEventListener('click', () => navigateToQuiz(day));
        }

        if (todayDay !== null && day === todayDay) {
            dayDiv.classList.add('today');
        } else if (todayDay !== null && day < todayDay) {
            dayDiv.classList.add('past-open');
        }
        
        calendar.appendChild(dayDiv);
    }
}

// Handle hash changes for navigation
function handleHashChange(): void {
    const hash = window.location.hash;
    const match = hash.match(/quiz-(\d+)/);
    if (match) {
        const day = parseInt(match[1], 10);
        const availableDay = getAvailableRamadanDayInLebanon();
        if (day >= 1 && day <= RAMADAN_DAYS && day <= availableDay) {
            loadQuizData().then(() => {
                showQuizPage(day);
            });
        } else {
            showCalendarPage();
        }
    } else {
        showCalendarPage();
    }
}

function startLebanonMidnightWatcher(): void {
    lastAvailableRamadanDay = getAvailableRamadanDayInLebanon();

    setInterval(() => {
        const currentAvailableDay = getAvailableRamadanDayInLebanon();
        if (currentAvailableDay !== lastAvailableRamadanDay) {
            lastAvailableRamadanDay = currentAvailableDay;
            createCalendar();
            handleHashChange();
        }
    }, 60 * 1000);
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    // Load quiz data first
    await loadQuizData();
    
    createCalendar();
    handleHashChange();
    startLebanonMidnightWatcher();
    window.addEventListener('hashchange', handleHashChange);
    
    // Add back button event listener
    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.addEventListener('click', showCalendarPage);
    }
    
    // Add close score modal button event listener
    const closeScoreBtn = document.getElementById('close-score-btn');
    if (closeScoreBtn) {
        closeScoreBtn.addEventListener('click', hideScoreModal);
    }
    
    // Close modal when clicking outside
    const scoreModal = document.getElementById('score-modal');
    if (scoreModal) {
        scoreModal.addEventListener('click', (e) => {
            if (e.target === scoreModal) {
                hideScoreModal();
            }
        });
    }
});
