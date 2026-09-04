import { Server as SocketIOServer } from 'socket.io';

export default class Socket {
    #server;
    #io;
    #sockets = new Set();
    #events = new Map();
    #connectHandler;
    #disconnectHandler;

    constructor(config, _server) {
        console.log('[Socket]', 'init');
        this.#server = _server;

        this.#io = new SocketIOServer(this.#server.server, {
            cors: {
                origin: /.*$/,
                credentials: true,
            },
            allowEIO3: true,
        });

        this.#io.engine.use(this.#server.sessionMiddleware);

        this.#handleConnection();
    }

    #handleConnection() {
        this.#io.on('connection', (socket) => {
            this.#sockets.add(socket);
            console.debug('[Socket]', `Client connected: ${socket.id}`);
            socket.mfInfos = {};
            this.#handleConnect(socket);

            socket.onAny((eventName, ...data) => {
                console.debug(
                    '[Socket]',
                    `Client Message ${socket.id} [${eventName}]`,
                    data
                );
                this.#handleEvent(socket, eventName, ...data);
            });

            socket.on('disconnect', () => {
                this.#sockets.delete(socket);
                this.#handleDisconnect(socket);
                console.debug('[Socket]', `Client disconnected: ${socket.id}`);
            });
        });
    }

    #handleConnect(socket) {
        const handler = this.#connectHandler;

        if (!handler) {
            return;
        }

        handler(socket);
    }

    #handleDisconnect(socket) {
        const handler = this.#disconnectHandler;

        if (!handler) {
            return;
        }

        handler(socket);
    }

    #handleEvent(socket, eventName, ...data) {
        if (!this.#events.has(eventName)) {
            console.warn('[Socket]', `Unknown Event '${eventName}'`);
            return;
        }

        const eventHandler = this.#events.get(eventName);

        if (!eventHandler) {
            console.warn('[Socket]', `Event '${eventName}' has no Handler`);
            return;
        }

        eventHandler(socket, ...data);
    }

    connected(handler) {
        this.#connectHandler = handler;
    }

    disconnected(handler) {
        this.#disconnectHandler = handler;
    }

    on(eventName, handler) {
        console.debug('[Socket]', `Register Handler for Event '${eventName}'`);
        this.#events.set(eventName, handler);
    }

    emit(eventName, ...data) {
        console.debug('[Socket]', `Emit Event '${eventName}'`);
        this.#io.emit(eventName, ...data);
    }

    send(socket, eventName, ...data) {
        console.debug(
            '[Socket]',
            `Emit Event '${eventName}' to socket '${socket.id}'`
        );
        socket.emit(eventName, ...data);
    }

    sendTo(socketId, eventName, ...data) {
        console.debug(
            '[Socket]',
            `Emit Event '${eventName}' to socket '${socketId}'`
        );
        this.#io.to(socketId).emit(eventName, ...data);
    }

    stop() {
        console.debug('[Socket]', 'Closing');

        this.#sockets.clear();

        this.#io.close();
    }
}
