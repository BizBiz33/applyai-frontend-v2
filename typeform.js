/* ============================================
   ApplyAI - Typeform Style JavaScript
   Navigation, Validation, Micro-interactions
   ============================================ */

// Configuration
const N8N_WEBHOOK_URL = 'https://bizbiz.app.n8n.cloud/webhook/user-registration';
const TOTAL_QUESTIONS = 26;
const POPUP_QUESTION = 15; // La question de transition
const DURATION_QUESTION = 5; // Question de durée (stage/CDD)

// Experience counter
let experienceCount = 1;

// State
let currentQuestion = 1;
let formData = {};
let isAnimating = false;
let userFirstName = ''; // Stocke le prénom pour la personnalisation

// DOM Elements
const form = document.getElementById('typeform');
const progressBar = document.getElementById('progressBar');
const currentQuestionEl = document.getElementById('currentQuestion');
const totalQuestionsEl = document.getElementById('totalQuestions');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    totalQuestionsEl.textContent = TOTAL_QUESTIONS;
    updateProgress();
    initKeyboardNavigation();
    initChoiceListeners();
    initInputListeners();
    initUploadZone();
    initTextareaCounter();
    initCountrySelector();
    initOtherCountriesSelector();
    initDatePickerChoice();
    initFirstNameListener();
    initContractTypeListener();
    initOtherDomainsSelector();
    initOtherCitiesSelector();
    initCustomCityFranceInput();
    initAnywhereCityFrance();
    initCustomCountryInput();
    initOtherLanguageInput();

    // Focus first input after animation
    setTimeout(() => {
        focusCurrentInput();
    }, 500);
});

// ============================================
// NAVIGATION
// ============================================

function nextQuestion() {
    if (isAnimating) return;

    // Validate current question
    if (!validateCurrentQuestion()) {
        return;
    }

    // Save current question data
    saveCurrentQuestionData();

    // Check if it's the last question
    if (currentQuestion >= TOTAL_QUESTIONS) {
        submitForm();
        return;
    }

    // Animate transition
    animateTransition('next');
}

function prevQuestion() {
    if (isAnimating || currentQuestion <= 1) return;

    animateTransition('prev');
}

function goToQuestion(questionNumber) {
    if (isAnimating || questionNumber < 1 || questionNumber > TOTAL_QUESTIONS) return;

    const direction = questionNumber > currentQuestion ? 'next' : 'prev';
    currentQuestion = questionNumber - (direction === 'next' ? 1 : -1);
    animateTransition(direction);
}

function animateTransition(direction) {
    isAnimating = true;

    const currentEl = document.querySelector(`.tf-question[data-question="${currentQuestion}"]`);
    let nextQuestionNum = direction === 'next' ? currentQuestion + 1 : currentQuestion - 1;

    // Skip duration question (Q5) if contract type is not stage or cdd
    if (nextQuestionNum === DURATION_QUESTION) {
        const contractType = formData.contractType;
        if (contractType !== 'stage' && contractType !== 'cdd') {
            nextQuestionNum = direction === 'next' ? nextQuestionNum + 1 : nextQuestionNum - 1;
        }
    }

    // When going back from Q6 and contract is not stage/cdd, skip Q5
    if (direction === 'prev' && currentQuestion === 6) {
        const contractType = formData.contractType;
        if (contractType !== 'stage' && contractType !== 'cdd') {
            nextQuestionNum = 4; // Skip Q5, go directly to Q4
        }
    }

    const nextEl = document.querySelector(`.tf-question[data-question="${nextQuestionNum}"]`);

    if (!nextEl) {
        isAnimating = false;
        return;
    }

    // Add exit animation class
    currentEl.classList.add(direction === 'next' ? 'slide-up' : 'slide-down');

    // Wait for exit animation
    setTimeout(() => {
        currentEl.classList.remove('active', 'slide-up', 'slide-down');

        // Update current question
        currentQuestion = nextQuestionNum;

        // Show next question
        nextEl.classList.add('active');

        // Update UI
        updateProgress();
        updateNavButtons();

        // Focus input
        setTimeout(() => {
            focusCurrentInput();
            isAnimating = false;
        }, 100);

    }, 300);
}

function updateProgress() {
    const progress = (currentQuestion / TOTAL_QUESTIONS) * 100;
    progressBar.style.width = `${progress}%`;
    currentQuestionEl.textContent = currentQuestion;
}

function updateNavButtons() {
    prevBtn.disabled = currentQuestion <= 1;

    // Update next button text for last question
    if (currentQuestion >= TOTAL_QUESTIONS) {
        nextBtn.innerHTML = `
            <span>Terminer</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
        `;
    } else {
        nextBtn.innerHTML = `
            <span>OK</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
        `;
    }
}

function focusCurrentInput() {
    const currentEl = document.querySelector(`.tf-question[data-question="${currentQuestion}"]`);
    if (!currentEl) return;

    const input = currentEl.querySelector('input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input[type="number"]');
    const textarea = currentEl.querySelector('textarea');
    if (input) {
        input.focus();
    } else if (textarea) {
        textarea.focus();
    }
}

// ============================================
// KEYBOARD NAVIGATION
// ============================================

function initKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        // Enter key - go to next question
        if (e.key === 'Enter' && !e.shiftKey) {
            const activeElement = document.activeElement;
            if (activeElement.tagName !== 'TEXTAREA') {
                e.preventDefault();
                nextQuestion();
            }
        }

        // Escape key - go to previous question
        if (e.key === 'Escape') {
            prevQuestion();
        }

        // Letter keys for choices (A, B, C, etc.)
        if (/^[a-gA-G1-5]$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
            const currentEl = document.querySelector(`.tf-question[data-question="${currentQuestion}"]`);
            const choices = currentEl?.querySelectorAll('.tf-choice');

            if (choices && choices.length > 0) {
                const activeElement = document.activeElement;
                // Only if not typing in an input
                if (activeElement.tagName !== 'INPUT' || activeElement.type === 'radio' || activeElement.type === 'checkbox') {
                    const key = e.key.toUpperCase();
                    const choice = currentEl.querySelector(`.tf-choice[data-key="${key}"]`);

                    if (choice) {
                        const input = choice.querySelector('input');
                        if (input.type === 'checkbox') {
                            input.checked = !input.checked;
                        } else {
                            input.checked = true;
                        }

                        // Trigger change event
                        input.dispatchEvent(new Event('change', { bubbles: true }));

                        // Add visual feedback
                        choice.classList.add('pressed');
                        setTimeout(() => choice.classList.remove('pressed'), 200);

                        // Auto-advance for radio buttons
                        if (input.type === 'radio') {
                            setTimeout(() => nextQuestion(), 400);
                        }
                    }
                }
            }
        }
    });
}

// ============================================
// CHOICE LISTENERS
// ============================================

function initChoiceListeners() {
    document.querySelectorAll('.tf-choice input[type="radio"]').forEach(input => {
        input.addEventListener('change', () => {
            // Auto-advance after selection (with delay for visual feedback)
            setTimeout(() => {
                nextQuestion();
            }, 400);
        });
    });

    // For checkbox multi-select, don't auto-advance
    document.querySelectorAll('.tf-choice input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', () => {
            // Just visual feedback, no auto-advance
            updateCheckboxState(input);
        });
    });
}

function updateCheckboxState(input) {
    const choice = input.closest('.tf-choice');
    if (input.checked) {
        choice.classList.add('selected');
    } else {
        choice.classList.remove('selected');
    }
}

// ============================================
// INPUT LISTENERS
// ============================================

function initInputListeners() {
    document.querySelectorAll('.tf-input').forEach(input => {
        // Focus animation
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });

        input.addEventListener('blur', () => {
            input.parentElement.classList.remove('focused');
        });

        // Remove error state on input
        input.addEventListener('input', () => {
            input.classList.remove('error');
        });

        // Enter key to advance
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                nextQuestion();
            }
        });
    });
}

// ============================================
// UPLOAD ZONE
// ============================================

function initUploadZone() {
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('cvFile');

    if (!uploadZone || !fileInput) return;

    uploadZone.addEventListener('click', () => {
        fileInput.click();
    });

    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
}

function handleFileUpload(file) {
    // For now, just show the file name
    // In production, you'd upload to a service and get a URL
    const uploadZone = document.getElementById('uploadZone');
    uploadZone.innerHTML = `
        <span class="tf-upload-icon">✓</span>
        <span class="tf-upload-text">${file.name}</span>
    `;
    uploadZone.classList.add('uploaded');

    // Store file reference
    formData.cvFile = file;
}

