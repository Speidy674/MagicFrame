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
            pool: {
                max: 20,
                min: 0,
            },
        });
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
