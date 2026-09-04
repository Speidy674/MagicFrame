import { Router } from 'express';

export default class BaseRouter {
    #config;
    #socket;
    #router;

    constructor(config, socket, ...extraArgs) {
        const routerName = this.constructor.name ?? 'BaseRouter';
        console.log(`[${routerName}]`, 'init');
        this.#config = config;
        this.#socket = socket;
        this.#router = new Router();

        this.handleExtraArgs(...extraArgs);

        this.initRoutes();
    }

    get config() {
        return this.#config;
    }

    get socket() {
        return this.#socket;
    }

    get router() {
        return this.#router;
    }

    handleExtraArgs() {}

    initRoutes() {}
}
