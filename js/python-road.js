// python-road.js
document.addEventListener('DOMContentLoaded', () => {
    const pythonData = {
        chapters: [
            { title: "PHASE_01: Syntax_Core", desc: "Foundations of Python logic.", modules: ["Variables & Types", "Control Flow", "Functions"] },
            { title: "PHASE_02: Data_Structures", desc: "Handling complex information.", modules: ["Lists & Dicts", "Tuples", "Sets"] },
            { title: "PHASE_03: OOP_Architecture", desc: "Mastering Classes & Objects.", modules: ["Inheritance", "Decorators", "Dunder Methods"] }
        ]
    };

    const container = document.getElementById('python-content');

    pythonData.chapters.forEach((ch, index) => {
        const side = index % 2 === 0 ? 'left' : 'right';
        const node = document.createElement('div');
        node.className = `chapter-node ${side}`;
        node.innerHTML = `
            <h3>${ch.title}</h3>
            <p>${ch.desc}</p>
            <button class="toggle-btn" onclick="toggleDetails(this)">+</button>
            <div class="chapter-details">
                ${ch.modules.map(m => `<a href="#" class="module-link">> ${m}</a>`).join('')}
            </div>
        `;
        container.appendChild(node);
    });

    // GSAP Entrance
    gsap.from(".chapter-node", {
        scrollTrigger: ".roadmap-wrapper",
        x: (i) => i % 2 === 0 ? -100 : 100,
        opacity: 0,
        stagger: 0.2,
        duration: 1
    });
});

function toggleDetails(btn) {
    const details = btn.nextElementSibling;
    btn.classList.toggle('active');
    details.classList.toggle('open');
    btn.innerText = btn.classList.contains('active') ? '×' : '+';
}