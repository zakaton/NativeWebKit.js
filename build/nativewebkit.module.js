/**
 * @copyright Zack Qattan 2024
 * @license MIT
 */
/** @type {"__NATIVEWEBKIT__DEV__" | "__NATIVEWEBKIT__PROD__"} */
const isInDev = "__NATIVEWEBKIT__PROD__" == "__NATIVEWEBKIT__DEV__";

/**
 * @callback LogFunction
 * @param {...any} data
 */

/**
 * @callback AssertLogFunction
 * @param {boolean} condition
 * @param {...any} data
 */

/**
 * @typedef ConsoleLevelFlags
 * @type {object}
 * @property {boolean} log
 * @property {boolean} warn
 * @property {boolean} error
 * @property {boolean} assert
 */

function emptyFunction() {}

const log = console.log.bind(console);
const warn = console.warn.bind(console);
const error = console.error.bind(console);
const assert = console.assert.bind(console);

class Console {
    /** @type {Object.<string, Console>} */
    static #consoles = {};

    /**
     * @param {string} type
     */
    constructor(type) {
        if (Console.#consoles[type]) {
            throw new Error(`"${type}" console already exists`);
        }
        Console.#consoles[type] = this;
    }

    /** @type {ConsoleLevelFlags} */
    #levelFlags = {
        log: isInDev,
        warn: isInDev,
        error: isInDev,
    };

    /**
     * @param {ConsoleLevelFlags} levelFlags
     */
    setLevelFlags(levelFlags) {
        Object.assign(this.#levelFlags, levelFlags);
    }

    /**
     * @param {string} type
     * @param {ConsoleLevelFlags} levelFlags
     * @throws {Error} if no console with type "type" is found
     */
    static setLevelFlagsForType(type, levelFlags) {
        if (!this.#consoles[type]) {
            throw new Error(`no console found with type "${type}"`);
        }
        this.#consoles[type].setLevelFlags(levelFlags);
    }

    /**
     * @param {ConsoleLevelFlags} levelFlags
     */
    static setAllLevelFlags(levelFlags) {
        for (const type in this.#consoles) {
            this.#consoles[type].setLevelFlags(levelFlags);
        }
    }

    /**
     * @param {string} type
     * @param {ConsoleLevelFlags} levelFlags
     * @returns {Console}
     */
    static create(type, levelFlags) {
        const console = this.#consoles[type] || new Console(type);
        return console;
    }

    /** @type {LogFunction} */
    get log() {
        return this.#levelFlags.log ? log : emptyFunction;
    }

    /** @type {LogFunction} */
    get warn() {
        return this.#levelFlags.warn ? warn : emptyFunction;
    }

    /** @type {LogFunction} */
    get error() {
        return this.#levelFlags.error ? error : emptyFunction;
    }

    /** @type {AssertLogFunction} */
    get assert() {
        return this.#levelFlags.assert ? assert : emptyFunction;
    }

    /**
     * @param {boolean} condition
     * @param {string?} message
     * @throws {Error} if condition is not met
     */
    assertWithError(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }
}

/**
 * @param {string} type
 * @param {ConsoleLevelFlags?} levelFlags
 * @returns {Console}
 */
function createConsole(type, levelFlags) {
    return Console.create(type, levelFlags);
}

/**
 * @param {string} type
 * @param {ConsoleLevelFlags} levelFlags
 * @throws {Error} if no console with type is found
 */
function setConsoleLevelFlagsForType(type, levelFlags) {
    Console.setLevelFlagsForType(type, levelFlags);
}

/**
 * @param {ConsoleLevelFlags} levelFlags
 */
function setAllConsoleLevelFlags(levelFlags) {
    Console.setAllLevelFlags(levelFlags);
}

const _console$6 = createConsole("EventDispatcher", { log: false });

/**
 * @typedef EventDispatcherEvent
 * @type {object}
 * @property {string} type
 * @property {object} message
 */

/**
 * @typedef EventDispatcherOptions
 * @type {object}
 * @property {boolean?} once
 */

/** @typedef {(event: EventDispatcherEvent) => void} EventDispatcherListener */

// based on https://github.com/mrdoob/eventdispatcher.js/
class EventDispatcher {
    /**
     * @param {string[]?} eventTypes
     */
    constructor(eventTypes) {
        _console$6.assertWithError(Array.isArray(eventTypes), "eventTypes must be an array");
        this.#eventTypes = eventTypes;
    }

    /** @type {string[]?} */
    #eventTypes;

    /**
     * @param {string} type
     * @returns {boolean}
     */
    #isValidEventType(type) {
        if (!this.#eventTypes) {
            return true;
        }
        return this.#eventTypes.includes(type);
    }

    /**
     * @param {string} type
     * @throws {Error}
     */
    #assertValidEventType(type) {
        _console$6.assertWithError(this.#isValidEventType(type), `invalid event type "${type}"`);
    }

    /** @type {Object.<string, [function]?>?} */
    #listeners;

    /**
     * @param {string} type
     * @param {EventDispatcherListener} listener
     * @param {EventDispatcherOptions?} options
     */
    addEventListener(type, listener, options) {
        _console$6.log(`adding "${type}" eventListener`, listener);
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
     * @param {EventDispatcherListener} listener
     * @returns {boolean}
     * @throws {Error} if type is not valid
     */
    hasEventListener(type, listener) {
        _console$6.log(`has "${type}" eventListener?`, listener);
        this.#assertValidEventType(type);
        return this.#listeners?.[type]?.includes(listener);
    }

    /**
     * @param {string} type
     * @param {EventDispatcherListener} listener
     * @returns {boolean} successfully removed listener
     * @throws {Error} if type is not valid
     */
    removeEventListener(type, listener) {
        _console$6.log(`removing "${type}" eventListener`, listener);
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
     * @throws {Error} if type is not valid
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
     * @param {EventDispatcherEvent} message
     * @returns {EventDispatcherEvent}
     */
    formatMessage(message) {
        /** @type {EventDispatcherEvent} */
        const formattedMessage = { ...message };
        formattedMessage.type = `${this._prefix}-${message.type}`;
        return formattedMessage;
    }
}

const _console$5 = createConsole("platformUtils", { log: false });

const { userAgent } = navigator;

const isInSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);

const isInApp = /NativeWebKit/i.test(userAgent);

var isSafariExtensionInstalled = Boolean(window.isNativeWebKitSafariExtensionInstalled);

const checkIfSafariExtensionIsInstalled = async () => {
    isSafariExtensionInstalled = isSafariExtensionInstalled || Boolean(window.isNativeWebKitSafariExtensionInstalled);
    if (isSafariExtensionInstalled) {
        return true;
    } else {
        _console$5.log("checking if Safari Extension is installed...");
        return new Promise((resolve) => {
            const eventListener = () => {
                _console$5.log("Safari Extension is installed");
                isSafariExtensionInstalled = true;
                resolve(true);
            };
            window.addEventListener("nativewebkit-extension-is-installed", eventListener, { once: true });
            window.dispatchEvent(new Event("is-nativewebkit-extension-installed"));
            window.setTimeout(() => {
                if (!isSafariExtensionInstalled) {
                    _console$5.log("Safari Extension is not installed");
                    window.removeEventListener("nativewebkit-extension-is-installed", eventListener);
                    resolve(false);
                }
            }, 1);
        });
    }
};

