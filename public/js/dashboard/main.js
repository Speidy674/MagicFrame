import loader from '/js/utils/loader.js';
import template from '/js/utils/template.js';
import BaseDashboard from '/js/dashboard/base.js';
import OpCodesIm from '/js/enums/OpCodes.js';

/** @typedef {import("../../../js/enums/OpCodes.js").OpCodesType} OpCodesType */

/** @type {OpCodesType} */
const OpCodes = OpCodesIm;

class Dashboard extends BaseDashboard {
    constructor() {
        super();

        this.loadFrameCounts();
        this.loadMediaCount();
        this.loadSceneCount();
        this.loadPlaylistCount();
        this.loadCronCount();

        loader.hide();
    }

    async loadFrameCounts() {
        const totalContainer = document.querySelector('#frameCount');
        const onlineContainer = document.querySelector('#frameOnlineCount');

        if (!totalContainer || !onlineContainer) {
            return;
        }

        const countRes = await fetch(`/api/frame/count`);

        const count = await countRes.json();

        totalContainer.textContent = count.total;
        onlineContainer.textContent = count.online;
    }

    async loadMediaCount() {
        const totalContainer = document.querySelector('#mediaCount');

        if (!totalContainer) {
            return;
        }

        const countRes = await fetch(`/api/media/count`);

        const count = await countRes.json();

        totalContainer.textContent = count.total;
    }

    async loadSceneCount() {}

    async loadPlaylistCount() {}

    async loadCronCount() {
        const totalContainer = document.querySelector('#cronCounts');

        if (!totalContainer) {
            return;
        }

        const countRes = await fetch(`/api/cron/count`);

        const count = await countRes.json();

        totalContainer.textContent = count.total;
    }

    handlePageSocketListener() {
        this.connectionManager.on(
            OpCodes.FRAME_UPDATED.value,
            ({ id: frameId }) => {
                this.loadFrameCounts();
            }
        );
    }
}

const dashboard = new Dashboard();
