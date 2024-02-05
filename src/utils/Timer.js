import { createConsole } from "./Console.js";

const _console = createConsole("Timer", { log: false });

class Timer {
    /**
     * @param {Function} callback
     * @param {number} interval
     * @param {boolean?} runImmediately
     */
    constructor(callback, interval, runImmediately = false) {
        _console.log("creating timer", { callback, interval, runImmediately });

        this.#callback = callback;
        this.#interval = interval;
        if (runImmediately) {
            this.start();
        }
    }
    /** @type {Function} */
    #callback;

    /** @type {number} */
    #interval;
    get interval() {
        return this.#interval;
    }
    set interval(newInterval) {
        _console.assertTypeWithError(newInterval, "number");
        if (newInterval == this.#interval) {
            _console.warn("same interval value", newInterval);
            return;
        }

        this.#interval = newInterval;
        if (this.isRunning) {
            this.#restart();
        }
    }

    /** @type {number?} */
    #intervalId = null;

    get isRunning() {
        return this.#intervalId != null;
    }

    start() {
        _console.assertWithError(!this.isRunning, "timer already running");
        this.#intervalId = window.setInterval(this.#callback, this.#interval);
    }
    stop() {
        if (!this.isRunning) {
            _console.assert("timer is already not running");
            return;
        }
        window.clearInterval(this.#intervalId);
        this.#intervalId = null;
    }

    #restart() {
        this.stop();
        this.start();
    }
}

export default Timer;