var isNativeWebKitEnabled = isInApp || isSafariExtensionInstalled;
const checkIfNativeWebKitEnabled = async () => {
    isNativeWebKitEnabled = isInApp || isSafariExtensionInstalled;
    if (isNativeWebKitEnabled) {
        return true;
    } else {
        isNativeWebKitEnabled = await checkIfSafariExtensionIsInstalled();
        return isNativeWebKitEnabled;
    }
};

const is_iOS = /iPad|iPhone|iPod/.test(userAgent);

const isMac = /Macintosh/.test(userAgent);

const openInApp = () => {
    if (isInSafari) {
        /** @type {HTMLAnchorElement} */
        const a = document.createElement("a");
        const href = `nativewebkit://${location.href}`;
        _console$5.log("attempting to open current link in App...", location.href, href);
        a.href = href;
        a.click();
    } else {
        _console$5.warn("unable to open link in app - not in safari");
    }
};

const _console$4 = createConsole("messaging", { log: false });

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

if (!window.__NATIVEWEBKIT_MESSAGING_FLAG__) {
    window.__NATIVEWEBKIT_MESSAGING_FLAG__ = true;
    _console$4.log(`adding "nativewebkit-receive" window listener`);

    window.addEventListener("nativewebkit-receive", (event) => {
        /** @type {NKMessage|NKMessage[]} */
        let messages = event.detail;
        onAppMessages(messages);
    });

    window.addEventListener("load", () => {
        _console$4.log("triggering window.load events...");
        const messages = appListeners["window.load"]
            ?.map((callback) => callback())
            .flat()
            .filter(Boolean);
        if (messages.length > 0) {
            sendMessageToApp(messages);
        }
    });
    window.addEventListener("unload", () => {
        _console$4.log("triggering window.unload events...");
        const messages = appListeners["window.unload"]
            ?.map((callback) => callback())
            .flat()
            .filter(Boolean);
        if (messages.length > 0) {
            sendMessageToApp(messages);
        }
    });
}

/**
 * @param {NKMessage|NKMessage[]} messages
 */
