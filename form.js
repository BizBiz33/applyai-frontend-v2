/* ============================================
   ApplyAI - Form Logic
   Gestion du formulaire multi-étapes
   ============================================ */

// Configuration
const N8N_WEBHOOK_URL = 'https://bizbiz.app.n8n.cloud/webhook/user-registration';

// État global
let currentStep = 1;
const totalSteps = 7;
let formData = {
    education: [],
    experiences: [],
    skills: [],
    languages: [],
    domains: [],
    jobPreferences: {}
};

// Compteurs pour les éléments dynamiques
let educationCount = 1;
let experienceCount = 1;
let languageCount = 1;

// ============================================
// NAVIGATION ENTRE LES ÉTAPES
// ============================================

function changeStep(direction) {
    // Valider l'étape actuelle avant de continuer
    if (direction === 1 && !validateStep(currentStep)) {
        return;
    }
    
    const newStep = currentStep + direction;
    
    if (newStep < 1 || newStep > totalSteps) return;
    
    // Cacher l'étape actuelle
    document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.remove('active');
    document.querySelector(`.progress-step[data-step="${currentStep}"]`).classList.remove('active');
    
    if (direction === 1) {
        document.querySelector(`.progress-step[data-step="${currentStep}"]`).classList.add('completed');
    }
    
    // Afficher la nouvelle étape
    currentStep = newStep;
    document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.add('active');
    document.querySelector(`.progress-step[data-step="${currentStep}"]`).classList.add('active');
    
    // Mettre à jour la barre de progression
    const progressPercentage = (currentStep / totalSteps) * 100;
    document.getElementById('progressFill').style.width = progressPercentage + '%';
    
    // Gérer l'affichage des boutons
    updateNavigationButtons();
    
    // Générer le récapitulatif à la dernière étape
    if (currentStep === totalSteps) {
        generateSummary();
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    // Bouton Précédent
    prevBtn.style.display = currentStep === 1 ? 'none' : 'inline-flex';
    
    // Bouton Suivant / Soumettre
    if (currentStep === totalSteps) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-flex';
    } else {
        nextBtn.style.display = 'inline-flex';
        submitBtn.style.display = 'none';
    }
}

// ============================================
// VALIDATION DES ÉTAPES
// ============================================

function validateStep(step) {
    const stepElement = document.querySelector(`.form-step[data-step="${step}"]`);
    const requiredFields = stepElement.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        // Enlever les classes d'erreur précédentes
        field.classList.remove('error');
        const errorMsg = field.parentElement.querySelector('.error-message');
        if (errorMsg) errorMsg.remove();

        // Vérifier si le champ est vide (sauf pour les radio buttons)
        if (field.type !== 'radio' && !field.value.trim()) {
            isValid = false;
            field.classList.add('error');

            // Ajouter un message d'erreur
            const error = document.createElement('span');
            error.className = 'error-message';
            error.textContent = 'Ce champ est obligatoire';
            field.parentElement.appendChild(error);
        }

        // Validation email
        if (field.type === 'email' && field.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(field.value)) {
                isValid = false;
                field.classList.add('error');

                const error = document.createElement('span');
                error.className = 'error-message';
                error.textContent = 'Email invalide';
                field.parentElement.appendChild(error);
            }
        }
    });

    // Validation spéciale pour l'étape 7 (type de contrat et domaines)
    if (step === 7) {
        // Vérifier qu'un type de contrat est sélectionné
        const contractType = document.querySelector('input[name="contractType"]:checked');
        if (!contractType) {
            isValid = false;
            const contractSelect = document.querySelector('.contract-select');
            if (contractSelect && !contractSelect.querySelector('.error-message')) {
                const error = document.createElement('span');
                error.className = 'error-message';
                error.textContent = 'Veuillez sélectionner un type de contrat';
                contractSelect.parentElement.appendChild(error);
            }
        }

        // Vérifier qu'au moins un domaine est sélectionné
        const selectedDomains = document.querySelectorAll('input[name="domains"]:checked');
        if (selectedDomains.length === 0) {
            isValid = false;
            const domainSelect = document.querySelector('.domain-select');
            if (domainSelect && !domainSelect.parentElement.querySelector('.error-message')) {
                const error = document.createElement('span');
                error.className = 'error-message';
                error.textContent = 'Veuillez sélectionner au moins un domaine';
                domainSelect.parentElement.appendChild(error);
            }
        }
    }

    if (!isValid) {
        // Scroll vers le premier champ en erreur
        const firstError = stepElement.querySelector('.error, .error-message');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (firstError.focus) firstError.focus();
        }
    }

    return isValid;
}

