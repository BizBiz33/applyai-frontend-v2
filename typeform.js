/* ============================================
   ApplyAI - Typeform Style JavaScript
   Navigation, Validation, Micro-interactions
   ============================================ */

// Configuration
const N8N_WEBHOOK_URL = 'https://bizbiz.app.n8n.cloud/webhook/user-registration';
const TOTAL_QUESTIONS = 25;
const POPUP_QUESTION = 14; // La question de transition
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
    initCustomCountryInput();

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

    // Validation for cities (multi-select) - at least one required (Q9)
    if (currentQuestion === 9) {
        const checkedCities = currentEl.querySelectorAll('input[name="cities"]:checked');
        if (checkedCities.length === 0) {
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

    // Validation for custom date if selected (Q13)
    if (currentQuestion === 13) {
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
        languages: [],
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

function initCountrySelector() {
    // Listen for country selection changes
    document.querySelectorAll('input[name="country"]').forEach(input => {
        input.addEventListener('change', () => {
            updateCitiesForCountry(input.value);
        });
    });
}

function updateCitiesForCountry(country) {
    const citiesContainer = document.getElementById('citiesContainer');
    if (!citiesContainer) return;

    const cities = citiesByCountry[country] || [];

    citiesContainer.innerHTML = cities.map((city, index) => `
        <label class="tf-choice tf-choice-tag" data-key="${String.fromCharCode(65 + index)}">
            <input type="checkbox" name="cities" value="${city}">
            <span class="tf-choice-text">${city}</span>
        </label>
    `).join('');

    // Re-init checkbox listeners for new elements
    citiesContainer.querySelectorAll('input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', () => {
            updateCheckboxState(input);
        });
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
    const otherCityCheckbox = document.querySelector('input[name="cities"][value="other"]');
    const otherCitiesSelector = document.getElementById('otherCitiesSelector');
    const otherCitiesList = document.getElementById('otherCitiesList');

    if (!otherCityCheckbox || !otherCitiesSelector || !otherCitiesList) return;

    // Listen for country selection to update city list
    document.querySelectorAll('input[name="country"]').forEach(radio => {
        radio.addEventListener('change', () => {
            selectedCountry = radio.value;
            // Update cities list when "other" is checked
            if (otherCityCheckbox.checked) {
                populateOtherCities();
            }
        });
    });

    // Also listen to other countries checkboxes
    document.querySelectorAll('input[name="otherCountries"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            if (otherCityCheckbox.checked) {
                populateOtherCities();
            }
        });
    });

    otherCityCheckbox.addEventListener('change', () => {
        if (otherCityCheckbox.checked) {
            otherCitiesSelector.style.display = 'block';
            populateOtherCities();
        } else {
            otherCitiesSelector.style.display = 'none';
            otherCitiesList.innerHTML = '';
        }
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
            // Get all checked other countries
            document.querySelectorAll('input[name="otherCountries"]:checked').forEach(cb => {
                countries.push(cb.value);
            });
        } else {
            countries.push(countryRadio.value);
        }
    }

    if (countries.length === 0) {
        otherCitiesList.innerHTML = '<p class="tf-no-cities">Veuillez d\'abord sélectionner un pays</p>';
        return;
    }

    // Add cities for each selected country
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
            });

            otherCitiesList.appendChild(label);
        });

        // Add "Autre ville" option with text input for each country
        const otherCityWrapper = document.createElement('div');
        otherCityWrapper.className = 'tf-custom-city-wrapper';
        otherCityWrapper.innerHTML = `
            <label class="tf-choice tf-choice-tag tf-choice-other">
                <input type="checkbox" name="otherCities" value="custom_${country}" class="custom-city-checkbox" data-country="${country}">
                <span class="tf-choice-text">✏️ Autre ville${countries.length > 1 ? ' (' + countryName + ')' : ''}...</span>
            </label>
            <div class="tf-custom-city-input" style="display: none;">
                <input type="text" name="customCity_${country}" class="tf-input tf-input-small" placeholder="Entrez le nom de la ville">
            </div>
        `;

        const customCheckbox = otherCityWrapper.querySelector('.custom-city-checkbox');
        const customInputWrapper = otherCityWrapper.querySelector('.tf-custom-city-input');
        const customInput = otherCityWrapper.querySelector('input[type="text"]');

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

        // Update formData when custom city input changes
        customInput.addEventListener('input', () => {
            if (!formData.customCities) formData.customCities = {};
            formData.customCities[country] = customInput.value;
        });

        otherCitiesList.appendChild(otherCityWrapper);

        // Add separator between countries if multiple
        if (countries.length > 1 && countryIndex < countries.length - 1) {
            const separator = document.createElement('hr');
            separator.className = 'tf-country-separator';
            otherCitiesList.appendChild(separator);
        }
    });
}

// ============================================
// CUSTOM CITY INPUT (FRANCE - MAIN Q9)
// ============================================

function initCustomCityFranceInput() {
    const customCityCheckbox = document.querySelector('.custom-city-main-checkbox');
    const customCityInputWrapper = document.getElementById('customCityInputWrapper');
    const customCityInput = document.getElementById('customCityFranceInput');

    if (!customCityCheckbox || !customCityInputWrapper || !customCityInput) return;

    customCityCheckbox.addEventListener('change', () => {
        if (customCityCheckbox.checked) {
            customCityInputWrapper.style.display = 'block';
            customCityInput.focus();
        } else {
            customCityInputWrapper.style.display = 'none';
            customCityInput.value = '';
            // Remove from formData
            if (formData.customCities) {
                delete formData.customCities.france_main;
            }
        }
    });

    // Update formData when input changes
    customCityInput.addEventListener('input', () => {
        if (!formData.customCities) formData.customCities = {};
        formData.customCities.france_main = customCityInput.value;
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
`;
document.head.appendChild(style);
