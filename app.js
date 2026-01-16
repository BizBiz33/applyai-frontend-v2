/* ============================================
   ApplyAI - App Logic
   Animations et interactions générales
   ============================================ */

// Smooth scroll pour les ancres
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Animation au scroll (fade in)
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observer les sections
document.querySelectorAll('.feature-card, .step, .pricing-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'all 0.6s ease';
    observer.observe(el);
});

// Animation des orbs (landing page)
const orbs = document.querySelectorAll('.glow-orb');
orbs.forEach((orb, index) => {
    let x = 0, y = 0;
    setInterval(() => {
        x += Math.sin(Date.now() / 3000 + index) * 0.5;
        y += Math.cos(Date.now() / 4000 + index) * 0.5;
        orb.style.transform = `translate(${x}px, ${y}px)`;
    }, 50);
});

// Navbar sticky effect
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll <= 0) {
        navbar.style.boxShadow = 'none';
    } else {
        navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    }
    
    lastScroll = currentScroll;
});

// Stats counter animation
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start).toLocaleString();
        }
    }, 16);
}

// Animer les stats quand elles deviennent visibles
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const number = entry.target.querySelector('.stat-number');
            if (number && !number.classList.contains('animated')) {
                number.classList.add('animated');
                const target = parseInt(number.textContent.replace(/,/g, ''));
                animateCounter(number, target);
            }
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat').forEach(stat => {
    statsObserver.observe(stat);
});
```

---

# ✅ QUE FAIRE APRÈS ?

## 📝 CHECKLIST D'ACTIONS IMMÉDIATES

### 1. **Télécharger et organiser les fichiers** (5 min)

Créez cette structure sur votre ordinateur :
```
ApplyAI/
├── index.html          ← Fichier 1
├── inscription.html    ← Fichier 2
├── styles.css          ← Fichier 3
├── form.css            ← Fichier 4
├── form.js             ← Fichier 5 (celui que je viens de créer)
└── app.js              ← Fichier 6 (celui que je viens de créer)