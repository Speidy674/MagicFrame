import loader from '/js/utils/loader.js';
import template from '/js/utils/template.js';
import BaseDashboard from '/js/dashboard/base.js';
import OpCodesIm from '/js/enums/OpCodes.js';
import pagination from '/js/utils/pagination.js';
import { humanReadable, formatBytes } from '/js/utils/utils.js';

/** @typedef {import("../../../js/enums/OpCodes.js").OpCodesType} OpCodesType */

/** @type {OpCodesType} */
const OpCodes = OpCodesIm;

const defaultPage = 1;
const defaultLimit = 10;

class Dashboard extends BaseDashboard {

    page;
    limit;

    constructor() {
        super();

        const urlParams = new URLSearchParams(window.location.search);
        this.page = urlParams.get('page') ?? defaultPage
        this.limit = urlParams.get('limit') ?? defaultLimit

        this.handleEventListener()

        this.loadPage();
    }

    handlePageSocketListener() {
        /*
        this.connectionManager.on(
            OpCodes.FRAME_UPDATED.value,
            ({ id: frameId }) => {
                this.updateFrame(frameId);
            }
        );
        */
    }

    handleEventListener() {
        window.addEventListener('popstate', (e) => {
            if (!e.state) return;

            if (e.state.page) {
                this.page = e.state.page
            }

            if (e.state.limit) {
                this.limit = e.state.limit
            }

            this.loadPage()
        })
    }

    async loadPage() {

        const url = new URL(window.location)
        if (this.page != defaultPage || url.searchParams.has('page')) url.searchParams.set('page', this.page)
        if (this.limit != defaultLimit || url.searchParams.has('limit')) url.searchParams.set('limit', this.limit)

        history.pushState({
            page: this.page,
            limit: this.limit,
        }, `Page ${this.page} Limit ${this.limit}`, url)


        const pageInfoRes = await fetch(
            `/api/media?page=${this.page}&limit=${this.limit}`
        );
        const pageInfo = await pageInfoRes.json();

        const paginationBarHtml = await pagination.renderBar(
            pageInfo.data.length,
            pageInfo.pagination.total_count,
            pageInfo.pagination.current_page,
            pageInfo.pagination.total_pages,
        );

        document.querySelector('#paginationBar').outerHTML = paginationBarHtml;

        pagination.onBtn(this.onPageBtn.bind(this));

        const mediaContaier = document.querySelector('#mediaContaier');
        mediaContaier.innerHTML = '';

        for (const frame of pageInfo.data) {
            mediaContaier.innerHTML += await this.getMediaTableItem(frame);
        }
    }

    async updateMediaItem(mediaId) {
        const mediaItemContainer = document.querySelector(
            '#mediaTableItem_' + mediaId
        );

        if (!mediaItemContainer) {
            this.loadPage();
            return;
        }

        const mediaInfoRes = await fetch(`/api/frame/${mediaId}/info`);
        const mediaInfo = await mediaInfoRes.json();

        const mediaTableItemHtml = await this.getMediaTableItem(mediaInfo);

        mediaItemContainer.outerHTML = mediaTableItemHtml;
    }

    async getMediaTableItem(media) {
        let info = `${media.width} x ${media.height}`;

        if (media.duration) {
            info += ` - ${new Date(media.duration * 1000).toISOString().substring(11, 19)} Length`;
        }

        return await template.load('dashboard.media.tableitem', {
            id: media.id,
            name: media.name,
            type: media.type,
            mimeType: media.mime_type,
            fileSize: formatBytes(media.size),
            info: info
        });
    }

    async onPageBtn(btn) {
        switch (btn) {
            case 'previous':
                if (this.page > 1) this.page--;
                break;
            case 'next':
                this.page++;
                break;
            default:
                if (!isNaN(btn)) this.page = btn;
                break;
        }

        this.loadPage();
    }
}

const dashboard = new Dashboard();
