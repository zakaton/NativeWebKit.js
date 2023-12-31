import Console from "./Console.js";
import { isSafariExtensionInstalled } from "./context.js";

const _console = new Console("AppMessagePoll");

/** @typedef {import("./messaging.js").NKMessage} NKMessage */

class AppMessagePoll {
    static #isPollingEnabled = isSafariExtensionInstalled;

    /** @type {number|null} */
    static #intervalId = null;
    static get #isRunning() {
        return this.#intervalId != null;
    }

    /** @type {AppMessagePoll[]} */
    static #polls = [];
    get index() {
        return AppMessagePoll.#polls.indexOf(this);
    }

    /** @type {function():} */
    #callback;
    /** @type {number} */
    #interval;
    get interval() {
        return this.#interval;
    }
    set interval(newInterval) {
        if (isRunning) {
            this.stop();
        }
        this.#interval = newInterval;
        if (isRunning) {
            this.start();
        }
    }

    /**
     * @param {function():NKMessage} callback
     * @param {number} interval
     */
    constructor(callback, interval) {
        this.#callback = callback;
        this.#interval = interval;
        AppMessagePoll.#polls.push(this);
    }

    start() {
        // FILL
    }
    get isRunning() {
        return false;
    }
    stop() {
        // FILL
    }

    destroy() {
        _console.log("destroying poll", this);
        AppMessagePoll.#polls.splice(this.index, 1);
    }
}

export default AppMessagePoll;
