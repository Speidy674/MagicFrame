import cookieParser from 'cookie-parser';
import express from 'express';
import fs from 'fs';
import helmet from 'helmet';
import http from 'http';
import https from 'https';
import crypto from 'crypto';
import session from 'express-session';
import mustache from 'mustache';
import path from 'path';
import mustacheExpress from 'mustache-express';

export default class Server {
    #server;
    #app;
    #config;
    #sessionMiddleware;

    constructor(config) {
        console.log('[Server]', 'init');
        this.#config = config;

        this.createExpress();
        this.setupExpressViewEngine();
        this.createServer();
        this.startServer();

        this.#app.use(express.static(path.resolve(global.root_path, 'public')));
    }

    get express() {
        return this.#app;
    }

    get server() {
        return this.#server;
    }

    get sessionMiddleware() {
        if (!this.#sessionMiddleware) this.#createSessionMiddleware();
        return this.#sessionMiddleware;
    }

    createExpress() {
        console.debug('[Server]', 'Create Express');

        this.#app = express();
        this.#app.use(this.#requestLogger.bind(this));
        this.#app.set('trust proxy', 1);
        this.#app.use(cookieParser(this.#config.cookieParserKey));
        this.#app.use(this.sessionMiddleware);
        this.#app.use(helmet(this.#config.httpHeaders));
        this.#app.use(express.json());
        this.#app.use(express.urlencoded({ extended: true }));
        this.#app.use(function defaultHeaders(req, res, next) {
            res.header('Access-Control-Allow-Origin', '*');
            return next();
        });
    }

    setupExpressViewEngine() {
        console.debug('[Server]', 'Setup Express View Engine');

        const viewfolder = path.resolve(global.root_path, 'views');
        const partialsfolder = path.resolve(
            global.root_path,
            'public/templates'
        );

        let engine = mustacheExpress((file, ext) => {
            file = file.replaceAll('.', '/');
            return path.resolve(partialsfolder, file + ext);
        }, '.mustache');

        engine.cache.maxAge = 1;

        this.#app.engine('mustache', engine);
        this.#app.set('view engine', 'mustache');
        this.#app.set('views', viewfolder);
    }

    createServer() {
        console.debug('[Server]', 'Create Web Server');

        if (this.#config.useHttps) {
            const options = {
                key: fs.readFileSync(this.#config.httpsPrivateKey),
                cert: fs.readFileSync(this.#config.httpsCertificate),
            };
            this.#server = https.Server(options, this.#app);
        } else {
            this.#server = http.Server(this.#app);
        }
    }

    startServer() {
        let address = this.#config.address || 'localhost';
        let port = this.#config.port || '8080';

        console.log('[Server]', `Starting server on port ${address}:${port}`);

        this.#server.listen(port, address);
    }

    serveModule(url, file) {
        this.#app.get(url, (req, res) => {
            res.sendFile(path.resolve(global.root_path, file));
        });
    }

    #createSessionMiddleware() {
        console.debug('[Server]', 'Create new Session Middleware');

        this.#sessionMiddleware = session({
            genid: () => crypto.randomUUID(),
            name: 'sid',
            secret: this.#config.cookieParserKey,
            //	store: sessionStore,
            resave: false,
            saveUninitialized: false,
            cookie: {
                httpOnly: true,
                secure: true,
                maxAge: 1000 * 60 * 60 * 24,
            },
        });
    }

    #requestLogger(req, res, next) {
        console.debug(
            '[Server]',
            req.method,
            req.path,
            '-',
            req.headers['user-agent']
        );

        next();
    }

    stop() {
        console.debug('[Server]', 'Closing');

        this.#server.close();
    }
}
