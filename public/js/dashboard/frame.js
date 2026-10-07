import loader from '/js/utils/loader.js';
import template from '/js/utils/template.js';
import BaseDashboard from '/js/dashboard/base.js';
import OpCodesIm from '/js/enums/OpCodes.js';
import FrameModes from '/js/enums/FrameMode.js';
import pagination from '/js/utils/pagination.js';
import FrameStatus from '../../../js/enums/FrameStatus.js';
import { humanReadable } from '/js/utils/utils.js';

/** @typedef {import("../../../js/enums/OpCodes.js").OpCodesType} OpCodesType */

/** @type {OpCodesType} */
const OpCodes = OpCodesIm;

const defaultPage = 1;
const defaultLimit = 10;

class Dashboard extends BaseDashboard {

    page;
    limit;

    statusColorMap = {
        default: {
            bg: 'bg-primary/10',
            text: 'text-primary',
            inset: 'inset-primary/50',
        },
        [FrameStatus.ONLINE.value]: {
            bg: 'bg-green-500/10',
            text: 'text-green-500',
            inset: 'inset-green-500/50',
        },
        [FrameStatus.OFFLINE.value]: {
            bg: 'bg-red-500/10',
            text: 'text-red-500',
            inset: 'inset-red-500/50',
        },
    };

    constructor() {
        super();

        const urlParams = new URLSearchParams(window.location.search);
        this.page = urlParams.get('page') ?? defaultPage
        this.limit = urlParams.get('limit') ?? defaultLimit

        this.handleEventListener()

        this.loadPage();
    }

    handlePageSocketListener() {
        this.connectionManager.on(
            OpCodes.FRAME_UPDATED.value,
            ({ id: frameId }) => {
                this.updateFrame(frameId);
            }
        );
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
            `/api/frame?page=${this.page}&limit=${this.limit}`
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

        const frameContaier = document.querySelector('#frameContaier');
        frameContaier.innerHTML = '';

        for (const frame of pageInfo.data) {
            frameContaier.innerHTML += await this.getFrameTableItem(frame);
        }
    }

    async updateFrame(frameId) {
        const frameItemContainer = document.querySelector(
            '#frameTableItem_' + frameId
        );

        if (!frameItemContainer) {
            this.loadPage();
            return;
        }

        const frameInfoRes = await fetch(`/api/frame/${frameId}`);
        const frameInfo = await frameInfoRes.json();

        const frameItemHtml = await this.getFrameTableItem(frameInfo);

        frameItemContainer.outerHTML = frameItemHtml;
    }

    async getFrameTableItem(frame) {
        let showing = '';

        if (frame.showing_ref) {
            showing += frame.showing_ref;
        }

        if (frame.showing_id) {
            showing += ' - ID: ' + frame.showing_id;
        }

        if (frame.showing_data) {
            showing += ' - DATA: ' + frame.showing_data;
        }

        let source = '';
        let controller = '';

        const status = FrameStatus.tryFromValue(frame.status);

        return await template.load('dashboard.frame.tableitem', {
            id: frame.id,
            label: frame.label,
            mode: FrameModes.tryFromValue(frame.mode).name,
            status: status.name,
            lastSeen:
                status.value === FrameStatus.OFFLINE.value
                    ? humanReadable(frame.lastseen)
                    : '',
            showing,
            showingUpdate: frame.showing_updated
                ? humanReadable(frame.showing_updated)
                : '',
            source,
            controller,
            statusColor:
                this.statusColorMap[status.value] ??
                this.statusColorMap['default'],
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
