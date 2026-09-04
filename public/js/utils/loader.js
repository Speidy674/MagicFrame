class Loader {
    constructor() {
        if (Loader.instance) return Loader.instance;

        Loader.instance = this;

        const loaderElement = document.querySelector(this.containerQuery);

        const loaderHidden = loaderElement.classList.contains('hidden');
        if (loaderHidden) {
            this.state = 'hide';
            this.showTimestamp = null;
        } else {
            this.state = 'show';
            this.showTimestamp = Date.now();
        }
    }

    containerQuery = '#loader';
    minShowingTimeMs = 500;
    showTimestamp;
    state;
    actionTimeout;

    show() {
        console.log('[Loader]', 'show');
        if (this.state !== 'show') {
            this.state = 'show';
            this.showTimestamp = Date.now();
        }
        document.querySelector(this.containerQuery).classList.remove('hidden');

        this.#clearActionTimeout();
    }

    hide() {
        if (this.state !== 'show') return;
        console.log('[Loader]', 'hide');

        const internalHide = () => {
            console.debug('[Loader]', 'internal hide');
            this.state = 'hide';
            document.querySelector(this.containerQuery).classList.add('hidden');
        };

        if (!this.showTimestamp) {
            internalHide();
            return;
        }

        const timeSinceShowing = Date.now() - this.showTimestamp;
        const delay = Math.max(0, this.minShowingTimeMs - timeSinceShowing);

        this.#clearActionTimeout();

        this.actionTimeout = setTimeout(() => {
            internalHide();
            this.actionTimeout = null;
        }, delay);
    }

    #clearActionTimeout() {
        if (this.actionTimeout) {
            clearTimeout(this.actionTimeout);
            this.actionTimeout = null;
        }
    }
}

export default new Loader();
