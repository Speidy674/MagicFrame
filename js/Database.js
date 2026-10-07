import { DataTypes, Sequelize } from 'sequelize';
import path from 'path';
import Migration from './database/Migration.js';
import Frame from './database/models/Frame.js';
import FrameSetting from './database/models/FrameSetting.js';
import Media from './database/models/Media.js';

export default class Database {
    #config;
    #sequelize;
    #migration;

    constructor(config) {
        console.log('[Database]', 'init');
        this.#config = config;

        this.#sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: path.resolve(global.root_path, 'data/database.sqlite'),
            logging: (msg, dbConfig) => this.#dbLogger(msg, dbConfig),
        });

        this.#sequelize.afterConnect(async (connection, config) => {
            await connection.query("PRAGMA journal_mode = WAL;");
            await connection.query("PRAGMA synchronous = NORMAL;");
            await connection.query("PRAGMA journal_size_limit = 67108864;");
            await connection.query("PRAGMA mmap_size = 134217728;");
            await connection.query("PRAGMA cache_size = 2000;");
            await connection.query("PRAGMA busy_timeout = 60000;");
        })
    }

    #dbLogger(msg, dbConfig) {
        if (!this.#config.dbLogging) {
            return;
        }
        console.debug('[Database]', msg);
    }

    loadModels() {
        Frame.mfInitModel(this.#sequelize);
        FrameSetting.mfInitModel(this.#sequelize);
        Media.mfInitModel(this.#sequelize);
    }

    async testConnection() {
        try {
            await this.#sequelize.authenticate();

        } catch (error) {
            throw 'Database Error';
        }
    }

    async stop() {
        console.debug('[Database]', 'Closing');
        await this.#sequelize.close();
    }

    get migration() {
        if (!this.#migration) this.#migration = new Migration(this.#sequelize);

        return this.#migration;
    }

    get sequelize() {
        return this.#sequelize;
    }
}
