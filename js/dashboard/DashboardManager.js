import { Router } from 'express';
import Media from '../database/models/Media.js';
import Frame from '../database/models/Frame.js';
import OpCodes from '../enums/OpCodes.js';
import FrameStatus from '../enums/FrameStatus.js';

export default class DashboardManager {
    #config;
    #sever;
    #socket;

    constructor(config, server, socket) {
        console.log('[DashboardManager]', 'init');
        this.#config = config;
        this.#sever = server;
        this.#socket = socket;

        this.router = new Router();

        this.#sever.express.use('/dashboard', this.router);

        this.initRoutes();

        this.initSocketListener();
    }

    getSidebar(req) {
        return {
            navigationActive: function () {
                return this.url == req.originalUrl;
            },
            navigation: [
                {
                    name: 'dashboard.navigation.group.core.name',
                    icon: 'settings',
                    items: [
                        {
                            name: 'dashboard.navigation.group.core.items.frames',
                            icon: 'gallery-horizontal-end',
                            url: '/dashboard/frames',
                        },
                        {
                            name: 'dashboard.navigation.group.core.items.media',
                            icon: 'images',
                            url: '/dashboard/media',
                        },
                        {
                            name: 'dashboard.navigation.group.core.items.scenes',
                            icon: 'sticky-notes',
                            url: '/dashboard/scenes',
                        },
                        {
                            name: 'dashboard.navigation.group.core.items.playlists',
                            icon: 'list-video',
                            url: '/dashboard/playlists',
                        },
                        {
                            name: 'dashboard.navigation.group.core.items.crons',
                            icon: 'monitor-cog',
                            url: '/dashboard/crons',
                        },
                    ],
                },
            ],
        };
    }

    getViewOptions(req, title, options = {}) {
        return {
            version: global.version,
            sideBar: this.getSidebar(req),
            pageTitle: title,
            ...options
        }
    }

    initRoutes() {
        this.router.get('/', async (req, res) => {
            res.render('dashboard/main', this.getViewOptions(req, 'Übersicht'));
        });

        this.router.get('/frames', async (req, res) => {
            res.render('dashboard/frames/table', this.getViewOptions(req, 'Frames'));
        });

        this.router.get('/frames/:id', async (req, res) => {
            res.render('dashboard/frames/detail', this.getViewOptions(req, 'Frame - ' + req.params.id));
        });

        this.router.get('/media', async (req, res) => {
            res.render('dashboard/media/table', this.getViewOptions(req, 'Media'));
        });

        this.router.get('/media/:id', async (req, res) => {
            res.render('dashboard/media/detail', this.getViewOptions(req, 'Media - ' + req.params.id));
        });

        this.router.get('/{*splat}', async (req, res) => {
            this.sendError(req, res, 404);
        });
    }

    sendError(req, res, errorCode) {
        res.status(errorCode);
        res.render('dashboard/error/' + errorCode, this.getViewOptions(req, errorCode));
    }

    initSocketListener() {
        this.#socket.on(OpCodes.DASHBOARD_LOGIN.value, async (socket) => {
            socket.mfInfos.dashboard = true;
            socket.join('dashboards');
            socket.emit(OpCodes.DASHBOARD_LOGIN.value);
        });
    }
}
