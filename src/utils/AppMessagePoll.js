import Console from "./Console.js";
import { isSafariExtensionInstalled } from "./context.js";
import { findGreatestCommonFactor } from "./MathUtils.js";
import { sendMessageToApp } from "./messaging.js";

const _console = new Console("AppMessagePoll");

/** @typedef {import("./messaging.js").NKMessage} NKMessage */

class AppMessagePoll {
    static get #isPollingEnabled() {
        return isSafariExtensionInstalled();
    }

    /** @type {AppMessagePoll[]} */
    static #polls = [];
    /**
     * @param {AppMessagePoll} poll
     * @returns {number} poll index
     * */
    static #add(poll) {
        if (this.#polls.includes(poll)) {
            _console.log("poll already included");
            return this.#polls.indexOf(poll);
        } else {
            return this.#polls.push(poll);
        }
    }
    /**
     * @param {AppMessagePoll} poll
     * @returns {boolean} false if poll was never included
     * */
    static #remove(poll) {
        if (!this.#polls.includes(poll)) {
            _console.log("poll wasn't included");
            return false;
        } else {
            poll.stop();
            this.#polls.splice(poll, poll.#index);
            this.#restart();
            return true;
        }
    }
    get #index() {
        return AppMessagePoll.#polls.indexOf(this);
    }

    /** @type {function():NKMessage} */
    #generateMessage;
    /** @type {number} (ms) */
    #interval;
    /** @type {number} (ms) */
    #lastTimeCallbackWasCalled = 0;
    get interval() {
        return this.#interval;
    }
    set interval(newInterval) {
        if (newInterval <= 0) {
            _console.error(`invalid interval ${newInterval}ms`);
            return;
        }
        if (newInterval == this.#interval) {
            _console.warn("assigning same interval");
            return;
        }

        this.#interval = newInterval;
        if (this.#isRunning) {
            AppMessagePoll.#restart();
        }
    }

    /**
     * @param {function():NKMessage} generateMessage
     * @param {number} interval (ms)
     */
    constructor(generateMessage, interval) {
        this.#generateMessage = generateMessage;
        this.#interval = interval;
        AppMessagePoll.#add(this);
    }

    /** @type {number|null} */
    static #intervalId = null;
    static get #IsRunning() {
        return this.#intervalId != null;
    }

    /** @type {number|null} (ms) */
    static #Interval = null;
    static get #enabledPolls() {
        return this.#polls.filter((poll) => poll.#isEnabled);
    }
    static get #intervals() {
        return this.#enabledPolls.map((poll) => poll.#interval);
    }

    /** @returns {boolean} did interval update */
    static #updateInterval() {
        /** @type {number|null} */
        var newInterval = findGreatestCommonFactor(this.#intervals);
        _console.log(`new interval ${newInterval}`);
        if (this.#Interval != newInterval) {
            _console.log(`interval updated from ${this.#Interval} to ${newInterval}`);
            this.#Interval = newInterval;
            return true;
        }
    }

    static async #intervalCallback() {
        const now = Date.now();
        const polls = this.#enabledPolls.filter((poll) => {
            const timeSinceLastCallback = now - poll.#lastTimeCallbackWasCalled;
            return timeSinceLastCallback >= poll.#interval;
        });

        const messages = polls.map((poll) => poll.#generateMessage());
        _console.log("messages", messages);

        if (messages.length > 0) {
            const didReceiveMessage = await sendMessageToApp(messages);
            _console.log("didReceiveMessage?", didReceiveMessage);
            if (!didReceiveMessage) {
                _console.error("app didn't receive message");
            }
        } else {
            _console.log("no messages to send");
        }

        polls.forEach((poll) => (poll.#lastTimeCallbackWasCalled = now));
    }
    static #start() {
        if (this.#IsRunning) {
            _console.log("tried to start AppMessagePoll when it's already running");
            return;
        }
        if (this.#Interval == null) {
            _console.log("null interval");
            return;
        }
        if (!this.#isPollingEnabled) {
            _console.error("polling is not enabled");
            return;
        }
        _console.log(`starting interval at ${this.#Interval}`);

        this.#intervalId = window.setInterval(this.#intervalCallback.bind(this), this.#Interval);
    }
    static #stop() {
        if (!this.#IsRunning) {
            _console.log("tried to stop AppMessagePoll when it already isn't running");
            return;
        }

        window.clearInterval(this.#intervalId);
        this.#intervalId = null;
    }
    static #restart(startAnyway = false) {
        if (!this.#IsRunning && !startAnyway) {
            //_console.log("AppMessagePoll isn't running");
            return;
        }

        const didIntervalUpdate = this.#updateInterval();
        if (this.#IsRunning || didIntervalUpdate) {
            _console.log("restarting...");
            this.#stop();
            this.#start();
        } else {
            _console.log("no need to restart");
        }
    }

    /** @type {boolean} */
    #isEnabled = false;
    get #isRunning() {
        return AppMessagePoll.#IsRunning && this.#isEnabled;
    }
    start() {
        if (this.#isRunning) {
            _console.log("poll is already running");
            return;
        }
        this.#isEnabled = true;
        AppMessagePoll.#restart(true);
    }
    stop() {
        if (!this.#isRunning) {
            //_console.log("poll isn't running");
            return;
        }
        this.#isEnabled = false;
        AppMessagePoll.#restart();
    }

    destroy() {
        _console.log("destroying poll", this);
        AppMessagePoll.#remove(this);
    }
}

window.AppMessagePoll = AppMessagePoll;

export default AppMessagePoll;
