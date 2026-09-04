import { Enum, EnumEntry } from '../utils/Enum.js';

/** @typedef {EnumEntry<int>} FrameStatusEntry */

/**
 * @typedef {Object} FrameStatus
 * @property {FrameStatusEntry} OFFLINE
 * @property {FrameStatusEntry} ONLINE
 */

/** @type {FrameStatus} */
const FrameStatus = new Enum({
    OFFLINE: 0,
    ONLINE: 1,
});

export default FrameStatus;