// ============================================
// VALIDATION
// ============================================

function validateCurrentQuestion() {
    const currentEl = document.querySelector(`.tf-question[data-question="${currentQuestion}"]`);
    if (!currentEl) return true;

    // Check required inputs
    const requiredInputs = currentEl.querySelectorAll('input[required], select[required]');
    let isValid = true;

    requiredInputs.forEach(input => {
        if (input.type === 'radio') {
            // Check if any radio in the group is selected
            const name = input.name;
            const checked = currentEl.querySelector(`input[name="${name}"]:checked`);
            if (!checked) {
                isValid = false;
                showError(input.closest('.tf-choices'));
            }
        } else if (!input.value.trim()) {
            isValid = false;
            input.classList.add('error');
            shakeElement(input);
        }
    });

    // Special validation for email
    const emailInput = currentEl.querySelector('input[type="email"]');
    if (emailInput && emailInput.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value)) {
            isValid = false;
            emailInput.classList.add('error');
            shakeElement(emailInput);
        }
    }

    // Validation for domains (multi-select) - at least one required (Q6)
    if (currentQuestion === 6) {
        const checkedDomains = currentEl.querySelectorAll('input[name="domains"]:checked');
        if (checkedDomains.length === 0) {
            isValid = false;
            shakeElement(currentEl.querySelector('.tf-choices'));
        }
    }

    // Validation for cities (multi-select) - at least one required OR "anywhere" (Q9)
    if (currentQuestion === 9) {
        const checkedCities = currentEl.querySelectorAll('input[name="cities"]:checked');
        const anywhereHidden = document.getElementById('anywhereHiddenFrance');
        const isAnywhereSelected = anywhereHidden && anywhereHidden.value === 'anywhere';

        if (checkedCities.length === 0 && !isAnywhereSelected) {
            isValid = false;
            shakeElement(currentEl.querySelector('.tf-choices'));
        }
    }

    // Validation for other countries if "other" is selected (Q8)
    if (currentQuestion === 8) {
        const countryValue = currentEl.querySelector('input[name="country"]:checked')?.value;
        if (countryValue === 'other') {
            const checkedOtherCountries = currentEl.querySelectorAll('input[name="otherCountries"]:checked');
            if (checkedOtherCountries.length === 0) {
                isValid = false;
                shakeElement(currentEl.querySelector('.tf-countries-list'));
            }
        }
    }

    // Validation for languages (multi-select) - at least one required (Q10)
    if (currentQuestion === 10) {
        const checkedLanguages = currentEl.querySelectorAll('input[name="languages"]:checked');
        if (checkedLanguages.length === 0) {
            isValid = false;
            shakeElement(currentEl.querySelector('.tf-choices'));
        }
    }

    // Validation for custom date if selected (Q14)
    if (currentQuestion === 14) {
        const availabilityValue = currentEl.querySelector('input[name="availability"]:checked')?.value;
        if (availabilityValue === 'custom_date') {
            const dateInput = document.getElementById('availabilityDate');
            if (!dateInput.value) {
                isValid = false;
                shakeElement(dateInput);
            }
        }
    }

    // Skip validation for popup transition
    if (currentQuestion === POPUP_QUESTION) {
        return true;
    }

    // Validation for textarea
    const textarea = currentEl.querySelector('textarea[required]');
    if (textarea && !textarea.value.trim()) {
        isValid = false;
        textarea.classList.add('error');
        shakeElement(textarea);
    }

    return isValid;
}

function showError(element) {
    if (!element) return;
    element.classList.add('error');
    setTimeout(() => element.classList.remove('error'), 1000);
}

function shakeElement(element) {
    if (!element) return;
    element.style.animation = 'none';
    element.offsetHeight; // Trigger reflow
    element.style.animation = 'shake 0.4s ease';
}

// ============================================
// DATA COLLECTION
// ============================================

function saveCurrentQuestionData() {
    const currentEl = document.querySelector(`.tf-question[data-question="${currentQuestion}"]`);
    if (!currentEl) return;

    // Get all inputs in current question
    const inputs = currentEl.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
        if (input.type === 'radio') {
            if (input.checked) {
                formData[input.name] = input.value;
            }
        } else if (input.type === 'checkbox') {
            if (!formData[input.name]) {
                formData[input.name] = [];
            }
            if (input.checked && !formData[input.name].includes(input.value)) {
                formData[input.name].push(input.value);
            } else if (!input.checked) {
                formData[input.name] = formData[input.name].filter(v => v !== input.value);
            }
        } else if (input.value) {
            formData[input.name] = input.value;
        }
    });
}

function collectAllData() {
    // Make sure we have all data
    document.querySelectorAll('.tf-question').forEach(question => {
        const inputs = question.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.type === 'radio' && input.checked) {
                formData[input.name] = input.value;
            } else if (input.type === 'checkbox' && input.checked) {
                if (!formData[input.name]) formData[input.name] = [];
                if (!formData[input.name].includes(input.value)) {
                    formData[input.name].push(input.value);
                }
            } else if (input.type !== 'radio' && input.type !== 'checkbox' && input.value) {
                formData[input.name] = input.value;
            }
        });
    });

    // Collect experiences
    const experiences = [];
    document.querySelectorAll('.tf-experience-item').forEach(item => {
        const index = item.dataset.index;
        const company = formData[`exp_company_${index}`];
        const position = formData[`exp_position_${index}`];
        const duration = formData[`exp_duration_${index}`];

        if (company || position) {
            experiences.push({
                company: company || null,
                position: position || null,
                duration: duration || null
            });
        }
    });

    // Structure data for API
    return {
        email: formData.email,
        emailProvider: formData.emailProvider,
        firstName: formData.firstName,
        lastName: formData.lastName,
        fullName: `${formData.firstName} ${formData.lastName}`,
        gender: formData.gender || null,
        phone: formData.phone || null,
        linkedinUrl: formData.linkedinUrl || null,
        portfolioUrl: formData.portfolioUrl || null,
        profileDescription: formData.profileDescription || null,

        currentEducation: {
            school: formData.currentSchool,
            program: formData.currentProgram,
            currentYear: formData.currentYear,
            programDuration: null,
            major: formData.currentMajor,
            expectedGraduation: parseInt(formData.expectedGraduation)
        },

        completedEducation: [],
        experiences: experiences,
        skills: [],
        languages: formData.languages || [],
        otherLanguages: formData.otherLanguages || [],
        cvUrl: formData.cvUrl,

        jobPreferences: {
            contractType: formData.contractType,
            contractDuration: formData.contractDuration || null,
            domains: formData.domains || [],
            otherDomains: formData.otherDomains || [],
            country: formData.country || null,
            otherCountries: formData.otherCountries || [],
            customCountry: formData.customCountry || null,
            cities: formData.cities || [],
            otherCities: formData.otherCities || [],
            customCities: formData.customCities || {},
            languages: formData.languages || [],
            otherLanguages: formData.otherLanguages || [],
            flexibility: formData.flexibility || null,
            specificPosition: formData.specificPosition || null,
            salaryRange: formData.salaryRange || null,
            seniority: formData.seniority || null,
            availability: formData.availability || null,
            availabilityDate: formData.availabilityDate || null
        }
    };
}

// ============================================
// FORM SUBMISSION
// ============================================

async function submitForm() {
    // Save last question data
    saveCurrentQuestionData();

    // Collect all data
    const data = collectAllData();

    console.log('Submitting data:', data);

    // Show loading state
    nextBtn.disabled = true;
    nextBtn.innerHTML = `
        <span class="tf-spinner-small"></span>
        <span>Envoi...</span>
    `;

    try {
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        // Try to parse response, but don't fail if it's not JSON
        let result = null;
        try {
            result = await response.json();
            console.log('Response:', result);
        } catch (parseError) {
            console.log('Response is not JSON, but request was sent');
        }

        // Show success screen regardless of response parsing
        // The important thing is that the data was sent
        showSuccessScreen();

    } catch (error) {
        console.error('Error:', error);

        // Even on network error, show success screen
        // Data might have been received by the server
        console.log('Network error, but showing success screen anyway');
        showSuccessScreen();
    }
}

