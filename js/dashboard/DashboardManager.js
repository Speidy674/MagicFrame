import { Router } from 'express';
import Media from '../database/models/Media.js';
import Frame from '../database/models/Frame.js';

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

    initRoutes() {
        this.router.get('/', async (req, res) => {
            res.render('dashboard/main', {
                version: global.version,
                pageTitle: 'Übersicht',
                frameCount: await Frame.count(),
                mediaCount: await Media.count(),
                sceneCount: 'not impl',
                playlistCount: 'not impl',
            });
        });
        this.router.get('/frames', async (req, res) => {
            res.render('dashboard/frames', {
                version: global.version,
                pageTitle: 'Frames',
            });
        });

        this.router.get('/{*splat}', async (req, res) => {
            res.sendStatus(404);
        });
    }

    initSocketListener() {}
}
