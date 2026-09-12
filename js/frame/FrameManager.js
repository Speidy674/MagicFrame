import { Router } from 'express';
import Frame from '../database/models/Frame.js';
import OpCodes from '../enums/OpCodes.js';
import FrameStatus from '../enums/FrameStatus.js';
import FrameMode from '../enums/FrameMode.js';
import FrameSetting from '../database/models/FrameSetting.js';
import { EnumEntry } from '../utils/Enum.js';
import Media from '../database/models/Media.js';

export default class FrameManager {
    #config;
    #sever;
    #socket;

    #framesConnection = new Map();

    constructor(config, server, socket) {
        console.log('[FrameManager]', 'init');
        this.#config = config;
        this.#sever = server;
        this.#socket = socket;

        this.router = new Router();

        this.#sever.express.use('/frame', this.router);

        this.initRoutes();

        this.initSocketListener();

        Frame.afterSave(async (frame, sequelize) => {
            this.dashboardFrameUpdate(frame.id);
        });

        FrameSetting.afterSave(async (frameSetting, sequelize) => {
            this.dashboardFrameUpdate(frameSetting.frameId);
        });
    }

    initRoutes() {
        this.router.get('/', async (req, res) => {
            res.render('frame', {
                version: global.version,
            });
        });
    }

    initSocketListener() {
        this.#socket.on(OpCodes.FRAME_REGISTER.value, async (socket) => {
            let id;
            do {
                id = crypto.randomUUID();
            } while (await Frame.findByPk(id));

            Frame.create({ id: id });

            socket.emit(OpCodes.FRAME_REGISTER.value, { id: id });
        });

        this.#socket.on(OpCodes.FRAME_LOGIN.value, async (socket, data) => {
            if (!data.id)
                socket.emit(OpCodes.FRAME_LOGIN_ERROR.value, 'no id provided');

            const frameId = data.id;

            let [frame] = await Frame.findOrCreate({
                where: {
                    id: frameId,
                },
            });

            if (frame.status === FrameStatus.ONLINE.value) {
                socket.emit(
                    OpCodes.FRAME_LOGIN_ERROR.value,
                    'Id already in use'
                );
                return;
            }

            socket.mfInfos.frame = frameId;

            this.#framesConnection.set(frameId, socket.id);

            socket.join('frame:' + frameId);
            socket.join('frames');

            frame.update({
                lastseen: Date.now(),
                status: FrameStatus.ONLINE.value,
            });

            socket.emit(OpCodes.FRAME_LOGIN.value);

            await this.sendFrameSettings(frameId);

            await this.sendFramePlayingInfos(frameId, frame);
        });
    }

    async socketDisconnect(socket) {
        if (!socket.mfInfos.frame) return;

        let frame = await Frame.findOne({
            where: {
                id: socket.mfInfos.frame,
            },
        });

        if (frame) {
            await frame.update({
                lastseen: Date.now(),
                status: FrameStatus.OFFLINE.value,
            });
        }

        this.#framesConnection.delete(socket.mfInfos.frame);
    }

    async changeId(frameId, newId) {
        let frame = await Frame.findByPk(frameId);

        if (!frame) return new Error('Frame not found');

        this.#socket.sendTo('frame:' + frameId, OpCodes.FRAME_ID_CHANGE.value, {
            id: newId,
        });

        await frame.destroy();
    }

    async changeMode(frameId, mode) {
        if (!mode) {
            mode = FrameMode.INFO.value;
        }

        if (mode instanceof EnumEntry) {
            mode = mode.value;
        }

        try {
            FrameMode.tryFromValue(mode);
        } catch (error) {
            return error;
        }

        let frame = await Frame.findByPk(frameId);

        if (!frame) return new Error('Frame not found');

        await frame.update({
            mode: mode,
        });

        await this.sendFramePlayingInfos(frameId, frame);

        return frame;
    }

    async playMedia(frameId, mediaId) {
        let frame = await Frame.findByPk(frameId);

        if (!frame) return new Error('Frame not found');

        let media = await Media.findByPk(mediaId);

        if (!media) return new Error('Media not found');

        await frame.update({
            showing_ref: 'media',
            showing_id: mediaId,
            showing_data: null,
            showing_updated: Date.now(),
        });

        await this.sendFramePlayingInfos(frameId, frame);

        return frame;
    }

    async playData(frameId, ref, data) {
        let frame = await Frame.findByPk(frameId);

        if (!frame) return new Error('Frame not found');

        await frame.update({
            showing_ref: ref,
            showing_id: null,
            showing_data: JSON.stringify(data),
            showing_updated: Date.now(),
        });

        await this.sendFramePlayingInfos(frameId, frame);

        return frame;
    }

    async sendFramePlayingInfos(frameId, frame = null) {
        if (!frame) frame = await Frame.findByPk(frameId);

        if (!frame) return null;

        if (
            frame.mode === FrameMode.INFO.value ||
            !frame.showing_ref ||
            (!frame.showing_id && !frame.showing_data)
        ) {
            this.#socket.sendTo('frame:' + frameId, OpCodes.FRAME_INFO.value, {
                method: 'show',
            });
        } else {
            this.#socket.sendTo('frame:' + frameId, OpCodes.FRAME_INFO.value, {
                method: 'hide',
            });
            this.#socket.sendTo('frame:' + frameId, OpCodes.FRAME_PLAY.value, {
                ref: frame.showing_ref,
                id: frame.showing_id,
                data: JSON.parse(frame.showing_data),
            });
        }
    }

    async sendFrameSettings(frameId, frameSetting) {
        let frame = await Frame.findByPk(frameId);

        if (!frame) return null;

        if (!frameSetting) {
            [frameSetting] = await FrameSetting.findOrCreate({
                where: {
                    frame_id: frameId,
                },
            });
        }

        this.#socket.sendTo(
            'frame:' + frameId,
            OpCodes.FRAME_SETTINGS.value,
            frameSetting
        );
    }

    dashboardFrameUpdate(frameId) {
        this.#socket.sendTo('dashboards', OpCodes.FRAME_UPDATED.value, {
            id: frameId,
        });
    }
}
