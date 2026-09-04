import { Enum, EnumEntry } from '../utils/Enum.js';

/** @typedef {EnumEntry<int>} FrameModeEntry */

/**
 * @typedef {Object} FrameMode
 * @property {FrameModeEntry} INFO
 * @property {FrameModeEntry} SINGLE
 * @property {FrameModeEntry} RANDOM
 * @property {FrameModeEntry} SCENE
 * @property {FrameModeEntry} PLAYLIST
 */

/** @type {FrameMode} */
const FrameMode = new Enum({
    INFO: 0,
    SINGLE: 1,
    RANDOM: 2,
    SCENE: 3,
    PLAYLIST: 4,
});

export default FrameMode;
