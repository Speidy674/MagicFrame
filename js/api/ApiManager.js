import { Router } from 'express';
import MediaRouter from './MediaRouter.js';
import FrameRouter from './FrameRouter.js';
import CronRouter from './CronRouter.js';
import Media from '../database/models/Media.js';
import Frame from '../database/models/Frame.js';
import FrameStatus from '../enums/FrameStatus.js';
import { Op } from 'sequelize';
import FrameMode from '../enums/FrameMode.js';

export default class ApiManager {
    #config;
    #database;
    #sever;
    #socket;
    #cronManager;
    #frameManager;

    constructor(config, database, server, socket, cronManager, frameManager) {
        console.log('[Api]', 'init');
        this.#config = config;
        this.#database = database;
        this.#sever = server;
        this.#socket = socket;
        this.#cronManager = cronManager;
        this.#frameManager = frameManager;

        this.router = new Router();

        this.#sever.express.use('/api', this.router);

        this.initRoutes();
    }

    initRoutes() {
        this.router.use(
            '/media',
            new MediaRouter(this.#config, this.#socket).router
        );

        this.router.use(
            '/frame',
            new FrameRouter(this.#config, this.#socket, this.#frameManager)
                .router
        );

        this.router.use(
            '/cron',
            new CronRouter(this.#config, this.#socket, this.#cronManager).router
        );
    }
}
