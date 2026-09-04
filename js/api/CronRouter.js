import BaseRouter from './BaseRouter.js';

export default class CronRouter extends BaseRouter {
    handleExtraArgs(cronManager) {
        this.cronManager = cronManager;
    }

    initRoutes() {
        this.router.get('/', this.list.bind(this));
        this.router.get('/:id', this.info.bind(this));
    }

    async list(req, res) {
        res.status(200).json(this.cronManager.all());
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
