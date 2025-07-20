export default class SidebarManager {
    constructor(channelsMenuEl, sidebarOverlayEl) {
        this.channelsMenuEl = channelsMenuEl;
        this.sidebarOverlayEl = sidebarOverlayEl;

        this.sidebarOverlayEl.addEventListener('click', () => this.toggleSidebar());
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.channelsMenuEl.classList.contains('open')) {
                this.toggleSidebar();
            }
        });
    }

    toggleSidebar() {
        const isOpen = this.channelsMenuEl.classList.contains('open');

        if (isOpen) {
            this.channelsMenuEl.classList.remove('open');
            this.sidebarOverlayEl.classList.remove('active');
        } else {
            this.channelsMenuEl.classList.add('open');
            this.sidebarOverlayEl.classList.add('active');
        }
    }
}
