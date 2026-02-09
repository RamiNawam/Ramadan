// Ramadan calendar configuration
const RAMADAN_START_DATE = new Date(2026, 2, 17); // Month is 0-indexed, so 2 = March
const RAMADAN_DAYS = 29;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Get the day of the week for the first day of Ramadan
function getFirstDayOfWeek(): number {
    return RAMADAN_START_DATE.getDay();
}

// Navigate to quiz page
function navigateToQuiz(day: number): void {
    window.location.hash = `quiz-${day}`;
    showQuizPage(day);
}

// Show quiz page
function showQuizPage(day: number): void {
    const calendarPage = document.getElementById('calendar-page');
    const quizPage = document.getElementById('quiz-page');
    
    if (calendarPage) calendarPage.style.display = 'none';
    if (quizPage) {
        quizPage.style.display = 'block';
        loadQuiz(day);
    }
}

// Show calendar page
function showCalendarPage(): void {
    const calendarPage = document.getElementById('calendar-page');
    const quizPage = document.getElementById('quiz-page');
    
    if (calendarPage) calendarPage.style.display = 'block';
    if (quizPage) quizPage.style.display = 'none';
    window.location.hash = '';
}

// Load quiz content for a specific day
function loadQuiz(day: number): void {
    const dayTitle = document.getElementById('quiz-day-title');
    const quizContent = document.getElementById('quiz-content');
    
    if (dayTitle) {
        dayTitle.textContent = `Ramadan ${day}`;
    }
    
    if (quizContent) {
        // Draft quiz content - will be replaced with actual questions later
        quizContent.innerHTML = `
            <div class="quiz-intro">
                <p>Welcome to Day ${day} of Ramadan! This is a brief introduction to today's lesson.</p>
            </div>
            <div class="quiz-questions">
                <div class="question">
                    <h3>Question 1</h3>
                    <p>What is the main theme of today's lesson?</p>
                    <div class="options">
                        <button class="option-btn">Option A</button>
                        <button class="option-btn">Option B</button>
                        <button class="option-btn">Option C</button>
                        <button class="option-btn">Option D</button>
                    </div>
                </div>
                <div class="question">
                    <h3>Question 2</h3>
                    <p>How does this relate to Ramadan?</p>
                    <div class="options">
                        <button class="option-btn">Option A</button>
                        <button class="option-btn">Option B</button>
                        <button class="option-btn">Option C</button>
                        <button class="option-btn">Option D</button>
                    </div>
                </div>
                <div class="question">
                    <h3>Question 3</h3>
                    <p>What can we learn from this?</p>
                    <div class="options">
                        <button class="option-btn">Option A</button>
                        <button class="option-btn">Option B</button>
                        <button class="option-btn">Option C</button>
                        <button class="option-btn">Option D</button>
                    </div>
                </div>
            </div>
        `;
    }
}

// Create the calendar
function createCalendar(): void {
    const calendar = document.getElementById('calendar');
    if (!calendar) return;
    
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
        
        // Make day 1 clickable and highlighted
        if (day === 1) {
            dayDiv.classList.add('first-day');
            dayDiv.style.cursor = 'pointer';
            dayDiv.addEventListener('click', () => navigateToQuiz(day));
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
        if (day >= 1 && day <= RAMADAN_DAYS) {
            showQuizPage(day);
        }
    } else {
        showCalendarPage();
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    createCalendar();
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    
    // Add back button event listener
    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.addEventListener('click', showCalendarPage);
    }
});