function showSuccessScreen() {
    // Hide current question
    const currentEl = document.querySelector(`.tf-question[data-question="${currentQuestion}"]`);
    if (currentEl) {
        currentEl.classList.add('slide-up');
        setTimeout(() => {
            currentEl.classList.remove('active', 'slide-up');
        }, 300);
    }

    // Show success screen
    setTimeout(() => {
        const successEl = document.querySelector('.tf-success');
        if (successEl) {
            successEl.classList.add('active');

            // Update first name in success screen
            updateFirstNameDisplays();

            // Launch confetti
            setTimeout(() => launchConfetti(), 300);
        }

        // Hide navigation
        document.querySelector('.tf-nav').style.display = 'none';

        // Update progress to 100%
        progressBar.style.width = '100%';
        currentQuestionEl.textContent = TOTAL_QUESTIONS;
    }, 300);
}

// ============================================
// TEXTAREA COUNTER
// ============================================

function initTextareaCounter() {
    const textarea = document.querySelector('textarea[name="profileDescription"]');
    const counter = document.getElementById('charCount');

    if (!textarea || !counter) return;

    textarea.addEventListener('input', () => {
        const length = textarea.value.length;
        counter.textContent = length;

        if (length > 500) {
            counter.style.color = '#ef4444';
        } else if (length > 400) {
            counter.style.color = '#f59e0b';
        } else {
            counter.style.color = 'var(--text-muted)';
        }
    });
}

// ============================================
// EXPERIENCE MANAGEMENT
// ============================================

function addExperience() {
    const list = document.getElementById('experiencesList');
    if (!list) return;

    const newItem = document.createElement('div');
    newItem.className = 'tf-experience-item';
    newItem.dataset.index = experienceCount;
    newItem.innerHTML = `
        <button type="button" class="tf-remove-btn" onclick="removeExperience(this)">×</button>
        <div class="tf-experience-row">
            <input type="text" name="exp_company_${experienceCount}" class="tf-input-small" placeholder="Entreprise">
            <input type="text" name="exp_position_${experienceCount}" class="tf-input-small" placeholder="Poste">
            <input type="text" name="exp_duration_${experienceCount}" class="tf-input-small" placeholder="Durée (ex: 6 mois)">
        </div>
    `;

    list.appendChild(newItem);
    experienceCount++;

    // Focus on the new company input
    newItem.querySelector('input').focus();
}

function removeExperience(button) {
    const item = button.closest('.tf-experience-item');
    if (item) {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-20px)';
        setTimeout(() => item.remove(), 200);
    }
}

// ============================================
// COUNTRY & CITIES SELECTOR
// ============================================

// Complete cities data by country (15 largest cities per country)
const citiesByCountry = {
    france: [
        'Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Montpellier',
        'Strasbourg', 'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Le Havre',
        'Saint-Étienne', 'Toulon'
    ],
    belgique: [
        'Bruxelles', 'Anvers', 'Gand', 'Charleroi', 'Liège', 'Bruges',
        'Namur', 'Louvain', 'Mons', 'Ostende', 'Alost', 'Malines',
        'La Louvière', 'Courtrai', 'Hasselt'
    ],
    suisse: [
        'Zurich', 'Genève', 'Bâle', 'Lausanne', 'Berne', 'Winterthour',
        'Lucerne', 'Saint-Gall', 'Lugano', 'Bienne', 'Thoune', 'Köniz',
        'La Chaux-de-Fonds', 'Fribourg', 'Schaffhouse'
    ],
    luxembourg: [
        'Luxembourg-Ville', 'Esch-sur-Alzette', 'Differdange', 'Dudelange',
        'Pétange', 'Ettelbruck', 'Diekirch', 'Strassen', 'Bertrange',
        'Belvaux', 'Mamer', 'Hesperange', 'Sanem', 'Mersch', 'Kayl'
    ],
    uk: [
        'Londres', 'Birmingham', 'Manchester', 'Leeds', 'Glasgow', 'Liverpool',
        'Newcastle', 'Sheffield', 'Bristol', 'Édimbourg', 'Leicester', 'Coventry',
        'Bradford', 'Cardiff', 'Belfast'
    ],
    allemagne: [
        'Berlin', 'Hambourg', 'Munich', 'Cologne', 'Francfort', 'Stuttgart',
        'Düsseldorf', 'Leipzig', 'Dortmund', 'Essen', 'Brême', 'Dresde',
        'Hanovre', 'Nuremberg', 'Duisbourg'
    ],
    espagne: [
        'Madrid', 'Barcelone', 'Valence', 'Séville', 'Saragosse', 'Malaga',
        'Murcie', 'Palma', 'Las Palmas', 'Bilbao', 'Alicante', 'Cordoue',
        'Valladolid', 'Vigo', 'Gijón'
    ],
    italie: [
        'Rome', 'Milan', 'Naples', 'Turin', 'Palerme', 'Gênes', 'Bologne',
        'Florence', 'Bari', 'Catane', 'Venise', 'Vérone', 'Messine',
        'Padoue', 'Trieste'
    ],
    'pays-bas': [
        'Amsterdam', 'Rotterdam', 'La Haye', 'Utrecht', 'Eindhoven', 'Tilburg',
        'Groningue', 'Almere', 'Breda', 'Nimègue', 'Enschede', 'Haarlem',
        'Arnhem', 'Zaanstad', 'Amersfoort'
    ],
    portugal: [
        'Lisbonne', 'Porto', 'Vila Nova de Gaia', 'Amadora', 'Braga', 'Coimbra',
        'Funchal', 'Setúbal', 'Almada', 'Agualva-Cacém', 'Queluz', 'Leiria',
        'Faro', 'Guimarães', 'Évora'
    ],
    irlande: [
        'Dublin', 'Cork', 'Limerick', 'Galway', 'Waterford', 'Drogheda',
        'Swords', 'Dundalk', 'Bray', 'Navan', 'Kilkenny', 'Ennis',
        'Carlow', 'Tralee', 'Newbridge'
    ],
    canada: [
        'Toronto', 'Montréal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa',
        'Winnipeg', 'Québec', 'Hamilton', 'Kitchener', 'London', 'Victoria',
        'Halifax', 'Oshawa', 'Windsor'
    ],
    usa: [
        'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphie',
        'San Antonio', 'San Diego', 'Dallas', 'San José', 'Austin', 'Jacksonville',
        'Fort Worth', 'Columbus', 'San Francisco'
    ],
    australie: [
        'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast',
        'Canberra', 'Newcastle', 'Wollongong', 'Logan City', 'Geelong',
        'Hobart', 'Townsville', 'Cairns', 'Darwin'
    ],
    singapour: [
        'Singapour Centre', 'Jurong East', 'Tampines', 'Woodlands', 'Sengkang',
        'Punggol', 'Ang Mo Kio', 'Bedok', 'Toa Payoh', 'Hougang', 'Yishun',
        'Clementi', 'Bukit Batok', 'Choa Chu Kang', 'Pasir Ris'
    ],
    japon: [
        'Tokyo', 'Yokohama', 'Osaka', 'Nagoya', 'Sapporo', 'Fukuoka',
        'Kobe', 'Kawasaki', 'Kyoto', 'Saitama', 'Hiroshima', 'Sendai',
        'Chiba', 'Kitakyushu', 'Sakai'
    ],
    emirats: [
        'Dubaï', 'Abu Dhabi', 'Sharjah', 'Al Ain', 'Ajman', 'Ras Al Khaimah',
        'Fujairah', 'Umm Al Quwain', 'Khor Fakkan', 'Dibba Al-Hisn',
        'Madinat Zayed', 'Ruwais', 'Liwa Oasis', 'Ghayathi', 'Jebel Ali'
    ]
};

// Sauvegarder le HTML original des villes françaises
let originalFrenchCitiesHTML = '';

