
// ===== Global cursor ambient glow (page-wide) =====
(function () {
    const glow = document.getElementById("cursor-glow");
    if (!glow) return;
    let tx = window.innerWidth / 2,
        ty = window.innerHeight / 2;
    let cx = tx,
        cy = ty;
    let started = false;
    const lerp = (a, b, t) => a + (b - a) * t;
    function tick() {
        cx = lerp(cx, tx, 0.07);
        cy = lerp(cy, ty, 0.07);
        glow.style.left = cx + "px";
        glow.style.top = cy + "px";
        requestAnimationFrame(tick);
    }
    document.addEventListener("mousemove", (e) => {
        tx = e.clientX;
        ty = e.clientY;
        if (!started) {
            started = true;
            glow.classList.add("active");
            tick();
        }
    });
})();

// Scroll reveal for sections
const sectionObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("reveal");
                sectionObserver.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.15 },
);

document
    .querySelectorAll("section")
    .forEach((section) => sectionObserver.observe(section));
document
    .querySelectorAll(".fade-in")
    .forEach((el) => sectionObserver.observe(el));

// About text — blur-fade-slide reveal (repeats every scroll)
const aboutText = document.querySelector(".about-text");
if (aboutText) {
    const aboutObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("about-reveal");
                } else {
                    entry.target.classList.remove("about-reveal");
                }
            });
        },
        { threshold: 0.2 },
    );
    aboutObserver.observe(aboutText);
}

// Design Focus items — staggered blur-fade-slide (repeats every scroll)
const focusObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("focus-reveal");
            } else {
                entry.target.classList.remove("focus-reveal");
            }
        });
    },
    { threshold: 0.25 },
);
document
    .querySelectorAll(".focus-item")
    .forEach((item) => focusObserver.observe(item));

// Scroll reveal for skill cards and title
const skillCards = document.querySelectorAll(".skill-card");
const skillTitle = document.getElementById("skills-title");
const skillObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                if (entry.target.classList.contains("skill-card")) {
                    const idx = Array.from(skillCards).indexOf(entry.target);
                    entry.target.style.transitionDelay = `${idx * 0.1}s`;
                }
                entry.target.classList.add("visible");
                skillObserver.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.15 },
);