function onAppMessages(messages) {
    if (!Array.isArray(messages)) {
        messages = [messages];
    }
    messages = messages.flatMap((message) => {
        if (message.type == "messages") {
            return message.messages;
        }
        return message;
    });
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

/** @typedef {Promise<boolean>} NKMessagePromise */

/** @type {NKMessage[]} */
var pendingMessagesToSend = [];
/** @type {NKMessagePromise?} */
var pendingMessagesPromise;
/** @type {PromiseLike<boolean>?} */
var pendingMessagesPromiseResolve;

/**
 * @param {NKMessage|NKMessage[]} message
 * @param {boolean} sendImmediately
 * @returns {NKMessagePromise} did app receive message?
 */
async function sendMessageToApp(message, sendImmediately = true) {
    const isNativeWebKitEnabled = await checkIfNativeWebKitEnabled();
    if (isNativeWebKitEnabled) {
        _console$4.log("requesting to send message", message, "send immediately?", sendImmediately);
        if (!message && pendingMessagesToSend.length == 0) {
            _console$4.warn("no messages received, and no pending messages");
            return;
        }

        if (message) {
            if (pendingMessagesToSend.length == 0) {
                pendingMessagesPromise = new Promise((resolve) => {
                    pendingMessagesPromiseResolve = resolve;
                });
            }

            pendingMessagesToSend.push(message);
            pendingMessagesToSend = pendingMessagesToSend.flat();
        }

        if (pendingMessagesToSend.length == 0) {
            _console$4.log("no messages to send");
            return;
        }

        if (!sendImmediately) {
            return pendingMessagesPromise;
        }

        _console$4.log("sending messages to app...", pendingMessagesToSend);
        if (isInApp) {
            /** @type {NKMessage|NKMessage[]} */
            const messages = await webkit.messageHandlers.nativewebkit_reply.postMessage(pendingMessagesToSend);
            _console$4.log("app response", messages);
            if (messages) {
                onAppMessages(messages);
            }
            pendingMessagesPromiseResolve(true);
        } else {
            const id = generateAppMessageId();
            window.dispatchEvent(
                new CustomEvent("nativewebkit-send", { detail: { message: pendingMessagesToSend, id } })
            );
            window.addEventListener(
                `nativewebkit-receive-${id}`,
                (event) => {
                    /** @type {boolean} */
                    const didReceiveMessage = event.detail;
                    _console$4.log(`did receive message for nativewebkit-receive-${id}?`, didReceiveMessage);
                    if (!didReceiveMessage) {
                        _console$4.error(`didn't receive message for nativewebkit-receive-${id}`);
                    }
                    pendingMessagesPromiseResolve(didReceiveMessage);
                    appMessageIds.delete(id);
                },
                { once: true }
            );
        }
        pendingMessagesToSend.length = 0;
        return pendingMessagesPromise;
    } else {
        _console$4.warn(
            "NativeWebKit.js is not enabled - run in the NativeWebKit app or enable the NativeWebKit Safari Web Extension"
        );
    }
}

const _console$3 = createConsole("mathUtils", { log: false });

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
 * @returns {number?}
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

const _console$2 = createConsole("AppMessagePoll", { log: false });

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
        _console$2.assertWithError(newInterval > 0, `invalid interval ${newInterval}ms`);
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
     * @param {NKMessage|function():NKMessage} messageOrMessageGenerator
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

        const messages = polls.map((poll) => {
            const message = Object.assign({}, poll.#generateMessage());
            message.type = `${poll.#prefix}-${message.type}`;
            return message;
        });
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
    async start() {
        const isPollingEnabled = await this.#isPollingEnabled();
        if (!isPollingEnabled) {
            //_console.warn("polling is not enabled");
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

/** @typedef {"isAvailable" | "isActive" | "startUpdates" | "stopUpdates" | "getData"} HMMessageType */

/** @typedef {"isAvailable" | "isActive" | "motionData" | "sensorLocation"} HMEventType */

/** @typedef {import("./utils/messaging.js").NKMessage} NKMessage */

/** @typedef {import("./utils/EventDispatcher.js").EventDispatcherOptions} EventDispatcherOptions */

/**
 * @typedef HMMessage
 * @type {object}
 * @property {HMMessageType} type
 * @property {object} message
 */

/**
 * @typedef HMAppMessage
 * @type {object}
 * @property {HMMessageType} type
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

const _console$1 = createConsole("HeadphoneMotionManager", { log: false });

class HeadphoneMotionManager {
    /** @type {HMEventType[]} */
    static #EventsTypes = ["isAvailable", "isActive", "motionData", "sensorLocation"];
    /** @type {HMEventType[]} */
    get eventTypes() {
        return HeadphoneMotionManager.#EventsTypes;
    }
    #eventDispatcher = new EventDispatcher(this.eventTypes);
    /**
     * @param {HMEventType} type
     * @param {HMEventListener} listener
     * @param {EventDispatcherOptions?} options
     */
    addEventListener(type, listener, options) {
        return this.#eventDispatcher.addEventListener(type, listener, options);
    }
    /**
     * @param {HMEventType} type
     * @param {HMEventListener} listener
     * @returns {boolean}
     */
    removeEventListener(type, listener) {
        return this.#eventDispatcher.removeEventListener(type, listener);
    }
    /**
     * @param {HMEventType} type
     * @param {HMEventListener} listener
     * @returns {boolean}
     */
    hasEventListener(type, listener) {
        return this.#eventDispatcher.hasEventListener(type, listener);
    }
    /**
     * @param {HMEvent} event
     */
    dispatchEvent(event) {
        return this.#eventDispatcher.dispatchEvent(event);
    }

    static #shared = new HeadphoneMotionManager();
    static get shared() {
        return this.#shared;
    }
    #prefix = "hm";
    /**
     * @param {HMMessage[]} messages
     * @returns {NKMessage[]}
     */
    #formatMessages(messages) {
        return messages.map((message) => Object.assign({}, message, { type: `${this.#prefix}-${message.type}` }));
    }

    /** @throws {Error} if singleton already exists */
    constructor() {
        _console$1.assertWithError(
            !this.shared,
            "HeadphoneMotionManager is a singleton - use HeadphoneMotionManager.shared"
        );

        addAppListener(this.#getWindowLoadMessages.bind(this), "window.load");
        addAppListener(this.#onAppMessage.bind(this), this.#prefix);
        addAppListener(this.#getWindowUnloadMessages.bind(this), "window.unload");
    }

    /** @returns {NKMessage[]?} */
    #getWindowLoadMessages() {
        /** @type {HMMessage[]} */
        const messages = [];
        if (this.#checkAvailabilityOnLoad) {
            messages.push({ type: "isAvailable" });
        }
        return this.#formatMessages(messages);
    }
    /** @returns {NKMessage[]?} */
    #getWindowUnloadMessages() {
        /** @type {HMMessage[]} */
        const messages = [];
        if (this.#isActive && this.#stopUpdatesOnUnload) {
            messages.push({ type: "stopUpdates" });
        }
        return this.#formatMessages(messages);
    }

    /**
     * @param {HMAppMessage} message
     */
    async sendMessageToApp(message) {
        message.type = `${this.#prefix}-${message.type}`;
        return sendMessageToApp(message);
    }

    /** @type {boolean} */
    #checkAvailabilityOnLoad = false;
    get checkAvailabilityOnLoad() {
        return this.#checkAvailabilityOnLoad;
    }
    /** @throws {Error} if newValue is not a boolean */
    set checkAvailabilityOnLoad(newValue) {
        _console$1.assertWithError(
            typeof newValue == "boolean",
            "invalid newValue for checkAvailabilityOnLoad",
            newValue
        );
        this.#checkAvailabilityOnLoad = newValue;
    }

    /** @type {boolean} */
    #stopUpdatesOnUnload = true;
    get stopUpdatesOnUnload() {
        return this.#stopUpdatesOnUnload;
    }
    /** @throws {Error} if newValue is not a boolean */
    set stopUpdatesOnUnload(newValue) {
        _console$1.assertWithError(typeof newValue == "boolean", "invalid newValue for stopUpdatesOnUnload", newValue);
        this.#stopUpdatesOnUnload = newValue;
    }

    /**
     * @param {HMAppMessage} message
     */
    #onAppMessage(message) {
        _console$1.log(`received background message of type ${message.type}`, message);
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
                throw Error(`uncaught message type ${type}`);
        }
    }

    /** @type {boolean?} */
    #isAvailable = null;
    get isAvailable() {
        return Boolean(this.#isAvailable);
    }
    /** @param {boolean} newValue */
    #onIsAvailableUpdated(newValue) {
        if (this.#isAvailable != newValue) {
            this.#isAvailable = newValue;
            _console$1.log(`updated isAvailable to ${newValue}`);
            this.dispatchEvent({
                type: "isAvailable",
                message: { isAvailable: this.isAvailable },
            });
            if (this.#isAvailable) {
                this.#checkIsActive();
            }
        }
    }
    async #checkIsAvailable() {
        _console$1.log("checking isAvailable...");
        return this.sendMessageToApp({ type: "isAvailable" });
    }

    /** @type {boolean?} */
    #isActive = null;
    get isActive() {
        return Boolean(this.#isActive);
    }
    /** @param {boolean} newIsActive */
    #onIsActiveUpdated(newIsActive) {
        if (this.#isActive != newIsActive) {
            this.#isActive = newIsActive;
            _console$1.log(`updated isActive to ${this.isActive}`);
            this.dispatchEvent({
                type: "isActive",
                message: { isActive: this.isActive },
            });

            this.#isActivePoll.stop();
            if (this.#isActive) {
                _console$1.log("starting motion data poll");
                this.#motionDataPoll.start();
            } else {
                _console$1.log("stopping motion data poll");
                this.#motionDataPoll.stop();
            }
        }
    }
    async #checkIsActive() {
        _console$1.log("checking isActive");
        return this.sendMessageToApp({ type: "isActive" });
    }
    #isActivePoll = new AppMessagePoll({ type: "isActive" }, this.#prefix, 50, true);

    async startUpdates() {
        if (!this.isAvailable) {
            _console$1.warn("not available");
            return;
        }
        if (this.isActive) {
            _console$1.warn("already active");
            return;
        }
        _console$1.log("starting motion updates");
        this.#isActivePoll.start();
        return this.sendMessageToApp({ type: "startUpdates" });
    }
    async stopUpdates() {
        if (!this.isAvailable) {
            _console$1.warn("not available");
            return;
        }
        if (!this.isActive) {
            _console$1.warn("already inactive");
            return;
        }
        _console$1.log("stopping motion updates");
        this.#isActivePoll.start();
        return this.sendMessageToApp({ type: "stopUpdates" });
    }

    async toggleMotionUpdates() {
        if (!this.isAvailable) {
            _console$1.log("not available");
            return;
        }
        if (this.isActive) {
            return this.stopUpdates();
        } else {
            return this.startUpdates();
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
    /** @type {HeadphoneMotionSensorLocation?} */
    #sensorLocation = null;
    get sensorLocation() {
        return this.#sensorLocation;
    }
    /** @param {HeadphoneMotionSensorLocation} newValue */
    #onSensorLocationUpdated(newValue) {
        if (this.#sensorLocation != newValue) {
            this.#sensorLocation = newValue;
            _console$1.log(`updated sensor location to ${newValue}`);
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
        _console$1.log("received headphone motion data", this.motionData);
        this.dispatchEvent({ type: "motionData", message: { motionData: this.motionData } });
        this.#onSensorLocationUpdated(newMotionData.sensorLocation);
    }

    #checkMotionDataMessage() {
        return { type: "getData", timestamp: this.#motionDataTimestamp };
    }
    #motionDataPoll = new AppMessagePoll(this.#checkMotionDataMessage.bind(this), this.#prefix, 20);
}
var HeadphoneMotionManager$1 = HeadphoneMotionManager.shared;

/**
 * @param {object} a
 * @param {object} b
 * @returns {boolean}
 */
function areObjectsEqual(a, b) {
    if (typeof a != "object" || typeof b != "object") {
        return false;
    }

    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);

    if (aKeys.length != bKeys.length) {
        return false;
    }

    const areEqual = aKeys.every((aKey) => {
        if (aKey in b) {
            return a[aKey] == b[aKey];
        } else {
            return false;
        }
    });
    return areEqual;
}