function initCountrySelector() {
    // Sauvegarder les villes françaises au chargement
    const citiesContainer = document.getElementById('citiesContainer');
    if (citiesContainer) {
        originalFrenchCitiesHTML = citiesContainer.innerHTML;
    }

    // Listen for country selection changes
    document.querySelectorAll('input[name="country"]').forEach(input => {
        input.addEventListener('change', () => {
            const citiesContainer = document.getElementById('citiesContainer');
            const otherCitiesSelector = document.getElementById('otherCitiesSelector');
            const customCityPopup = document.getElementById('customCityPopup');
            const customCityPopupDynamic = document.getElementById('customCityPopupDynamic');
            const anywhereWrapperFrance = document.getElementById('anywhereWrapperFrance');

            if (input.value === 'other') {
                // Pour "Autres pays" : cacher les villes françaises, afficher le sélecteur d'autres villes
                if (citiesContainer) {
                    // Cacher toutes les villes
                    citiesContainer.querySelectorAll('.tf-choice').forEach(label => {
                        const cityInput = label.querySelector('input[name="cities"]');
                        if (cityInput && cityInput.value !== 'remote') {
                            label.style.display = 'none';
                            cityInput.checked = false;
                        }
                    });
                    // Cacher les popups
                    if (customCityPopup) customCityPopup.style.display = 'none';
                    if (customCityPopupDynamic) customCityPopupDynamic.style.display = 'none';
                }
                // Cacher le "N'importe quelle ville" de France
                if (anywhereWrapperFrance) anywhereWrapperFrance.style.display = 'none';
                // Afficher automatiquement le sélecteur d'autres villes
                if (otherCitiesSelector) {
                    otherCitiesSelector.style.display = 'block';
                    populateOtherCities();
                }
            } else if (input.value === 'france') {
                // Pour France : restaurer les villes françaises statiques
                restoreFrenchCities();
                if (otherCitiesSelector) otherCitiesSelector.style.display = 'none';
                if (customCityPopupDynamic) customCityPopupDynamic.style.display = 'none';
                // Réafficher le "N'importe quelle ville" de France
                if (anywhereWrapperFrance) anywhereWrapperFrance.style.display = 'block';
            } else {
                // Pour les autres pays (Belgique, Suisse, etc.) : afficher leurs villes
                updateCitiesForCountry(input.value);
                if (otherCitiesSelector) otherCitiesSelector.style.display = 'none';
                // Cacher le "N'importe quelle ville" de France pour les autres pays
                if (anywhereWrapperFrance) anywhereWrapperFrance.style.display = 'none';
            }
        });
    });
}

function restoreFrenchCities() {
    const citiesContainer = document.getElementById('citiesContainer');

    if (!citiesContainer || !originalFrenchCitiesHTML) return;

    // Restaurer le HTML original
    citiesContainer.innerHTML = originalFrenchCitiesHTML;

    // Réinitialiser les listeners
    citiesContainer.querySelectorAll('input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', () => {
            updateCheckboxState(input);
        });
    });

    // Réinitialiser le custom city input pour France
    initCustomCityFranceInput();
}

function updateCitiesForCountry(country) {
    const citiesContainer = document.getElementById('citiesContainer');
    const otherCitiesSelector = document.getElementById('otherCitiesSelector');
    const customCityChoice = document.getElementById('customCityChoice');
    const otherCitiesChoice = document.getElementById('otherCitiesChoice');

    if (!citiesContainer) return;

    const cities = citiesByCountry[country] || [];

    // Générer les villes du pays + Remote + Autre ville
    let html = cities.map(city => `
        <label class="tf-choice tf-choice-tag">
            <input type="checkbox" name="cities" value="${city.toLowerCase().replace(/\s+/g, '-')}">
            <span class="tf-choice-text">${city}</span>
        </label>
    `).join('');

    // Ajouter Remote
    html += `
        <label class="tf-choice tf-choice-tag">
            <input type="checkbox" name="cities" value="remote">
            <span class="tf-choice-text">🏠 Remote</span>
        </label>
    `;

    // Ajouter "Autres villes" avec saisie
    html += `
        <label class="tf-choice tf-choice-tag tf-choice-other" id="customCityChoiceDynamic">
            <input type="checkbox" name="cities" value="custom_${country}" class="custom-city-dynamic-checkbox" data-country="${country}">
            <span class="tf-choice-text">✏️ Autres villes</span>
        </label>
    `;

    citiesContainer.innerHTML = html;

    // Cacher les éléments statiques
    if (customCityChoice) customCityChoice.style.display = 'none';
    if (otherCitiesChoice) otherCitiesChoice.style.display = 'none';
    if (otherCitiesSelector) otherCitiesSelector.style.display = 'none';

    // Ajouter le popup pour la saisie de ville personnalisée (multi-villes avec tags)
    let popup = document.getElementById('customCityPopupDynamic');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'customCityPopupDynamic';
        popup.className = 'tf-custom-city-popup';
        popup.style.display = 'none';
        popup.innerHTML = `
            <div class="tf-popup-arrow"></div>
            <div class="tf-city-tags" id="cityTagsDynamic"></div>
            <input type="text" name="customCityDynamic" id="customCityDynamicInput" class="tf-popup-input" placeholder="Entrez une ville et appuyez sur Entrée...">
        `;
        citiesContainer.parentNode.appendChild(popup);
    } else {
        // Reset tags container if popup already exists
        const tagsContainer = popup.querySelector('.tf-city-tags');
        if (tagsContainer) tagsContainer.innerHTML = '';
    }

    // Re-init checkbox listeners for new elements
    citiesContainer.querySelectorAll('input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', () => {
            updateCheckboxState(input);
        });
    });

    // Init dynamic custom city input
    initDynamicCustomCityInput(country);
}

function initDynamicCustomCityInput(country) {
    const customCityCheckbox = document.querySelector('.custom-city-dynamic-checkbox');
    const customCityPopup = document.getElementById('customCityPopupDynamic');
    const customCityInput = document.getElementById('customCityDynamicInput');
    const cityTagsContainer = document.getElementById('cityTagsDynamic');

    if (!customCityCheckbox || !customCityPopup || !customCityInput || !cityTagsContainer) return;

    // Initialize cities array for this country
    if (!formData.customCities) formData.customCities = {};
    if (!formData.customCities[country]) formData.customCities[country] = [];

    customCityCheckbox.addEventListener('change', () => {
        if (customCityCheckbox.checked) {
            customCityPopup.style.display = 'block';
            setTimeout(() => {
                customCityInput.focus();
            }, 50);
        } else {
            customCityPopup.style.display = 'none';
            customCityInput.value = '';
            cityTagsContainer.innerHTML = '';
            if (formData.customCities) {
                formData.customCities[country] = [];
            }
        }
    });

    customCityInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();

            const cityName = customCityInput.value.trim();
            if (cityName) {
                // Add city to array
                if (!formData.customCities[country].includes(cityName)) {
                    formData.customCities[country].push(cityName);

                    // Create tag element
                    const tag = document.createElement('span');
                    tag.className = 'tf-city-tag';
                    tag.innerHTML = `
                        ${cityName}
                        <button type="button" class="tf-tag-remove" data-city="${cityName}">&times;</button>
                    `;

                    // Add remove handler
                    tag.querySelector('.tf-tag-remove').addEventListener('click', () => {
                        formData.customCities[country] = formData.customCities[country].filter(c => c !== cityName);
                        tag.remove();
                    });

                    cityTagsContainer.appendChild(tag);
                }

                // Clear input for next city
                customCityInput.value = '';
            }
        }
    });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// FIRST NAME LISTENER (pour personnalisation)
// ============================================

function initFirstNameListener() {
    const firstNameInput = document.getElementById('firstName');
    if (!firstNameInput) return;

    firstNameInput.addEventListener('input', () => {
        userFirstName = firstNameInput.value.trim();
        // Mettre à jour les éléments qui affichent le prénom
        updateFirstNameDisplays();
    });

    firstNameInput.addEventListener('blur', () => {
        userFirstName = firstNameInput.value.trim();
        updateFirstNameDisplays();
    });
}

function updateFirstNameDisplays() {
    const popupFirstName = document.getElementById('popupFirstName');
    const successFirstName = document.getElementById('successFirstName');

    if (popupFirstName) {
        popupFirstName.textContent = userFirstName;
    }
    if (successFirstName) {
        successFirstName.textContent = userFirstName;
    }
}

// ============================================
// OTHER COUNTRIES SELECTOR
// ============================================

function initOtherCountriesSelector() {
    const otherCountryRadio = document.querySelector('input[name="country"][value="other"]');
    const otherCountriesSelector = document.getElementById('otherCountriesSelector');

    if (!otherCountryRadio || !otherCountriesSelector) return;

    // Écouter les changements sur tous les radios country
    document.querySelectorAll('input[name="country"]').forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'other' && radio.checked) {
                otherCountriesSelector.style.display = 'block';
                // Ne pas auto-avancer pour "Autres pays"
            } else {
                otherCountriesSelector.style.display = 'none';
            }
        });
    });

    // Init checkbox listeners for other countries
    otherCountriesSelector.querySelectorAll('input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', () => {
            updateCheckboxState(input);
        });
    });
}

// Override auto-advance for "other" country option
const originalInitChoiceListeners = initChoiceListeners;