if (skillTitle) skillObserver.observe(skillTitle);
skillCards.forEach((card) => {
    skillObserver.observe(card);

    const rotateAmplitude = 20; // Increased for better visibility
    const scaleOnHover = 1.08;

    card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Glow effect variables
        card.style.setProperty("--mouse-x", `${(x / rect.width) * 100}%`);
        card.style.setProperty("--mouse-y", `${(y / rect.height) * 100}%`);

        // Tilt math
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const offsetX = x - centerX;
        const offsetY = y - centerY;

        const rotationX = (offsetY / centerY) * -rotateAmplitude;
        const rotationY = (offsetX / centerX) * rotateAmplitude;

        // Apply fast tracking (removing transition during move for snappiness)
        card.style.transition = "none";
        card.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg) scale(${scaleOnHover})`;
    });

    card.addEventListener("mouseleave", () => {
        // Smooth return transition
        card.style.transition = "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.4s ease, background 0.4s ease";
        card.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
    });
});

document.getElementById("year").textContent = new Date().getFullYear();

// Experience Carousel Logic
const expCards = document.querySelectorAll(".exp-card");
const prevBtn = document.querySelector(".carousel-btn.prev");
const nextBtn = document.querySelector(".carousel-btn.next");
let activeIdx = 0;

function updateCarousel() {
    expCards.forEach((card, i) => {
        card.classList.remove("active", "prev", "next", "hidden");

        if (i === activeIdx) {
            card.classList.add("active");
        } else if (
            i ===
            (activeIdx - 1 + expCards.length) % expCards.length
        ) {
            card.classList.add("prev");
        } else if (i === (activeIdx + 1) % expCards.length) {
            card.classList.add("next");
        } else {
            card.classList.add("hidden");
        }
    });
}

if (prevBtn && nextBtn) {
    prevBtn.addEventListener("click", () => {
        activeIdx = (activeIdx - 1 + expCards.length) % expCards.length;
        updateCarousel();
    });

    nextBtn.addEventListener("click", () => {
        activeIdx = (activeIdx + 1) % expCards.length;
        updateCarousel();
    });
}

// Initialize carousel
if (expCards.length > 0) updateCarousel();

// --- Generic Project Overlay Logic (Click-to-Open & Glide-Away Close) ---
function initProjectOverlay(cardId, overlayId) {
    const card = document.getElementById(cardId);
    const backdrop = document.getElementById(overlayId);
    if (!card || !backdrop) return;

    const container = backdrop.querySelector(".overlay-container");
    const content = backdrop.querySelector(".overlay-content");
    let closeTimeout;

    function open(e) {
        if (e) e.stopPropagation();
        clearTimeout(closeTimeout);
        backdrop.classList.add("active");
        backdrop.setAttribute("aria-hidden", "false");
        if (content) content.scrollTop = 0;
    }

    function close(immediate = false) {
        clearTimeout(closeTimeout);
        const delay = immediate ? 0 : 250;
        closeTimeout = setTimeout(() => {
            backdrop.classList.remove("active");
            backdrop.setAttribute("aria-hidden", "true");
        }, delay);
    }

    // Card triggers
    card.addEventListener("click", open);

    // Internal container tracking
    if (container) {
        container.addEventListener("mouseenter", () =>
            clearTimeout(closeTimeout),
        );
    }

    // Backdrop click to close
    backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) close(true);
    });

    // Close button logic
    const closeBtn = backdrop.querySelector(".overlay-close-btn");
    if (closeBtn) {
        closeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            close(true);
        });
    }

    // Cursor glow inside the card (generic listener)
    card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty("--mouse-x", `${x}%`);
        card.style.setProperty("--mouse-y", `${y}%`);
    });

    // Parallax Tilt for the container
    if (container) {
        backdrop.addEventListener("mousemove", (e) => {
            if (!backdrop.classList.contains("active")) return;
            const rect = container.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const mouseX = (e.clientX - centerX) / (window.innerWidth / 2);
            const mouseY = (e.clientY - centerY) / (window.innerHeight / 2);
            container.style.transform = `translateY(0) rotateX(${mouseY * -2}deg) rotateY(${mouseX * 2}deg)`;
        });
    }
}

// Initialize all interactive projects
initProjectOverlay("project-algomox", "algomox-overlay");
initProjectOverlay("project-markflix", "markflix-overlay");
initProjectOverlay("project-collegego", "case-study-overlay");
initProjectOverlay("project-login", "login-overlay");
initProjectOverlay("project-sidebar", "sidebar-overlay");
initProjectOverlay("project-website", "website-overlay");
initProjectOverlay("project-nova", "nova-overlay");
initProjectOverlay("project-novahr", "nova-hr-overlay");

// UI Experiments Carousel Logic
const expProjCards = document.querySelectorAll(
    ".experiment-carousel .project.card",
);
const prevExpBtn = document.querySelector(".prev-exp");
const nextExpBtn = document.querySelector(".next-exp");
let activeExpIdx = 0;

function updateExpCarousel() {
    expProjCards.forEach((card, i) => {
        card.classList.remove("active", "prev", "next", "hidden");

        if (i === activeExpIdx) {
            card.classList.add("active");
        } else if (
            i ===
            (activeExpIdx - 1 + expProjCards.length) % expProjCards.length
        ) {
            card.classList.add("prev");
        } else if (i === (activeExpIdx + 1) % expProjCards.length) {
            card.classList.add("next");
        } else {
            card.classList.add("hidden");
        }
    });
}

if (prevExpBtn && nextExpBtn) {
    prevExpBtn.addEventListener("click", () => {
        activeExpIdx =
            (activeExpIdx - 1 + expProjCards.length) % expProjCards.length;
        updateExpCarousel();
    });

    nextExpBtn.addEventListener("click", () => {
        activeExpIdx = (activeExpIdx + 1) % expProjCards.length;
        updateExpCarousel();
    });
}

// Mobile Menu Toggle
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const navLinksList = document.querySelectorAll(".nav-links a");

if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
        const expanded = menuToggle.getAttribute("aria-expanded") === "true";
        menuToggle.setAttribute("aria-expanded", !expanded);
        menuToggle.classList.toggle("active");
        navLinks.classList.toggle("active");
    });

    // Close menu when a link is clicked
    navLinksList.forEach((link) => {
        link.addEventListener("click", () => {
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.classList.remove("active");
            navLinks.classList.remove("active");
        });
    });
}

// Initialize experiment carousel
if (expProjCards.length > 0) updateExpCarousel();

// Border Glow Effect
class BorderGlow {
    constructor(container, options = {}) {
        this.container = container;
        this.edgeSensitivity = options.edgeSensitivity || 30;
        this.glowColor = options.glowColor || '40 80 80';
        this.backgroundColor = options.backgroundColor || '#060010';
        this.glowRadius = options.glowRadius || 40;
        this.glowIntensity = options.glowIntensity || 1.0;
        this.coneSpread = options.coneSpread || 25;
        this.colors = options.colors || ['#c084fc', '#f472b6', '#38bdf8'];
        this.fillOpacity = options.fillOpacity || 0.5;

        this.init();
    }

    parseHSL(hslStr) {
        const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
        if (!match) return { h: 40, s: 80, l: 80 };
        return { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) };
    }

    buildGlowVars(glowColor, intensity) {
        const { h, s, l } = this.parseHSL(glowColor);
        const base = `${h}deg ${s}% ${l}%`;
        const opacities = [100, 60, 50, 40, 30, 20, 10];
        const keys = ['', '-60', '-50', '-40', '-30', '-20', '-10'];
        const vars = {};
        for (let i = 0; i < opacities.length; i++) {
            vars[`--glow-color${keys[i]}`] = `hsl(${base} / ${Math.min(opacities[i] * intensity, 100)}%)`;
        }
        return vars;
    }

    buildGradientVars(colors) {
        const positions = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%'];
        const keys = ['--gradient-one', '--gradient-two', '--gradient-three', '--gradient-four', '--gradient-five', '--gradient-six', '--gradient-seven'];
        const map = [0, 1, 2, 0, 1, 2, 1];
        const vars = {};
        for (let i = 0; i < 7; i++) {
            const c = colors[Math.min(map[i], colors.length - 1)];
            vars[keys[i]] = `radial-gradient(at ${positions[i]}, ${c} 0px, transparent 50%)`;
        }
        vars['--gradient-base'] = `linear-gradient(${colors[0]} 0 100%)`;
        return vars;
    }

    init() {
        const glowVars = this.buildGlowVars(this.glowColor, this.glowIntensity);
        const gradVars = this.buildGradientVars(this.colors);
        const allVars = {
            '--card-bg': this.backgroundColor,
            '--edge-sensitivity': this.edgeSensitivity,
            '--glow-padding': `${this.glowRadius}px`,
            '--cone-spread': this.coneSpread,
            '--fill-opacity': this.fillOpacity,
            ...glowVars,
            ...gradVars
        };

        for (const [key, value] of Object.entries(allVars)) {
            this.container.style.setProperty(key, value);
        }

        this.container.addEventListener('pointermove', (e) => this.handlePointerMove(e));
    }

    handlePointerMove(e) {
        const rect = this.container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const dx = x - cx;
        const dy = y - cy;

        // Proximity
        let kx = Infinity;
        let ky = Infinity;
        if (dx !== 0) kx = cx / Math.abs(dx);
        if (dy !== 0) ky = cy / Math.abs(dy);
        const edge = Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);

        // Angle
        let angle = 0;
        if (dx !== 0 || dy !== 0) {
            angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
            if (angle < 0) angle += 360;
        }

        this.container.style.setProperty('--edge-proximity', (edge * 100).toFixed(3));
        this.container.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`);
    }
}