const _console = createConsole("ARSession", { log: false });

/** @typedef {"worldTrackingSupport" | "faceTrackingSupport" | "run" | "pause" | "status" | "frame" | "debugOptions" | "cameraMode" | "configuration" | "showCamera" | "messageConfiguration" | "isRunning"} ARSMessageType */

/** @typedef {"worldTrackingSupport" | "faceTrackingSupport" | "isRunning" | "frame" | "camera" | "faceAnchors" | "faceAnchor" | "debugOptions" | "cameraMode" | "configuration" | "showCamera" | "lightEstimate" | "messageConfiguration"} ARSEventType */

/** @typedef {import("./utils/messaging.js").NKMessage} NKMessage */

/** @typedef {import("./utils/EventDispatcher.js").EventDispatcherOptions} EventDispatcherOptions */

/** @typedef {import("./utils/messaging.js").NKWindowLoadCallback} NKWindowLoadCallback */

/**
 * @typedef ARSMessage
 * @type {object}
 * @property {ARSMessageType} type
 * @property {object} message
 */

/**
 * @typedef ARSAppMessage
 * @type {object}
 * @property {ARSMessageType} type
 */

/**
 * @typedef ARSWorldTrackingSupport
 * @type {object}
 * @property {boolean} isSupported
 * @property {boolean} supportsUserFaceTracking
 */

/**
 * @typedef ARSFaceTrackingSupport
 * @type {object}
 * @property {boolean} isSupported
 * @property {boolean} supportsWorldTracking
 */

/**
 * @typedef ARSEvent
 * @type {object}
 * @property {ARSEventType} type
 * @property {object} message
 */

/**
 * @typedef {(event: ARSEvent) => void} ARSEventListener
 */

/** @typedef {"worldTracking"|"faceTracking"} ARSConfigurationType */
/**
 * @typedef ARSConfiguration
 * @type {object}
 * @property {ARSConfigurationType} type
 */

/** @typedef {"userFaceTrackingEnabled"} ARSWorldTrackingConfigurationKey */
/**
 * @typedef _ARSWorldTrackingConfiguration
 * @type {object}
 * @property {bool} userFaceTrackingEnabled
 */
/** @typedef {ARSConfiguration & _ARSWorldTrackingConfiguration} ARSWorldTrackingConfiguration */

/** @typedef {"isWorldTrackingEnabled" | "maximumNumberOfTrackedFaces"} ARSFaceTrackingConfigurationKey */
/**
 * @typedef _ARSFaceTrackingConfiguration
 * @type {object}
 * @property {bool} isWorldTrackingEnabled
 * @property {bool} maximumNumberOfTrackedFaces
 */
/** @typedef {ARSConfiguration & _ARSFaceTrackingConfiguration} ARSFaceTrackingConfiguration */

/**
 * @typedef ARSFrame
 * @type {object}
 * @property {number} timestamp
 * @property {ARSCamera} camera
 * @property {ARSFaceAnchor[]?} faceAnchors
 * @property {ARSLightEstimate?} lightEstimate
 */

/**
 * @typedef ARSLightEstimate
 * @type {object}
 * @property {number} ambientIntensity (lumens)
 * @property {number} ambientColorTemperature (kelvin)
 * @property {number?} primaryLightIntensity (lumens)
 * @property {number[]?} primaryLightDirection
 */

/**
 * @typedef ARSCamera
 * @type {object}
 * @property {number} focalLength
 * @property {number} exposureOffset
 * @property {number[]} position not available when cameraMode is "nonAR"
 * @property {number[]} quaternion not available when cameraMode is "nonAR" - use eulerAngles instead
 * @property {number[]} position not available when cameraMode is "nonAR"
 * @property {number[]} eulerAngles
 */

/**
 * @typedef ARSFaceAnchor
 * @type {object}
 * @property {string} identifier
 * @property {number[]} lookAtPoint
 * @property {number[]} position
 * @property {number[]} quaternion
 * @property {ARSFaceAnchorEye} leftEye
 * @property {ARSFaceAnchorEye} rightEye
 * @property {ARSFaceAnchorBlendShapes?} blendShapes
 * @property {ARSFaceAnchorGeometry?} geometry
 */

/**
 * @typedef ARSFaceAnchorEye
 * @type {object}
 * @property {number[]} quaternion
 * @property {number[]} position
 */

/**
 * @typedef ARSFaceAnchorGeometry
 * @type {object}
 * @property {number[][]} vertices array of 3d vertices
 * @property {number} triangleCount
 * @property {number[]} triangleIndices
 * @property {number[][]} textureCoordinates 2d texture coordinate of each vertex
 */

/** @typedef {"faceAnchorBlendshapes" | "faceAnchorGeometry"} ARSMessageConfigurationType */

/**
 * @typedef ARSMessageConfiguration
 * @type {object}
 * @property {boolean} faceAnchorBlendshapes
 * @property {boolean} faceAnchorGeometry
 */

/** @typedef {"none" | "showAnchorGeometry" | "showAnchorOrigins" | "showFeaturePoints" | "showPhysics" | "showSceneUnderstanding" | "showStatistics" | "showWorldOrigin"} ARSDebugOption */

/**
 * @typedef ARSDebugOptions
 * @type {object}
 * @property {boolean} none
 * @property {boolean} showAnchorGeometry
 * @property {boolean} showAnchorOrigins
 * @property {boolean} showFeaturePoints
 * @property {boolean} showPhysics
 * @property {boolean} showSceneUnderstanding
 * @property {boolean} showStatistics
 * @property {boolean} showWorldOrigin
 */

/** @typedef {"browDownLeft" | "browDownRight" | "browInnerUp" | "browOuterUpLeft" | "browOuterUpRight" | "cheekPuff" | "cheekSquintLeft" | "cheekSquintRight" | "eyeBlinkLeft" | "eyeBlinkRight" | "eyeLookDownLeft" | "eyeLookDownRight" | "eyeLookInLeft" | "eyeLookInRight" | "eyeLookOutLeft" | "eyeLookOutRight" | "eyeLookUpLeft" | "eyeLookUpRight" | "eyeSquintLeft" | "eyeSquintRight" | "eyeWideLeft" | "eyeWideRight" | "jawForward" | "jawLeft" | "jawOpen" | "jawRight" | "mouthClose" | "mouthDimpleLeft" | "mouthDimpleRight" | "mouthFrownLeft" | "mouthFrownRight" | "mouthFunnel" | "mouthLeft" | "mouthLowerDownLeft" | "mouthLowerDownRight" | "mouthPressLeft" | "mouthPressRight" | "mouthPucker" | "mouthRight" | "mouthRollLower" | "mouthRollUpper" | "mouthShrugLower" | "mouthShrugUpper" | "mouthSmileLeft" | "mouthSmileRight" | "mouthStretchLeft" | "mouthStretchRight" | "mouthUpperUpLeft" | "mouthUpperUpRight" | "noseSneerLeft" | "noseSneerRight" | "tongueOut"} ARSFaceAnchorBlendShapeLocation */