// ============================================
// AJOUT DYNAMIQUE D'ÉLÉMENTS
// ============================================

function addEducation() {
    const container = document.getElementById('educationList');
    const newItem = document.createElement('div');
    newItem.className = 'education-item';
    newItem.innerHTML = `
        <button type="button" class="remove-item" onclick="removeItem(this)">×</button>
        <div class="form-row">
            <div class="form-group">
                <label>École / Université</label>
                <input type="text" name="school_${educationCount}" placeholder="Lycée, Université...">
            </div>
            <div class="form-group">
                <label>Diplôme obtenu</label>
                <select name="degree_${educationCount}">
                    <option value="">Sélectionner</option>
                    <optgroup label="Secondaire">
                        <option value="Bac Général">Bac Général</option>
                        <option value="Bac Technologique">Bac Technologique</option>
                        <option value="Bac Professionnel">Bac Professionnel</option>
                    </optgroup>
                    <optgroup label="Bac +2">
                        <option value="BTS">BTS</option>
                        <option value="DUT">DUT</option>
                        <option value="Prépa">Classe Préparatoire</option>
                        <option value="L2">L2 / DEUG</option>
                    </optgroup>
                    <optgroup label="Bac +3">
                        <option value="Licence">Licence</option>
                        <option value="Licence Pro">Licence Professionnelle</option>
                        <option value="Bachelor">Bachelor</option>
                        <option value="BUT">BUT</option>
                    </optgroup>
                    <optgroup label="Bac +4/5">
                        <option value="Master 1">Master 1</option>
                        <option value="Master 2">Master 2</option>
                        <option value="MBA">MBA</option>
                        <option value="MSc">MSc</option>
                        <option value="Diplôme Ingénieur">Diplôme Ingénieur</option>
                        <option value="Diplôme Grande École">Diplôme Grande École</option>
                    </optgroup>
                    <option value="Autre">Autre</option>
                </select>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Spécialité / Mention</label>
                <input type="text" name="field_${educationCount}" placeholder="Économie, Sciences, Littéraire...">
            </div>
            <div class="form-group">
                <label>Année d'obtention</label>
                <input type="number" name="year_${educationCount}" placeholder="2023" min="1990" max="2030">
            </div>
        </div>
    `;
    container.appendChild(newItem);
    educationCount++;
}

function addExperience() {
    const container = document.getElementById('experienceList');
    const newItem = document.createElement('div');
    newItem.className = 'experience-item';
    newItem.innerHTML = `
        <button type="button" class="remove-item" onclick="removeItem(this)">×</button>
        <div class="form-row">
            <div class="form-group">
                <label>Entreprise *</label>
                <input type="text" name="company_${experienceCount}" placeholder="Nom de l'entreprise" required>
            </div>
            <div class="form-group">
                <label>Poste *</label>
                <input type="text" name="position_${experienceCount}" placeholder="Marketing Manager" required>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Durée *</label>
                <input type="text" name="duration_${experienceCount}" placeholder="6 mois, 1 an..." required>
            </div>
        </div>
        <div class="form-group">
            <label>Description des missions</label>
            <textarea name="description_${experienceCount}" placeholder="Décrivez vos principales missions et réalisations..." rows="3"></textarea>
        </div>
    `;
    container.appendChild(newItem);
    experienceCount++;
}

function addLanguage() {
    const container = document.getElementById('languagesList');
    const newItem = document.createElement('div');
    newItem.className = 'language-item';
    newItem.innerHTML = `
        <button type="button" class="remove-item" onclick="removeItem(this)">×</button>
        <div class="form-row">
            <div class="form-group">
                <input type="text" name="language_${languageCount}" placeholder="Anglais">
            </div>
            <div class="form-group">
                <select name="level_${languageCount}">
                    <option value="">Niveau</option>
                    <option value="Débutant">Débutant</option>
                    <option value="Intermédiaire">Intermédiaire</option>
                    <option value="Avancé">Avancé</option>
                    <option value="Courant">Courant</option>
                    <option value="Bilingue">Bilingue</option>
                    <option value="Natif">Natif</option>
                </select>
            </div>
        </div>
    `;
    container.appendChild(newItem);
    languageCount++;
}

function removeItem(button) {
    button.parentElement.remove();
}

// ============================================
// PREVIEW DES COMPÉTENCES
// ============================================

document.getElementById('skills')?.addEventListener('input', function(e) {
    const skills = e.target.value.split(',').map(s => s.trim()).filter(s => s);
    const preview = document.getElementById('skillsPreview');
    
    preview.innerHTML = '';
    skills.forEach(skill => {
        const tag = document.createElement('span');
        tag.className = 'skill-tag';
        tag.textContent = skill;
        preview.appendChild(tag);
    });
});

