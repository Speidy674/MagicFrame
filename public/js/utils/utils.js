export function humanReadable(input, lang = 'de') {
    const date = input instanceof Date ? input : new Date(input);
    const formatter = new Intl.RelativeTimeFormat('de', { numeric: 'auto' });
    const ranges = [
        ['years', 3600 * 24 * 365],
        ['months', 3600 * 24 * 30],
        ['weeks', 3600 * 24 * 7],
        ['days', 3600 * 24],
        ['hours', 3600],
        ['minutes', 60],
        ['seconds', 1],
    ];
    const secondsElapsed = (date.getTime() - Date.now()) / 1000;

    for (const [rangeType, rangeVal] of ranges) {
        if (rangeVal < Math.abs(secondsElapsed)) {
            const delta = secondsElapsed / rangeVal;
            return formatter.format(Math.round(delta), rangeType);
        }
    }

    return formatter.format(0, 'second');
}

const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB'];

export function formatBytes(input, decimals = 2) {
    if (input === 0) return `0 ${sizes[0]}`;

    const base = 1024;

    const _decimals = decimals < 0 ? 0 : decimals;

    const sizesIndex = Math.floor(Math.log(input) / Math.log(base));

    const finalSize = input / Math.pow(base, sizesIndex)

    return `${finalSize.toFixed(_decimals)} ${sizes[sizesIndex]}`;
}