import { toHuman } from 'cron-translate';
import cron from 'node-cron';

export default class CronManager {
    #config;
    #tasks = new Map();

    constructor(config) {
        console.log('[CronManager]', 'init');
        this.#config = config;
        this.#tasks = new Map();
    }

    all() {
        let out = [];
        this.#tasks.forEach((task, key) => out.push(this.#mapInfo(key, task)));
        return out;
    }

    /**
     *
     * @param {string} key
     * @param {string} cronExpression
     * @param {import('node-cron').TaskFn} taskFn
     * @param {import('node-cron').TaskOptions} options
     */
    create(key, cronExpression, taskFn, options = {}) {
        if (!key) {
            throw new Error('Key need to be set');
        }
        console.debug('[CronManager]', `create Task '${key}'`);

        if (this.#tasks.has(key)) {
            throw new Error('Key already set');
        }

        if (!options?.name) {
            options.name = key;
        }

        const task = cron.createTask(cronExpression, taskFn, options);

        this.#tasks.set(key, task);

        this.#setTaskEventListiner(task);

        return task;
    }

    #setTaskEventListiner(task) {
        task.on('execution:started', (ctx) => {
            console.debug(
                '[CronManager]',
                `'${task.name}'`,
                `startet: Reason ${ctx.execution.reason}`
            );
        });

        task.on('execution:finished', (ctx) => {
            console.debug(
                '[CronManager]',
                `'${task.name}'`,
                `done in ${ctx.execution?.finishedAt - ctx.execution?.startedAt}ms`
            );
        });

        task.on('execution:failed', (ctx) => {
            console.debug(
                '[CronManager]',
                `'${task.name}'`,
                'failed:',
                ctx.execution?.error?.message
            );
        });
    }

    #getTask(key) {
        if (!this.#tasks.has(key)) return null;
        return this.#tasks.get(key);
    }

    start(key) {
        const task = this.#getTask(key);
        if (!task) return null;
        task.start();
    }

    stop(key) {
        const task = this.#getTask(key);
        if (!task) return null;
        task.stop();
    }

    destroy(key) {
        const task = this.#getTask(key);
        if (!task) return null;
        task.destroy();

        this.#tasks.delete(key);
    }

    execute(key) {
        const task = this.#getTask(key);
        if (!task) return null;
        task.execute();
    }

    getStatus(key) {
        const task = this.#getTask(key);
        if (!task) return null;
        return task.getStatus();
    }

    getNextRun(key) {
        const task = this.#getTask(key);
        if (!task) return null;
        return task.getNextRun();
    }

    info(key) {
        const task = this.#getTask(key);
        if (!task) return null;
        return this.#mapInfo(key, task);
    }

    #mapInfo(key, task) {
        return {
            key: key,
            status: task.getStatus(),
            nextRun: task.getNextRun(),
            isBusy: task.isBusy(),
            pattern: {
                cron: task.getPattern(),
                human: toHuman(task.getPattern()),
            },
            lastRun: task.lastRun(),
            msToNext: task.msToNext(),
            runsLeft: task.runsLeft(),
        };
    }

    stop() {
        console.debug('[CronManager]', 'Stopping');

        this.#tasks.forEach((task, key) => {
            task.destroy();
        });
    }
}
