import './utils/logger.js';
import Database from './Database.js';
import path from 'path';
import { pathToFileURL } from 'url';
import Config from './utils/Config.js';

global.version = process.env.npm_package_version ?? 'unkown';
global.root_path = path.resolve(`${import.meta.dirname}/../`);

console.log('[Migration]', 'MagicFrame v' + global.version);

const actions = {
    drop: 'Drop all Tabels',
    up: 'run new migrations',
    down: 'remove latest migration batch',
    fresh: 'drops all table and run migration',
};

const printUsage = (action = null) => {
    const base = 'npm run migration';

    if (action) {
        console.error(`Action not found '${action}'`);
    }

    const maxLength = Math.max(
        ...Object.keys(actions).map((action) => action.length)
    );

    console.error('Usage');

    Object.keys(actions).forEach((action) => {
        const info = actions[action];
        console.error(`- ${base} ${action.padEnd(maxLength)} - ${info}`);
    });
};

const [, , ...args] = process.argv;

if (!args || args.length === 0) {
    printUsage();
    process.exit(1);
}

const configFilePath = path.resolve(global.root_path, 'config/config.js');
const { default: userConfig } = await import(pathToFileURL(configFilePath));
const config = new Config(userConfig);

const database = new Database(config);

await database.testConnection();

try {
    switch (args[0].toLowerCase().trim()) {
        case 'drop':
            await database.migration.drop();
            break;
        case 'up':
            await database.migration.up();
            break;
        case 'down':
            await database.migration.down();
            break;
        case 'fresh':
            await database.migration.drop();
            await database.migration.up();
            break;
        default:
            printUsage(args[0]);
            break;
    }
} catch (error) {
    console.error('[Migration]', error);
} finally {
    await database.stop();
}