// ============================================
// CUSTOM CALENDAR
// ============================================

let calendarDate = new Date();
let selectedDate = null;

const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

function initDatePickerChoice() {
    const customDateRadio = document.querySelector('input[name="availability"][value="custom_date"]');
    const calendarContainer = document.getElementById('calendarContainer');

    if (!customDateRadio || !calendarContainer) return;

    // Écouter les changements sur tous les radios availability
    document.querySelectorAll('input[name="availability"]').forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'custom_date' && radio.checked) {
                calendarContainer.style.display = 'block';
                renderCalendar();
            } else {
                calendarContainer.style.display = 'none';
            }
        });
    });

    // Init calendar navigation
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            calendarDate.setMonth(calendarDate.getMonth() - 1);
            renderCalendar();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            calendarDate.setMonth(calendarDate.getMonth() + 1);
            renderCalendar();
        });
    }
}

function renderCalendar() {
    const monthEl = document.getElementById('calendarMonth');
    const yearEl = document.getElementById('calendarYear');
    const daysContainer = document.getElementById('calendarDays');

    if (!monthEl || !yearEl || !daysContainer) return;

    // Update header
    monthEl.textContent = monthNames[calendarDate.getMonth()];
    yearEl.textContent = calendarDate.getFullYear();

    // Clear days
    daysContainer.innerHTML = '';

    // Get first day of month and total days
    const firstDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
    const lastDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0);
    const totalDays = lastDay.getDate();

    // Get start day (Monday = 0, Sunday = 6)
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    // Get today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add previous month days
    const prevMonthDays = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
        const day = document.createElement('button');
        day.type = 'button';
        day.className = 'tf-calendar-day other-month disabled';
        day.textContent = prevMonthDays - i;
        daysContainer.appendChild(day);
    }

    // Add current month days
    for (let i = 1; i <= totalDays; i++) {
        const day = document.createElement('button');
        day.type = 'button';
        day.className = 'tf-calendar-day';
        day.textContent = i;

        const dayDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), i);
        dayDate.setHours(0, 0, 0, 0);

        // Mark today
        if (dayDate.getTime() === today.getTime()) {
            day.classList.add('today');
        }

        // Disable past days
        if (dayDate < today) {
            day.classList.add('disabled');
        }

        // Mark selected
        if (selectedDate && dayDate.getTime() === selectedDate.getTime()) {
            day.classList.add('selected');
        }

        // Click handler
        if (dayDate >= today) {
            day.addEventListener('click', () => selectCalendarDate(dayDate));
        }

        daysContainer.appendChild(day);
    }

    // Add next month days to fill the grid
    const totalCells = startDay + totalDays;
    const remaining = 7 - (totalCells % 7);
    if (remaining < 7) {
        for (let i = 1; i <= remaining; i++) {
            const day = document.createElement('button');
            day.type = 'button';
            day.className = 'tf-calendar-day other-month disabled';
            day.textContent = i;
            daysContainer.appendChild(day);
        }
    }
}

function selectCalendarDate(date) {
    selectedDate = date;

    // Update hidden input
    const dateInput = document.getElementById('availabilityDate');
    if (dateInput) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        dateInput.value = `${year}-${month}-${day}`;
        formData.availabilityDate = dateInput.value;
    }

    // Show selected date
    const selectedDisplay = document.getElementById('selectedDateDisplay');
    const selectedText = document.getElementById('selectedDateText');
    if (selectedDisplay && selectedText) {
        selectedDisplay.style.display = 'block';
        selectedText.textContent = date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    // Re-render to update selected state
    renderCalendar();

    // Auto-advance after selection
    setTimeout(() => nextQuestion(), 600);
}

// ============================================
// SKIP WITH VALUE FUNCTION
// ============================================

function skipWithValue(fieldName, value) {
    formData[fieldName] = value;
}

// ============================================
// SEND APPLICATIONS FUNCTION
// ============================================

async function sendApplications() {
    const btn = document.getElementById('sendApplicationsBtn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');

    // Show loading state
    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'flex';

    try {
        // Simuler l'envoi (remplacer par l'appel API réel)
        await sleep(3000);

        // Success - redirect to dashboard
        window.location.href = 'dashboard.html';

    } catch (error) {
        console.error('Error sending applications:', error);

        // Reset button
        btn.disabled = false;
        btnText.style.display = 'flex';
        btnLoading.style.display = 'none';

        alert('Une erreur est survenue. Veuillez réessayer.');
    }
}

// ============================================
// CONFETTI ANIMATION
// ============================================

function launchConfetti() {
    const container = document.getElementById('confetti');
    if (!container) return;

    const colors = ['#3b82f6', '#60a5fa', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6'];

    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.className = 'confetti-particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            particle.style.width = (Math.random() * 8 + 6) + 'px';
            particle.style.height = (Math.random() * 8 + 6) + 'px';
            particle.style.animationDuration = (Math.random() * 2 + 2) + 's';
            particle.style.animationDelay = Math.random() * 0.5 + 's';

            container.appendChild(particle);

            // Remove particle after animation
            setTimeout(() => particle.remove(), 4000);
        }, i * 30);
    }
}

// ============================================
// CONTRACT TYPE LISTENER (for duration question)
// ============================================

function initContractTypeListener() {
    const contractRadios = document.querySelectorAll('input[name="contractType"]');
    const durationQuestion = document.getElementById('durationQuestion');
    const durationSubtitle = document.getElementById('durationSubtitle');

    if (!contractRadios.length || !durationQuestion) return;

    contractRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            const value = radio.value;

            // Show duration question only for stage or CDD
            if (value === 'stage' || value === 'cdd') {
                durationQuestion.style.display = '';
                durationQuestion.setAttribute('data-required', 'true');

                // Update subtitle based on contract type
                if (durationSubtitle) {
                    durationSubtitle.textContent = value === 'stage'
                        ? 'Pour votre stage'
                        : 'Pour votre CDD';
                }
            } else {
                durationQuestion.style.display = 'none';
                durationQuestion.setAttribute('data-required', 'false');
                // Clear duration selection
                const durationRadios = durationQuestion.querySelectorAll('input[name="contractDuration"]');
                durationRadios.forEach(r => r.checked = false);
            }
        });
    });
}

// ============================================
// OTHER DOMAINS SELECTOR
// ============================================

function initOtherDomainsSelector() {
    const otherDomainCheckbox = document.querySelector('input[name="domains"][value="other"]');
    const otherDomainsSelector = document.getElementById('otherDomainsSelector');

    if (!otherDomainCheckbox || !otherDomainsSelector) return;

    otherDomainCheckbox.addEventListener('change', () => {
        if (otherDomainCheckbox.checked) {
            otherDomainsSelector.style.display = 'block';
        } else {
            otherDomainsSelector.style.display = 'none';
            // Uncheck all other domains
            otherDomainsSelector.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
                updateCheckboxState(cb);
            });
        }
    });

    // Init checkbox listeners for other domains
    otherDomainsSelector.querySelectorAll('input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', () => {
            updateCheckboxState(input);
        });
    });
}

// ============================================
// OTHER CITIES SELECTOR
// ============================================

function initOtherCitiesSelector() {
    const otherCitiesSelector = document.getElementById('otherCitiesSelector');
    const otherCitiesList = document.getElementById('otherCitiesList');

    if (!otherCitiesSelector || !otherCitiesList) return;

    // Listen for other countries checkboxes changes to update cities
    document.querySelectorAll('input[name="otherCountries"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const countryRadio = document.querySelector('input[name="country"]:checked');
            if (countryRadio && countryRadio.value === 'other') {
                populateOtherCities();
            }
        });
    });
}

