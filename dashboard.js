// ============================================
// ApplyAI - Tableau de bord
// ============================================

// Configuration des endpoints n8n
const ENDPOINTS = {
    scrapeJobs: 'https://bizbiz.app.n8n.cloud/webhook/job-scraping',
    generateEmails: 'https://bizbiz.app.n8n.cloud/webhook/email-generation-sending'
};

// État de l'application
let currentApplications = [];
let isSearching = false;

// Données utilisateur (simulées pour le moment)
const userData = {
    userId: '2fee46b0-a58c-493d-a92a-36459a362817',
    fullName: 'Jean Dupont',
    email: 'jean.dupont@gmail.com'
};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    updateStats();
    loadApplications();
    initializeSearch();
});

// Mettre à jour les statistiques
function updateStats() {
    // Simuler des données pour le moment
    document.getElementById('totalApplications').textContent = '24';
    document.getElementById('pendingApplications').textContent = '10';
    document.getElementById('sentApplications').textContent = '12';
    document.getElementById('repliedApplications').textContent = '2';
}

// Charger les candidatures
async function loadApplications() {
    // Pour le moment, on utilise des données simulées
    const mockApplications = [
        {
            id: '1',
            company: 'Lectra',
            jobTitle: 'Responsable de campagnes marketing',
            date: new Date().toISOString(),
            status: 'sent'
        },
        {
            id: '2',
            company: 'Sogelink',
            jobTitle: 'Marketing Manager',
            date: new Date(Date.now() - 86400000).toISOString(),
            status: 'opened'
        },
        {
            id: '3',
            company: 'LIVY',
            jobTitle: 'Head of Marketing',
            date: new Date(Date.now() - 172800000).toISOString(),
            status: 'replied'
        },
        {
            id: '4',
            company: 'SAINT-GOBAIN',
            jobTitle: 'Digital Marketing Specialist',
            date: new Date(Date.now() - 259200000).toISOString(),
            status: 'pending'
        }
    ];
    
    currentApplications = mockApplications;
    renderApplications();
}

// Afficher les candidatures
function renderApplications() {
    const tbody = document.getElementById('applicationsTable');
    
    tbody.innerHTML = currentApplications.map(app => `
        <tr>
            <td>
                <div class="company-cell">
                    <div class="company-logo">${app.company.charAt(0)}</div>
                    <div class="company-info">
                        <div class="company-name">${app.company}</div>
                        <div class="job-title">${app.jobTitle}</div>
                    </div>
                </div>
            </td>
            <td>${formatDate(app.date)}</td>
            <td>
                <span class="status-badge status-${app.status}">
                    ${getStatusText(app.status)}
                </span>
            </td>
            <td>
                <button class="btn-ghost btn-small" onclick="viewApplication('${app.id}')">
                    Voir
                </button>
            </td>
        </tr>
    `).join('');
}

// Formater la date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    
    return date.toLocaleDateString('fr-FR');
}

// Obtenir le texte du statut
function getStatusText(status) {
    const statusMap = {
        pending: 'En attente',
        sent: 'Envoyée',
        opened: 'Ouverte',
        replied: 'Répondu'
    };
    return statusMap[status] || status;
}

// Initialiser la recherche
function initializeSearch() {
    const searchForm = document.getElementById('searchForm');
    
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (isSearching) return;
        
        const searchBtn = document.getElementById('searchBtn');
        const btnText = searchBtn.querySelector('.btn-text');
        const btnLoading = searchBtn.querySelector('.btn-loading');
        
        // Collecter les critères
        const searchCriteria = {
            userId: userData.userId,
            domain: document.getElementById('domain').value,
            contractType: document.getElementById('contractType').value,
            location: document.getElementById('location').value || 'France',
            specificPosition: document.getElementById('specificPosition').value || ''
        };
        
        // Vérifier les critères obligatoires
        if (!searchCriteria.domain || !searchCriteria.contractType) {
            alert('Veuillez remplir tous les champs obligatoires');
            return;
        }
        
        // Afficher le chargement
        isSearching = true;
        searchBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'flex';
        
        try {
            // Étape 1 : Scraper les offres
            showNotification('🔍 Recherche des offres d\'emploi...', 'info');
            
            const scrapeResponse = await fetch(ENDPOINTS.scrapeJobs, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(searchCriteria)
            });
            
            if (!scrapeResponse.ok) throw new Error('Erreur lors du scraping');
            
            const scrapeResult = await scrapeResponse.json();
            showNotification(`✅ ${scrapeResult.count || 10} offres trouvées !`, 'success');
            
            // Attendre un peu pour l'effet
            await sleep(1500);
            
            // Étape 2 : Générer et envoyer les emails
            showNotification('✉️ Génération et envoi des candidatures...', 'info');
            
            const emailResponse = await fetch(ENDPOINTS.generateEmails, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userData.userId
                })
            });
            
            if (!emailResponse.ok) throw new Error('Erreur lors de l\'envoi');
            
            const emailResult = await emailResponse.json();
            showNotification(`🎉 ${emailResult.sent || 10} candidatures envoyées avec succès !`, 'success');
            
            // Recharger les candidatures
            await loadApplications();
            updateStats();
            
        } catch (error) {
            console.error('Erreur:', error);
            showNotification('❌ Une erreur est survenue. Veuillez réessayer.', 'error');
        } finally {
            // Réactiver le bouton
            isSearching = false;
            searchBtn.disabled = false;
            btnText.style.display = 'flex';
            btnLoading.style.display = 'none';
        }
    });
}

// Afficher une notification
function showNotification(message, type = 'info') {
    const container = document.getElementById('notifications') || createNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="closeNotification(this)" class="notification-close">×</button>
    `;
    
    container.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto-fermeture après 5 secondes
    setTimeout(() => {
        closeNotification(notification.querySelector('.notification-close'));
    }, 5000);
}

// Créer le container de notifications s'il n'existe pas
function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notifications';
    container.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
    `;
    document.body.appendChild(container);
    return container;
}

// Fermer une notification
function closeNotification(button) {
    const notification = button.parentElement;
    notification.classList.remove('show');
    setTimeout(() => {
        notification.remove();
    }, 300);
}

// Voir une candidature
function viewApplication(id) {
    const app = currentApplications.find(a => a.id === id);
    if (app) {
        alert(`Détails de la candidature :\n\nEntreprise: ${app.company}\nPoste: ${app.jobTitle}\nStatut: ${getStatusText(app.status)}`);
    }
}

// Fonction utilitaire pour attendre
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Styles CSS pour les notifications
const notificationStyles = `
<style>
.notification {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    padding: 15px 20px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 300px;
    max-width: 400px;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
}

.notification.show {
    opacity: 1;
    transform: translateX(0);
}

.notification-info {
    border-color: var(--blue-500);
    background: rgba(59, 130, 246, 0.1);
}

.notification-success {
    border-color: var(--green-500);
    background: rgba(34, 197, 94, 0.1);
}

.notification-error {
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
}

.notification-close {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 1.5rem;
    cursor: pointer;
    margin-left: 15px;
}

.notification-close:hover {
    color: var(--text-primary);
}

/* Animations pour le bouton de recherche */
.btn-loading {
    display: none;
}

@media (max-width: 640px) {
    #notifications {
        left: 20px;
        right: 20px;
    }
    
    .notification {
        max-width: none;
    }
}
</style>
`;

// Ajouter les styles au document
document.head.insertAdjacentHTML('beforeend', notificationStyles);