// ============================================
// UPLOAD DE CV
// ============================================

const uploadZone = document.getElementById('uploadZone');
const cvFileInput = document.getElementById('cvFile');

uploadZone?.addEventListener('click', () => {
    cvFileInput.click();
});

uploadZone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
});

uploadZone?.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
});

uploadZone?.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    
    const file = e.dataTransfer.files[0];
    if (file) {
        handleFileUpload(file);
    }
});

cvFileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFileUpload(file);
    }
});

async function handleFileUpload(file) {
    // Vérifier le type de fichier
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
        alert('Format de fichier non supporté. Utilisez PDF, DOC ou DOCX.');
        return;
    }
    
    // Vérifier la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        alert('Le fichier est trop volumineux (max 5MB).');
        return;
    }
    
    // TODO: Upload vers Supabase Storage
    // Pour l'instant, on simule avec un lien temporaire
    const tempUrl = URL.createObjectURL(file);
    document.getElementById('cvUrl').value = tempUrl;
    
    // Afficher le nom du fichier
    uploadZone.innerHTML = `
        <div class="upload-icon">✓</div>
        <p>${file.name}</p>
        <span class="upload-hint">Fichier prêt à être uploadé</span>
    `;
}

// ============================================
// GÉNÉRATION DU RÉCAPITULATIF
// ============================================

function generateSummary() {
    const form = document.getElementById('inscriptionForm');
    const formData = new FormData(form);

    let html = '';

    // Email
    html += `
        <div class="summary-item">
            <span class="summary-label">Email</span>
            <span class="summary-value">${formData.get('email')}</span>
        </div>
    `;

    // Nom
    html += `
        <div class="summary-item">
            <span class="summary-label">Nom</span>
            <span class="summary-value">${formData.get('fullName')}</span>
        </div>
    `;

    // Formation en cours
    const currentProgram = formData.get('currentProgram');
    const currentYear = formData.get('currentYear');
    const currentSchool = formData.get('currentSchool');
    html += `
        <div class="summary-item">
            <span class="summary-label">Formation en cours</span>
            <span class="summary-value">${currentProgram} - ${currentYear}e année (${currentSchool})</span>
        </div>
    `;

    // Diplômes obtenus
    const educationItems = document.querySelectorAll('.education-item');
    html += `
        <div class="summary-item">
            <span class="summary-label">Diplômes obtenus</span>
            <span class="summary-value">${educationItems.length} diplôme(s)</span>
        </div>
    `;

    // Expérience
    const experienceItems = document.querySelectorAll('.experience-item');
    html += `
        <div class="summary-item">
            <span class="summary-label">Expérience(s)</span>
            <span class="summary-value">${experienceItems.length} expérience(s)</span>
        </div>
    `;

    // Compétences
    const skills = formData.get('skills')?.split(',').filter(s => s.trim()).length || 0;
    html += `
        <div class="summary-item">
            <span class="summary-label">Compétences</span>
            <span class="summary-value">${skills} compétence(s)</span>
        </div>
    `;

    // CV
    const cvUrl = formData.get('cvUrl');
    html += `
        <div class="summary-item">
            <span class="summary-label">CV</span>
            <span class="summary-value">${cvUrl ? '✓ Fourni' : '✗ Non fourni'}</span>
        </div>
    `;

    // Type de contrat
    const contractType = document.querySelector('input[name="contractType"]:checked');
    const contractLabels = {
        stage: 'Stage',
        alternance: 'Alternance',
        cdi: 'CDI',
        cdd: 'CDD',
        freelance: 'Freelance'
    };
    html += `
        <div class="summary-item">
            <span class="summary-label">Type de contrat</span>
            <span class="summary-value">${contractType ? contractLabels[contractType.value] : '-'}</span>
        </div>
    `;

    // Domaines
    const selectedDomains = document.querySelectorAll('input[name="domains"]:checked');
    const domainValues = Array.from(selectedDomains).map(d => d.value);
    html += `
        <div class="summary-item">
            <span class="summary-label">Domaines</span>
            <span class="summary-value">${domainValues.length} domaine(s)</span>
        </div>
    `;

    // Localisation
    const location = formData.get('location');
    html += `
        <div class="summary-item">
            <span class="summary-label">Localisation</span>
            <span class="summary-value">${location || '-'}</span>
        </div>
    `;

    document.getElementById('summaryContent').innerHTML = html;
}

// ============================================
// SOUMISSION DU FORMULAIRE
// ============================================