// Initialize BorderGlow
window.addEventListener('load', () => {
    const contactBtn = document.getElementById('contact-glow');
    if (contactBtn) {
        new BorderGlow(contactBtn, {
            edgeSensitivity: 2,
            glowColor: "271 95 75",
            backgroundColor: "#060010",
            glowRadius: 140,
            glowIntensity: 2.2,
            coneSpread: 25,
            colors: ['#c084fc', '#f472b6', '#38bdf8']
        });
    }

    const projectsBtn = document.getElementById('projects-glow');
    if (projectsBtn) {
        new BorderGlow(projectsBtn, {
            edgeSensitivity: 2,
            glowColor: "40 95 60",
            backgroundColor: "#060010",
            glowRadius: 140,
            glowIntensity: 2.2,
            coneSpread: 25,
            colors: ['#C9A84C', '#D4B96A', '#C9A84C']
        });
    }
});

// Variable Proximity Effect Logic (Ported from React)
class VariableProximity {
    constructor(element, options = {}) {
        this.container = element;
        this.radius = options.radius || 100;
        this.fromSettings = options.fromSettings || "'wght' 400";
        this.toSettings = options.toSettings || "'wght' 1000";
        this.falloff = options.falloff || 'linear';
        this.className = options.className || '';

        this.letterRefs = [];
        this.mousePos = { x: 0, y: 0 };
        this.lastPosition = { x: null, y: null };

        this.parsedSettings = this.parseSettings(this.fromSettings, this.toSettings);
        this.splitText();
        this.init();
    }