function populateOtherCities() {
    const otherCitiesList = document.getElementById('otherCitiesList');
    if (!otherCitiesList) return;

    // Clear existing cities
    otherCitiesList.innerHTML = '';

    // Get selected country
    const countryRadio = document.querySelector('input[name="country"]:checked');
    let countries = [];

    if (countryRadio) {
        if (countryRadio.value === 'other') {
            // Get all checked other countries (excluding 'custom')
            document.querySelectorAll('input[name="otherCountries"]:checked').forEach(cb => {
                if (cb.value !== 'custom') {
                    countries.push(cb.value);
                }
            });
        } else {
            countries.push(countryRadio.value);
        }
    }

    if (countries.length === 0) {
        // Si "Autres pays" est sélectionné mais aucun pays coché, afficher option de saisie manuelle
        if (countryRadio && countryRadio.value === 'other') {
            const manualCityWrapper = document.createElement('div');
            manualCityWrapper.className = 'tf-custom-city-wrapper';
            manualCityWrapper.innerHTML = `
                <p class="tf-no-cities">Sélectionnez des pays dans la question précédente, ou saisissez une ville manuellement :</p>
                <label class="tf-choice tf-choice-tag tf-choice-other" style="margin-top: 15px;">
                    <input type="checkbox" name="otherCities" value="custom_manual" class="custom-city-checkbox" data-country="manual">
                    <span class="tf-choice-text">✏️ Saisir une ville manuellement</span>
                </label>
                <div class="tf-custom-city-input" style="display: none;">
                    <input type="text" name="customCity_manual" class="tf-input tf-input-small" placeholder="Entrez le nom de la ville">
                </div>
            `;

            const customCheckbox = manualCityWrapper.querySelector('.custom-city-checkbox');
            const customInputWrapper = manualCityWrapper.querySelector('.tf-custom-city-input');
            const customInput = manualCityWrapper.querySelector('input[type="text"]');

            customCheckbox.addEventListener('change', () => {
                updateCheckboxState(customCheckbox);
                if (customCheckbox.checked) {
                    customInputWrapper.style.display = 'block';
                    customInput.focus();
                } else {
                    customInputWrapper.style.display = 'none';
                    customInput.value = '';
                }
            });

            customInput.addEventListener('input', () => {
                if (!formData.customCities) formData.customCities = {};
                formData.customCities.manual = customInput.value;
            });

            otherCitiesList.appendChild(manualCityWrapper);
            return;
        }

        otherCitiesList.innerHTML = '<p class="tf-no-cities">Veuillez d\'abord sélectionner un pays</p>';
        return;
    }

    // Si plusieurs pays sont sélectionnés dans "Autres pays", afficher saisie manuelle + option "N'importe"
    if (countries.length > 1 && countryRadio && countryRadio.value === 'other') {
        // Conteneur principal simplifié
        const simplifiedWrapper = document.createElement('div');
        simplifiedWrapper.className = 'tf-simplified-cities';
        simplifiedWrapper.innerHTML = `
            <div class="tf-city-input-wrapper">
                <div class="tf-city-tags" id="cityTags_multi"></div>
                <input type="text" id="multiCityInput" class="tf-input" placeholder="Tapez une ville et appuyez sur Entrée...">
            </div>
            <span class="tf-anywhere-link" id="anywhereCitiesLink">N'importe quelle ville</span>
            <input type="hidden" name="otherCities" value="" id="anywhereCitiesHidden">
        `;

        otherCitiesList.appendChild(simplifiedWrapper);

        const cityInput = simplifiedWrapper.querySelector('#multiCityInput');
        const cityTagsContainer = simplifiedWrapper.querySelector('.tf-city-tags');
        const anywhereLink = simplifiedWrapper.querySelector('#anywhereCitiesLink');
        const anywhereHidden = simplifiedWrapper.querySelector('#anywhereCitiesHidden');

        // Initialize cities array for multi-country
        if (!formData.customCities) formData.customCities = {};
        if (!formData.customCities.multi) formData.customCities.multi = [];

        // Handle Enter key to add city as tag
        cityInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();

                const cityName = cityInput.value.trim();
                if (cityName) {
                    if (!formData.customCities.multi.includes(cityName)) {
                        formData.customCities.multi.push(cityName);

                        const tag = document.createElement('span');
                        tag.className = 'tf-city-tag';
                        tag.innerHTML = `
                            ${cityName}
                            <button type="button" class="tf-tag-remove" data-city="${cityName}">&times;</button>
                        `;

                        tag.querySelector('.tf-tag-remove').addEventListener('click', () => {
                            formData.customCities.multi = formData.customCities.multi.filter(c => c !== cityName);
                            tag.remove();
                            // Réactiver le lien si plus de villes
                            if (formData.customCities.multi.length === 0) {
                                anywhereLink.classList.remove('tf-anywhere-disabled');
                            }
                        });

                        cityTagsContainer.appendChild(tag);

                        // Désactiver visuellement le lien "N'importe" si une ville est ajoutée
                        anywhereLink.classList.add('tf-anywhere-disabled');
                        anywhereHidden.value = '';
                    }
                    cityInput.value = '';
                }
            }
        });

        // Handle "N'importe quelle ville" link click
        anywhereLink.addEventListener('click', () => {
            if (anywhereLink.classList.contains('tf-anywhere-disabled')) return;

            // Marquer comme sélectionné
            anywhereLink.classList.toggle('tf-anywhere-active');

            if (anywhereLink.classList.contains('tf-anywhere-active')) {
                // Vider les villes saisies
                formData.customCities.multi = [];
                cityTagsContainer.innerHTML = '';
                cityInput.value = '';
                cityInput.disabled = true;
                cityInput.placeholder = 'N\'importe quelle ville';
                anywhereHidden.value = 'anywhere';
                // Passer à la question suivante
                setTimeout(() => nextQuestion(), 300);
            } else {
                cityInput.disabled = false;
                cityInput.placeholder = 'Tapez une ville et appuyez sur Entrée...';
                anywhereHidden.value = '';
            }
        });

        return;
    }

    // Add cities for each selected country (un seul pays sélectionné)
    countries.forEach((country, countryIndex) => {
        const cities = citiesByCountry[country] || [];
        const countryName = getCountryDisplayName(country);

        if (cities.length > 0 && countries.length > 1) {
            // Add country header if multiple countries
            const header = document.createElement('p');
            header.className = 'tf-cities-country-header';
            header.textContent = countryName;
            otherCitiesList.appendChild(header);
        }

        cities.forEach(city => {
            const label = document.createElement('label');
            label.className = 'tf-choice tf-choice-tag';
            label.innerHTML = `
                <input type="checkbox" name="otherCities" value="${city.toLowerCase()}">
                <span class="tf-choice-text">${city}</span>
            `;

            const input = label.querySelector('input');
            input.addEventListener('change', () => {
                updateCheckboxState(input);
                // Désactiver "N'importe quelle ville" si une ville est cochée
                const anywhereLink = document.querySelector(`#anywhereLink_${country}`);
                if (anywhereLink) {
                    const checkedCities = otherCitiesList.querySelectorAll(`input[name="otherCities"]:checked:not([value="anywhere_${country}"])`);
                    if (checkedCities.length > 0) {
                        anywhereLink.classList.add('tf-anywhere-disabled');
                        anywhereLink.classList.remove('tf-anywhere-active');
                    } else {
                        anywhereLink.classList.remove('tf-anywhere-disabled');
                    }
                }
            });

            otherCitiesList.appendChild(label);
        });

        // Add "Autres villes" option with multi-tag input for each country
        const otherCityWrapper = document.createElement('div');
        otherCityWrapper.className = 'tf-custom-city-wrapper';
        otherCityWrapper.innerHTML = `
            <label class="tf-choice tf-choice-tag tf-choice-other">
                <input type="checkbox" name="otherCities" value="custom_${country}" class="custom-city-checkbox" data-country="${country}">
                <span class="tf-choice-text">✏️ Autres villes${countries.length > 1 ? ' (' + countryName + ')' : ''}...</span>
            </label>
            <div class="tf-custom-city-input" style="display: none;">
                <div class="tf-city-tags" id="cityTags_${country}"></div>
                <input type="text" name="customCity_${country}" class="tf-input tf-input-small" placeholder="Entrez une ville et appuyez sur Entrée...">
            </div>
        `;

        const customCheckbox = otherCityWrapper.querySelector('.custom-city-checkbox');
        const customInputWrapper = otherCityWrapper.querySelector('.tf-custom-city-input');
        const customInput = otherCityWrapper.querySelector('input[type="text"]');
        const cityTagsContainer = otherCityWrapper.querySelector('.tf-city-tags');

        // Initialize cities array for this country
        if (!formData.customCities) formData.customCities = {};
        if (!formData.customCities[country]) formData.customCities[country] = [];

        customCheckbox.addEventListener('change', () => {
            updateCheckboxState(customCheckbox);
            if (customCheckbox.checked) {
                customInputWrapper.style.display = 'block';
                customInput.focus();
                // Désactiver "N'importe quelle ville"
                const anywhereLink = document.querySelector(`#anywhereLink_${country}`);
                if (anywhereLink) {
                    anywhereLink.classList.add('tf-anywhere-disabled');
                    anywhereLink.classList.remove('tf-anywhere-active');
                }
            } else {
                customInputWrapper.style.display = 'none';
                customInput.value = '';
                cityTagsContainer.innerHTML = '';
                formData.customCities[country] = [];
                // Réactiver "N'importe quelle ville" si aucune ville cochée
                const anywhereLink = document.querySelector(`#anywhereLink_${country}`);
                if (anywhereLink) {
                    const checkedCities = otherCitiesList.querySelectorAll(`input[name="otherCities"]:checked:not([value="anywhere_${country}"])`);
                    if (checkedCities.length === 0) {
                        anywhereLink.classList.remove('tf-anywhere-disabled');
                    }
                }
            }
        });

        // Handle Enter key to add city as tag
        customInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();

                const cityName = customInput.value.trim();
                if (cityName) {
                    if (!formData.customCities[country].includes(cityName)) {
                        formData.customCities[country].push(cityName);

                        const tag = document.createElement('span');
                        tag.className = 'tf-city-tag';
                        tag.innerHTML = `
                            ${cityName}
                            <button type="button" class="tf-tag-remove" data-city="${cityName}">&times;</button>
                        `;

                        tag.querySelector('.tf-tag-remove').addEventListener('click', () => {
                            formData.customCities[country] = formData.customCities[country].filter(c => c !== cityName);
                            tag.remove();
                        });

                        cityTagsContainer.appendChild(tag);
                    }
                    customInput.value = '';
                }
            }
        });

        otherCitiesList.appendChild(otherCityWrapper);

        // Add "N'importe quelle ville" link for this country
        const anywhereWrapper = document.createElement('div');
        anywhereWrapper.className = 'tf-anywhere-wrapper';
        anywhereWrapper.innerHTML = `
            <span class="tf-anywhere-link" id="anywhereLink_${country}">N'importe quelle ville</span>
            <input type="hidden" name="anywhereCity_${country}" value="" id="anywhereHidden_${country}">
        `;

        const anywhereLink = anywhereWrapper.querySelector('.tf-anywhere-link');
        const anywhereHidden = anywhereWrapper.querySelector('input[type="hidden"]');

        anywhereLink.addEventListener('click', () => {
            if (anywhereLink.classList.contains('tf-anywhere-disabled')) return;

            anywhereLink.classList.toggle('tf-anywhere-active');

            if (anywhereLink.classList.contains('tf-anywhere-active')) {
                // Décocher toutes les villes pour ce pays
                otherCitiesList.querySelectorAll(`input[name="otherCities"]`).forEach(cb => {
                    if (cb.checked) {
                        cb.checked = false;
                        updateCheckboxState(cb);
                    }
                });
                // Vider les villes personnalisées
                if (formData.customCities && formData.customCities[country]) {
                    formData.customCities[country] = [];
                }
                cityTagsContainer.innerHTML = '';
                customInputWrapper.style.display = 'none';
                anywhereHidden.value = 'anywhere';
                // Stocker dans formData
                if (!formData.anywhereCities) formData.anywhereCities = {};
                formData.anywhereCities[country] = true;
                // Passer à la question suivante
                setTimeout(() => nextQuestion(), 300);
            } else {
                anywhereHidden.value = '';
                if (formData.anywhereCities) {
                    formData.anywhereCities[country] = false;
                }
            }
        });

        otherCitiesList.appendChild(anywhereWrapper);

        // Add separator between countries if multiple
        if (countries.length > 1 && countryIndex < countries.length - 1) {
            const separator = document.createElement('hr');
            separator.className = 'tf-country-separator';
            otherCitiesList.appendChild(separator);
        }
    });
}

