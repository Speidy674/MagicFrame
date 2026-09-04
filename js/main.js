import './utils/logger.js';
import path from 'path';
import { pathToFileURL } from 'url';
import Config from './utils/Config.js';
import Core from './Core.js';

global.version = process.env.npm_package_version ?? 'unkown';
global.root_path = path.resolve(`${import.meta.dirname}/../`);

console.log('[Core]', 'Starting MagicFrame v' + global.version);

const configFilePath = path.resolve(global.root_path, 'config/config.js');
const { default: userConfig } = await import(pathToFileURL(configFilePath));
const config = new Config(userConfig);

console.setLogLevels(config.logLevel);

const core = await new Core(config);
const shutdown = async (signal) => {
    console.log(`[${signal}]`, 'Received. Shutting down server...');
    await core.stop();
    console.log('Goodbye');
    process.exit(0);
};

process.on('SIGINT', () => {
    shutdown('SIGINT');
});

process.on('SIGTERM', () => {
    shutdown('SIGTERM');
});
