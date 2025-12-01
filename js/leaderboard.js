/* =========================================
   PIXEL PHANTOMS | GLOBAL COMMAND CENTER
   Core Logic: GitHub API + CSV Event Data + HUD Navigation
   ========================================= */

const REPO_OWNER = 'sayeeg-11';
const REPO_NAME = 'Pixel_Phantoms';
const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
const EVENT_DATA_URL = '../data/attendance.csv';

// --- SCORING MATRIX (Inspired by Contributors.js) ---
// Scaled up for "XP" feel
const SCORING = {
    PR: {
        L3: 1100,    // High Complexity (was 11)
        L2: 500,     // Medium Complexity (was 5)
        L1: 200,     // Low Complexity (was 2)
        DEFAULT: 100
    },
    EVENT: {
        ATTENDANCE: 250, // Points per event attended
        HOSTING: 500     // Points for hosting (derived logic if needed)
    }
};

// --- STATE MANAGEMENT ---
let globalState = {
    contributors: [],
    pullRequests: [],
    attendance: {}, // Map<username, count>
    eventStats: {
        totalEvents: 0,
        totalAttendance: 0
    },
    physics: {
        totalMass: 0,
        avgVelocity: 0
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    initNavigation();
    init3DInteraction();
});

/* =========================================
   1. NAVIGATION SYSTEM (HUD TABS)
   ========================================= */
function initNavigation() {
    const buttons = document.querySelectorAll('.sidebar-icon');
    const sections = document.querySelectorAll('.hud-section');
    const title = document.getElementById('page-title');
    const subtitle = document.getElementById('page-subtitle');

    const titles = {
        'dashboard-view': { t: 'PERFORMANCE_MATRIX', s: ':: SYSTEM_OVERRIDE // EVENT_PROTOCOL_V2 ::' },
        'teams-view':     { t: 'AGENT_ROSTER', s: ':: CLASSIFIED PERSONNEL DATABASE ::' },
        'projects-view':  { t: 'PROJECT_SCHEMATICS', s: ':: R&D ARCHIVES ::' },
        'settings-view':  { t: 'SYSTEM_CONFIG', s: ':: ROOT ACCESS REQUIRED ::' }
    };

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            buttons.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            // Add active to current
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) targetSection.classList.add('active');

            // Update Header Text
            if (titles[targetId] && title && subtitle) {
                // Optional glitch effect reset could go here
                title.setAttribute('data-text', titles[targetId].t);
                title.innerText = titles[targetId].t;
                subtitle.innerText = titles[targetId].s;
            }
        });
    });
}

/* =========================================
   2. DATA AGGREGATION SYSTEM
   ========================================= */
async function initDashboard() {
    const tableBody = document.getElementById('leaderboard-body');
    if(tableBody) tableBody.innerHTML = '<tr><td colspan="6" class="loading-text">INITIALIZING DATA STREAMS...</td></tr>';

    try {
        // Parallel Data Fetching
        const [repoData, prData, csvText] = await Promise.all([
            fetch(API_BASE).then(res => res.json()),
            fetchAllPulls(),
            fetchEventCSV()
        ]);

        // Process Data
        const attendanceData = parseAttendanceCSV(csvText);
        globalState.attendance = attendanceData.map;
        globalState.eventStats = attendanceData.stats;
        globalState.pullRequests = prData;

        // Calculate Scores
        const leaderboard = calculateLeaderboard(prData, globalState.attendance);
        
        // Render UI Components
        updateGlobalHUD(leaderboard, globalState.eventStats);
        renderLeaderboardTable(leaderboard);
        renderPhysicsEngine(leaderboard);
        renderVisualizers(leaderboard);
        
        // Render Roster (Teams View)
        populateRoster(leaderboard);

    } catch (error) {
        console.warn("⚠️ System Offline or Rate Limited. engaging_mock_protocol();", error);
        loadMockProtocol();
    }
}

