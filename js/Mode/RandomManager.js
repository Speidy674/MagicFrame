import { Op } from 'sequelize';
import Frame from '../database/models/Frame.js';
import CronJobs from '../enums/CronJobs.js';
import FrameMode from '../enums/FrameMode.js';
import FrameStatus from '../enums/FrameStatus.js';
import Media from '../database/models/Media.js';

export default class RandomManager {
    #config;
    #database;
    #socket;
    #cronManager;
    #frameManager;

    constructor(config, database, socket, cronManager, frameManager) {
        console.log('[RandomManager]', 'init');
        this.#config = config;
        this.#database = database;
        this.#socket = socket;
        this.#cronManager = cronManager;
        this.#frameManager = frameManager;

        this.#cronManager.create(
            CronJobs.RANDOM_IMAGE.value,
            this.#config.frameRandomImage,
            this.baseRandomImage.bind(this),
            {
                noOverlap: true,
            }
        );
        this.#cronManager.start(CronJobs.RANDOM_IMAGE.value);
    }

    async baseRandomImage() {
        let frames = await Frame.findAll({
            where: {
                status: FrameStatus.ONLINE.value,
                mode: FrameMode.RANDOM.value,
            },
        });

        for (const frame of frames) {
            const findOptions = {
                order: this.#database.sequelize.random(),
            };

            if (frame.showing_ref === 'media' && frame.showing_id) {
                findOptions.where = {
                    id: { [Op.not]: frame.showing_id },
                };
            }

            let media = await Media.findOne(findOptions);

            await this.#frameManager.playMedia(frame.id, media.id);
        }
    }
}
