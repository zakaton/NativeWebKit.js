import { createConsole } from "./Console.js";
import { checkIfSafariExtensionIsInstalled, isInApp, checkIfNativeWebKitEnabled } from "./platformUtils.js";
import { findGreatestCommonFactor } from "./MathUtils.js";
import { sendMessageToApp } from "./messaging.js";

const _console = createConsole("AppMessagePoll", { log: false });

/** @typedef {import("./messaging.js").NKMessage} NKMessage */

class AppMessagePoll {
    #runInApp = false;
    async #isPollingEnabled() {
        const isNativeWebKitEnabled = await checkIfNativeWebKitEnabled();
        if (!isNativeWebKitEnabled) {
            return false;
        }

        if (isInApp) {
            return this.#runInApp;
        } else {
            const isSafariExtensionInstalled = await checkIfSafariExtensionIsInstalled();
            return isSafariExtensionInstalled;
        }
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

    /** @type {function():(NKMessage?|NKMessage[]?)} */
    #generateMessage;
    /** @type {string} */
    #prefix = "";
    /** @type {number} (ms) */
    #interval;
    /** @type {number} (ms) */
    #lastTimeCallbackWasCalled = 0;
    get interval() {
        return this.#interval;
    }
    set interval(newInterval) {
        _console.assertWithError(newInterval > 0, `invalid interval ${newInterval}ms`);
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
     * @param {NKMessage|function():(NKMessage?|NKMessage[]?)} messageOrMessageGenerator
     * @param {string} prefix
     * @param {number} interval (ms)
     * @param {boolean} runInApp
     */
    constructor(messageOrMessageGenerator, prefix, interval, runInApp = false) {
        if (typeof messageOrMessageGenerator == "function") {
            const generateMessage = messageOrMessageGenerator;
            this.#generateMessage = generateMessage;
        } else {
            const message = messageOrMessageGenerator;
            this.#generateMessage = () => message;
        }
        this.#prefix = prefix;
        this.#interval = interval;
        this.#runInApp = runInApp;
        AppMessagePoll.#add(this);
    }

    /** @type {number?} */
    static #intervalId = null;
    static get #IsRunning() {
        return this.#intervalId != null;
    }

    /** @type {number?} (ms) */
    static #Interval = null;
    static get #enabledPolls() {
        return this.#polls.filter((poll) => poll.#isEnabled);
    }
    static get #intervals() {
        return this.#enabledPolls.map((poll) => poll.#interval);
    }

    /** @returns {boolean} did interval update */
    static #updateInterval() {
        /** @type {number?} */
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

        const messages = polls
            .map((poll) => {
                var _messages = poll.#generateMessage();
                if (!_messages) {
                    return [];
                }
                if (!Array.isArray(_messages)) {
                    _messages = [_messages];
                }
                _messages = _messages.map((_message) => {
                    _message = Object.assign({}, _message);
                    _message.type = `${poll.#prefix}-${_message.type}`;
                    return _message;
                });
                return _messages;
            })
            .flat();
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
    async start() {
        const isPollingEnabled = await this.#isPollingEnabled();
        if (!isPollingEnabled) {
            //_console.warn("polling is not enabled");
            return;
        }
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
export default AppMessagePoll;