    parseSettings(fromStr, toStr) {
        const parse = s =>
            new Map(
                s.split(',')
                    .map(v => v.trim())
                    .filter(v => v)
                    .map(v => {
                        const parts = v.split(' ');
                        const value = parseFloat(parts.pop());
                        const name = parts.join(' ').replace(/['"]/g, '');
                        return [name, value];
                    })
            );

        const fromMap = parse(fromStr);
        const toMap = parse(toStr);

        return Array.from(fromMap.entries()).map(([axis, fromValue]) => ({
            axis,
            fromValue,
            toValue: toMap.get(axis) ?? fromValue
        }));
    }

    splitText() {
        const processNode = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.nodeValue;
                const parent = node.parentElement;
                const isAccent = parent && parent.classList.contains('hero-accent');
                const fragment = document.createDocumentFragment();

                const words = text.split(/(\s+)/);
                words.forEach(word => {
                    if (word === '') return;
                    if (word.trim() === '') {
                        fragment.appendChild(document.createTextNode(word));
                        return;
                    }

                    const wordSpan = document.createElement('span');
                    wordSpan.style.display = 'inline-block';
                    wordSpan.style.whiteSpace = 'nowrap';

                    word.split('').forEach(char => {
                        const charSpan = document.createElement('span');
                        charSpan.textContent = char;
                        charSpan.className = `vp-letter ${this.className}`;
                        if (isAccent) charSpan.classList.add('hero-accent');
                        charSpan.style.display = 'inline-block';
                        wordSpan.appendChild(charSpan);
                        this.letterRefs.push(charSpan);
                    });
                    fragment.appendChild(wordSpan);
                });
                return fragment;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName === 'BR') {
                    return document.createElement('br');
                }
                const newElement = node.cloneNode(false);
                Array.from(node.childNodes).forEach(child => {
                    const result = processNode(child);
                    if (result) newElement.appendChild(result);
                });
                return newElement;
            }
            return null;
        };

        const originalContent = Array.from(this.container.childNodes);
        const originalText = this.container.innerText;
        this.container.innerHTML = '';

