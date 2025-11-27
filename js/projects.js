document.addEventListener('DOMContentLoaded', () => {
    // Initialize GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);
    
    // Initial Reveal Animation
    animateCards();
    
    // Setup Filter Logic
    initFilters();
});

function animateCards() {
    gsap.fromTo(".project-card", 
        { 
            y: 50, 
            opacity: 0, 
            scale: 0.9,
            filter: "blur(5px)"
        },
        {
            y: 0,
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out",
            clearProps: "all" // Clear styles to allow hover effects
        }
    );
}

function initFilters() {
    const buttons = document.querySelectorAll('.btn-glitch-filter');
    const cards = document.querySelectorAll('.project-card');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // 1. Update Active State
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // 2. Get Filter Value
            const filterValue = btn.getAttribute('data-filter');

            // 3. Glitch/Filter Animation Logic
            const timeline = gsap.timeline();

            // Step A: "Despawn" all cards briefly
            timeline.to(cards, {
                duration: 0.2,
                opacity: 0,
                scale: 0.95,
                filter: "brightness(2) blur(10px)", // Flash effect
                ease: "power1.in",
                onComplete: () => {
                    // Step B: Toggle visibility
                    cards.forEach(card => {
                        const cardCategory = card.getAttribute('data-category');
                        if (filterValue === 'all' || filterValue === cardCategory) {
                            card.style.display = 'flex';
                        } else {
                            card.style.display = 'none';
                        }
                    });
                }
            });

            // Step C: "Respawn" visible cards
            timeline.to(cards, {
                duration: 0.4,
                opacity: 1,
                scale: 1,
                filter: "brightness(1) blur(0px)",
                ease: "back.out(1.7)",
                stagger: {
                    amount: 0.2,
                    from: "random" // Random spawn order for hacker feel
                },
                clearProps: "filter, opacity, scale"
            });
        });
    });
}