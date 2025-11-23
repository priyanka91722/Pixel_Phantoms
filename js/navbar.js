function renderNavbar(basePath = '') {
    const navbarHTML = `
    <nav class="navbar">
        <div class="logo">
            <img src="${basePath}assets/logo.png" alt="Pixel Phantoms Logo">
            <span>Pixel Phantoms</span>
        </div>
        <ul class="nav-links">
            <li><a href="${basePath}index.html">Home</a></li>
            <li><a href="${basePath}about.html">About</a></li>
            <li><a href="${basePath}pages/contributors.html">Contributors</a></li> 
            <li><a href="${basePath}contact.html">Contact</a></li>
            <li>
                <div class="theme-toggle">
                    <input type="checkbox" id="theme-switch" class="theme-switch">
                    <label for="theme-switch" class="theme-label">
                        <div class="toggle-thumb"></div>
                        <span class="sun-icon">☀️</span>
                        <span class="moon-icon">🌙</span>
                    </label>
                </div>
            </li>
        </ul>
    </nav>
    `;
    document.getElementById('navbar-placeholder').innerHTML = navbarHTML;
}