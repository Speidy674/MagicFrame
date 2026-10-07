import Database from './Database.js';
import Server from './Server.js';
import Socket from './Socket.js';
import MediaManager from './media/MediaManager.js';
import ApiManager from './api/ApiManager.js';
import FrameManager from './frame/FrameManager.js';
import Frame from './database/models/Frame.js';
import FrameStatus from './enums/FrameStatus.js';
import DashboardManager from './dashboard/DashboardManager.js';
import CronManager from './Cron/CronManager.js';
import CronJobs from './enums/CronJobs.js';
import RandomManager from './Mode/RandomManager.js';

import fs from 'fs';
import path from 'path';

export default class Core {
    #config;

    constructor(config) {
        console.log('[CORE]', 'init');
        this.#config = config;

        this.#start();
    }

    async #start() {
        this.database = new Database(this.#config);
        await this.database.testConnection();
        this.database.loadModels();

        console.debug('[CORE]', 'set all frames offline');
        await Frame.update(
            {
                status: FrameStatus.OFFLINE.value,
            },
            {
                where: {},
            }
        );

        this.cronManager = new CronManager(this.#config);

        this.server = new Server(this.#config);
        this.socket = new Socket(this.#config, this.server);

        this.#serverSharedModules();

        this.mediaManager = new MediaManager(this.#config, this.cronManager);

        this.cronManager.execute(CronJobs.MEDIA_SCAN.value);

        this.frameManager = new FrameManager(
            this.#config,
            this.server,
            this.socket
        );

        this.randomManager = new RandomManager(
            this.#config,
            this.database,
            this.socket,
            this.cronManager,
            this.frameManager
        );

        this.apiManager = new ApiManager(
            this.#config,
            this.database,
            this.server,
            this.socket,
            this.cronManager,
            this.frameManager
        );

        this.dashboardManager = new DashboardManager(
            this.#config,
            this.server,
            this.socket,
            this.cronManager
        );

        this.server.express.get("/konachan/img{/:extra}", (req, res) => {
            const extraParm = req.params.extra ?? "";
            const url = "https://konachan.com/post.json?tags=order:random" + extraParm + "&limit=1"
            fetch(url).then(async (konachanRes) => {
                const json = await konachanRes.json();
                if (!json[0]) {

                    res.sendStatus(404)
                    return;
                }
                const parts = json[0].file_url.split(/[\/\\]/);
                const fileName = decodeURI(parts.pop());
                const img = await fetch(json[0].file_url)
                const imgBlob = await img.blob();
                const imgBuffer = await imgBlob.arrayBuffer();
                res.type(imgBlob.type)
                res.send(Buffer.from(imgBuffer))

                console.debug("[konachan]", `IMG: [${json[0].id}] [${json[0].rating}]`, fileName)
                const localFilePath = path.resolve(global.root_path, 'files/konachan/', fileName)
                if (!fs.existsSync(localFilePath)) {
                    fs.writeFileSync(localFilePath, Buffer.from(imgBuffer))
                    console.debug("[konachan]", "saved img")
                } else {
                    console.debug("[konachan]", "img already saved")
                }
            }).catch(e => {
                console.error(e);
                res.sendStatus(500)
            })
        })

        this.server.express.get('/', (req, res) => {
            res.redirect('/frame');
        });

        this.#handleSocketConnnection();
    }

    #serverSharedModules() {
        this.server.serveModule('/js/utils/Enum.js', 'js/utils/Enum.js');
        this.server.serveModule('/js/enums/OpCodes.js', 'js/enums/OpCodes.js');
        this.server.serveModule(
            '/js/enums/FrameMode.js',
            'js/enums/FrameMode.js'
        );
        this.server.serveModule(
            '/js/enums/FrameStatus.js',
            'js/enums/FrameStatus.js'
        );
    }

    #handleSocketConnnection() {
        this.socket.connected((socket) => { });

        this.socket.disconnected((socket) => {
            this.frameManager.socketDisconnect(socket);
        });
    }

    async stop() {
        await this.socket.stop();
        await this.server.stop();
        await this.mediaManager.stop();
        await this.cronManager.stop();
        await this.database.stop();
    }
}
