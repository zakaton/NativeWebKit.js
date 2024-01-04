/**
 * @copyright Zack Qattan 2024
 * @license MIT
 */
const { userAgent } = navigator;

const isInApp = /NativeWebKit/i.test(userAgent);

const isSafariExtensionInstalled = Boolean(window.isNativeWebKitSafariExtensionInstalled);

const isNativeWebKitEnabled = isInApp || isSafariExtensionInstalled;

/** @typedef {import("./messaging.js").NKMessage} NKMessage */

/**
 * @typedef EventDispatcherEvent
 * @type {object}
 * @property {string} type
 */

/**
 * @typedef {(event: EventDispatcherEvent) => void} EventListener
 */

// based on https://github.com/mrdoob/eventdispatcher.js/
class EventDispatcher {
    /** @type {string[]} */
    get eventTypes() {
        return [];
    }

    /**
     * @param {string} type
     * @returns {boolean}
     */
    #isValidEventType(type) {
        if (this.eventTypes.length == 0) {
            return true;
        }
        return this.eventTypes.includes(type);
    }

    /**
     * @param {string} type
     * @throws {Error}
     */
    #assertValidEventType(type) {
        if (!this.#isValidEventType(type)) {
            throw Error(`invalid event type "${type}"`);
        }
    }

    /** @type {Object.<string, [function]|undefined>|undefined} */
    #listeners;

    /**
     * @param {string} type
     * @param {EventListener} listener
     * @param {object|undefined} options
     * @throws {Error}
     */
    addEventListener(type, listener, options) {
        this.#assertValidEventType(type);

        if (!this.#listeners) this.#listeners = {};

        if (options?.once) {
            const _listener = listener;
            listener = function onceCallback(event) {
                _listener.apply(this, arguments);
                this.removeEventListener(type, onceCallback);
            };
        }

        const listeners = this.#listeners;

        if (!listeners[type]) {
            listeners[type] = [];
        }

        if (!listeners[type].includes(listener)) {
            listeners[type].push(listener);
        }
    }

    /**
     *
     * @param {string} type
     * @param {EventListener} listener
     * @returns {boolean}
     * @throws {Error}
     */
    hasEventListener(type, listener) {
        this.#assertValidEventType(type);
        return this.#listeners?.[type]?.includes(listener);
    }

    /**
     * @param {string} type
     * @param {EventListener} listener
     * @returns {boolean}
     * @throws {Error}
     */
    removeEventListener(type, listener) {
        this.#assertValidEventType(type);
        if (this.hasEventListener(type, listener)) {
            const index = this.#listeners[type].indexOf(listener);
            this.#listeners[type].splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * @param {EventDispatcherEvent} event
     * @throws {Error}
     */
    dispatchEvent(event) {
        this.#assertValidEventType(event.type);
        if (this.#listeners?.[event.type]) {
            event.target = this;

            // Make a copy, in case listeners are removed while iterating.
            const array = this.#listeners[event.type].slice(0);

            for (let i = 0, l = array.length; i < l; i++) {
                array[i].call(this, event);
            }
        }
    }

    /** @type {string} */
    get _prefix() {
        return "";
    }
    /**
     * @param {NKMessage} message
     * @returns {NKMessage}
     */
    _formatMessage(message) {
        /** @type {NKMessage} */
        const formattedMessage = { ...message };
        formattedMessage.type = `${this._prefix}-${message.type}`;
        return formattedMessage;
    }
}

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
        return this.#emptyFunction;
    }
    #log = console.log.bind(console);

    /** @type {boolean} */
    isWarningEnabled = false;
    /** @type {LogFunction} */
    get warn() {
        return this.#emptyFunction;
    }
    /** @type {LogFunction} */
    #warn = console.warn.bind(console);

    /** @type {boolean} */
    isErrorEnabled = true;
    /** @type {LogFunction} */
    get error() {
        return this.#emptyFunction;
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

const _console$4 = new Console();

/** @type {Set.<number>} */
const appMessageIds = new Set();
/** @returns {number} */
function generateAppMessageId() {
    var id = 0;
    while (appMessageIds.has(id)) {
        id++;
    }
    appMessageIds.add(id);
    return id;
}

/** @type {Object.<string, [(NKMessage) => void]>} */
const appListeners = {};
/**
 * @param {function} callback
 * @param {string} prefix
 */
function addAppListener(callback, prefix) {
    _console$4.log(`adding callback with prefix "${prefix}"`, callback);
    if (!appListeners[prefix]) {
        appListeners[prefix] = [];
    }
    appListeners[prefix].push(callback);
}

if (!window.__NATIVEWEBKIT_LISTENER_FLAG__) {
    window.__NATIVEWEBKIT_LISTENER_FLAG__ = true;
    _console$4.log(`adding "nativewebkit-receive" window listener`);

    window.addEventListener("nativewebkit-receive", (event) => {
        /** @type {NKMessage|NKMessage[]} */
        let messages = event.detail;
        onAppMessages(messages);
    });
}

/**
 * @param {NKMessage|NKMessage[]} messages
 */
function onAppMessages(messages) {
    if (!Array.isArray(messages)) {
        messages = [messages];
    }
    _console$4.log("nativewebkit-receive messages", messages);
    messages.forEach((message) => {
        const [prefix, type] = message.type.split("-");
        _console$4.log(`received "${prefix}" message of type "${type}"`, message);
        message.type = type;
        if (!appListeners[prefix] || appListeners[prefix].length == 0) {
            _console$4.warn("no callbacks listening for prefix", prefix);
        } else {
            appListeners[prefix].forEach((callback) => {
                _console$4.log("triggering callback", callback, "for message", message);
                callback(message);
            });
        }
    });
}

/**
 * @typedef NKMessage
 * @type {object}
 * @property {string} type
 */

/**
 * @param {NKMessage|NKMessage[]} message
 * @returns {Promise<boolean>} did receive message?
 */
async function sendMessageToApp(message) {
    if (isNativeWebKitEnabled) {
        _console$4.log("sending message to app...", message);
        if (isInApp) {
            /** @type {NKMessage|NKMessage[]} */
            const messages = await webkit.messageHandlers.nativewebkit_reply.postMessage(message);
            _console$4.log("app response", messages);
            if (messages) {
                onAppMessages(messages);
            }
            return true;
        } else {
            return new Promise((resolve) => {
                const id = generateAppMessageId();
                window.dispatchEvent(new CustomEvent("nativewebkit-send", { detail: { message, id } }));
                window.addEventListener(
                    `nativewebkit-receive-${id}`,
                    (event) => {
                        /** @type {boolean} */
                        const didReceiveMessage = event.detail;
                        _console$4.log(`did receive message for nativewebkit-receive-${id}?`, didReceiveMessage);
                        if (!didReceiveMessage) {
                            _console$4.error(`didn't receive message for nativewebkit-receive-${id}`);
                        }
                        resolve(didReceiveMessage);
                        appMessageIds.delete(id);
                    },
                    { once: true }
                );
            });
        }
    } else {
        _console$4.warn(
            "NativeWebKit.js is not enabled - run in the NativeWebKit app or enable the NativeWebKit Safari Web Extension"
        );
    }
}

const _console$3 = new Console();

/**
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function greaterCommonFactor(a, b) {
    return b === 0 ? a : greaterCommonFactor(b, a % b);
}

/**
 * @param {number[]} numbers
 * @returns {number|null}
 */
function findGreatestCommonFactor(numbers) {
    _console$3.log("finding greatestCommonFactor of numbers", numbers);
    numbers = numbers.filter((number) => number > 0);

    if (numbers.length == 0) {
        return null;
    }

    const greatestCommonFactor = numbers.reduce((number, gcf) => greaterCommonFactor(number, gcf));
    _console$3.log("greatestCommonFactor", greatestCommonFactor);
    if (greatestCommonFactor == 0) {
        return null;
    }
    return greatestCommonFactor;
}

const _console$2 = new Console("AppMessagePoll");

/** @typedef {import("./messaging.js").NKMessage} NKMessage */

class AppMessagePoll {
    static get #isPollingEnabled() {
        return isSafariExtensionInstalled;
    }

    /** @type {AppMessagePoll[]} */
    static #polls = [];
    /**
     * @param {AppMessagePoll} poll
     * @returns {number} poll index
     * */
    static #add(poll) {
        if (this.#polls.includes(poll)) {
            _console$2.log("poll already included");
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
            _console$2.log("poll wasn't included");
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
            _console$2.error(`invalid interval ${newInterval}ms`);
            return;
        }
        if (newInterval == this.#interval) {
            _console$2.warn("assigning same interval");
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
        _console$2.log(`new interval ${newInterval}`);
        if (this.#Interval != newInterval) {
            _console$2.log(`interval updated from ${this.#Interval} to ${newInterval}`);
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
        _console$2.log("messages", messages);

        if (messages.length > 0) {
            const didReceiveMessage = await sendMessageToApp(messages);
            _console$2.log("didReceiveMessage?", didReceiveMessage);
            if (!didReceiveMessage) {
                _console$2.error("app didn't receive message");
            }
        } else {
            _console$2.log("no messages to send");
        }

        polls.forEach((poll) => (poll.#lastTimeCallbackWasCalled = now));
    }
    static #start() {
        if (this.#IsRunning) {
            _console$2.log("tried to start AppMessagePoll when it's already running");
            return;
        }
        if (this.#Interval == null) {
            _console$2.log("null interval");
            return;
        }
        _console$2.log(`starting interval at ${this.#Interval}`);

        this.#intervalId = window.setInterval(this.#intervalCallback.bind(this), this.#Interval);
    }
    static #stop() {
        if (!this.#IsRunning) {
            _console$2.log("tried to stop AppMessagePoll when it already isn't running");
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
            _console$2.log("restarting...");
            this.#stop();
            this.#start();
        } else {
            _console$2.log("no need to restart");
        }
    }

    /** @type {boolean} */
    #isEnabled = false;
    get #isRunning() {
        return AppMessagePoll.#IsRunning && this.#isEnabled;
    }
    start() {
        if (!AppMessagePoll.#isPollingEnabled) {
            _console$2.warn("polling is not enabled");
            return;
        }

        if (this.#isRunning) {
            _console$2.log("poll is already running");
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
        _console$2.log("destroying poll", this);
        AppMessagePoll.#remove(this);
    }
}

window.AppMessagePoll = AppMessagePoll;

const _console$1 = new Console("AudioSessionManager");

/** @typedef {} ASMessageType */

/** @typedef {} ASEventType */

/** @typedef {import("./utils/messaging.js").NKMessage} NKMessage */

/**
 * @typedef ASMessage
 * @type {object}
 * @property {ASMessageType} type
 * @property {object} message
 */

/**
 * @typedef ASEvent
 * @type {object}
 * @property {ASEventType} type
 * @property {object} message
 */

/**
 * @typedef {(event: ASEvent) => void} ASEventListener
 */

class AudioSessionManager extends EventDispatcher {
    /** @type {ASEventType[]} */
    static #EventsTypes = [];
    /** @type {ASEventType[]} */
    get eventTypes() {
        return AudioSessionManager.#EventsTypes;
    }

    static #shared = new AudioSessionManager();
    static get shared() {
        return this.#shared;
    }

    get _prefix() {
        return "as";
    }
    /**
     * @param {ASMessage} message
     * @returns {NKMessage}
     */
    _formatMessage(message) {
        return super._formatMessage(message);
    }

    /**
     * @param {ASEventType} type
     * @param {ASEventListener} listener
     * @param {object|undefined} options
     */
    addEventListener(type, listener, options) {
        return super.addEventListener(...arguments);
    }
    /**
     * @param {ASEventType} type
     * @param {ASEventListener} listener
     * @returns {boolean}
     */
    removeEventListener(type, listener) {
        return super.removeEventListener(...arguments);
    }
    /**
     * @param {ASEventType} type
     * @param {ASEventListener} listener
     * @returns {boolean}
     */
    hasEventListener(type, listener) {
        return super.hasEventListener(...arguments);
    }
    /**
     * @param {ASEventType} event
     */
    dispatchEvent(event) {
        return super.dispatchEvent(...arguments);
    }

    /** AudioSessionManager is a singleton - use AudioSessionManager.shared */
    constructor() {
        super();

        if (this.shared) {
            throw new Error("AudioSessionManager is a singleton - use AudioSessionManager.shared");
        }

        addAppListener(this.#onAppMessage.bind(this), this._prefix);

        window.addEventListener("load", () => {});
        window.addEventListener("unload", () => {});
    }

    /**
     * @param {ASMessage} message
     */
    #onAppMessage(message) {
        _console$1.log(`received background message of type ${message.type}`, message);
        const { type } = message;
        switch (type) {
            default:
                _console$1.error(`uncaught message type ${type}`);
                break;
        }
    }
}

var AudioSessionManager$1 = AudioSessionManager.shared;

/** @typedef {"isAvailable" | "isActive" | "startUpdates" | "stopUpdates" | "getData"} HMMessageType */

/** @typedef {"isAvailable" | "isActive" | "motionData" | "sensorLocation"} HMEventType */

/** @typedef {import("./utils/messaging.js").NKMessage} NKMessage */

/**
 * @typedef HMMessage
 * @type {object}
 * @property {HMMessageType} type
 * @property {object} message
 */

/** @typedef {"default" | "left headphone" | "right headphone" | "unknown"} HeadphoneMotionSensorLocation */

/**
 * @typedef HMEvent
 * @type {object}
 * @property {HMEventType} type
 * @property {object} message
 */

/**
 * @typedef {(event: HMEvent) => void} HMEventListener
 */

/**
 * @typedef HeadphoneMotionData
 * @type {object}
 * @property {number} timestamp
 * @property {HeadphoneMotionSensorLocation} sensorLocation
 * @property {[number]} quaternion
 * @property {[number]} euler
 * @property {[number]} userAcceleration
 * @property {[number]} gravity
 * @property {[number]} rotationRate
 */

const _console = new Console("HeadphoneMotionManager");

class HeadphoneMotionManager extends EventDispatcher {
    /** @type {HMEventType[]} */
    static #EventsTypes = ["isAvailable", "isActive", "motionData", "sensorLocation"];
    /** @type {HMEventType[]} */
    get eventTypes() {
        return HeadphoneMotionManager.#EventsTypes;
    }

    static #shared = new HeadphoneMotionManager();
    static get shared() {
        return this.#shared;
    }

    get _prefix() {
        return "hm";
    }
    /**
     * @param {HMMessage} message
     * @returns {NKMessage}
     */
    _formatMessage(message) {
        return super._formatMessage(message);
    }

    /**
     * @param {HMEventType} type
     * @param {HMEventListener} listener
     * @param {object|undefined} options
     */
    addEventListener(type, listener, options) {
        return super.addEventListener(...arguments);
    }
    /**
     * @param {HMEventType} type
     * @param {HMEventListener} listener
     * @returns {boolean}
     */
    removeEventListener(type, listener) {
        return super.removeEventListener(...arguments);
    }
    /**
     * @param {HMEventType} type
     * @param {HMEventListener} listener
     * @returns {boolean}
     */
    hasEventListener(type, listener) {
        return super.hasEventListener(...arguments);
    }
    /**
     * @param {HMEventType} event
     */
    dispatchEvent(event) {
        return super.dispatchEvent(...arguments);
    }

    /** HeadphoneMotionManager is a singleton - use HeadphoneMotionManager.shared */
    constructor() {
        super();

        if (this.shared) {
            throw new Error("HeadphoneMotionManager is a singleton - use HeadphoneMotionManager.shared");
        }

        addAppListener(this.#onAppMessage.bind(this), this._prefix);

        window.addEventListener("load", () => {
            if (this.#checkAvailabilityOnLoad) {
                this.checkIsAvailable();
            }
        });
        window.addEventListener("unload", () => {
            if (this.#isActive && this.#stopUpdatesOnUnload) {
                this.stopUpdates();
            }
        });
    }

    /** @type {boolean} */
    #checkAvailabilityOnLoad = false;
    get checkAvailabilityOnLoad() {
        return this.#checkAvailabilityOnLoad;
    }
    /** @throws {Error} if newValue is not a boolean */
    set checkAvailabilityOnLoad(newValue) {
        if (typeof newValue == "boolean") {
            this.#checkAvailabilityOnLoad = newValue;
        } else {
            throw Error(`invalid newValue for checkAvailabilityOnLoad`, newValue);
        }
    }

    /** @type {boolean} */
    #stopUpdatesOnUnload = false;
    get stopUpdatesOnUnload() {
        return this.#stopUpdatesOnUnload;
    }
    /** @throws {Error} if newValue is not a boolean */
    set stopUpdatesOnUnload(newValue) {
        if (typeof newValue == "boolean") {
            this.#stopUpdatesOnUnload = newValue;
        } else {
            throw Error(`invalid newValue for stopUpdatesOnUnload`, newValue);
        }
    }

    /**
     * @param {HMMessage} message
     */
    #onAppMessage(message) {
        _console.log(`received background message of type ${message.type}`, message);
        const { type } = message;
        switch (type) {
            case "isAvailable":
                this.#onIsAvailableUpdated(message.isAvailable);
                break;
            case "isActive":
                this.#onIsActiveUpdated(message.isActive);
                break;
            case "getData":
                this.#onMotionData(message.motionData);
                break;
            default:
                _console.error(`uncaught message type ${type}`);
                break;
        }
    }

    /** @type {boolean|null} */
    #isAvailable = null;
    get isAvailable() {
        return Boolean(this.#isAvailable);
    }
    /** @param {boolean} newValue */
    #onIsAvailableUpdated(newValue) {
        if (this.#isAvailable != newValue) {
            this.#isAvailable = newValue;
            _console.log(`updated isAvailable to ${newValue}`);
            this.dispatchEvent({
                type: "isAvailable",
                message: { isAvailable: this.isAvailable },
            });
            if (this.#isAvailable) {
                this.checkIsActive();
            }
        }
    }
    async checkIsAvailable() {
        _console.log("checking isAvailable...");
        await sendMessageToApp(this.#checkIsAvailableMessage);
    }
    get #checkIsAvailableMessage() {
        return this._formatMessage({ type: "isAvailable" });
    }

    /** @type {boolean|null} */
    #isActive = null;
    get isActive() {
        return Boolean(this.#isActive);
    }
    /** @param {boolean} newIsActive */
    #onIsActiveUpdated(newIsActive) {
        if (this.#isActive != newIsActive) {
            this.#isActive = newIsActive;
            _console.log(`updated isActive to ${this.isActive}`);
            this.dispatchEvent({
                type: "isActive",
                message: { isActive: this.isActive },
            });

            this.#isActivePoll.stop();
            if (this.#isActive) {
                _console.log("starting motion data poll");
                this.#motionDataPoll.start();
            } else {
                _console.log("stopping motion data poll");
                this.#motionDataPoll.stop();
            }
        }
    }
    async checkIsActive() {
        _console.log("checking isActive");
        await sendMessageToApp(this.#checkIsActiveMessage());
    }
    #checkIsActiveMessage() {
        return this._formatMessage({ type: "isActive" });
    }
    #isActivePoll = new AppMessagePoll(this.#checkIsActiveMessage.bind(this), 50);

    async startUpdates() {
        if (!this.isAvailable) {
            _console.warn("not available");
            return;
        }
        if (this.isActive) {
            _console.warn("already active");
            return;
        }
        _console.log("starting motion updates");
        this.#isActivePoll.start();
        await sendMessageToApp(this.#startHeadphoneMotionUpdatesMessage);
    }
    get #startHeadphoneMotionUpdatesMessage() {
        return this._formatMessage({ type: "startUpdates" });
    }
    async stopUpdates() {
        if (!this.isAvailable) {
            _console.warn("not available");
            return;
        }
        if (!this.isActive) {
            _console.warn("already inactive");
            return;
        }
        _console.log("stopping motion updates");
        this.#isActivePoll.start();
        await sendMessageToApp(this.#stopHeadphoneMotionUpdatesMessage);
    }
    get #stopHeadphoneMotionUpdatesMessage() {
        return this._formatMessage({ type: "stopUpdates" });
    }

    async toggleMotionUpdates() {
        if (!this.isAvailable) {
            _console.log("not available");
            return;
        }
        if (this.isActive) {
            await this.stopUpdates();
        } else {
            await this.startUpdates();
        }
    }

    /** @type {HeadphoneMotionData} */
    #motionData;
    get motionData() {
        return this.#motionData;
    }
    /** @type {number} */
    get #motionDataTimestamp() {
        return this.motionData?.timestamp || 0;
    }
    /** @type {HeadphoneMotionSensorLocation|null} */
    #sensorLocation = null;
    get sensorLocation() {
        return this.#sensorLocation;
    }
    /** @param {HeadphoneMotionSensorLocation} newValue */
    #onSensorLocationUpdated(newValue) {
        if (this.#sensorLocation != newValue) {
            this.#sensorLocation = newValue;
            _console.log(`updated sensor location to ${newValue}`);
            this.dispatchEvent({
                type: "sensorLocation",
                message: { sensorLocation: this.sensorLocation },
            });
        }
    }

    /**
     * @param {HeadphoneMotionData} newMotionData
     */
    #onMotionData(newMotionData) {
        this.#motionData = newMotionData;
        _console.log("received headphone motion data", this.motionData);
        this.dispatchEvent({ type: "motionData", message: { motionData: this.motionData } });
        this.#onSensorLocationUpdated(newMotionData.sensorLocation);
    }

    async checkMotionData() {
        _console.log("checkMotionData");
        await sendMessageToApp(this.#checkMotionDataMessage);
    }
    #checkMotionDataMessage() {
        return this._formatMessage({ type: "getData", timestamp: this.#motionDataTimestamp });
    }
    #motionDataPoll = new AppMessagePoll(this.#checkMotionDataMessage.bind(this), 20);
}
var HeadphoneMotionManager$1 = HeadphoneMotionManager.shared;

export { AudioSessionManager$1 as AudioSessionManager, HeadphoneMotionManager$1 as HeadphoneMotionManager };