// --- GITHUB API: FETCH ALL PRS ---
async function fetchAllPulls() {
    let pulls = [];
    let page = 1;
    // Limit to 3 pages to prevent API lockout during demo/dev
    while (page <= 3) {
        try {
            const res = await fetch(`${API_BASE}/pulls?state=all&per_page=100&page=${page}`);
            if (!res.ok) break;
            const data = await res.json();
            if (!data.length) break;
            pulls = pulls.concat(data);
            page++;
        } catch(e) { break; }
    }
    return pulls;
}

// --- CSV HANDLER ---
async function fetchEventCSV() {
    try {
        const res = await fetch(EVENT_DATA_URL);
        if(!res.ok) return ""; 
        return await res.text();
    } catch (e) { return ""; }
}

function parseAttendanceCSV(csvText) {
    const attendanceMap = {};
    const uniqueEvents = new Set();
    let totalAttendance = 0;

    if (!csvText) return { map: attendanceMap, stats: { totalEvents: 0, totalAttendance: 0 } };

    const lines = csvText.split('\n');
    
    lines.slice(1).forEach(line => { // Skip header
        // CSV Format: GitHubUsername,Date,EventName
        const parts = line.split(',');
        if (parts.length >= 3) {
            const username = parts[0].trim();
            const eventName = parts[2].trim();
            
            if (username && eventName) {
                // Track User Attendance
                attendanceMap[username] = (attendanceMap[username] || 0) + 1;
                
                // Global Stats
                uniqueEvents.add(eventName);
                totalAttendance++;
            }
        }
    });

    return {
        map: attendanceMap,
        stats: {
            totalEvents: uniqueEvents.size,
            totalAttendance: totalAttendance
        }
    };
}

/* =========================================
   3. SCORING & PHYSICS ALGORITHM
   ========================================= */
function calculateLeaderboard(pulls, attendanceMap) {
    const userMap = {};

    // Date for Velocity Calculation (e.g., last 60 days)
    const recentCutoff = new Date();
    recentCutoff.setDate(recentCutoff.getDate() - 60);

    // A. Process Pull Requests
    pulls.forEach(pr => {
        if (!pr.merged_at) return; // Only merged PRs count
        
        const user = pr.user.login;
        if (user.toLowerCase() === REPO_OWNER.toLowerCase()) return; // Optional: Exclude owner from ranking

        if (!userMap[user]) initUser(userMap, user, pr.user.avatar_url);

        // -- Mass Calculation (Complexity based on labels) --
        let prPoints = SCORING.PR.DEFAULT;
        let massGain = 5; // Base mass

        pr.labels.forEach(label => {
            const name = label.name.toLowerCase();
            if (name.includes('level 3')) { prPoints = SCORING.PR.L3; massGain = 30; }
            else if (name.includes('level 2')) { prPoints = SCORING.PR.L2; massGain = 15; }
            else if (name.includes('level 1')) { prPoints = SCORING.PR.L1; massGain = 10; }
        });

        userMap[user].xp += prPoints;
        userMap[user].mass += massGain;
        userMap[user].prCount++;

        // -- Velocity Calculation (Recent Activity) --
        if (new Date(pr.merged_at) > recentCutoff) {
            userMap[user].velocity += 10; // Speed boost for recency
        }
    });

    // B. Process Event Attendance
    Object.keys(attendanceMap).forEach(user => {
        // If user attended but has no PRs, init them
        if (!userMap[user]) {
            initUser(userMap, user, `https://github.com/${user}.png`);
        }
        
        const eventsAttended = attendanceMap[user];
        const eventXP = eventsAttended * SCORING.EVENT.ATTENDANCE;
        
        userMap[user].xp += eventXP;
        userMap[user].events += eventsAttended;
        // Events add momentum (Mass + Velocity impact)
        userMap[user].mass += (eventsAttended * 2); 
        userMap[user].velocity += (eventsAttended * 5); 
    });

    // C. Finalize & Sort
    const leaderboard = Object.values(userMap).sort((a, b) => b.xp - a.xp);
    
    // Assign Ranks, Classes & Status
    return leaderboard.map((agent, index) => {
        agent.rank = index + 1;
        
        // Determine Class (Role)
        if (agent.mass > 100) agent.class = 'TITAN'; // Heavy contributor
        else if (agent.velocity > 50) agent.class = 'STRIKER'; // Fast contributor
        else if (agent.events > 3) agent.class = 'SCOUT'; // Community active
        else agent.class = 'ROOKIE';

        // Determine Status
        if (agent.velocity > 80) agent.status = 'OVERDRIVE';
        else if (agent.velocity > 20) agent.status = 'ONLINE';
        else agent.status = 'IDLE';

        return agent;
    });
}