        originalContent.forEach(child => {
            const result = processNode(child);
            if (result) this.container.appendChild(result);
        });

        // Accessibility hidden label
        const srOnly = document.createElement('span');
        srOnly.className = 'sr-only';
        srOnly.textContent = originalText;
        this.container.appendChild(srOnly);
    }

    init() {
        const updatePosition = (clientX, clientY) => {
            const rect = this.container.getBoundingClientRect();
            this.mousePos.x = clientX - rect.left;
            this.mousePos.y = clientY - rect.top;
        };

        window.addEventListener('mousemove', e => updatePosition(e.clientX, e.clientY));
        window.addEventListener('touchmove', e => updatePosition(e.touches[0].clientX, e.touches[0].clientY));

        const loop = () => {
            this.update();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    calculateFalloff(distance) {
        const norm = Math.min(Math.max(1 - distance / this.radius, 0), 1);
        switch (this.falloff) {
            case 'exponential': return Math.pow(norm, 2);
            case 'gaussian': return Math.exp(-((distance / (this.radius / 2)) ** 2) / 2);
            case 'linear':
            default: return norm;
        }
    }

    update() {
        const { x, y } = this.mousePos;
        if (this.lastPosition.x === x && this.lastPosition.y === y) return;
        this.lastPosition = { x, y };

        const containerRect = this.container.getBoundingClientRect();

        this.letterRefs.forEach(letter => {
            const rect = letter.getBoundingClientRect();
            const letterCenterX = rect.left + rect.width / 2 - containerRect.left;
            const letterCenterY = rect.top + rect.height / 2 - containerRect.top;

            const distance = Math.sqrt((x - letterCenterX) ** 2 + (y - letterCenterY) ** 2);

            if (distance >= this.radius) {
                letter.style.fontVariationSettings = this.fromSettings;
                return;
            }

            const falloffValue = this.calculateFalloff(distance);
            const settings = this.parsedSettings.map(({ axis, fromValue, toValue }) => {
                const val = fromValue + (toValue - fromValue) * falloffValue;
                return `'${axis}' ${val}`;
            }).join(', ');

            letter.style.fontVariationSettings = settings;
        });
    }
}

window.addEventListener('load', () => {
    console.log("VariableProximity: Page Load Triggered");
    // Initialize hero title proximity
    const heroTitle = document.getElementById('home-title');
    if (heroTitle) {
        console.log("VariableProximity: Found #home-title, initializing...");
        new VariableProximity(heroTitle, {
            radius: 120,
            fromSettings: "'wght' 400, 'opsz' 9",
            toSettings: "'wght' 1000, 'opsz' 40",
            falloff: 'linear'
        });
    }

    // --- Typewriter Logic ---
    const typingContainer = document.getElementById('typing-text');
    const phrases = [
        "Designing effortless experiences.",
        "Building interfaces that perform.",
        "Turning ideas into real products.",
        "Where creativity meets clean code."
    ];

    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 30; // Faster typing speed (was 40)

    function type() {
        const fullText = phrases[phraseIndex];

        if (isDeleting) {
            typingContainer.textContent = fullText.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 15; // Faster deleting speed (was 20)
        } else {
            typingContainer.textContent = fullText.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 30; // Faster typing speed
        }

        if (!isDeleting && charIndex === fullText.length) {
            isDeleting = true;
            typingSpeed = 2000; // Pause at end of sentence
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            typingSpeed = 400; // Pause before next sentence
        }

        setTimeout(type, typingSpeed);
    }

    if (typingContainer) {
        setTimeout(type, 800); // Starts almost immediately (reduced from 3800)
    }

    // --- Tilted Card Logic ---
    const tiltedCard = document.getElementById('hero-tilt-card');
    const inner = tiltedCard.querySelector('.tilted-card-inner');

    let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
    let rotateAmplitude = 6;
    let lerpFactor = 0.1;

    tiltedCard.addEventListener('mousemove', (e) => {
        const rect = tiltedCard.getBoundingClientRect();
        const offsetX = e.clientX - rect.left - rect.width / 2;
        const offsetY = e.clientY - rect.top - rect.height / 2;

        targetX = (offsetY / (rect.height / 2)) * -rotateAmplitude;
        targetY = (offsetX / (rect.width / 2)) * rotateAmplitude;
    });

    tiltedCard.addEventListener('mouseleave', () => {
        targetX = 0;
        targetY = 0;
    });

    function animateTilt() {
        currentX += (targetX - currentX) * lerpFactor;
        currentY += (targetY - currentY) * lerpFactor;

        const activeScale = tiltedCard.matches(':hover') ? 1.05 : 1;
        inner.style.transform = `rotateX(${currentX}deg) rotateY(${currentY}deg) scale(${activeScale})`;

        requestAnimationFrame(animateTilt);
    }
    animateTilt();

    // --- Vertical Scroll Sidebar Visibility & ScrollSpy ---
    const scrollNav = document.getElementById('scroll-nav');
    const navLinks = document.querySelectorAll('.scroll-nav-link');
    const sections = document.querySelectorAll('section[id]');
    const trigger = document.getElementById('side-nav-trigger');

    let isMouseNearEdge = false;
    let isMouseOverNav = false;
    let isNavLocked = false;
    let closingTimeout;

    function updateNavVisibility() {
        // Show if mouse is near edge OR over the nav OR locked
        if (isMouseNearEdge || isMouseOverNav || isNavLocked) {
            if (closingTimeout) clearTimeout(closingTimeout);
            scrollNav.classList.add('visible');
            trigger.classList.add('sidebar-open');
        } else {
            // Delayed close only when completely clear
            if (closingTimeout) clearTimeout(closingTimeout);
            closingTimeout = setTimeout(() => {
                if (!isMouseNearEdge && !isMouseOverNav && !isNavLocked) {
                    scrollNav.classList.remove('visible');
                    trigger.classList.remove('sidebar-open');
                }
            }, 1000); // 1 second delay
        }
    }

    const navCheckbox = document.getElementById('nav-lock-checkbox');

    // Track mouse over switch (peek behavior)
    trigger.addEventListener('mouseenter', () => {
        isMouseNearEdge = true;
        updateNavVisibility();
    });

    trigger.addEventListener('mouseleave', () => {
        isMouseNearEdge = false;
        updateNavVisibility();
    });

    // Toggle lock via Switch
    navCheckbox.addEventListener('change', () => {
        isNavLocked = navCheckbox.checked;
        updateNavVisibility();
    });

    // Track mouse over sidebar specifically
    scrollNav.addEventListener('mouseenter', () => {
        isMouseOverNav = true;
        updateNavVisibility();
    });

    scrollNav.addEventListener('mouseleave', () => {
        isMouseOverNav = false;
        updateNavVisibility();
    });

    // Force Immediate Dismissal when clicking anywhere outside
    document.addEventListener('click', (e) => {
        const isClickInsideNav = scrollNav.contains(e.target);
        const isClickOnTrigger = trigger.contains(e.target);

        if (!isClickInsideNav && !isClickOnTrigger) {
            isNavLocked = false;
            isMouseNearEdge = false;
            isMouseOverNav = false;

            if (navCheckbox) navCheckbox.checked = false; // Sync UI

            if (closingTimeout) clearTimeout(closingTimeout);

            scrollNav.classList.remove('visible');
        }
    });


    const bgCoded = document.querySelector('.hero-bg-coded');
    const aboutSection = document.getElementById('about');
    let aboutOffsetTop = aboutSection ? aboutSection.offsetTop : window.innerHeight;

    // Cache section offsets for scrollspy to prevent constant layout reflow
    let sectionOffsets = [];
    function calculateSectionOffsets() {
        if (aboutSection) aboutOffsetTop = aboutSection.offsetTop || window.innerHeight;
        sectionOffsets = Array.from(sections).map(section => ({
            id: section.getAttribute('id'),
            top: section.offsetTop
        }));
    }
    calculateSectionOffsets();
    window.addEventListener('resize', calculateSectionOffsets, { passive: true });

    let scrollTicking = false;

    const handleScroll = () => {
        const scrollPos = window.scrollY;

        // --- Animated Background Fading ---
        if (bgCoded) {
            const fadeProgress = Math.max(0, Math.min(scrollPos / aboutOffsetTop, 1));
            bgCoded.style.opacity = (0.5 * (1 - fadeProgress)).toFixed(3);
        }

        // Landing Page Visibility & Auto-Dismiss
        if (scrollPos < 600) {
            isNavLocked = false;
            isMouseNearEdge = false;
            isMouseOverNav = false;
            if (navCheckbox) navCheckbox.checked = false;
            trigger.classList.add('hidden-trigger');
            scrollNav.classList.remove('visible');
            scrollTicking = false;
            return; // Skip ScrollSpy on landing for performance
        } else {
            trigger.classList.remove('hidden-trigger');
        }

        let currentSectionId = '';
        sectionOffsets.forEach(sec => {
            if (scrollPos >= sec.top - 250) {
                currentSectionId = sec.id;
            }
        });

        navLinks.forEach(link => {
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                if (!link.classList.contains('active')) link.classList.add('active');
            } else {
                if (link.classList.contains('active')) link.classList.remove('active');
            }
        });

        scrollTicking = false;
    };

    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            window.requestAnimationFrame(handleScroll);
            scrollTicking = true;
        }
    }, { passive: true });

    handleScroll(); // Run on load

    updateNavVisibility();
});

