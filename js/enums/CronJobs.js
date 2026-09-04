import { Enum, EnumEntry } from '../utils/Enum.js';

/** @typedef {EnumEntry<string>} CronJobsEntry */

/**
 * @typedef {Object} CronJobs
 * @property {CronJobsEntry} MEDIA_SCAN
 * @property {CronJobsEntry} FRAME_UPTIME_Check
 * @property {CronJobsEntry} RANDOM_IMAGE
 */

/** @type {CronJobs} */
const CronJobs = new Enum({
    MEDIA_SCAN: 'media_scan',
    FRAME_UPTIME_Check: 'frame_uptime_check',
    RANDOM_IMAGE: 'random_mode',
});

export default CronJobs;