function initUser(map, login, avatar) {
    map[login] = {
        login,
        avatar,
        xp: 0,
        mass: 0,      
        velocity: 0,  
        events: 0,
        prCount: 0
    };
}

/* =========================================
   4. RENDERING & UI UPDATES
   ========================================= */

function updateGlobalHUD(data, eventStats) {
    animateCount('total-performers', data.length);
    animateCount('total-events', eventStats.totalEvents);
    animateCount('total-attendance', eventStats.totalAttendance);
    
    // Fake Ping Update
    setInterval(() => {
        const ping = Math.floor(Math.random() * 20) + 10;
        const pingEl = document.getElementById('ping-counter');
        if(pingEl) {
            pingEl.innerText = `${ping}ms`;
            pingEl.style.color = ping > 30 ? '#ff0055' : '#0aff60';
        }
    }, 2000);
}

function renderLeaderboardTable(data) {
    const tbody = document.getElementById('leaderboard-body');
    if(!tbody) return;
    tbody.innerHTML = '';

    // Show top 50
    data.slice(0, 50).forEach(agent => {
        const row = document.createElement('tr');
        
        // Dynamic colors based on status/class
        let classColor = '#00f3ff'; // Default Cyan
        if(agent.class === 'TITAN') classColor = '#ff0055'; // Pink
        if(agent.class === 'STRIKER') classColor = '#ffd700'; // Gold

        const velPercent = Math.min(agent.velocity, 100);

        row.innerHTML = `
            <td class="rank-cell">#${String(agent.rank).padStart(2,'0')}</td>
            <td class="agent-cell">
                <img src="${agent.avatar}" onerror="this.src='../assets/logo.png'">
                <div>
                    <span class="agent-name">${agent.login}</span>
                    <span class="agent-sub">Events: ${agent.events} | PRs: ${agent.prCount}</span>
                </div>
            </td>
            <td style="color:${classColor}; font-weight:800; letter-spacing:1px;">${agent.class}</td>
            <td class="velocity-cell">
                <div class="v-bar-bg" title="Velocity: ${agent.velocity}">
                    <div class="v-bar-fill" style="width:${velPercent}%"></div>
                </div>
            </td>
            <td class="xp-cell">${agent.xp.toLocaleString()}</td>
            <td><span class="status-badge ${agent.status.toLowerCase()}">${agent.status}</span></td>
        `;
        tbody.appendChild(row);
    });

    // Search Feature
    const searchInput = document.getElementById('search-input');
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const rows = tbody.querySelectorAll('tr');
            rows.forEach(row => {
                const text = row.innerText.toLowerCase();
                row.style.display = text.includes(term) ? '' : 'none';
            });
        });
    }
}

function renderPhysicsEngine(data) {
    if(!data.length) return;
    const topAgent = data[0];

    // Normalize stats for visualization (relative to top agent or fixed max)
    // Cap bars at 100%
    const maxV = 150; // Arbitrary max velocity
    const maxM = 200; // Arbitrary max mass
    
    const vPct = Math.min((topAgent.velocity / maxV) * 100, 100);
    const mPct = Math.min((topAgent.mass / maxM) * 100, 100); 
    const fPct = 100; // Top agent always impacts max relative to leaderboard context

    const bars = document.querySelectorAll('.physics-stat .bar-fill');
    if(bars.length >= 3) {
        bars[0].style.width = `${vPct}%`; // Velocity
        bars[1].style.width = `${mPct}%`; // Mass
        bars[2].style.width = `${fPct}%`; // Impact
    }
}