/**
 * @typedef ARSFaceAnchorBlendShapes
 * @type {object}
 * @property {number} browDownLeft The coefficient describing downward movement of the outer portion of the left eyebrow.
 * @property {number} browDownRight The coefficient describing downward movement of the outer portion of the right eyebrow.
 * @property {number} browInnerUp The coefficient describing upward movement of the inner portion of both eyebrows.
 * @property {number} browOuterUpLeft The coefficient describing upward movement of the outer portion of the left eyebrow.
 * @property {number} browOuterUpRight The coefficient describing upward movement of the outer portion of the right eyebrow.
 * @property {number} cheekPuff The coefficient describing outward movement of both cheeks.
 * @property {number} cheekSquintLeft The coefficient describing upward movement of the cheek around and below the left eye.
 * @property {number} cheekSquintRight The coefficient describing upward movement of the cheek around and below the right eye.
 * @property {number} eyeBlinkLeft The coefficient describing closure of the eyelids over the left eye.
 * @property {number} eyeBlinkRight The coefficient describing closure of the eyelids over the right eye.
 * @property {number} eyeLookDownLeft The coefficient describing movement of the left eyelids consistent with a downward gaze.
 * @property {number} eyeLookDownRight The coefficient describing movement of the right eyelids consistent with a downward gaze.
 * @property {number} eyeLookInLeft The coefficient describing movement of the left eyelids consistent with a rightward gaze.
 * @property {number} eyeLookInRight The coefficient describing movement of the right eyelids consistent with a leftward gaze.
 * @property {number} eyeLookOutLeft The coefficient describing movement of the left eyelids consistent with a leftward gaze.
 * @property {number} eyeLookOutRight The coefficient describing movement of the right eyelids consistent with a rightward gaze.
 * @property {number} eyeLookUpLeft The coefficient describing movement of the left eyelids consistent with an upward gaze.
 * @property {number} eyeLookUpRight The coefficient describing movement of the right eyelids consistent with an upward gaze.
 * @property {number} eyeSquintLeft The coefficient describing contraction of the face around the left eye.
 * @property {number} eyeSquintRight The coefficient describing contraction of the face around the right eye.
 * @property {number} eyeWideLeft The coefficient describing a widening of the eyelids around the left eye.
 * @property {number} eyeWideRight The coefficient describing a widening of the eyelids around the right eye.
 * @property {number} jawForward The coefficient describing forward movement of the lower jaw.
 * @property {number} jawLeft The coefficient describing leftward movement of the lower jaw.
 * @property {number} jawOpen The coefficient describing an opening of the lower jaw.
 * @property {number} jawRight The coefficient describing rightward movement of the lower jaw.
 * @property {number} mouthClose The coefficient describing closure of the lips independent of jaw position.
 * @property {number} mouthDimpleLeft The coefficient describing backward movement of the left corner of the mouth.
 * @property {number} mouthDimpleRight The coefficient describing backward movement of the right corner of the mouth.
 * @property {number} mouthFrownLeft The coefficient describing downward movement of the left corner of the mouth.
 * @property {number} mouthFrownRight The coefficient describing downward movement of the right corner of the mouth.
 * @property {number} mouthFunnel The coefficient describing contraction of both lips into an open shape.
 * @property {number} mouthLeft The coefficient describing leftward movement of both lips together.
 * @property {number} mouthLowerDownLeft The coefficient describing downward movement of the lower lip on the left side.
 * @property {number} mouthLowerDownRight The coefficient describing downward movement of the lower lip on the right side.
 * @property {number} mouthPressLeft The coefficient describing upward compression of the lower lip on the left side.
 * @property {number} mouthPressRight The coefficient describing upward compression of the lower lip on the right side.
 * @property {number} mouthPucker The coefficient describing contraction and compression of both closed lips.
 * @property {number} mouthRight The coefficient describing rightward movement of both lips together.
 * @property {number} mouthRollLower The coefficient describing movement of the lower lip toward the inside of the mouth.
 * @property {number} mouthRollUpper The coefficient describing movement of the upper lip toward the inside of the mouth.
 * @property {number} mouthShrugLower The coefficient describing outward movement of the lower lip.
 * @property {number} mouthShrugUpper The coefficient describing outward movement of the upper lip.
 * @property {number} mouthSmileLeft The coefficient describing upward movement of the left corner of the mouth.
 * @property {number} mouthSmileRight The coefficient describing upward movement of the right corner of the mouth.
 * @property {number} mouthStretchLeft The coefficient describing leftward movement of the left corner of the mouth.
 * @property {number} mouthStretchRight The coefficient describing rightward movement of the left corner of the mouth.
 * @property {number} mouthUpperUpLeft The coefficient describing upward movement of the upper lip on the left side.
 * @property {number} mouthUpperUpRight The coefficient describing upward movement of the upper lip on the right side.
 * @property {number} noseSneerLeft The coefficient describing a raising of the left side of the nose around the nostril.
 * @property {number} noseSneerRight The coefficient describing a raising of the right side of the nose around the nostril.
 * @property {number} tongueOut The coefficient describing extension of the tongue.
 */

/** @typedef {"ar" | "nonAR"} ARSCameraMode */

