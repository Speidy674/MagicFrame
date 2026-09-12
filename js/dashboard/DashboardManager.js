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

    initRoutes() {
        this.router.get('/', async (req, res) => {
            res.render('dashboard/main', {
                version: global.version,
                pageTitle: 'Übersicht',
                sideBar: this.getSidebar(req),
            });
        });

        this.router.get('/frames', async (req, res) => {
            res.render('dashboard/frames', {
                version: global.version,
                pageTitle: 'Frames',
                sideBar: this.getSidebar(req),
            });
        });

        this.router.get('/media', async (req, res) => {
            res.render('dashboard/media', {
                version: global.version,
                pageTitle: 'Media',
                sideBar: this.getSidebar(req),
            });
        });

        this.router.get('/{*splat}', async (req, res) => {
            res.sendStatus(404);
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
