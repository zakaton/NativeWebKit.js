import { isInDev } from "./context.js";

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
    isLoggingEnabled = false;
    /** @type {LogFunction} */
    get log() {
        return isInDev && this.isLoggingEnabled ? this.#log : this.#emptyFunction;
    }
    #log = console.log.bind(console);

    /** @type {boolean} */
    isWarningEnabled = true;
    /** @type {LogFunction} */
    get warn() {
        return isInDev && this.isWarningEnabled ? this.#warn : this.#emptyFunction;
    }
    /** @type {LogFunction} */
    #warn = console.warn.bind(console);

    /** @type {boolean} */
    isErrorEnabled = true;
    /** @type {LogFunction} */
    get error() {
        return isInDev && this.isErrorEnabled ? this.#error : this.#emptyFunction;
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
        if (prefix) {
            this.prefix = prefix;
        }
    }
}

export default Console;
