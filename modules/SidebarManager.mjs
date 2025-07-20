export default class SidebarManager {
    constructor(channelsMenuEl, sidebarOverlayEl) {
        this.channelsMenuEl = channelsMenuEl;
        this.sidebarOverlayEl = sidebarOverlayEl;

        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Sidebar overlay click to close
        this.sidebarOverlayEl.addEventListener('click', () => this.toggleSidebar());
        
        // Escape key to close sidebar
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.channelsMenuEl.classList.contains('open')) {
                this.toggleSidebar();
                // Return focus to menu toggle button
                const menuToggle = document.querySelector('.menu-toggle');
                if (menuToggle) {
                    menuToggle.focus();
                }
            }
        });
        
        // Menu toggle button event delegation
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('menu-toggle')) {
                this.toggleSidebar();
            }
        });
    }

    toggleSidebar() {
        const isOpen = this.channelsMenuEl.classList.contains('open');

        if (isOpen) {
            this.channelsMenuEl.classList.remove('open');
            this.sidebarOverlayEl.classList.remove('active');
            this.updateMenuToggleAriaExpanded(false);
        } else {
            this.channelsMenuEl.classList.add('open');
            this.sidebarOverlayEl.classList.add('active');
            this.updateMenuToggleAriaExpanded(true);
            this.focusFirstChannelMenuItem();
        }
    }
    
    updateMenuToggleAriaExpanded(isExpanded) {
        const menuToggleButtons = document.querySelectorAll('.menu-toggle');
        menuToggleButtons.forEach(button => {
            button.setAttribute('aria-expanded', isExpanded.toString());
        });
    }
    
    focusFirstChannelMenuItem() {
        setTimeout(() => {
            const firstMenuItem = this.channelsMenuEl.querySelector('.channel-menu');
            if (firstMenuItem) {
                firstMenuItem.focus();
            }
        }, 100);
    }
}
