import { Enum, EnumEntry } from '../utils/Enum.js';

/** @typedef {EnumEntry<int>} MediaTypeEntry */

/**
 * @typedef {Object} MediaType
 * @property {MediaTypeEntry} VIDEO
 * @property {MediaTypeEntry} IMAGE
 */

/** @type {MediaType} */
const MediaType = new Enum({
    VIDEO: 'video',
    IMAGE: 'image',
});

export default MediaType;
