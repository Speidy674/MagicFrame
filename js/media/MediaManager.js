import fs from 'fs';
import path from 'path';
import { imageSizeFromFile } from 'image-size/fromFile';
import ffprobe from 'ffprobe';
import ffprobeStatic from 'ffprobe-static';
import MediaType from '../enums/MediaType.js';
import Media from '../database/models/Media.js';
import CronJobs from '../enums/CronJobs.js';

export default class MediaManager {
    #config;
    #cronManager;

    #scanning = false;
    #scanningProgress = 0;
    #scanningTotal = 0;
    #scanningFoundFiles = [];

    #scannigRunning = 0;
    #scannigMaxRunning = 10;

    #imageFormat = ['.jpg', '.png', '.gif', '.jpeg', '.webp', '.svg'];
    #videoFormat = ['.mp4'];

    mimeTypes = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
        mp4: 'video/mp4',
    };

    get formats() {
        return this.#imageFormat.concat(this.#videoFormat);
    }

    constructor(config, cronManager) {
        console.log('[MediaManager]', 'init');
        this.#config = config;
        this.#cronManager = cronManager;

        this.#cronManager.create(
            CronJobs.MEDIA_SCAN.value,
            this.#config.fileListUpdate,
            this.scanMediaFolder.bind(this),
            {
                noOverlap: true,
            }
        );
        this.#cronManager.start(CronJobs.MEDIA_SCAN.value);
    }

    get mediaFolder() {
        return path.resolve(global.root_path, this.#config.fileFolder);
    }

    async scanMediaFolder() {
        if (this.#scanning) {
            console.log('[MediaManager]', 'Scan is already in progress');
            return;
        }

        this.#scanning = true;
        this.#scanningFoundFiles = [];
        this.#scannigRunning = 0;

        console.log('[MediaManager]', 'Scan Started');

        const dirContent = fs.readdirSync(this.mediaFolder, {
            recursive: true,
            withFileTypes: true,
        });

        this.#scanningTotal = dirContent.length;
        this.#scanningProgress = 0;

        this.#checkScan();

        for (const file of dirContent) {
            if (
                file.isDirectory() ||
                !this.formats.some((format) => file.name.endsWith(format))
            ) {
                this.#scanningProgress++;
                continue;
            }

            while (this.#scannigRunning >= this.#scannigMaxRunning) {
                await new Promise((resolve) => setTimeout(resolve, 250));
            }

            this.#scannigRunning++;

            this.#handleMediaFile(file);
        }

        while (this.#scanning) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }

    #checkScan() {
        console.log(
            '[MediaManager]',
            'Scan Progress:',
            this.#scanningProgress,
            '/',
            this.#scanningTotal
        );

        const finished = this.#scanningProgress === this.#scanningTotal;

        if (finished) {
            this.#checkMissingFiles();
        } else {
            setTimeout(() => {
                this.#checkScan();
            }, 1000);
        }
    }

    async #checkMissingFiles() {
        console.log('[MediaManager]', 'Delete Check');
        const dbFiles = await Media.findAll();

        for (const dbFile of dbFiles) {
            const fullFilePath = path.resolve(
                this.mediaFolder,
                dbFile.path,
                dbFile.name
            );
            const relativeFilePath = path.relative(
                this.mediaFolder,
                fullFilePath
            );
            if (!this.#scanningFoundFiles.includes(relativeFilePath)) {
                console.debug(
                    '[MediaManager]',
                    `File '${relativeFilePath}' not found, Deleting`
                );

                await dbFile.destroy();
            }
        }

        console.log('[MediaManager]', 'Scan Finished');
        this.#scanning = false;
        this.#scanningFoundFiles = [];
    }

    async #handleMediaFile(file) {
        try {
            const mediaFolder = path.resolve(
                global.root_path,
                this.#config.fileFolder
            );

            const fullFilePath = path.resolve(file.parentPath, file.name);
            const relativeFilePath = file.parentPath
                .replace(mediaFolder, '')
                .substring(1);

            this.#scanningFoundFiles.push(
                path.relative(this.mediaFolder, fullFilePath)
            );

            const stats = fs.statSync(fullFilePath);
            const ext = path.extname(file.name).toLowerCase().substring(1);

            const dbFile = await Media.findOne({
                where: {
                    name: file.name,
                    path: relativeFilePath,
                },
                paranoid: false,
            });

            const media = {
                name: file.name,
                path: relativeFilePath,
                type: null,
                mime_type: this.mimeTypes[ext],
                size: stats.size,
                width: null,
                height: null,
                duration: null,
            };

            const isImage = this.#imageFormat.includes('.' + ext);
            const isVideo = this.#videoFormat.includes('.' + ext);

            if (isImage) {
                media.type = MediaType.IMAGE.value;
                const dimensions = await imageSizeFromFile(fullFilePath);
                media.height = dimensions.height;
                media.width = dimensions.width;
            } else if (isVideo) {
                media.type = MediaType.VIDEO.value;
                const ffprobeInfo = await ffprobe(fullFilePath, {
                    path: ffprobeStatic.path,
                });
                const videoInfo = ffprobeInfo.streams.find(
                    (stream) => stream.codec_type == 'video'
                );
                media.width = videoInfo.width;
                media.height = videoInfo.height;
                media.duration = Math.ceil(videoInfo.duration);
            } else {
                media.type = 'unknown';
            }

            if (dbFile) {
                if (dbFile.isSoftDeleted()) {
                    await dbFile.restore();
                }
                await dbFile.update(media);
            } else {
                await Media.create(media);
            }
        } catch (error) {
            console.error(
                '[MediaManager]',
                `Error Checking ${file.name}`,
                error
            );
        } finally {
            this.#scannigRunning--;
            this.#scanningProgress++;
        }
    }

    stop() {
        console.debug('[MediaManager]', 'Stopping');
    }
}