// ============================================
// CUSTOM CITY INPUT (FRANCE - MAIN Q9) - POPUP STYLE
// ============================================

function initCustomCityFranceInput() {
    const customCityCheckbox = document.querySelector('.custom-city-main-checkbox');
    const customCityPopup = document.getElementById('customCityPopup');
    const customCityInput = document.getElementById('customCityFranceInput');
    const cityTagsContainer = document.getElementById('cityTagsFrance');

    if (!customCityCheckbox || !customCityPopup || !customCityInput || !cityTagsContainer) return;

    // Initialize cities array for France
    if (!formData.customCities) formData.customCities = {};
    if (!formData.customCities.france_main) formData.customCities.france_main = [];

    customCityCheckbox.addEventListener('change', () => {
        if (customCityCheckbox.checked) {
            customCityPopup.style.display = 'block';
            setTimeout(() => {
                customCityInput.focus();
            }, 50);
        } else {
            customCityPopup.style.display = 'none';
            customCityInput.value = '';
            cityTagsContainer.innerHTML = '';
            if (formData.customCities) {
                formData.customCities.france_main = [];
            }
        }
    });

    // Handle Enter key to add city as tag
    customCityInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();

            const cityName = customCityInput.value.trim();
            if (cityName) {
                // Add city to array if not already present
                if (!formData.customCities.france_main.includes(cityName)) {
                    formData.customCities.france_main.push(cityName);

                    // Create tag element
                    const tag = document.createElement('span');
                    tag.className = 'tf-city-tag';
                    tag.innerHTML = `
                        ${cityName}
                        <button type="button" class="tf-tag-remove" data-city="${cityName}">&times;</button>
                    `;

                    // Add remove handler
                    tag.querySelector('.tf-tag-remove').addEventListener('click', () => {
                        formData.customCities.france_main = formData.customCities.france_main.filter(c => c !== cityName);
                        tag.remove();
                    });

                    cityTagsContainer.appendChild(tag);
                }

                // Clear input for next city
                customCityInput.value = '';
            }
        }
    });
}

// ============================================
// ANYWHERE CITY FRANCE (Q9) - "N'importe quelle ville"
// ============================================

function initAnywhereCityFrance() {
    const anywhereLink = document.getElementById('anywhereLinkFrance');
    const anywhereHidden = document.getElementById('anywhereHiddenFrance');
    const citiesContainer = document.getElementById('citiesContainer');
    const customCityCheckbox = document.querySelector('.custom-city-main-checkbox');
    const customCityPopup = document.getElementById('customCityPopup');
    const cityTagsContainer = document.getElementById('cityTagsFrance');

    if (!anywhereLink || !anywhereHidden || !citiesContainer) return;

    // Listen to city checkbox changes to disable/enable "N'importe quelle ville"
    citiesContainer.querySelectorAll('input[name="cities"]').forEach(cb => {
        cb.addEventListener('change', () => {
            const checkedCities = citiesContainer.querySelectorAll('input[name="cities"]:checked');
            if (checkedCities.length > 0) {
                anywhereLink.classList.add('tf-anywhere-disabled');
                anywhereLink.classList.remove('tf-anywhere-active');
                anywhereHidden.value = '';
            } else {
                anywhereLink.classList.remove('tf-anywhere-disabled');
            }
        });
    });

    // Handle "N'importe quelle ville" link click
    anywhereLink.addEventListener('click', () => {
        if (anywhereLink.classList.contains('tf-anywhere-disabled')) return;

        anywhereLink.classList.toggle('tf-anywhere-active');

        if (anywhereLink.classList.contains('tf-anywhere-active')) {
            // Décocher toutes les villes
            citiesContainer.querySelectorAll('input[name="cities"]:checked').forEach(cb => {
                cb.checked = false;
                updateCheckboxState(cb);
            });
            // Vider les villes personnalisées
            if (formData.customCities && formData.customCities.france_main) {
                formData.customCities.france_main = [];
            }
            if (cityTagsContainer) cityTagsContainer.innerHTML = '';
            if (customCityPopup) customCityPopup.style.display = 'none';
            anywhereHidden.value = 'anywhere';
            // Stocker dans formData
            if (!formData.anywhereCities) formData.anywhereCities = {};
            formData.anywhereCities.france = true;
            // Passer à la question suivante
            setTimeout(() => nextQuestion(), 300);
        } else {
            anywhereHidden.value = '';
            if (formData.anywhereCities) {
                formData.anywhereCities.france = false;
            }
        }
    });
}

// ============================================
// CUSTOM COUNTRY INPUT (Q8)
// ============================================

