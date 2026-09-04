import { Enum, EnumEntry } from '../utils/Enum.js';

/** @typedef {EnumEntry<string>} OpCodeEntry */

/**
 * @typedef {Object} OpCodesType
 * @property {OpCodeEntry} PING
 * @property {OpCodeEntry} PONG
 *
 * @property {OpCodeEntry} FRAME_REGISTER
 * @property {OpCodeEntry} FRAME_LOGIN
 * @property {OpCodeEntry} FRAME_LOGIN_ERROR
 *
 * @property {OpCodeEntry} FRAME_INFO
 * @property {OpCodeEntry} FRAME_UPDATED
 * @property {OpCodeEntry} FRAME_ID_CHANGE
 *
 * @property {OpCodeEntry} FRAME_SETTINGS
 * @property {OpCodeEntry} FRAME_HEALTH_CHECK
 * @property {OpCodeEntry} FRAME_STATUS
 *
 * @property {OpCodeEntry} FRAME_PLAY
 * @property {OpCodeEntry} FRAME_STOP
 * @property {OpCodeEntry} FRAME_PAUSE
 * @property {OpCodeEntry} FRAME_RESUME
 *
 * @property {OpCodeEntry} RELOAD
 *
 * @property {OpCodeEntry} DASHBOARD_LOGIN
 */

/** @type {OpCodesType} */
const OpCodes = new Enum({
    PING: 'ping',
    PONG: 'pong',

    FRAME_REGISTER: 'frame.register',
    FRAME_LOGIN: 'frame.login',
    FRAME_LOGIN_ERROR: 'frame.login.error',

    FRAME_INFO: 'frame.info',
    FRAME_UPDATED: 'frame.updated',
    FRAME_ID_CHANGE: 'frame.id.change',

    FRAME_SETTINGS: 'frame.settings',
    FRAME_HEALTH_CHECK: 'frame.health_check',
    FRAME_STATUS: 'frame.status',

    FRAME_PLAY: 'frame.play',
    FRAME_STOP: 'frame.stop',
    FRAME_PAUSE: 'frame.pause',
    FRAME_RESUME: 'frame.resume',

    RELOAD: 'reload',

    DASHBOARD_LOGIN: 'dashboard.login',
});

export default OpCodes;
