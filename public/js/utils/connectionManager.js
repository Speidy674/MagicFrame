import OpCodesIm from '/js/enums/OpCodes.js';

/** @typedef {import("../../js/enums/OpCodes.js").OpCodesType} OpCodesType */

/** @type {OpCodesType} */
const OpCodes = OpCodesIm;

class EventBus {
    #eventTarget = new EventTarget();

    emit(event, ...data) {
        this.#eventTarget.dispatchEvent(
            new CustomEvent(event, { detail: data })
        );
    }

    on(event, eventHandler, { signal }) {
        const listener = (event) => eventHandler(...event.detail);
        this.#eventTarget.addEventListener(event, listener, { signal });
        return () => this.#eventTarget.removeEventListener(event, listener);
    }
}

export default class ConnectionManager {
    #socket;
    #connected;
    #eventBus;

    constructor() {
        this.#connected = false;
        this.#eventBus = new EventBus();
    }

    async connect() {
        if (this.#socket) {
            await this.#socket.disconnect();
            this.#socket = null;
            this.#connected = false;
        }
        this.#socket = new io();

        this.#handleListiner();
    }

    on(event, eventHandler, { signal } = {}) {
        this.#eventBus.on(event, eventHandler, { signal });
    }

    emit(event, ...data) {
        if (!this.isConnected) return;
        this.#socket.emit(event, ...data);
    }

    #handleListiner() {
        this.#socket.on('connect', () => {
            console.log(
                '[Socket]',
                `[${new Date().toLocaleString()}]`,
                'connect'
            );

            this.#connected = true;

            this.#eventBus.emit('socket:connect');
        });

        this.#socket.on('connect_error', (err) => {
            console.log(
                '[Socket]',
                `[${new Date().toLocaleString()}]`,
                'connect_error: ' + err
            );
            this.#connected = false;

            this.#eventBus.emit('socket:connect_error');
        });

        this.#socket.on('disconnect', (err) => {
            console.log(
                '[Socket]',
                `[${new Date().toLocaleString()}]`,
                'disconnect: ' + err
            );
            this.#connected = false;

            this.#eventBus.emit('socket:disconnect');
        });

        this.#socket.io.on('reconnect', () => {
            console.log(
                '[Socket]',
                `[${new Date().toLocaleString()}]`,
                'reconnect'
            );

            this.#eventBus.emit('socket:reconnect');
        });

        this.#socket.onAny((eventName, ...data) => {
            console.debug(
                '[Socket]',
                `[${new Date().toLocaleString()}]`,
                `Message [${eventName}]`,
                ...data
            );

            this.#eventBus.emit(eventName, ...data);
        });

        this.#socket.on(OpCodes.RELOAD.value, () => {
            window.location.reload();
        });
    }

    get socket() {
        return this.#socket;
    }

    get isConnected() {
        return this.#connected;
    }
}
