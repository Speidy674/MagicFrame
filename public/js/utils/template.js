class Template {
    #cache;
    constructor() {
        if (Template.instance) return Template.instance;

        this.#cache = new Map();

        Template.instance = this;
    }

    async load(key, ...data) {
        let template = await this.#getTemplate(key);

        let tmpRoot = document.createElement('div');
        let tmpTemplate = document.createElement('template');

        tmpRoot.appendChild(tmpTemplate);

        tmpTemplate.innerHTML = Mustache.render(template, ...data);

        lucide.createIcons({
            root: tmpRoot,
            inTemplates: true
        });

        return tmpTemplate.innerHTML;
    }

    async #getTemplate(key) {
        if (this.#cache.has(key)) return this.#cache.get(key);

        const fileUrl = key.replaceAll('.', '/');

        const response = await fetch(`/templates/${fileUrl}.mustache`);

        if (!response.ok) {
            throw new Error(`Failed to load Template ${key} (${fileUrl})`);
        }

        this.#cache.set(key, response.text());

        return this.#cache.get(key);
    }

    clear(key = null) {
        if (key === null || key === undefined) {
            this.#cache.clear();
        } else if (this.#cache.has(key)) {
            this.#cache.delete(key);
        }
    }
}

export default new Template();
