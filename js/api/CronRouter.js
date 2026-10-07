import BaseRouter from './BaseRouter.js';

export default class CronRouter extends BaseRouter {
    handleExtraArgs(cronManager) {
        this.cronManager = cronManager;
    }

    initRoutes() {
        this.router.get('/', this.list.bind(this));
        this.router.get('/count', this.count.bind(this));
        this.router.get('/:id', this.info.bind(this));
    }

    async list(req, res) {
        let { page = 1, limit = 25 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        if (page <= 0) page = 1;

        const rows = this.cronManager.all();
        const count = rows.length;

        const dataStart = ((page - 1) * limit);
        const dataEnd = dataStart + limit;

        const totalPages = Math.ceil(count / limit);

        res.status(200).json({
            tmp: { dataStart, dataEnd },
            data: rows.slice(dataStart, dataEnd),
            pagination: {
                total_count: count,
                current_page: page,
                total_pages: totalPages,
            },
        });
    }

    async count(req, res) {
        const total = this.cronManager.all().length;

        const out = {
            total,
        };

        res.status(200).json(out);
    }

    async info(req, res) {
        let task = this.cronManager.info(req.params.id);
        if (!task) {
            res.sendStatus(404);
            return;
        }
        res.status(200).json(task);
    }
}
