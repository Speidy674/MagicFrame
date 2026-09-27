class Core {
    constructor() {
        lucide.createIcons();
        document.addEventListener("click", this.backBtn)
    }

    backBtn(event) {
        const clickedElement = event.target;
        if (!clickedElement.matches("[data-btn-back]")) {
            return;
        }

        event.preventDefault();

        history.back()

        setTimeout(() => {
            location.reload();
        }, 50);
    }
}

const core = new Core();