document.getElementById('inscriptionForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Afficher le loading
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.querySelector('.btn-text').style.display = 'none';
    submitBtn.querySelector('.btn-loading').style.display = 'flex';
    submitBtn.disabled = true;

    try {
        // Collecter toutes les données
        const formData = new FormData(e.target);

        // Collecter les domaines sélectionnés
        const selectedDomains = document.querySelectorAll('input[name="domains"]:checked');
        const domains = Array.from(selectedDomains).map(d => d.value);

        // Construire l'objet de données
        const data = {
            // Informations de base
            email: formData.get('email'),
            emailProvider: formData.get('emailProvider'),
            fullName: formData.get('fullName'),
            phone: formData.get('phone') || null,
            linkedinUrl: formData.get('linkedinUrl') || null,
            portfolioUrl: formData.get('portfolioUrl') || null,

            // Formation en cours
            currentEducation: {
                school: formData.get('currentSchool'),
                program: formData.get('currentProgram'),
                currentYear: formData.get('currentYear'),
                programDuration: formData.get('programDuration'),
                major: formData.get('currentMajor'),
                expectedGraduation: parseInt(formData.get('expectedGraduation'))
            },

            // Diplômes obtenus
            completedEducation: [],
            experiences: [],
            skills: [],
            languages: [],
            cvUrl: formData.get('cvUrl'),

            // Préférences de recherche
            jobPreferences: {
                contractType: formData.get('contractType'),
                domains: domains,
                location: formData.get('location'),
                specificPosition: formData.get('specificPosition') || null,
                salaryMin: formData.get('salaryMin') ? parseInt(formData.get('salaryMin')) : null,
                seniority: formData.get('seniority') || null,
                flexibility: formData.get('flexibility') || null
            }
        };

        // Collecter les diplômes obtenus
        for (let i = 0; i < educationCount; i++) {
            const school = formData.get(`school_${i}`);
            const degree = formData.get(`degree_${i}`);
            if (school || degree) {
                data.completedEducation.push({
                    school: school || null,
                    degree: degree || null,
                    field: formData.get(`field_${i}`) || null,
                    year: formData.get(`year_${i}`) ? parseInt(formData.get(`year_${i}`)) : null
                });
            }
        }

        // Collecter les expériences
        for (let i = 0; i < experienceCount; i++) {
            if (formData.get(`company_${i}`)) {
                data.experiences.push({
                    company: formData.get(`company_${i}`),
                    position: formData.get(`position_${i}`),
                    duration: formData.get(`duration_${i}`),
                    description: formData.get(`description_${i}`) || ''
                });
            }
        }

        // Collecter les compétences
        const skillsInput = formData.get('skills');
        if (skillsInput) {
            data.skills = skillsInput.split(',').map(s => s.trim()).filter(s => s);
        }

        // Collecter les langues
        for (let i = 0; i < languageCount; i++) {
            const language = formData.get(`language_${i}`);
            const level = formData.get(`level_${i}`);
            if (language && level) {
                data.languages.push({
                    language: language,
                    level: level
                });
            }
        }

        console.log('Données à envoyer:', data);

        // Envoyer au webhook n8n
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Erreur lors de l\'inscription');
        }

        const result = await response.json();
        console.log('Réponse:', result);

        // Afficher un message de succès
        showSuccessMessage(result.userId);

    } catch (error) {
        console.error('Erreur:', error);
        alert('Une erreur est survenue lors de l\'inscription. Veuillez réessayer.');

        // Réactiver le bouton
        submitBtn.querySelector('.btn-text').style.display = 'flex';
        submitBtn.querySelector('.btn-loading').style.display = 'none';
        submitBtn.disabled = false;
    }
});

function showSuccessMessage(userId) {
    const formContainer = document.querySelector('.form-container');
    formContainer.innerHTML = `
        <div class="success-message">
            <div class="success-icon">🎉</div>
            <h2>Inscription réussie !</h2>
            <p>Votre compte a été créé avec succès.</p>
            <p>Nous allons maintenant lancer la recherche d'offres d'emploi correspondant à votre profil.</p>
            <a href="dashboard.html?userId=${userId}" class="btn-primary btn-large">
                Accéder au Dashboard →
            </a>
        </div>
    `;
}

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    updateNavigationButtons();
    
    // Animation des orbs (si présents)
    const orbs = document.querySelectorAll('.glow-orb');
    orbs.forEach((orb, index) => {
        setInterval(() => {
            const x = Math.sin(Date.now() / 3000 + index) * 20;
            const y = Math.cos(Date.now() / 4000 + index) * 20;
            orb.style.transform = `translate(${x}px, ${y}px)`;
        }, 50);
    });
});