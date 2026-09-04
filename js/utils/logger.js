import { styleText } from 'node:util';

const LogLevelWidth = 5;

const LogLevelStyleMap = {
    log: 'cyan',
    error: ['red', 'bold'],
    info: 'green',
    warn: 'yellow',
    debug: 'magenta',
};

const LogLevels = Object.freeze({
    LOG: 'log',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
    DEBUG: 'debug',
    GROUP: 'group',
    GROUPCOLLAPSED: 'groupCollapsed',
    GROUPEND: 'groupEnd',
    TIME: 'time',
    TIMEEND: 'timeEnd',
    TIMESTAMP: 'timeStamp',
});

export default (() => {
    let enabledLogLevels = ['log', 'info', 'warn', 'error'];

    const originalLogs = {
        log: Function.prototype.bind.call(console.log, console),
        info: Function.prototype.bind.call(console.info, console),
        warn: Function.prototype.bind.call(console.warn, console),
        error: Function.prototype.bind.call(console.error, console),
        debug: Function.prototype.bind.call(console.debug, console),
        group: Function.prototype.bind.call(console.group, console),
        groupCollapsed: Function.prototype.bind.call(
            console.groupCollapsed,
            console
        ),
        groupEnd: Function.prototype.bind.call(console.groupEnd, console),
        time: Function.prototype.bind.call(console.time, console),
        timeEnd: Function.prototype.bind.call(console.timeEnd, console),
        timeStamp: Function.prototype.bind.call(console.timeStamp, console),
    };

    function getTimestampFormated() {
        const date = new Date();

        const pad = (num, size = 2) => String(num).padStart(size, '0');

        const formattedDate =
            `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
            `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
        return '[' + styleText('yellow', formattedDate) + ']';
    }

    function getLogLevelFormated(loglevel) {
        let logLevelLabel = loglevel.toUpperCase();
        const logLevelStyle = LogLevelStyleMap[loglevel] ?? 'reset';

        const missingCharsCount = LogLevelWidth - logLevelLabel.length;

        if (Array.isArray(logLevelStyle)) {
            logLevelLabel = styleText(logLevelStyle, logLevelLabel);
        } else {
            logLevelLabel = styleText([logLevelStyle], logLevelLabel);
        }

        logLevelLabel = '[' + logLevelLabel + ']';

        for (let index = 0; index < missingCharsCount; index++) {
            logLevelLabel += ' ';
        }

        return logLevelLabel;
    }

    function writeLog(type, ...msg) {
        if (!enabledLogLevels.includes(type)) return;
        const typeFunction = type.toLowerCase();
        const timestampLabel = getTimestampFormated();
        const logLevelLabel = getLogLevelFormated(type);
        originalLogs[typeFunction](
            `${timestampLabel} ${logLevelLabel}`,
            ...msg
        );
    }

    Object.keys(LogLevels).forEach((logLevelKey) => {
        const logLevel = LogLevels[logLevelKey];
        console[logLevel] = (...msg) => writeLog(logLevel, ...msg);
    });

    console.setLogLevels = (newLogLevels) => {
        enabledLogLevels = newLogLevels.map((level) => level.toLowerCase());
    };

    console.addLogLevel = (logLevel) => {
        if (enabledLogLevels.includes(logLevel)) return;
        enabledLogLevels.push(logLevel);
    };

    return console;
})();
