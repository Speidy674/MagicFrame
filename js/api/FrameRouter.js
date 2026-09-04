import Frame from '../database/models/Frame.js';
import FrameSetting from '../database/models/FrameSetting.js';
import Media from '../database/models/Media.js';
import FrameMode from '../enums/FrameMode.js';
import BaseRouter from './BaseRouter.js';
import path from 'path';

export default class FrameRouter extends BaseRouter {
    handleExtraArgs(frameManager) {
        this.frameManager = frameManager;
    }

    initRoutes() {
        this.router.get('/', this.list.bind(this));
        this.router.get('/:id', this.info.bind(this));
        this.router.get('/:id/setting', this.setting.bind(this));

        this.router.post('/:id/mode/:mode', this.mode.bind(this));

        this.router.post('/:id/play/media/:media', this.playMedia.bind(this));
        this.router.post(
            '/:id/play/twitch/:type/:value',
            this.playTwitch.bind(this)
        );
    }

    async list(req, res) {
        let { page = 1, limit = 25 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        if (page <= 0) page = 1;

        const { count, rows } = await Frame.findAndCountAll({
            offset: limit * (page - 1),
            limit: limit,
        });

        const totalPages = Math.ceil(count / limit);

        res.status(200).json({
            data: rows,
            pagination: {
                total_count: count,
                current_page: page,
                total_pages: totalPages,
            },
        });
    }

    async info(req, res) {
        let frame = await Frame.findByPk(req.params.id);
        if (!frame) {
            res.sendStatus(404);
            return;
        }
        res.status(200).json(frame);
    }

    async setting(req, res) {
        let frame = await Frame.findByPk(req.params.id);

        if (!frame) {
            res.sendStatus(404);
            return;
        }

        let [setting] = await FrameSetting.findOrCreate({
            where: { frame_id: req.params.id },
        });

        res.status(200).json(setting);
    }

    async mode(req, res) {
        req.params.mode = parseInt(req.params.mode);
        let frame = await this.frameManager.changeMode(
            req.params.id,
            req.params.mode
        );

        if (frame instanceof Error) {
            res.status(404).json({ name: frame.name, message: frame.message });
            return;
        }

        res.status(200).json(frame);
    }

    async playMedia(req, res) {
        req.params.media = parseInt(req.params.media);
        let frame = await this.frameManager.playMedia(
            req.params.id,
            req.params.media
        );

        if (frame instanceof Error) {
            res.status(404).json({ name: frame.name, message: frame.message });
            return;
        }

        res.status(200).json(frame);
    }

    async playTwitch(req, res) {
        let frame = await this.frameManager.playData(req.params.id, 'twitch', {
            type: req.params.type,
            value: req.params.value,
        });

        if (frame instanceof Error) {
            res.status(404).json({ name: frame.name, message: frame.message });
            return;
        }

        res.status(200).json(frame);
    }
}
