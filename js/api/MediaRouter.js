import Media from '../database/models/Media.js';
import BaseRouter from './BaseRouter.js';
import path from 'path';

export default class MediaRouter extends BaseRouter {
    initRoutes() {
        this.router.get('/', this.list.bind(this));
        this.router.get('/count', this.count.bind(this));
        this.router.get('/:id', this.file.bind(this));
        this.router.get('/:id/info', this.info.bind(this));
    }

    async list(req, res) {
        let { page = 1, limit = 25 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        if (page <= 0) page = 1;

        const { count, rows } = await Media.findAndCountAll({
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

    async count(req, res) {
        const total = await Media.count();
        const countTypes = await Media.count({ group: ['type'] });

        const out = {
            total,
            types: {},
        };

        countTypes.forEach((element) => {
            out.types[element.type] = element.count;
        });

        res.status(200).json(out);
    }

    async file(req, res) {
        let file = await Media.findByPk(req.params.id);

        if (!file) {
            res.sendStatus(404);
            return;
        }

        const filePath = path.resolve(
            global.root_path,
            this.config.fileFolder,
            file.path,
            file.name
        );

        res.status(200).sendFile(filePath);
    }

    async info(req, res) {
        let file = await Media.findByPk(req.params.id);
        if (file) res.status(200).json(file);
        else res.sendStatus(404);
    }
}