class ARSessionManager {
    /** @type {ARSEventType[]} */
    static #EventsTypes = [
        "worldTrackingSupport",
        "faceTrackingSupport",
        "isRunning",
        "frame",
        "camera",
        "faceAnchors",
        "faceAnchor",
        "debugOptions",
        "cameraMode",
        "configuration",
        "showCamera",
        "lightEstimate",
        "messageConfiguration",
    ];
    /** @type {ARSEventType[]} */
    get eventTypes() {
        return ARSessionManager.#EventsTypes;
    }
    #eventDispatcher = new EventDispatcher(this.eventTypes);
    /**
     * @param {ARSEventType} type
     * @param {ARSEventListener} listener
     * @param {EventDispatcherOptions?} options
     */
    addEventListener(type, listener, options) {
        return this.#eventDispatcher.addEventListener(...arguments);
    }
    /**
     * @param {ARSEventType} type
     * @param {ARSEventListener} listener
     * @returns {boolean}
     */
    removeEventListener(type, listener) {
        return this.#eventDispatcher.removeEventListener(...arguments);
    }
    /**
     * @param {ARSEventType} type
     * @param {ARSEventListener} listener
     * @returns {boolean}
     */
    hasEventListener(type, listener) {
        return this.#eventDispatcher.hasEventListener(...arguments);
    }
    /**
     * @param {ARSEvent} event
     */
    dispatchEvent(event) {
        return this.#eventDispatcher.dispatchEvent(...arguments);
    }

    static #shared = new ARSessionManager();
    static get shared() {
        return this.#shared;
    }
    #prefix = "ars";
    /**
     * @param {ARSMessage[]} messages
     * @returns {NKMessage[]}
     */
    #formatMessages(messages) {
        return messages.map((message) => Object.assign({}, message, { type: `${this.#prefix}-${message.type}` }));
    }

    /** @throws {Error} if singleton already exists */
    constructor() {
        _console.assertWithError(!this.shared, "ARSessionManager is a singleton - use ARSessionManager.shared");

        addAppListener(this.#getWindowLoadMessages.bind(this), "window.load");
        addAppListener(this.#onAppMessage.bind(this), this.#prefix);
        addAppListener(this.#getWindowUnloadMessages.bind(this), "window.unload");
    }

    get isSupported() {
        return is_iOS && isInApp;
    }
    /**
     * @throws {Error} if not supported
     */
    #assertIsSupported() {
        if (!this.isSupported) {
            if (isMac) {
                throw Error("AR Session is not supported on Mac");
            } else {
                throw Error("AR Session not supported in iOS Safari");
            }
        }
    }
    /**
     * @throws {Error} if not running
     */
    #assertIsRunning() {
        _console.assertWithError(this.isRunning, "ARSession is not running");
    }

    /**
     * @param {ARSAppMessage} message
     */
    async sendMessageToApp(message) {
        message.type = `${this.#prefix}-${message.type}`;
        return sendMessageToApp(message);
    }

    /** @returns {NKMessage[]} */
    #getWindowLoadMessages() {
        if (!this.isSupported) {
            return;
        }

        /** @type {ARSMessage[]} */
        const messages = [];
        if (this.checkFaceTrackingSupportOnLoad) {
            messages.push({ type: "faceTrackingSupport" });
        }
        if (this.checkWorldTrackingSupportOnLoad) {
            messages.push({ type: "worldTrackingSupport" });
        }
        if (this.checkIsRunningOnLoad) {
            messages.push({ type: "isRunning" });
        }
        if (this.checkDebugOptionsOnLoad) {
            messages.push({ type: "debugOptions" });
        }
        if (this.checkCameraModeOnLoad) {
            messages.push({ type: "cameraMode" });
        }
        if (this.checkShowCameraOnLoad) {
            messages.push({ type: "showCamera" });
        }

        return this.#formatMessages(messages);
    }
    /** @returns {NKMessage[]} */
    #getWindowUnloadMessages() {
        if (!this.isSupported) {
            return;
        }

        /** @type {ARSMessage[]} */
        const messages = [];
        if (this.pauseOnUnload && this.isRunning) {
            messages.push({ type: "pause" });
        }
        return this.#formatMessages(messages);
    }

    /** @type {ARSWorldTrackingSupport} */
    #worldTrackingSupport = {
        isSupported: false,
        supportsUserFaceTracking: false,
    };
    get worldTrackingSupport() {
        return this.#worldTrackingSupport;
    }
    /** @param {ARSWorldTrackingSupport} newValue */
    #onWorldTrackingSupportUpdated(newValue) {
        if (!areObjectsEqual(this.#worldTrackingSupport, newValue)) {
            this.#worldTrackingSupport = newValue;
            _console.log("updated worldTrackingSupport", newValue);
            this.dispatchEvent({
                type: "worldTrackingSupport",
                message: { worldTrackingSupport: this.worldTrackingSupport },
            });
        }
    }

    /** @type {boolean} */
    #checkWorldTrackingSupportOnLoad = false;
    get checkWorldTrackingSupportOnLoad() {
        return this.#checkWorldTrackingSupportOnLoad;
    }
    /** @throws {Error} if newValue is not a boolean */
    set checkWorldTrackingSupportOnLoad(newValue) {
        _console.assertWithError(
            typeof newValue == "boolean",
            `invalid newValue for checkWorldTrackingSupportOnLoad`,
            newValue
        );
        this.#checkWorldTrackingSupportOnLoad = newValue;
    }

    /** @type {ARSFaceTrackingSupport} */
    #faceTrackingSupport = {
        isSupported: false,
        supportsWorldTracking: false,
    };
    get faceTrackingSupport() {
        return this.#faceTrackingSupport;
    }
    /** @param {ARSFaceTrackingSupport} newValue */
    #onFaceTrackingSupportUpdated(newValue) {
        if (!areObjectsEqual(this.#faceTrackingSupport, newValue)) {
            this.#faceTrackingSupport = newValue;
            _console.log("updated faceTrackingSupport", newValue);
            this.dispatchEvent({
                type: "faceTrackingSupport",
                message: { faceTrackingSupport: this.faceTrackingSupport },
            });
        }
    }

    /** @type {boolean} */
    #checkFaceTrackingSupportOnLoad = false;
    get checkFaceTrackingSupportOnLoad() {
        return this.#checkFaceTrackingSupportOnLoad;
    }
    /** @throws {Error} if newValue is not a boolean */
    set checkFaceTrackingSupportOnLoad(newValue) {
        _console.assertWithError(
            typeof newValue == "boolean",
            "invalid newValue for checkFaceTrackingSupportOnLoad",
            newValue
        );
        this.#checkFaceTrackingSupportOnLoad = newValue;
    }

    /** @type {boolean} */
    #isRunning = false;
    get isRunning() {
        return this.#isRunning;
    }
    /** @param {boolean} newValue */
    #onIsRunningUpdated(newValue) {
        if (this.#isRunning != newValue) {
            this.#isRunning = newValue;
            _console.log(`updated isRunning to ${newValue}`);
            this.dispatchEvent({
                type: "isRunning",
                message: { isRunning: this.isRunning },
            });
            if (this.isRunning) {
                this.#checkConfiguration();
            }
        }
    }

    /** @type {boolean} */
    #checkIsRunningOnLoad = false;
    get checkIsRunningOnLoad() {
        return this.#checkIsRunningOnLoad;
    }
    /** @throws {Error} if newValue is not a boolean */
    set checkIsRunningOnLoad(newValue) {
        _console.assertWithError(typeof newValue == "boolean", "invalid newValue for checkIsRunningOnLoad", newValue);
        this.#checkIsRunningOnLoad = newValue;
    }

    /** @type {boolean} */
    #pauseOnUnload = true;
    get pauseOnUnload() {
        return this.#pauseOnUnload;
    }
    /** @throws {Error} if newValue is not a boolean */
    set pauseOnUnload(newValue) {
        _console.assertWithError(typeof newValue == "boolean", `invalid newValue for pauseOnUnload`, newValue);
        this.#pauseOnUnload = newValue;
    }

    /**
     * @param {ARSConfiguration} configuration
     * @throws {Error} if invalid
     */
    #assertConfigurationIsValid(configuration) {
        _console.log("assertConfigurationIsValid", configuration);
        _console.assertWithError(configuration, "configuration required to run ARSession");
        _console.assertWithError(configuration.type, '"type" property required in configuration"');
        _console.assertWithError(
            this.allConfigurationTypes.includes(configuration.type),
            `invalid configuration type "${configuration.type}"`
        );

        switch (configuration.type) {
            case "worldTracking":
                const invalidWorldTrackingConfigurationKey = Object.keys(configuration).find(
                    (key) => key !== "type" && !this.#worldTrackingConfigurationKeys.includes(key)
                );
                _console.assertWithError(
                    !invalidWorldTrackingConfigurationKey,
                    `invalid worldTracking configuration key "${invalidWorldTrackingConfigurationKey}"`
                );
                /** @type {ARSWorldTrackingConfiguration} */
                const worldTrackingConfiguration = configuration;
                _console.assertWithError(
                    this.worldTrackingSupport.isSupported,
                    "your device doesn't support world tracking"
                );
                _console.assertWithError(
                    !worldTrackingConfiguration.userFaceTrackingEnabled ||
                        this.worldTrackingSupport.supportsUserFaceTracking,
                    "your device doesn't support user face tracking with world tracking"
                );
                break;
            case "faceTracking":
                const invalidFaceTrackingConfigurationKey = Object.keys(configuration).find(
                    (key) => key !== "type" && !this.#faceTrackingConfigurationKeys.includes(key)
                );
                _console.assertWithError(
                    !invalidFaceTrackingConfigurationKey,
                    `invalid faceTracking configuration key "${invalidFaceTrackingConfigurationKey}"`
                );
                /** @type {ARSFaceTrackingConfiguration} */
                const faceTrackingConfiguration = configuration;
                _console.assertWithError(
                    this.faceTrackingSupport.isSupported,
                    "your device doesn't support face tracking"
                );
                _console.assertWithError(
                    !faceTrackingConfiguration.isWorldTrackingEnabled || this.faceTrackingSupport.supportsWorldTracking,
                    "your device doesn't support user world tracking with face tracking"
                );
                break;
            default:
                throw Error(`uncaught configuration type "${configuration.type}"`);
        }
    }

    /** @param {ARSConfiguration} configuration */
    async run(configuration) {
        this.#assertIsSupported();
        this.#assertConfigurationIsValid(configuration);

        _console.log("running with configuraton", configuration);
        return this.sendMessageToApp({ type: "run", configuration });
    }

    async pause() {
        _console.log("pause...");
        return this.sendMessageToApp({ type: "pause" });
    }

    /** @type {ARSConfigurationType[]} */
    #allConfigurationTypes = ["worldTracking", "faceTracking"];
    get allConfigurationTypes() {
        return this.#allConfigurationTypes;
    }

    /** @type {ARSWorldTrackingConfigurationKey[]} */
    #worldTrackingConfigurationKeys = ["userFaceTrackingEnabled"];
    /** @type {ARSFaceTrackingConfigurationKey[]} */
    #faceTrackingConfigurationKeys = ["isWorldTrackingEnabled", "maximumNumberOfTrackedFaces"];

    /** @type {ARSConfiguration?} */
    #configuration = null;
    get configuration() {
        return this.#configuration;
    }

    async #checkConfiguration() {
        this.#assertIsSupported();
        this.#assertIsRunning();

        _console.log("checking configuration...");
        return this.sendMessageToApp({ type: "configuration" });
    }

    /** @param {ARSConfiguration} newConfiguration  */
    #onConfigurationUpdated(newConfiguration) {
        this.#configuration = newConfiguration;
        _console.log("updated configuration", this.configuration);
        this.dispatchEvent({
            type: "configuration",
            message: { configuration: this.configuration },
        });
    }

    /** @type {ARSFrame?} */
    #frame = null;
    get frame() {
        return this.#frame;
    }
    /** @type {ARSCamera?} */
    #camera = null;
    get camera() {
        return this.#camera;
    }
    /** @type {ARSLightEstimate?} */
    #lightEstimate = null;
    get lightEstimate() {
        return this.#lightEstimate;
    }
    /** @type {ARSFaceAnchor[]?} */
    #faceAnchors = null;
    get faceAnchors() {
        return this.#faceAnchors;
    }

    /** @param {ARSFrame} frame */
    #onFrame(frame) {
        this.#frame = frame;
        _console.log("received frame", this.frame);
        this.dispatchEvent({ type: "frame", message: { frame: this.frame } });
        this.#onCamera(frame.camera);
        if (frame.lightEstimate) {
            this.#onLightEstimate(frame.lightEstimate);
        }
        if (frame.faceAnchors) {
            this.#onFaceAnchors(frame.faceAnchors);
        }
    }

    /** @param {ARSCamera} camera */
    #onCamera(camera) {
        this.#camera = camera;
        _console.log("received camera", this.camera);
        this.dispatchEvent({ type: "camera", message: { camera: this.camera } });
    }
    /** @param {ARSLightEstimate} lightEstimate */
    #onLightEstimate(lightEstimate) {
        this.#lightEstimate = lightEstimate;
        _console.log("received lightEstimate", this.lightEstimate);
        this.dispatchEvent({ type: "lightEstimate", message: { lightEstimate: this.lightEstimate } });
    }

    /** @param {ARSFaceAnchor[]} faceAnchors */
    #onFaceAnchors(faceAnchors) {
        this.#faceAnchors = faceAnchors;
        _console.log("received faceAnchors", this.faceAnchors);
        this.dispatchEvent({ type: "faceAnchors", message: { faceAnchors: this.faceAnchors } });
        faceAnchors.forEach((faceAnchor) => {
            this.dispatchEvent({ type: "faceAnchor", message: { faceAnchor } });
        });
    }

    /** @type {ARSDebugOption[]} */
    #allDebugOptions = [
        "none",
        "showAnchorGeometry",
        "showAnchorOrigins",
        "showFeaturePoints",
        "showPhysics",
        "showSceneUnderstanding",
        "showStatistics",
        "showWorldOrigin",
    ];
    get allDebugOptions() {
        return this.#allDebugOptions;
    }

    /** @type {ARSDebugOptions?} */
    #debugOptions = null;
    get debugOptions() {
        return this.#debugOptions;
    }
    /** @param {ARSDebugOptions} newDebugOptions */
    #onDebugOptionsUpdated(newDebugOptions) {
        this.#debugOptions = newDebugOptions;
        _console.log("received debugOptions", this.debugOptions);
        this.dispatchEvent({ type: "debugOptions", message: { debugOptions: this.debugOptions } });
    }

    /**
     * @param {ARSDebugOptions} newDebugOptions
     * @throws if debugOptions is not an object or has an invalid key
     */
    async setDebugOptions(newDebugOptions) {
        this.#assertIsSupported();
        _console.assertWithError(typeof newDebugOptions == "object", "debugOptions must be an object", newDebugOptions);
        const invalidKey = Object.keys(newDebugOptions).find(
            (debugOption) => !this.#allDebugOptions.includes(debugOption)
        );
        _console.assertWithError(!invalidKey, `invalid debugOptions key ${invalidKey}`);

        _console.log("setting debugOptions...", newDebugOptions);
        return this.sendMessageToApp({ type: "debugOptions", debugOptions: newDebugOptions });
    }

    /** @type {boolean} */
    #checkDebugOptionsOnLoad = false;
    get checkDebugOptionsOnLoad() {
        return this.#checkDebugOptionsOnLoad;
    }
    /** @throws {Error} if newValue is not a boolean */
    set checkDebugOptionsOnLoad(newValue) {
        _console.assertWithError(
            typeof newValue == "boolean",
            `invalid newValue for checkDebugOptionsOnLoad`,
            newValue
        );
        this.#checkDebugOptionsOnLoad = newValue;
    }

    /** @type {ARSCameraMode[]} */
    #allCameraModes = ["ar", "nonAR"];
    get allCameraModes() {
        return this.#allCameraModes;
    }

    /** @type {ARSCameraMode?} */
    #cameraMode = null;
    get cameraMode() {
        return this.#cameraMode;
    }

    /** @param {ARSCameraMode} cameraMode */
    #setCameraModeMessage(cameraMode) {
        return this._formatMessage({ type: "cameraMode", cameraMode });
    }

    /**
     * @param {ARSCameraMode} newCameraMode
     * @throws error if newCameraMode is not valid
     */
    async setCameraMode(newCameraMode) {
        this.#assertIsSupported();

        const isValidCameraMode = this.#allCameraModes.includes(newCameraMode);
        _console.assertWithError(isValidCameraMode, `invalid cameraMode "${newCameraMode}"`);

        if (newCameraMode == this.#cameraMode) {
            _console.log(`cameraMode is already set to "${this.#cameraMode}"`);
            return;
        }

        _console.log("setting cameraMode...", newCameraMode);
        return this.sendMessageToApp({ type: "cameraMode", cameraMode: newCameraMode });
    }

    /** @type {boolean} */
    #checkCameraModeOnLoad = false;
    get checkCameraModeOnLoad() {
        return this.#checkCameraModeOnLoad;
    }
    /** @throws {Error} if newValue is not a boolean */
    set checkCameraModeOnLoad(newValue) {
        _console.assertWithError(typeof newValue == "boolean", `invalid newValue for checkCameraModeOnLoad`, newValue);
        this.#checkCameraModeOnLoad = newValue;
    }

    /** @param {ARSCameraMode} newCameraMode */
    #onCameraModeUpdated(newCameraMode) {
        if (this.#cameraMode == newCameraMode) {
            return;
        }

        this.#cameraMode = newCameraMode;
        _console.log(`updated cameraMode to ${this.cameraMode}`);
        this.dispatchEvent({ type: "cameraMode", message: { cameraMode: this.cameraMode } });
    }

    /** @type {boolean} */
    #showCamera = null;
    get showCamera() {
        return this.#showCamera;
    }

    /** @param {boolean} newShowCamera */
    #onShowCameraUpdated(newShowCamera) {
        if (this.#showCamera == newShowCamera) {
            return;
        }

        this.#showCamera = newShowCamera;
        _console.log(`updated showCamera to ${this.showCamera}`);
        this.dispatchEvent({ type: "showCamera", message: { showCamera: this.showCamera } });
    }

    /** @type {boolean} */
    #checkShowCameraOnLoad = false;
    get checkShowCameraOnLoad() {
        return this.#checkShowCameraOnLoad;
    }
    /** @throws {Error} if newValue is not a boolean */
    set checkShowCameraOnLoad(newValue) {
        _console.assertWithError(typeof newValue == "boolean", `invalid newValue for checkShowCameraOnLoad`, newValue);
        this.#checkShowCameraOnLoad = newValue;
    }

    /** @param {boolean} newShowCamera */
    async setShowCamera(newShowCamera) {
        this.#assertIsSupported();
        if (newShowCamera == this.#showCamera) {
            _console.log(`showCamera is already set to "${this.#showCamera}"`);
            return;
        }

        _console.log("setting showCamera...", newShowCamera);
        return this.sendMessageToApp({ type: "showCamera", showCamera: newShowCamera });
    }

    /** @type {ARSMessageConfiguration} */
    #messageConfiguration = {
        faceAnchorBlendshapes: false,
        faceAnchorGeometry: false,
    };
    get messageConfiguration() {
        return this.#messageConfiguration;
    }
    /** @param {ARSMessageConfiguration} newMessageConfiguration */
    async setMessageConfiguration(newMessageConfiguration) {
        this.#assertIsSupported();
        _console.log("setting messageConfiguration...", newMessageConfiguration);
        return this.sendMessageToApp({ type: "messageConfiguration", messageConfiguration: newMessageConfiguration });
    }
    /** @param {ARSMessageConfiguration} newMessageConfiguration */
    #onMessageConfigurationUpdated(newMessageConfiguration) {
        this.#messageConfiguration = newMessageConfiguration;
        _console.log("updated messageConfiguration", this.messageConfiguration);
        this.dispatchEvent({
            type: "messageConfiguration",
            message: { messageConfiguration: this.messageConfiguration },
        });
    }

    /**
     * @param {ARSAppMessage} message
     */
    #onAppMessage(message) {
        _console.log(`received background message of type ${message.type}`, message);
        const { type } = message;
        switch (type) {
            case "faceTrackingSupport":
                _console.log("received faceTrackingSupport message", message);
                this.#onFaceTrackingSupportUpdated(message.faceTrackingSupport);
                break;
            case "worldTrackingSupport":
                _console.log("received worldTrackingSupport message", message);
                this.#onWorldTrackingSupportUpdated(message.worldTrackingSupport);
                break;
            case "isRunning":
                _console.log("received isRunning message", message);
                this.#onIsRunningUpdated(message.isRunning);
                break;
            case "configuration":
                _console.log("received configuration message", message);
                this.#onConfigurationUpdated(message.configuration);
                break;
            case "debugOptions":
                _console.log("received debugOptions message", message);
                this.#onDebugOptionsUpdated(message.debugOptions);
                break;
            case "cameraMode":
                _console.log("received cameraMode message", message);
                this.#onCameraModeUpdated(message.cameraMode);
                break;
            case "frame":
                _console.log("received frame message", message);
                this.#onFrame(message.frame);
                break;
            case "showCamera":
                _console.log("received showCamera message", message);
                this.#onShowCameraUpdated(message.showCamera);
                break;
            case "messageConfiguration":
                _console.log("received messageConfiguration message", message);
                this.#onMessageConfigurationUpdated(message.messageConfiguration);
                break;
            default:
                throw Error(`uncaught message type ${type}`);
        }
    }
}

