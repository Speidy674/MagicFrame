/**
 * @template T
 */
class EnumEntry {
    #key;
    #name;
    /** @type {T} */
    #value;

    /**
     *
     * @param {string} key
     * @param {string} name
     * @param {T} value
     */
    constructor(key, name, value) {
        this.#key = key;
        this.#name = name;
        this.#value = value;
    }

    /** @returns {string} */
    get key() {
        return this.#key;
    }
    /** @returns {string} */
    get name() {
        return this.#name;
    }
    /** @returns {T} */
    get value() {
        return this.#value;
    }
}

class Enum {
    constructor(entrys) {
        for (const enumCase of Object.keys(entrys)) {
            const enumProperty = entrys[enumCase];
            let enumName = enumCase;
            let enumValue = enumProperty ?? enumCase;

            if (
                typeof enumProperty === 'object' &&
                !Array.isArray(enumProperty)
            ) {
                enumValue = enumProperty.value;
                if (Object.keys(enumProperty).includes('name')) {
                    enumName = enumProperty.name;
                } else if (Object.keys(enumProperty).includes('label')) {
                    enumName = enumProperty.label;
                }
            }

            this[enumCase] = new EnumEntry(enumCase, enumName, enumValue);
        }
    }

    all() {
        return Object.values(this).filter(
            (entry) => entry instanceof EnumEntry
        );
    }

    tryFromValue(value) {
        const entry = Object.values(this)
            .filter((entry) => entry instanceof EnumEntry)
            .find((entry) => entry.value === value);
        if (!entry) {
            throw new Error(`Value '${value}' not found in Enum`);
        }
        return entry;
    }

    tryFromName(name) {
        const entry = Object.values(this)
            .filter((entry) => entry instanceof EnumEntry)
            .find(
                (entry) =>
                    entry.name.trim().toLowerCase() ===
                    name.trim().toLowerCase()
            );
        if (!entry) {
            throw new `Name '${name}' not found in Enum`();
        }
        return entry;
    }
}

export { EnumEntry, Enum };
