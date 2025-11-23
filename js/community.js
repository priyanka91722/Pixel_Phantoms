document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initTiltEffect();
    initScrollAnimations();
});

/* =========================================
   1. INTERACTIVE PARTICLE NETWORK (CANVAS)
   ========================================= */
function initParticles() {
    const canvas = document.getElementById('hero-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particlesArray;

    // Handle Window Resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        createParticles();
    });

    // Mouse Interaction
    const mouse = { x: null, y: null, radius: 150 };
    window.addEventListener('mousemove', (event) => {
        mouse.x = event.x;
        mouse.y = event.y;
    });

    // Particle Class
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1;
            this.speedX = Math.random() * 1 - 0.5;
            this.speedY = Math.random() * 1 - 0.5;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            // Boundary check
            if (this.x > canvas.width || this.x < 0) this.speedX = -this.speedX;
            if (this.y > canvas.height || this.y < 0) this.speedY = -this.speedY;

            // Mouse repulsion
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < mouse.radius) {
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                const force = (mouse.radius - distance) / mouse.radius;
                const directionX = forceDirectionX * force * 3;
                const directionY = forceDirectionY * force * 3;
                this.x -= directionX;
                this.y -= directionY;
            }
        }
        draw() {
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function createParticles() {
        particlesArray = [];
        const numberOfParticles = (canvas.width * canvas.height) / 9000;
        for (let i = 0; i < numberOfParticles; i++) {
            particlesArray.push(new Particle());
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
            particlesArray[i].draw();
            connectParticles(i);
        }
        requestAnimationFrame(animateParticles);
    }

    function connectParticles(a) {
        for (let b = a; b < particlesArray.length; b++) {
            let distance = ((particlesArray[a].x - particlesArray[b].x) ** 2) + ((particlesArray[a].y - particlesArray[b].y) ** 2);
            if (distance < (canvas.width / 7) * (canvas.height / 7)) {
                let opacityValue = 1 - (distance / 20000);
                let color = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
                // Convert hex/var to rgba for opacity is complex in plain JS, simplified to gray:
                ctx.strokeStyle = `rgba(150, 150, 150, ${opacityValue})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                ctx.stroke();
            }
        }
    }

    createParticles();
    animateParticles();
}

/* =========================================
   2. 3D TILT EFFECT (VANILLA JS)
   ========================================= */
function initTiltEffect() {
    const cards = document.querySelectorAll('[data-tilt]');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const cardRect = card.getBoundingClientRect();
            const cardWidth = cardRect.width;
            const cardHeight = cardRect.height;
            
            // Calculate mouse position relative to card center
            const centerX = cardRect.left + cardWidth / 2;
            const centerY = cardRect.top + cardHeight / 2;
            const mouseX = e.clientX - centerX;
            const mouseY = e.clientY - centerY;

            // Calculate rotation (Max 20 degrees)
            const rotateX = (mouseY / (cardHeight / 2)) * -15;
            const rotateY = (mouseX / (cardWidth / 2)) * 15;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
        });

        card.addEventListener('mouseleave', () => {
            // Reset on leave
            card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale(1)`;
        });
    });
}

/* =========================================
   3. SCROLL REVEAL & COUNTERS
   ========================================= */
function initScrollAnimations() {
    const reveals = document.querySelectorAll('.reveal');
    const counters = document.querySelectorAll('.counter');
    let counted = false; // Ensure counters run only once

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');

                // Trigger counters if the stats section is revealed
                if (entry.target.classList.contains('stats-section') && !counted) {
                    startCounters(counters);
                    counted = true;
                }
            }
        });
    }, { threshold: 0.15 });

    reveals.forEach(element => observer.observe(element));
}

function startCounters(counters) {
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const speed = 200; // Lower is slower
        
        const updateCount = () => {
            const current = +counter.innerText;
            const increment = target / speed;

            if (current < target) {
                counter.innerText = Math.ceil(current + increment);
                setTimeout(updateCount, 20);
            } else {
                counter.innerText = target + "+"; // Add plus sign at end
            }
        };
        updateCount();
    });
}

/* =========================================
   4. UTILITIES
   ========================================= */
function copyLink(link) {
    navigator.clipboard.writeText(link).then(() => {
        showToast("Invite Link Copied! 📋");
    }).catch(err => {
        showToast("Failed to copy ❌");
    });
}

function showToast(message) {
    let toast = document.getElementById('toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}