const REPO_OWNER = 'sayeeg-11';
const REPO_NAME = 'Pixel_Phantoms';
const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
const EVENT_DATA_URL = './data/attendance.csv';

// Enhanced Scoring System with XP values
const SCORING = {
    PR: {
        L3: 11,    // High Complexity
        L2: 5,     // Medium Complexity
        L1: 2,     // Low Complexity
        DEFAULT: 1 // Standard PR
    },
    
};

// League Definitions for Logic
const LEAGUES = {
    GOLD: { threshold: 15000, name: 'Gold Class', color: '#FFD700' },
    SILVER: { threshold: 7500, name: 'Silver Class', color: '#C0C0C0' },
    BRONZE: { threshold: 3000, name: 'Bronze Class', color: '#CD7F32' },
    ROOKIE: { threshold: 0, name: 'Rookie Agent', color: '#00aaff' }
};

document.addEventListener('DOMContentLoaded', () => {
    initLeaderboard();
});

async function initLeaderboard() {
    const container = document.getElementById('lb-rows');
    try {
        // Fetch all required data in parallel
        const [pulls, csvText] = await Promise.all([
            fetchAllPulls(),
            fetchEventCSV()
        ]);
        
        // Process data
        const attendanceData = parseAttendanceCSV(csvText);
        const leaderboard = calculateLeaderboard(pulls, attendanceData);
        const topContributors = getTopContributors(leaderboard);
        
        renderLeaderboard(topContributors);
    } catch (error) {
        console.error("Leaderboard Sync Failed:", error);
        if(container) container.innerHTML = `<div style="padding:20px; text-align:center; color:#ff5f56;">Connection Lost. Retrying uplink...</div>`;
    }
}

async function fetchAllPulls() {
    let pulls = [];
    let page = 1;
    while (page <= 3) {
        try {
            const res = await fetch(`${API_BASE}/pulls?state=all&per_page=100&page=${page}`);
            if (!res.ok) break;
            const data = await res.json();
            if (!data.length) break;
            pulls = pulls.concat(data);
            page++;
        } catch (e) { break; }
    }
    return pulls;
}

// New function to fetch event attendance data
async function fetchEventCSV() {
    try {
        const res = await fetch(EVENT_DATA_URL);
        if(!res.ok) return ""; 
        return await res.text();
    } catch (e) { return ""; }
}

// New function to parse attendance CSV
function parseAttendanceCSV(csvText) {
    const attendanceMap = {};
    
    if (!csvText) return attendanceMap;

    const lines = csvText.split('\n');
    
    lines.slice(1).forEach(line => { // Skip header
        // CSV Format: GitHubUsername,Date,EventName
        const parts = line.split(',');
        if (parts.length >= 3) {
            const username = parts[0].trim();
            
            if (username) {
                // Track User Attendance
                attendanceMap[username] = (attendanceMap[username] || 0) + 1;
            }
        }
    });

    return attendanceMap;
}

// Enhanced leaderboard calculation incorporating both PRs and events
function calculateLeaderboard(pulls, attendanceMap) {
    const userMap = {};

    // Process Pull Requests
    pulls.forEach(pr => {
        if (!pr.merged_at) return; // Only merged PRs count
        
        const user = pr.user.login;
        if (user.toLowerCase() === REPO_OWNER.toLowerCase()) return; // Exclude owner from ranking

        if (!userMap[user]) {
            userMap[user] = {
                login: user,
                xp: 0,
                prCount: 0,
                events: 0
            };
        }

        // Award XP based on PR labels
        let prPoints = SCORING.PR.DEFAULT;
        let hasLevel = false;

        pr.labels.forEach(label => {
            const name = label.name.toLowerCase();
            if (name.includes('level 3')) { prPoints = SCORING.PR.L3; hasLevel = true; }
            else if (name.includes('level 2')) { prPoints = SCORING.PR.L2; hasLevel = true; }
            else if (name.includes('level 1')) { prPoints = SCORING.PR.L1; hasLevel = true; }
        });

        userMap[user].xp += prPoints;
        userMap[user].prCount++;
    });

    // Process Event Attendance
    Object.keys(attendanceMap).forEach(user => {
        // If user attended events but has no PRs, initialize them
        if (!userMap[user]) {
            userMap[user] = {
                login: user,
                xp: 0,
                prCount: 0,
                events: 0
            };
        }
        
        const eventsAttended = attendanceMap[user];
        const eventXP = eventsAttended * SCORING.EVENT.ATTENDANCE;
        
        userMap[user].xp += eventXP;
        userMap[user].events += eventsAttended;
    });

    return Object.values(userMap);
}

function getTopContributors(leaderboard) {
    return leaderboard
        .sort((a, b) => b.xp - a.xp)
        .slice(0, 5); // Show Top 5 on Homepage
}

function getLeagueInfo(xp) {
    if (xp >= LEAGUES.GOLD.threshold) return LEAGUES.GOLD;
    if (xp >= LEAGUES.SILVER.threshold) return LEAGUES.SILVER;
    if (xp >= LEAGUES.BRONZE.threshold) return LEAGUES.BRONZE;
    return LEAGUES.ROOKIE;
}

function renderLeaderboard(contributors) {
    const container = document.getElementById('lb-rows');
    if (!container) return;
    
    container.innerHTML = ''; // Clear loader

    if (contributors.length === 0) {
        container.innerHTML = `<div style="padding:20px; text-align:center;">No active agents found. Be the first!</div>`;
        return;
    }

    contributors.forEach((contributor, index) => {
        const rank = index + 1;
        const league = getLeagueInfo(contributor.xp);
        
        const row = document.createElement('div');
        row.className = `lb-row rank-${rank}`;
        
        // Enhanced display showing both PRs and events
        row.innerHTML = `
            <div class="lb-rank">
                <div class="lb-rank-badge">${rank}</div>
            </div>
            <div class="lb-user-info">
                <span class="lb-username">@${contributor.login}</span>
                <span class="lb-stats">PRs: ${contributor.prCount} | Events: ${contributor.events}</span>
                <span class="lb-league-tag" style="color: ${league.color}">${league.name}</span>
            </div>
            <div class="lb-xp-val">
                ${contributor.xp.toLocaleString()} XP
            </div>
        `;
        
        container.appendChild(row);
        
        // Add subtle entrance animation
        row.style.opacity = 0;
        row.style.transform = "translateY(10px)";
        setTimeout(() => {
            row.style.transition = "all 0.5s ease";
            row.style.opacity = 1;
            row.style.transform = "translateY(0)";
        }, index * 100);
    });
}