var ARSessionManager$1 = ARSessionManager.shared;

// https://gist.github.com/paulkaplan/5184275

/**
 * @param {number} x
 * @param {number} min
 * @param {number} max
 * @returns {number} clamped number
 */
function clamp(value, min, max) {
    if (value < min) {
        return min;
    } else if (value > max) {
        return max;
    } else {
        return value;
    }
}

/**
 *
 * @param {number} kelvin
 * @returns {number[]} [red, green, blue], ranged between [0, 1]
 */
function colorTemperatureToRGB(kelvin) {
    var temp = kelvin / 100;

    var red, green, blue;

    if (temp <= 66) {
        red = 255;

        green = temp;
        green = 99.4708025861 * Math.log(green) - 161.1195681661;

        if (temp <= 19) {
            blue = 0;
        } else {
            blue = temp - 10;
            blue = 138.5177312231 * Math.log(blue) - 305.0447927307;
        }
    } else {
        red = temp - 60;
        red = 329.698727446 * Math.pow(red, -0.1332047592);

        green = temp - 60;
        green = 288.1221695283 * Math.pow(green, -0.0755148492);

        blue = 255;
    }

    return [red, green, blue].map((value) => clamp(value / 255, 0, 1));
}

var utils = /*#__PURE__*/Object.freeze({
    __proto__: null,
    areObjectsEqual: areObjectsEqual,
    checkIfNativeWebKitEnabled: checkIfNativeWebKitEnabled,
    checkIfSafariExtensionIsInstalled: checkIfSafariExtensionIsInstalled,
    colorTemperatureToRGB: colorTemperatureToRGB,
    isInApp: isInApp,
    isInSafari: isInSafari,
    isMac: isMac,
    is_iOS: is_iOS,
    openInApp: openInApp,
    setAllConsoleLevelFlags: setAllConsoleLevelFlags,
    setConsoleLevelFlagsForType: setConsoleLevelFlagsForType
});

export { ARSessionManager$1 as ARSessionManager, HeadphoneMotionManager$1 as HeadphoneMotionManager, utils };
