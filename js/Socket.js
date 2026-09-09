import { Server as SocketIOServer } from 'socket.io';
import EventEmitter from 'node:events';

export default class Socket {
    #server;
    #io;
    #sockets = new Set();
    #eventEmitter;

    constructor(config, _server) {
        console.log('[Socket]', 'init');
        this.#server = _server;

        this.#eventEmitter = new EventEmitter();

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
        this.#eventEmitter.emit('socket:connected', socket);
    }

    #handleDisconnect(socket) {
        this.#eventEmitter.emit('socket:disconnected', socket);
    }

    #handleEvent(socket, eventName, ...data) {
        this.#eventEmitter.emit(eventName, socket, ...data);
    }

    connected(handler) {
        this.#eventEmitter.on('socket:connected', handler);
    }

    disconnected(handler) {
        this.#eventEmitter.on('socket:disconnected', handler);
    }

    on(eventName, handler) {
        console.debug('[Socket]', `Register Handler for Event '${eventName}'`);
        this.#eventEmitter.on(eventName, handler);
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

    sendTo(to, eventName, ...data) {
        console.debug(
            '[Socket]',
            `Emit Event '${eventName}' to socket/room '${to}'`
        );
        this.#io.to(to).emit(eventName, ...data);
    }

    stop() {
        console.debug('[Socket]', 'Closing');

        this.#sockets.clear();

        this.#io.close();
    }
}
