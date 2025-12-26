document.addEventListener('DOMContentLoaded', () => {
    initPythonRoadmap();
});

function initPythonRoadmap() {
    const container = document.getElementById('roadmap-content');
    if (!container) return;

    const pythonCurriculum = [
        { title: "PHASE_01: Syntax_&_Foundations", desc: "Variables, types, and f-strings.", modules: ["Variables & Types", "String Formatting", "Type Casting"] },
        { title: "PHASE_02: Control_Flow", desc: "Logic branching and loops.", modules: ["If/Else Statements", "For & While Loops", "Match-Case"] },
        { title: "PHASE_03: Data_Structures", desc: "Lists, Dictionaries, and Sets.", modules: ["List Slicing", "Dict Comprehensions", "Mutability"] },
        { title: "PHASE_04: Functions_&_Functional", desc: "Scope, args, and lambdas.", modules: ["*args & **kwargs", "Lambda Functions", "Generators"] },
        { title: "PHASE_05: Object_Oriented", desc: "Classes and Inheritance.", modules: ["Class Attributes", "Polymorphism", "Dunder Methods"] },
        { title: "PHASE_06: File_IO_&_Error", desc: "Context managers and exceptions.", modules: ["With Statements", "Custom Exceptions", "JSON Handling"] },
        { title: "PHASE_07: Advanced_Libraries", desc: "Data science and web basics.", modules: ["NumPy Basics", "Pandas DataFrames", "Requests API"] }
    ];

    container.innerHTML = ''; // Clear loading text

    pythonCurriculum.forEach((phase, index) => {
        const side = index % 2 === 0 ? 'left' : 'right';
        const node = document.createElement('div');
        node.className = `chapter-node ${side}`;
        
        node.innerHTML = `
            <div class="node-header">
                <h3>${phase.title}</h3>
                <button class="toggle-btn" onclick="togglePythonModule(this)">+</button>
            </div>
            <div class="chapter-details">
                <p class="phase-desc">${phase.desc}</p>
                <div class="module-list">
                    ${phase.modules.map(m => `<a href="#" class="module-link">> ${m}</a>`).join('')}
                </div>
            </div>
        `;
        container.appendChild(node);
    });

    animatePythonRoadmap(); //
}

function togglePythonModule(btn) {
    const details = btn.parentElement.nextElementSibling;
    btn.classList.toggle('active');
    details.classList.toggle('open');
    btn.innerText = btn.classList.contains('active') ? '×' : '+';
}

function animatePythonRoadmap() {
    gsap.from('.chapter-node', {
        scrollTrigger: { trigger: '.roadmap-wrapper', start: "top 80%" },
        opacity: 0,
        y: 50,
        stagger: 0.2,
        duration: 0.8
    });
}