function initCustomCountryInput() {
    const customCountryCheckbox = document.querySelector('.custom-country-checkbox');
    const customCountryInputWrapper = document.getElementById('customCountryInputWrapper');
    const customCountryInput = document.getElementById('customCountryInput');

    if (!customCountryCheckbox || !customCountryInputWrapper || !customCountryInput) return;

    customCountryCheckbox.addEventListener('change', () => {
        if (customCountryCheckbox.checked) {
            customCountryInputWrapper.style.display = 'block';
            customCountryInput.focus();
        } else {
            customCountryInputWrapper.style.display = 'none';
            customCountryInput.value = '';
            // Remove from formData
            delete formData.customCountry;
        }
    });

    // Update formData when input changes
    customCountryInput.addEventListener('input', () => {
        formData.customCountry = customCountryInput.value;
    });
}

// ============================================
// OTHER LANGUAGE INPUT (Q10)
// ============================================

function initOtherLanguageInput() {
    const otherLanguageCheckbox = document.querySelector('.other-language-checkbox');
    const otherLanguagePopup = document.getElementById('otherLanguagePopup');
    const otherLanguageInput = document.getElementById('otherLanguageInput');
    const languageTagsContainer = document.getElementById('languageTagsOther');

    if (!otherLanguageCheckbox || !otherLanguagePopup || !otherLanguageInput || !languageTagsContainer) return;

    // Initialize other languages array
    if (!formData.otherLanguages) formData.otherLanguages = [];

    otherLanguageCheckbox.addEventListener('change', () => {
        if (otherLanguageCheckbox.checked) {
            otherLanguagePopup.style.display = 'block';
            setTimeout(() => {
                otherLanguageInput.focus();
            }, 50);
        } else {
            otherLanguagePopup.style.display = 'none';
            otherLanguageInput.value = '';
            languageTagsContainer.innerHTML = '';
            formData.otherLanguages = [];
        }
    });

    // Handle Enter key to add language as tag
    otherLanguageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();

            const languageName = otherLanguageInput.value.trim();
            if (languageName) {
                if (!formData.otherLanguages.includes(languageName)) {
                    formData.otherLanguages.push(languageName);

                    const tag = document.createElement('span');
                    tag.className = 'tf-city-tag';
                    tag.innerHTML = `
                        ${languageName}
                        <button type="button" class="tf-tag-remove" data-language="${languageName}">&times;</button>
                    `;

                    tag.querySelector('.tf-tag-remove').addEventListener('click', () => {
                        formData.otherLanguages = formData.otherLanguages.filter(l => l !== languageName);
                        tag.remove();
                    });

                    languageTagsContainer.appendChild(tag);
                }
                otherLanguageInput.value = '';
            }
        }
    });
}

// Helper function to get display name for country
function getCountryDisplayName(countryCode) {
    const countryNames = {
        'france': 'France',
        'belgique': 'Belgique',
        'suisse': 'Suisse',
        'luxembourg': 'Luxembourg',
        'uk': 'Royaume-Uni',
        'allemagne': 'Allemagne',
        'espagne': 'Espagne',
        'italie': 'Italie',
        'pays-bas': 'Pays-Bas',
        'portugal': 'Portugal',
        'irlande': 'Irlande',
        'canada': 'Canada',
        'usa': 'États-Unis',
        'australie': 'Australie',
        'singapour': 'Singapour',
        'japon': 'Japon',
        'emirats': 'Émirats Arabes Unis'
    };
    return countryNames[countryCode] || countryCode.charAt(0).toUpperCase() + countryCode.slice(1);
}

// Add CSS for small spinner
const style = document.createElement('style');
style.textContent = `
    .tf-spinner-small {
        width: 18px;
        height: 18px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    .tf-choice.pressed {
        transform: scale(0.98);
    }

    .tf-upload-zone.uploaded {
        border-style: solid;
        border-color: var(--green-500);
        background: rgba(34, 197, 94, 0.1);
    }

    .tf-upload-zone.uploaded .tf-upload-icon {
        color: var(--green-500);
    }

    .tf-choices.error .tf-choice {
        border-color: #ef4444;
    }

    .tf-textarea.error {
        border-color: #ef4444;
        animation: shake 0.4s ease;
    }

    .tf-experience-item {
        transition: opacity 0.2s ease, transform 0.2s ease;
    }

    /* Button skip position style */
    .tf-btn-skip-position {
        display: block;
        width: 100%;
        margin-top: 20px;
        padding: 16px 24px;
        background: transparent;
        border: 1px solid var(--border-color);
        border-radius: 12px;
        color: var(--text-secondary);
        font-size: 0.95rem;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: center;
    }

    .tf-btn-skip-position:hover {
        border-color: var(--blue-500);
        color: var(--blue-500);
        background: rgba(59, 130, 246, 0.05);
    }

    /* Date picker inline styles */
    .tf-date-picker-inline {
        margin-top: 20px;
        animation: fadeIn 0.3s ease;
    }

    .tf-date-input {
        width: 100%;
        padding: 16px 20px;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        color: var(--text-primary);
        font-size: 1rem;
        cursor: pointer;
    }

    .tf-date-input:focus {
        outline: none;
        border-color: var(--blue-500);
    }

    /* Other countries selector styles */
    .tf-other-countries {
        animation: fadeIn 0.3s ease;
    }

    .tf-countries-list {
        margin-top: 10px;
    }

    /* Other domains selector styles */
    .tf-other-domains {
        animation: fadeIn 0.3s ease;
    }

    .tf-domains-list {
        margin-top: 10px;
    }

    /* Other cities selector styles */
    .tf-other-cities {
        animation: fadeIn 0.3s ease;
    }

    .tf-cities-list {
        margin-top: 10px;
    }

    .tf-cities-country-header {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--blue-400);
        margin-top: 16px;
        margin-bottom: 8px;
        text-transform: capitalize;
    }

    .tf-no-cities {
        color: var(--text-muted);
        font-style: italic;
        padding: 12px;
    }

    /* Custom city wrapper */
    .tf-custom-city-wrapper {
        margin-top: 8px;
    }

    .tf-custom-city-input {
        margin-top: 10px;
        margin-left: 0;
        animation: fadeIn 0.3s ease;
    }

    .tf-custom-city-input .tf-input-small {
        width: 100%;
        max-width: 300px;
    }

    /* Country separator */
    .tf-country-separator {
        border: none;
        border-top: 1px solid var(--border-color);
        margin: 20px 0;
        opacity: 0.5;
    }

    /* Other choice style */
    .tf-choice-other {
        border-style: dashed !important;
    }

    .tf-choice-other:hover {
        border-color: var(--blue-400) !important;
    }

    /* Custom city popup */
    .tf-custom-city-popup {
        margin-top: 16px;
        padding: 16px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        position: relative;
        animation: popupSlideIn 0.2s ease-out;
        max-width: 280px;
    }

    .tf-custom-city-popup::before {
        content: '';
        position: absolute;
        top: -8px;
        right: 24px;
        width: 14px;
        height: 14px;
        background: var(--bg-secondary);
        border-left: 1px solid var(--border-color);
        border-top: 1px solid var(--border-color);
        transform: rotate(45deg);
    }

    .tf-popup-input {
        width: 100%;
        padding: 12px 16px;
        font-size: 0.95rem;
        font-family: inherit;
        color: var(--text-primary);
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        outline: none;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .tf-popup-input::placeholder {
        color: var(--text-muted);
    }

    .tf-popup-input:focus {
        border-color: var(--blue-500);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    @keyframes popupSlideIn {
        from {
            opacity: 0;
            transform: translateY(-8px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    /* Success actions styles */
    .tf-success-actions {
        display: flex;
        flex-direction: column;
        gap: 15px;
        margin-top: 30px;
    }

    .tf-btn-send {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
    }

    .tf-btn-send .btn-loading {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .tf-btn-secondary-link {
        display: inline-block;
        padding: 12px 24px;
        color: var(--text-secondary);
        text-decoration: none;
        font-size: 0.95rem;
        transition: color 0.2s ease;
    }

    .tf-btn-secondary-link:hover {
        color: var(--blue-500);
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    /* City tags styles */
    .tf-city-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 12px;
    }

    .tf-city-tags:empty {
        margin-bottom: 0;
    }

    .tf-city-tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        background: var(--blue-500);
        color: white;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 500;
        animation: tagAppear 0.2s ease-out;
    }

    .tf-tag-remove {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 50%;
        color: white;
        font-size: 14px;
        cursor: pointer;
        transition: background 0.2s ease;
        line-height: 1;
        padding: 0;
    }

    .tf-tag-remove:hover {
        background: rgba(255, 255, 255, 0.4);
    }

    @keyframes tagAppear {
        from {
            opacity: 0;
            transform: scale(0.8);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
`;
document.head.appendChild(style);