function renderVisualizers(data) {
    const container = document.getElementById('chart-bars');
    if(!container) return;
    container.innerHTML = '';
    
    // Visualize Top 20 XP distribution
    const slice = data.slice(0, 20);
    if(slice.length === 0) return;
    
    const maxScore = slice[0].xp;

    slice.forEach((agent, i) => {
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        const height = Math.max((agent.xp / maxScore) * 100, 5); // Min 5% height
        bar.style.height = `${height}%`;
        bar.style.animationDelay = `${i * 0.05}s`;
        bar.title = `${agent.login}: ${agent.xp} XP`;
        container.appendChild(bar);
    });
}

function populateRoster(data) {
    const goldList = document.getElementById('roster-gold');
    const silverList = document.getElementById('roster-silver');
    const bronzeList = document.getElementById('roster-bronze');
    
    if (!goldList || !silverList || !bronzeList) return;
    
    goldList.innerHTML = ''; silverList.innerHTML = ''; bronzeList.innerHTML = '';

    data.forEach(agent => {
        const item = document.createElement('li');
        item.className = 'roster-item';
        item.innerHTML = `
            <img src="${agent.avatar}" onerror="this.src='../assets/logo.png'">
            <div>
                <strong style="color:#e0f7ff; display:block; font-size:0.9rem;">${agent.login}</strong>
                <span style="font-size:0.7rem; color:#5c7080;">${agent.xp} XP</span>
            </div>
        `;

        // Logic for Roster Tiers
        if (agent.xp >= 5000) goldList.appendChild(item);
        else if (agent.xp >= 2000) silverList.appendChild(item);
        else bronzeList.appendChild(item);
    });
}

/* =========================================
   5. 3D INTERACTION LOGIC
   ========================================= */
function init3DInteraction() {
    const container = document.querySelector('.stage-3d-panel');
    const cube = document.getElementById('cube');

    if (!container || !cube) return;

    container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left; 
        const y = e.clientY - rect.top; 
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateY = ((x - centerX) / centerX) * 45; 
        const rotateX = -((y - centerY) / centerY) * 45;

        cube.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    container.addEventListener('mouseleave', () => {
        cube.style.transform = `rotateX(-20deg) rotateY(-30deg)`; // Reset position
    });
}

/* =========================================
   UTILS & MOCK DATA (Fallback)
   ========================================= */
function animateCount(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    let start = 0;
    const duration = 2000;
    let startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        // Ease-out cubic
        const ease = 1 - Math.pow(1 - progress, 3);
        
        el.innerHTML = Math.floor(ease * target).toLocaleString();
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    }
    window.requestAnimationFrame(step);
}

function loadMockProtocol() {
    // Fallback data if API fails
    const mockData = [
        { login: "Neo_One", avatar_url: "", xp: 15000, velocity: 90, mass: 80, prCount: 15, events: 5, rank: 1, class: "TITAN", status: "OVERDRIVE" },
        { login: "Trinity", avatar_url: "", xp: 12500, velocity: 75, mass: 50, prCount: 12, events: 4, rank: 2, class: "STRIKER", status: "ONLINE" },
        { login: "Morpheus", avatar_url: "", xp: 9800, velocity: 40, mass: 60, prCount: 20, events: 1, rank: 3, class: "TITAN", status: "ONLINE" },
        { login: "Cipher", avatar_url: "", xp: 5000, velocity: 10, mass: 20, prCount: 5, events: 8, rank: 4, class: "SCOUT", status: "IDLE" },
        { login: "Switch", avatar_url: "", xp: 3200, velocity: 85, mass: 10, prCount: 8, events: 0, rank: 5, class: "STRIKER", status: "ONLINE" },
    ];
    
    const mockStats = { totalEvents: 15, totalAttendance: 450 };
    
    updateGlobalHUD(mockData, mockStats);
    renderLeaderboardTable(mockData);
    renderPhysicsEngine(mockData);
    renderVisualizers(mockData);
    populateRoster(mockData);
}