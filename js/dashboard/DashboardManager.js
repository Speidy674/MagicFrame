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
                    name: 'Core',
                    icon: 'settings',
                    items: [
                        {
                            name: 'Frames',
                            icon: 'gallery-horizontal-end',
                            url: '/dashboard/frames',
                        },
                        {
                            name: 'Media',
                            icon: 'images',
                            url: '/dashboard/media',
                        },
                        {
                            name: 'Scenes',
                            icon: 'sticky-notes',
                            url: '/dashboard/scenes',
                        },
                        {
                            name: 'Playlists',
                            icon: 'list-video',
                            url: '/dashboard/playlists',
                        },
                        {
                            name: 'Crons',
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
            res.status(404);
            res.render('dashboard/error/404', this.getViewOptions(req, '404'));
        });
    }

    initSocketListener() {
        this.#socket.on(OpCodes.DASHBOARD_LOGIN.value, async (socket) => {
            socket.mfInfos.dashboard = true;
            socket.join('dashboards');
            socket.emit(OpCodes.DASHBOARD_LOGIN.value);
        });
    }
}
