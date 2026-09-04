export default class Config {
    #config = {
        address: '0.0.0.0',
        port: 8080,
        useHttps: false,
        httpsPrivateKey: global.root_path + '/CA/key.pem',
        httpsCertificate: global.root_path + '/CA/cert.pem',
        cookieParserKey: 'geheimer signier key',
        httpHeaders: {
            //helment config https://helmetjs.github.io/
            contentSecurityPolicy: false,
            crossOriginOpenerPolicy: false,
            crossOriginEmbedderPolicy: false,
            crossOriginResourcePolicy: false,
            originAgentCluster: false,
        },
        fileFolder: 'files',

        // ┌────────────── second (optional)
        // │ ┌──────────── minute
        // │ │ ┌────────── hour
        // │ │ │ ┌──────── day of month
        // │ │ │ │ ┌────── month
        // │ │ │ │ │ ┌──── day of week
        // * * * * * *
        intervals: {
            fileListUpdate: '0 */12 * * *',
            frameUptimeCheck: '*/30 * * * * *',
            frameRandomImage: '*/30 * * * *',
        },
        logLevel: ['INFO', 'LOG', 'WARN', 'ERROR'],
        dbLogging: false,
    };

    #replaceConfigs = ['httpHeaders'];

    constructor(userConfig) {
        console.log('[Config]', 'init');

        this.#config = this.#mergeConfig(this.#config, userConfig);
    }

    get address() {
        return this.#config.address;
    }

    get port() {
        return this.#config.port;
    }

    get useHttps() {
        return this.#config.useHttps;
    }

    get httpsPrivateKey() {
        return this.#config.httpsPrivateKey;
    }

    get httpsCertificate() {
        return this.#config.httpsCertificate;
    }

    get cookieParserKey() {
        return this.#config.cookieParserKey;
    }

    get httpHeaders() {
        return this.#config.httpHeaders;
    }

    get fileFolder() {
        return this.#config.fileFolder;
    }

    get logLevel() {
        return this.#config.logLevel;
    }

    get intervals() {
        return this.#config.intervals;
    }

    get fileListUpdate() {
        return this.#config.intervals.fileListUpdate;
    }

    get frameUptimeCheck() {
        return this.#config.intervals.frameUptimeCheck;
    }

    get frameRandomImage() {
        return this.#config.intervals.frameRandomImage;
    }

    get dbLogging() {
        return this.#config.dbLogging;
    }

    #mergeConfig(defaultConfig, userConfig) {
        const result = {
            ...defaultConfig,
        };

        for (const key of Object.keys(userConfig)) {
            const value = userConfig[key];

            if (this.#replaceConfigs.includes(key) || Array.isArray(value)) {
                result[key] = value;
                console.info('[Console]', `Use User Config for Key '${key}'`);
                continue;
            }

            if (
                value !== null &&
                typeof value === 'object' &&
                defaultConfig[key] !== null &&
                typeof defaultConfig[key] === 'object' &&
                !Array.isArray(defaultConfig[key])
            ) {
                result[key] = this.#mergeConfig(defaultConfig[key], value);

                continue;
            }

            result[key] = value;
            console.info('[Console]', `Use User Config for Key '${key}'`);
        }

        return result;
    }
}