// Lucide Icons
lucide.createIcons();

// ===== CINEMATIC SCROLL REVEAL =====
document.addEventListener("DOMContentLoaded", () => {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        const revealElements = document.querySelectorAll('.cinematic-reveal');

        revealElements.forEach(el => {
            // Split text dynamically into separate word spans
            const text = el.innerText;
            const words = text.split(/(\s+)/); // Preserve whitespace segments

            el.innerHTML = '';

            words.forEach(segment => {
                if (segment.trim() === '') {
                    // It's whitespace, just append
                    el.appendChild(document.createTextNode(segment));
                } else {
                    const span = document.createElement('span');
                    span.className = 'word';
                    span.innerText = segment;
                    el.appendChild(span);
                }
            });

            // GSAP ScrollTrigger animation
            gsap.to(el.querySelectorAll('.word'), {
                scrollTrigger: {
                    trigger: el,
                    start: 'top 80%',
                    end: 'center 75%', // Finish sooner
                    scrub: 1, // Smooth scrub
                },
                opacity: 1,
                rotate: 0,
                filter: 'blur(0px)',
                stagger: 0.015, // Faster text reveal
                ease: 'power2.out'
            });
        });

        // Scroll effect for About Me title
        gsap.from('.av2-left h2', {
            scrollTrigger: {
                trigger: '.av2-left',
                start: 'top 85%',
                end: 'center 60%',
                scrub: 1,
            },
            opacity: 0,
            y: 30,
            ease: 'power2.out'
        });

        // Scroll effects for Design Focus stack
        gsap.from('.av2-focus-card', {
            scrollTrigger: {
                trigger: '.av2-right',
                start: 'top 80%',
                end: 'center 50%',
                scrub: 1,
            },
            opacity: 0,
            x: 40,
            stagger: 0.5,
            ease: 'power2.out'
        });

        // Scroll effects for Quote Row
        gsap.from('.av2-quote-row', {
            scrollTrigger: {
                trigger: '.av2-quote-row',
                start: 'top 95%',
                end: 'center 85%',
                scrub: 1,
            },
            opacity: 0,
            y: 20,
            scale: 1.05,
            ease: 'power2.out'
        });
    }
});

