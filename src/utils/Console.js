class Console {
    /**
     * @callback LogFunction
     * @param {...any} data
     */

    #emptyFunction = function () {};

    /** @param {string|undefined} newPrefix */
    set prefix(newPrefix) {
        const args = [console];
        if (newPrefix) {
            if (Array.isArray(newPrefix)) {
                args.push(...newPrefix);
            } else {
                args.push(newPrefix);
            }
        }

        this.#log = console.log.bind(...args);
        this.#warn = console.warn.bind(...args);
        this.#error = console.error.bind(...args);
    }

    /** @type {boolean} */
    isLoggingEnabled = true;
    /** @type {LogFunction} */
    get log() {
        return this.isLoggingEnabled ? this.#log : this.#emptyFunction;
    }
    #log = console.log.bind(console);

    /** @type {boolean} */
    isWarningEnabled = false;
    /** @type {LogFunction} */
    get warn() {
        return this.isWarningEnabled ? this.#warn : this.#emptyFunction;
    }
    /** @type {LogFunction} */
    #warn = console.warn.bind(console);

    /** @type {boolean} */
    isErrorEnabled = false;
    /** @type {LogFunction} */
    get error() {
        return this.isErrorEnabled ? this.#error : this.#emptyFunction;
    }
    /** @type {LogFunction} */
    #error = console.error.bind(console);

    /** @param {boolean} isEnabled */
    set isEnabled(isEnabled) {
        this.isLoggingEnabled = isEnabled;
        this.isWarningEnabled = isEnabled;
        this.isErrorEnabled = isEnabled;
    }

    /**
     *
     * @param {string|undefined} prefix
     */
    constructor(prefix) {
        super();
        if (prefix) {
            this.prefix = prefix;
        }
    }
}

export default Console;
