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

    /**
     * @param {any} value
     * @param {string} type
     * @throws {Error} if value's type doesn't match
     */
    assertTypeWithError(value, type) {
        this.assertWithError(typeof value == type, `value of type "${typeof value}" not of type "${type}"`);
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

const _console$8 = createConsole("EventDispatcher", { log: false });

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
        _console$8.assertWithError(Array.isArray(eventTypes), "eventTypes must be an array");
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
        _console$8.assertWithError(this.#isValidEventType(type), `invalid event type "${type}"`);
    }

    /** @type {Object.<string, [function]?>?} */
    #listeners;

    /**
     * @param {string} type
     * @param {EventDispatcherListener} listener
     * @param {EventDispatcherOptions?} options
     */
    addEventListener(type, listener, options) {
        _console$8.log(`adding "${type}" eventListener`, listener);
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
        _console$8.log(`has "${type}" eventListener?`, listener);
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
        _console$8.log(`removing "${type}" eventListener`, listener);
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

const _console$7 = createConsole("platformUtils", { log: false });

const { userAgent } = navigator;

const isInSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);

const isInApp = /NativeWebKit/i.test(userAgent);

var isSafariExtensionInstalled = Boolean(window.isNativeWebKitSafariExtensionInstalled);

const checkIfSafariExtensionIsInstalled = async () => {
    isSafariExtensionInstalled = isSafariExtensionInstalled || Boolean(window.isNativeWebKitSafariExtensionInstalled);
    if (isSafariExtensionInstalled) {
        return true;
    } else {
        _console$7.log("checking if Safari Extension is installed...");
        return new Promise((resolve) => {
            const eventListener = () => {
                _console$7.log("Safari Extension is installed");
                isSafariExtensionInstalled = true;
                resolve(true);
            };
            window.addEventListener("nativewebkit-extension-is-installed", eventListener, { once: true });
            window.dispatchEvent(new Event("is-nativewebkit-extension-installed"));
            window.setTimeout(() => {
                if (!isSafariExtensionInstalled) {
                    _console$7.log("Safari Extension is not installed");
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
        _console$7.log("attempting to open current link in App...", location.href, href);
        a.href = href;
        a.click();
    } else {
        _console$7.warn("unable to open link in app - not in safari");
    }
};

const _console$6 = createConsole("messaging", { log: false });

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
    _console$6.log(`adding callback with prefix "${prefix}"`, callback);
    if (!appListeners[prefix]) {
        appListeners[prefix] = [];
    }
    appListeners[prefix].push(callback);
}

if (!window.__NATIVEWEBKIT_MESSAGING_FLAG__) {
    window.__NATIVEWEBKIT_MESSAGING_FLAG__ = true;
    _console$6.log(`adding "nativewebkit-receive" window listener`);

    window.addEventListener("nativewebkit-receive", (event) => {
        /** @type {NKMessage|NKMessage[]} */
        let messages = event.detail;
        onAppMessages(messages);
    });

    window.addEventListener("load", () => {
        _console$6.log("triggering window.load events...");
        const messages = appListeners["window.load"]
            ?.map((callback) => callback())
            .flat()
            .filter(Boolean);
        if (messages.length > 0) {
            sendMessageToApp(messages);
        }
    });
    window.addEventListener("unload", () => {
        _console$6.log("triggering window.unload events...");
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
    _console$6.log("nativewebkit-receive messages", messages);
    messages.forEach((message) => {
        const [prefix, type] = message.type.split("-");
        _console$6.log(`received "${prefix}" message of type "${type}"`, message);
        message.type = type;
        if (!appListeners[prefix] || appListeners[prefix].length == 0) {
            _console$6.warn("no callbacks listening for prefix", prefix);
        } else {
            appListeners[prefix].forEach((callback) => {
                _console$6.log("triggering callback", callback, "for message", message);
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
        _console$6.log("requesting to send message", message, "send immediately?", sendImmediately);
        if (!message && pendingMessagesToSend.length == 0) {
            _console$6.warn("no messages received, and no pending messages");
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
            _console$6.log("no messages to send");
            return;
        }

        if (!sendImmediately) {
            return pendingMessagesPromise;
        }

        _console$6.log("sending messages to app...", pendingMessagesToSend);
        if (isInApp) {
            /** @type {NKMessage|NKMessage[]} */
            const messages = await webkit.messageHandlers.nativewebkit_reply.postMessage(pendingMessagesToSend);
            _console$6.log("app response", messages);
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
                    _console$6.log(`did receive message for nativewebkit-receive-${id}?`, didReceiveMessage);
                    if (!didReceiveMessage) {
                        _console$6.error(`didn't receive message for nativewebkit-receive-${id}`);
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
        _console$6.warn(
            "NativeWebKit.js is not enabled - run in the NativeWebKit app or enable the NativeWebKit Safari Web Extension"
        );
    }
}

const _console$5 = createConsole("mathUtils", { log: false });

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
    _console$5.log("finding greatestCommonFactor of numbers", numbers);
    numbers = numbers.filter((number) => number > 0);

    if (numbers.length == 0) {
        return null;
    }

    const greatestCommonFactor = numbers.reduce((number, gcf) => greaterCommonFactor(number, gcf));
    _console$5.log("greatestCommonFactor", greatestCommonFactor);
    if (greatestCommonFactor == 0) {
        return null;
    }
    return greatestCommonFactor;
}

const _console$4 = createConsole("AppMessagePoll", { log: false });

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
            _console$4.log("poll already included");
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
            _console$4.log("poll wasn't included");
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
        _console$4.assertWithError(newInterval > 0, `invalid interval ${newInterval}ms`);
        if (newInterval == this.#interval) {
            _console$4.warn("assigning same interval");
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
        _console$4.log(`new interval ${newInterval}`);
        if (this.#Interval != newInterval) {
            _console$4.log(`interval updated from ${this.#Interval} to ${newInterval}`);
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
        _console$4.log("messages", messages);

        if (messages.length > 0) {
            const didReceiveMessage = await sendMessageToApp(messages);
            _console$4.log("didReceiveMessage?", didReceiveMessage);
            if (!didReceiveMessage) {
                _console$4.error("app didn't receive message");
            }
        } else {
            _console$4.log("no messages to send");
        }

        polls.forEach((poll) => (poll.#lastTimeCallbackWasCalled = now));
    }
    static #start() {
        if (this.#IsRunning) {
            _console$4.log("tried to start AppMessagePoll when it's already running");
            return;
        }
        if (this.#Interval == null) {
            _console$4.log("null interval");
            return;
        }
        _console$4.log(`starting interval at ${this.#Interval}`);

        this.#intervalId = window.setInterval(this.#intervalCallback.bind(this), this.#Interval);
    }
    static #stop() {
        if (!this.#IsRunning) {
            _console$4.log("tried to stop AppMessagePoll when it already isn't running");
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
            _console$4.log("restarting...");
            this.#stop();
            this.#start();
        } else {
            _console$4.log("no need to restart");
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
            _console$4.log("poll is already running");
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
        _console$4.log("destroying poll", this);
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

const _console$3 = createConsole("HeadphoneMotionManager", { log: false });

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
    #dispatchEvent(event) {
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
        _console$3.assertWithError(
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
    async #sendMessageToApp(message) {
        message.type = `${this.#prefix}-${message.type}`;
        return sendMessageToApp(message);
    }

    /** @type {boolean} */
    #checkAvailabilityOnLoad = false;
    get checkAvailabilityOnLoad() {
        return this.#checkAvailabilityOnLoad;
    }
    set checkAvailabilityOnLoad(newValue) {
        _console$3.assertTypeWithError(newValue, "boolean");
        this.#checkAvailabilityOnLoad = newValue;
    }

    /** @type {boolean} */
    #stopUpdatesOnUnload = true;
    get stopUpdatesOnUnload() {
        return this.#stopUpdatesOnUnload;
    }
    set stopUpdatesOnUnload(newValue) {
        _console$3.assertTypeWithError(newValue, "boolean");
        this.#stopUpdatesOnUnload = newValue;
    }

    /**
     * @param {HMAppMessage} message
     */
    #onAppMessage(message) {
        _console$3.log(`received background message of type ${message.type}`, message);
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
    #assertIsAvailable() {
        _console$3.assert(this.isAvailable, "not available");
    }
    /** @param {boolean} newValue */
    #onIsAvailableUpdated(newValue) {
        if (this.#isAvailable == newValue) {
            return;
        }
        this.#isAvailable = newValue;
        _console$3.log(`updated isAvailable to ${newValue}`);
        this.#dispatchEvent({
            type: "isAvailable",
            message: { isAvailable: this.isAvailable },
        });
        if (this.#isAvailable) {
            this.#checkIsActive();
        }
    }
    async #checkIsAvailable() {
        _console$3.log("checking isAvailable...");
        return this.#sendMessageToApp({ type: "isAvailable" });
    }

    /** @type {boolean?} */
    #isActive = null;
    get isActive() {
        return Boolean(this.#isActive);
    }
    /** @param {boolean} newIsActive */
    #onIsActiveUpdated(newIsActive) {
        if (this.#isActive == newIsActive) {
            return;
        }
        this.#isActive = newIsActive;
        _console$3.log(`updated isActive to ${this.isActive}`);
        this.#dispatchEvent({
            type: "isActive",
            message: { isActive: this.isActive },
        });

        this.#isActivePoll.stop();
        if (this.#isActive) {
            _console$3.log("starting motion data poll");
            this.#motionDataPoll.start();
        } else {
            _console$3.log("stopping motion data poll");
            this.#motionDataPoll.stop();
        }
    }
    async #checkIsActive() {
        _console$3.log("checking isActive");
        return this.#sendMessageToApp({ type: "isActive" });
    }
    #isActivePoll = new AppMessagePoll({ type: "isActive" }, this.#prefix, 50, true);

    async startUpdates() {
        this.#assertIsAvailable();
        if (this.isActive) {
            _console$3.warn("already active");
            return;
        }
        _console$3.log("starting motion updates");
        this.#isActivePoll.start();
        return this.#sendMessageToApp({ type: "startUpdates" });
    }
    async stopUpdates() {
        this.#assertIsAvailable();
        if (!this.isActive) {
            _console$3.warn("already inactive");
            return;
        }
        _console$3.log("stopping motion updates");
        this.#isActivePoll.start();
        return this.#sendMessageToApp({ type: "stopUpdates" });
    }

    async toggleMotionUpdates() {
        this.#assertIsAvailable();
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
        if (this.#sensorLocation == newValue) {
            return;
        }
        this.#sensorLocation = newValue;
        _console$3.log(`updated sensor location to ${newValue}`);
        this.#dispatchEvent({
            type: "sensorLocation",
            message: { sensorLocation: this.sensorLocation },
        });
    }

    /**
     * @param {HeadphoneMotionData} newMotionData
     */
    #onMotionData(newMotionData) {
        this.#motionData = newMotionData;
        _console$3.log("received headphone motion data", this.motionData);
        this.#dispatchEvent({ type: "motionData", message: { motionData: this.motionData } });
        this.#onSensorLocationUpdated(newMotionData.sensorLocation);
    }

    /** @returns {HMAppMessage} */
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

const _console$2 = createConsole("ARSession", { log: false });

/** @typedef {"worldTrackingSupport" | "bodyTrackingSupport" | "faceTrackingSupport" | "run" | "pause" | "status" | "frame" | "debugOptions" | "cameraMode" | "configuration" | "showCamera" | "messageConfiguration" | "isRunning"} ARSMessageType */

/** @typedef {"worldTrackingSupport" | "bodyTrackingSupport" | "faceTrackingSupport" | "isRunning" | "frame" | "camera" | "faceAnchors" | "debugOptions" | "cameraMode" | "configuration" | "showCamera" | "lightEstimate" | "messageConfiguration" | "planeAnchors" | "bodyAnchors"} ARSEventType */

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
 * @typedef ARSBodyTrackingSupport
 * @type {object}
 * @property {boolean} isSupported
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

/** @typedef {"worldTracking"|"faceTracking"|"bodyTracking"} ARSConfigurationType */
/**
 * @typedef ARSConfiguration
 * @type {object}
 * @property {ARSConfigurationType} type
 */

/** @typedef {"userFaceTrackingEnabled" | "planeDetection" | "frameSemantics"} ARSWorldTrackingConfigurationKey */
/**
 * @typedef _ARSWorldTrackingConfiguration
 * @type {object}
 * @property {bool} userFaceTrackingEnabled
 * @property {ARSPlaneDetection[]} planeDetection
 * @property {ARSFrameSemantic[]} frameSemantics
 */
/** @typedef {"horizontal" | "vertical"} ARSPlaneDetection */

/** @typedef {"bodyDetection"} ARSFrameSemantic */

/** @typedef {ARSConfiguration & _ARSWorldTrackingConfiguration} ARSWorldTrackingConfiguration */

/** @typedef {"isWorldTrackingEnabled" | "maximumNumberOfTrackedFaces"} ARSFaceTrackingConfigurationKey */
/**
 * @typedef _ARSFaceTrackingConfiguration
 * @type {object}
 * @property {bool} isWorldTrackingEnabled
 * @property {bool} maximumNumberOfTrackedFaces
 */
/** @typedef {ARSConfiguration & _ARSFaceTrackingConfiguration} ARSFaceTrackingConfiguration */

/** @typedef {"planeDetection" | "frameSemantics"} ARSBodyTrackingConfigurationKey */
/**
 * @typedef _ARSBodyTrackingConfiguration
 * @type {object}
 * @property {ARSPlaneDetection[]} planeDetection
 * @property {ARSFrameSemantic[]} frameSemantics
 */
/** @typedef {ARSConfiguration & _ARSBodyTrackingConfiguration} ARSBodyTrackingConfiguration */

/**
 * @typedef ARSFrame
 * @type {object}
 * @property {number} timestamp
 * @property {ARSCamera} camera
 * @property {ARSFaceAnchor[]?} faceAnchors
 * @property {ARSPlaneAnchor[]?} planeAnchors
 * @property {ARSBodyAnchor[]?} bodyAnchors
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
 * @property {number[]?} lookAtPoint
 * @property {number[]} position
 * @property {number[]} quaternion
 * @property {ARSFaceAnchorEye?} leftEye
 * @property {ARSFaceAnchorEye?} rightEye
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

/**
 * @typedef ARSPlaneAnchor
 * @type {object}
 * @property {string} identifier
 * @property {number[]} position
 * @property {number[]} center
 * @property {number[]} quaternion
 * @property {ARSPlaneClassification} classification
 * @property {ARSPlaneExtent} planeExtent
 */

/** @typedef {"wall" | "floor" | "ceiling" | "table" | "seat" | "window" | "door" | "unknown" | "notAvailable" | "undetermined"} ARSPlaneClassification */

/**
 * @typedef ARSPlaneExtent
 * @type {object}
 * @property {number} height
 * @property {number} width
 * @property {number} rotationOnYAxis
 */

/**
 * @typedef ARSBodyAnchor
 * @type {object}
 * @property {string} identifier
 * @property {boolean} isTracked
 * @property {number} estimatedScaleFactor
 * @property {number[]} position
 * @property {number[]} quaternion
 * @property {ARSSkeleton} skeleton
 */

/** @typedef {"root" | "hips_joint" | "left_upLeg_joint" | "left_leg_joint" | "left_foot_joint" | "left_toes_joint" | "left_toesEnd_joint" | "right_upLeg_joint" | "right_leg_joint" | "right_foot_joint" | "right_toes_joint" | "right_toesEnd_joint" | "spine_1_joint" | "spine_2_joint" | "spine_3_joint" | "spine_4_joint" | "spine_5_joint" | "spine_6_joint" | "spine_7_joint" | "neck_1_joint" | "neck_2_joint" | "neck_3_joint" | "neck_4_joint" | "head_joint" | "jaw_joint" | "chin_joint" | "nose_joint" | "right_eye_joint" | "right_eyeUpperLid_joint" | "right_eyeLowerLid_joint" | "right_eyeball_joint" | "left_eye_joint" | "left_eyeUpperLid_joint" | "left_eyeLowerLid_joint" | "left_eyeball_joint" | "right_shoulder_1_joint" | "right_arm_joint" | "right_forearm_joint" | "right_hand_joint" | "right_handPinkyStart_joint" | "right_handPinky_1_joint" | "right_handPinky_2_joint" | "right_handPinky_3_joint" | "right_handPinkyEnd_joint" | "right_handRingStart_joint" | "right_handRing_1_joint" | "right_handRing_2_joint" | "right_handRing_3_joint" | "right_handRingEnd_joint" | "right_handMidStart_joint" | "right_handMid_1_joint" | "right_handMid_2_joint" | "right_handMid_3_joint" | "right_handMidEnd_joint" | "right_handIndexStart_joint" | "right_handIndex_1_joint" | "right_handIndex_2_joint" | "right_handIndex_3_joint" | "right_handIndexEnd_joint" | "right_handThumbStart_joint" | "right_handThumb_1_joint" | "right_handThumb_2_joint" | "right_handThumbEnd_joint" | "left_shoulder_1_joint" | "left_arm_joint" | "left_forearm_joint" | "left_hand_joint" | "left_handPinkyStart_joint" | "left_handPinky_1_joint" | "left_handPinky_2_joint" | "left_handPinky_3_joint" | "left_handPinkyEnd_joint" | "left_handRingStart_joint" | "left_handRing_1_joint" | "left_handRing_2_joint" | "left_handRing_3_joint" | "left_handRingEnd_joint" | "left_handMidStart_joint" | "left_handMid_1_joint" | "left_handMid_2_joint" | "left_handMid_3_joint" | "left_handMidEnd_joint" | "left_handIndexStart_joint" | "left_handIndex_1_joint" | "left_handIndex_2_joint" | "left_handIndex_3_joint" | "left_handIndexEnd_joint" | "left_handThumbStart_joint" | "left_handThumb_1_joint" | "left_handThumb_2_joint" | "left_handThumbEnd_joint"} ARSSkeletonJointName */
/**
 * @typedef ARSSkeleton
 * @type {Object.<string, ARSSkeletonJoint>}
 */

/**
 * @typedef ARSSkeletonJoint
 * @type {object}
 * @property {number[]} position
 * @property {number[]} quaternion
 */

/** @typedef {"faceAnchorBlendshapes" | "faceAnchorGeometry"} ARSMessageConfigurationType */

/**
 * @typedef ARSMessageConfiguration
 * @type {object}
 * @property {boolean} faceAnchorBlendshapes
 * @property {boolean} faceAnchorGeometry
 * @property {boolean} faceAnchorEyes
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
        "bodyTrackingSupport",
        "isRunning",
        "frame",
        "camera",
        "faceAnchors",
        "debugOptions",
        "cameraMode",
        "configuration",
        "showCamera",
        "lightEstimate",
        "messageConfiguration",
        "planeAnchors",
        "bodyAnchors",
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
    #dispatchEvent(event) {
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
        _console$2.assertWithError(!this.shared, "ARSessionManager is a singleton - use ARSessionManager.shared");

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
        _console$2.assertWithError(this.isRunning, "ARSession is not running");
    }

    /**
     * @param {ARSAppMessage} message
     */
    async #sendMessageToApp(message) {
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
        if (this.checkBodyTrackingSupportOnLoad) {
            messages.push({ type: "bodyTrackingSupport" });
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
        isSupported: null,
        supportsUserFaceTracking: null,
    };
    get worldTrackingSupport() {
        return this.#worldTrackingSupport;
    }
    /** @param {ARSWorldTrackingSupport} newValue */
    #onWorldTrackingSupportUpdated(newValue) {
        if (!areObjectsEqual(this.#worldTrackingSupport, newValue)) {
            this.#worldTrackingSupport = newValue;
            _console$2.log("updated worldTrackingSupport", newValue);
            this.#dispatchEvent({
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
    set checkWorldTrackingSupportOnLoad(newValue) {
        _console$2.assertTypeWithError(newValue, "boolean");
        this.#checkWorldTrackingSupportOnLoad = newValue;
    }

    /** @type {ARSBodyTrackingSupport} */
    #bodyTrackingSupport = {
        isSupported: null,
    };
    get bodyTrackingSupport() {
        return this.#bodyTrackingSupport;
    }
    /** @param {ARSBodyTrackingSupport} newValue */
    #onBodyTrackingSupportUpdated(newValue) {
        if (!areObjectsEqual(this.#bodyTrackingSupport, newValue)) {
            this.#bodyTrackingSupport = newValue;
            _console$2.log("updated bodyTrackingSupport", newValue);
            this.#dispatchEvent({
                type: "bodyTrackingSupport",
                message: { bodyTrackingSupport: this.bodyTrackingSupport },
            });
        }
    }

    /** @type {boolean} */
    #checkBodyTrackingSupportOnLoad = false;
    get checkBodyTrackingSupportOnLoad() {
        return this.#checkBodyTrackingSupportOnLoad;
    }
    set checkBodyTrackingSupportOnLoad(newValue) {
        _console$2.assertTypeWithError(newValue, "boolean");
        this.#checkBodyTrackingSupportOnLoad = newValue;
    }

    /** @type {ARSFaceTrackingSupport} */
    #faceTrackingSupport = {
        isSupported: null,
        supportsWorldTracking: null,
    };
    get faceTrackingSupport() {
        return this.#faceTrackingSupport;
    }
    /** @param {ARSFaceTrackingSupport} newValue */
    #onFaceTrackingSupportUpdated(newValue) {
        if (!areObjectsEqual(this.#faceTrackingSupport, newValue)) {
            this.#faceTrackingSupport = newValue;
            _console$2.log("updated faceTrackingSupport", newValue);
            this.#dispatchEvent({
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
    set checkFaceTrackingSupportOnLoad(newValue) {
        _console$2.assertTypeWithError(newValue, "boolean");
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
            _console$2.log(`updated isRunning to ${newValue}`);
            this.#dispatchEvent({
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
    set checkIsRunningOnLoad(newValue) {
        _console$2.assertTypeWithError(newValue, "boolean");
        this.#checkIsRunningOnLoad = newValue;
    }

    /** @type {boolean} */
    #pauseOnUnload = true;
    get pauseOnUnload() {
        return this.#pauseOnUnload;
    }
    set pauseOnUnload(newValue) {
        _console$2.assertTypeWithError(newValue, "boolean");
        this.#pauseOnUnload = newValue;
    }

    /**
     * @param {ARSConfiguration} configuration
     * @throws {Error} if invalid
     */
    #assertConfigurationIsValid(configuration) {
        _console$2.log("assertConfigurationIsValid", configuration);
        _console$2.assertWithError(configuration, "configuration required to run ARSession");
        _console$2.assertWithError(configuration.type, '"type" property required in configuration"');
        _console$2.assertWithError(
            this.allConfigurationTypes.includes(configuration.type),
            `invalid configuration type "${configuration.type}"`
        );

        switch (configuration.type) {
            case "worldTracking":
                const invalidWorldTrackingConfigurationKey = Object.keys(configuration).find(
                    (key) => key !== "type" && !this.#worldTrackingConfigurationKeys.includes(key)
                );
                _console$2.assertWithError(
                    !invalidWorldTrackingConfigurationKey,
                    `invalid worldTracking configuration key "${invalidWorldTrackingConfigurationKey}"`
                );
                /** @type {ARSWorldTrackingConfiguration} */
                const worldTrackingConfiguration = configuration;
                _console$2.assertWithError(
                    this.worldTrackingSupport.isSupported != null,
                    "check for world tracking support before running an AR session"
                );
                _console$2.assertWithError(
                    this.worldTrackingSupport.isSupported,
                    "your device doesn't support world tracking"
                );
                _console$2.assertWithError(
                    !worldTrackingConfiguration.userFaceTrackingEnabled ||
                        this.worldTrackingSupport.supportsUserFaceTracking,
                    "your device doesn't support user face tracking with world tracking"
                );
                break;
            case "faceTracking":
                const invalidFaceTrackingConfigurationKey = Object.keys(configuration).find(
                    (key) => key !== "type" && !this.#faceTrackingConfigurationKeys.includes(key)
                );
                _console$2.assertWithError(
                    !invalidFaceTrackingConfigurationKey,
                    `invalid faceTracking configuration key "${invalidFaceTrackingConfigurationKey}"`
                );
                /** @type {ARSFaceTrackingConfiguration} */
                const faceTrackingConfiguration = configuration;
                _console$2.assertWithError(
                    this.#faceTrackingSupport.isSupported != null,
                    "check for face tracking support before running an AR session"
                );
                _console$2.assertWithError(
                    this.faceTrackingSupport.isSupported,
                    "your device doesn't support face tracking"
                );
                _console$2.assertWithError(
                    !faceTrackingConfiguration.isWorldTrackingEnabled || this.faceTrackingSupport.supportsWorldTracking,
                    "your device doesn't support user world tracking with face tracking"
                );
                break;
            case "bodyTracking":
                break;
            default:
                throw Error(`uncaught configuration type "${configuration.type}"`);
        }
    }

    /** @param {ARSConfiguration} configuration */
    async run(configuration) {
        this.#assertIsSupported();
        this.#assertConfigurationIsValid(configuration);

        _console$2.log("running with configuraton", configuration);
        return this.#sendMessageToApp({ type: "run", configuration });
    }

    async pause() {
        _console$2.log("pause...");
        return this.#sendMessageToApp({ type: "pause" });
    }

    /** @type {ARSConfigurationType[]} */
    #allConfigurationTypes = ["worldTracking", "faceTracking", "bodyTracking"];
    get allConfigurationTypes() {
        return this.#allConfigurationTypes;
    }

    /** @type {ARSWorldTrackingConfigurationKey[]} */
    #worldTrackingConfigurationKeys = ["userFaceTrackingEnabled", "planeDetection", "frameSemantics"];
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

        _console$2.log("checking configuration...");
        return this.#sendMessageToApp({ type: "configuration" });
    }

    /** @param {ARSConfiguration} newConfiguration  */
    #onConfigurationUpdated(newConfiguration) {
        this.#configuration = newConfiguration;
        _console$2.log("updated configuration", this.configuration);
        this.#dispatchEvent({
            type: "configuration",
            message: { configuration: this.configuration },
        });
    }

    /** @type {ARSFrame?} */
    #frame = null;
    get frame() {
        return this.#frame;
    }
    /** @param {ARSFrame} frame */
    #onFrame(frame) {
        this.#frame = frame;
        _console$2.log("received frame", this.frame);
        this.#dispatchEvent({ type: "frame", message: { frame: this.frame } });
        this.#onCamera(frame.camera);
        if (frame.lightEstimate) {
            this.#onLightEstimate(frame.lightEstimate);
        }
        // dispatch messages so we can detect no anchors that frame
        {
            this.#onFaceAnchors(frame.faceAnchors || []);
        }
        {
            this.#onPlaneAnchors(frame.planeAnchors || []);
        }
        {
            this.#onBodyAnchors(frame.bodyAnchors || []);
        }
    }

    /** @type {ARSCamera?} */
    #camera = null;
    get camera() {
        return this.#camera;
    }
    /** @param {ARSCamera} camera */
    #onCamera(camera) {
        this.#camera = camera;
        _console$2.log("received camera", this.camera);
        this.#dispatchEvent({ type: "camera", message: { camera: this.camera } });
    }

    /** @type {ARSLightEstimate?} */
    #lightEstimate = null;
    get lightEstimate() {
        return this.#lightEstimate;
    }
    /** @param {ARSLightEstimate} lightEstimate */
    #onLightEstimate(lightEstimate) {
        this.#lightEstimate = lightEstimate;
        _console$2.log("received lightEstimate", this.lightEstimate);
        this.#dispatchEvent({ type: "lightEstimate", message: { lightEstimate: this.lightEstimate } });
    }

    /** @type {ARSFaceAnchor[]?} */
    #faceAnchors = null;
    get faceAnchors() {
        return this.#faceAnchors;
    }
    /** @param {ARSFaceAnchor[]} faceAnchors */
    #onFaceAnchors(faceAnchors) {
        this.#faceAnchors = faceAnchors;
        _console$2.log("received faceAnchors", this.faceAnchors);
        this.#dispatchEvent({ type: "faceAnchors", message: { faceAnchors: this.faceAnchors } });
    }

    /** @type {ARSPlaneAnchor[]?} */
    #planeAnchors = null;
    get planeAnchors() {
        return this.#planeAnchors;
    }
    /** @param {ARSPlaneAnchor[]} planeAnchors */
    #onPlaneAnchors(planeAnchors) {
        this.#planeAnchors = planeAnchors;
        _console$2.log("received planeAnchors", this.planeAnchors);
        this.#dispatchEvent({ type: "planeAnchors", message: { planeAnchors: this.planeAnchors } });
    }

    /** @type {ARSBodyAnchor[]?} */
    #bodyAnchors = null;
    get bodyAnchors() {
        return this.#bodyAnchors;
    }
    /** @param {ARSBodyAnchor[]} bodyAnchors */
    #onBodyAnchors(bodyAnchors) {
        this.#bodyAnchors = bodyAnchors;
        _console$2.log("received bodyAnchors", this.bodyAnchors);
        this.#dispatchEvent({ type: "bodyAnchors", message: { bodyAnchors: this.bodyAnchors } });
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
        _console$2.log("received debugOptions", this.debugOptions);
        this.#dispatchEvent({ type: "debugOptions", message: { debugOptions: this.debugOptions } });
    }

    /**
     * @param {ARSDebugOptions} newDebugOptions
     * @throws if debugOptions is not an object or has an invalid key
     */
    async setDebugOptions(newDebugOptions) {
        this.#assertIsSupported();
        _console$2.assertWithError(typeof newDebugOptions == "object", "debugOptions must be an object", newDebugOptions);
        const invalidKey = Object.keys(newDebugOptions).find(
            (debugOption) => !this.#allDebugOptions.includes(debugOption)
        );
        _console$2.assertWithError(!invalidKey, `invalid debugOptions key ${invalidKey}`);

        _console$2.log("setting debugOptions...", newDebugOptions);
        return this.#sendMessageToApp({ type: "debugOptions", debugOptions: newDebugOptions });
    }

    /** @type {boolean} */
    #checkDebugOptionsOnLoad = false;
    get checkDebugOptionsOnLoad() {
        return this.#checkDebugOptionsOnLoad;
    }
    set checkDebugOptionsOnLoad(newValue) {
        _console$2.assertTypeWithError(newValue, "boolean");
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

    /**
     * @param {ARSCameraMode} newCameraMode
     * @throws error if newCameraMode is not valid
     */
    async setCameraMode(newCameraMode) {
        this.#assertIsSupported();

        const isValidCameraMode = this.#allCameraModes.includes(newCameraMode);
        _console$2.assertWithError(isValidCameraMode, `invalid cameraMode "${newCameraMode}"`);

        if (newCameraMode == this.#cameraMode) {
            _console$2.log(`cameraMode is already set to "${this.#cameraMode}"`);
            return;
        }

        _console$2.log("setting cameraMode...", newCameraMode);
        return this.#sendMessageToApp({ type: "cameraMode", cameraMode: newCameraMode });
    }

    /** @type {boolean} */
    #checkCameraModeOnLoad = false;
    get checkCameraModeOnLoad() {
        return this.#checkCameraModeOnLoad;
    }
    set checkCameraModeOnLoad(newValue) {
        _console$2.assertTypeWithError(newValue, "boolean");
        this.#checkCameraModeOnLoad = newValue;
    }

    /** @param {ARSCameraMode} newCameraMode */
    #onCameraModeUpdated(newCameraMode) {
        if (this.#cameraMode == newCameraMode) {
            return;
        }

        this.#cameraMode = newCameraMode;
        _console$2.log(`updated cameraMode to ${this.cameraMode}`);
        this.#dispatchEvent({ type: "cameraMode", message: { cameraMode: this.cameraMode } });
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
        _console$2.log(`updated showCamera to ${this.showCamera}`);
        this.#dispatchEvent({ type: "showCamera", message: { showCamera: this.showCamera } });
    }

    /** @type {boolean} */
    #checkShowCameraOnLoad = false;
    get checkShowCameraOnLoad() {
        return this.#checkShowCameraOnLoad;
    }
    set checkShowCameraOnLoad(newValue) {
        _console$2.assertTypeWithError(newValue, "boolean");
        this.#checkShowCameraOnLoad = newValue;
    }

    /** @param {boolean} newShowCamera */
    async setShowCamera(newShowCamera) {
        this.#assertIsSupported();
        if (newShowCamera == this.#showCamera) {
            _console$2.log(`showCamera is already set to "${this.#showCamera}"`);
            return;
        }

        _console$2.log("setting showCamera...", newShowCamera);
        return this.#sendMessageToApp({ type: "showCamera", showCamera: newShowCamera });
    }

    /** @type {ARSMessageConfiguration} */
    #messageConfiguration = {
        faceAnchorBlendshapes: false,
        faceAnchorGeometry: false,
        faceAnchorEyes: false,
    };
    get messageConfiguration() {
        return this.#messageConfiguration;
    }
    /** @param {ARSMessageConfiguration} newMessageConfiguration */
    async setMessageConfiguration(newMessageConfiguration) {
        this.#assertIsSupported();
        _console$2.log("setting messageConfiguration...", newMessageConfiguration);
        return this.#sendMessageToApp({ type: "messageConfiguration", messageConfiguration: newMessageConfiguration });
    }
    /** @param {ARSMessageConfiguration} newMessageConfiguration */
    #onMessageConfigurationUpdated(newMessageConfiguration) {
        this.#messageConfiguration = newMessageConfiguration;
        _console$2.log("updated messageConfiguration", this.messageConfiguration);
        this.#dispatchEvent({
            type: "messageConfiguration",
            message: { messageConfiguration: this.messageConfiguration },
        });
    }

    /**
     * @param {ARSAppMessage} message
     */
    #onAppMessage(message) {
        _console$2.log(`received background message of type ${message.type}`, message);
        const { type } = message;
        switch (type) {
            case "faceTrackingSupport":
                _console$2.log("received faceTrackingSupport message", message);
                this.#onFaceTrackingSupportUpdated(message.faceTrackingSupport);
                break;
            case "worldTrackingSupport":
                _console$2.log("received worldTrackingSupport message", message);
                this.#onWorldTrackingSupportUpdated(message.worldTrackingSupport);
                break;
            case "bodyTrackingSupport":
                _console$2.log("received bodyTrackingSupport message", message);
                this.#onBodyTrackingSupportUpdated(message.bodyTrackingSupport);
                break;
            case "isRunning":
                _console$2.log("received isRunning message", message);
                this.#onIsRunningUpdated(message.isRunning);
                break;
            case "configuration":
                _console$2.log("received configuration message", message);
                this.#onConfigurationUpdated(message.configuration);
                break;
            case "debugOptions":
                _console$2.log("received debugOptions message", message);
                this.#onDebugOptionsUpdated(message.debugOptions);
                break;
            case "cameraMode":
                _console$2.log("received cameraMode message", message);
                this.#onCameraModeUpdated(message.cameraMode);
                break;
            case "frame":
                _console$2.log("received frame message", message);
                this.#onFrame(message.frame);
                break;
            case "showCamera":
                _console$2.log("received showCamera message", message);
                this.#onShowCameraUpdated(message.showCamera);
                break;
            case "messageConfiguration":
                _console$2.log("received messageConfiguration message", message);
                this.#onMessageConfigurationUpdated(message.messageConfiguration);
                break;
            default:
                throw Error(`uncaught message type ${type}`);
        }
    }
}

var ARSessionManager$1 = ARSessionManager.shared;

const _console$1 = createConsole("Timer", { log: false });

class Timer {
    /**
     * @param {Function} callback
     * @param {number} interval
     * @param {boolean?} runImmediately
     */
    constructor(callback, interval, runImmediately = false) {
        _console$1.log("creating timer", { callback, interval, runImmediately });

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
        _console$1.assertTypeWithError(newInterval, "number");
        if (newInterval == this.#interval) {
            _console$1.warn("same interval value", newInterval);
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
        _console$1.assertWithError(!this.isRunning, "timer already running");
        this.#intervalId = window.setInterval(this.#callback, this.#interval);
    }
    stop() {
        if (!this.isRunning) {
            _console$1.assert("timer is already not running");
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

const _console = createConsole("CBCentral", { log: false });

/** @typedef {"state" | "startScan" | "stopScan" | "isScanning" | "discoveredPeripherals" | "discoveredPeripheral" | "connect" | "disconnect" | "disconnectAll" | "peripheralConnectionState" | "connectedPeripherals" | "disconnectedPeripherals" | "getRSSI" | "readRSSI" | "discoverServices" | "getServices" | "getService" | "discoverIncludedServices" | "getIncludedServices" | "discoverCharacteristics" | "getCharacteristics" | "readCharacteristicValue" | "writeCharacteristicValue" | "getCharacteristicValue" | "setCharacteristicNotifyValue" | "getCharacteristicNotifyValue" | "updatedCharacteristicValues" | "discoverDescriptors" | "getDescriptors" | "readDescriptorValue" | "writeDescriptorValue" | "getDescriptorValue" } CBCentralMessageType */

/** @typedef {"state" | "isAvailable" | "isScanning" | "discoveredPeripheral" | "peripheralConnectionState" | "expiredDiscoveredPeripheral" | "peripheralRSSI" | "discoveredService" | "discoveredServices" | "discoveredIncludedService" | "discoveredIncludedServices" | "discoveredCharacteristic" | "discoveredCharacteristics" | "characteristicValue" | "characteristicNotifyValue" | "discoveredDescriptor" | "discoveredDescriptors" | "descriptorValue"} CBCentralEventType */

/** @typedef {import("./utils/EventDispatcher.js").EventDispatcherOptions} EventDispatcherOptions */

/** @typedef {import("./utils/messaging.js").NKMessage} NKMessage */

/**
 * @typedef CBCentralMessage
 * @type {object}
 * @property {CBCentralMessageType} type
 * @property {object} message
 */

/**
 * @typedef CBCentralAppMessage
 * @type {object}
 * @property {CBCentralMessageType} type
 */

/**
 * @typedef CBCentralEvent
 * @type {object}
 * @property {CBCentralEventType} type
 * @property {object} message
 */

/**
 * @typedef {(event: CBCentralEvent) => void} CBCentralEventListener
 */

/** @typedef {"unknown" | "resetting" | "unsupported" | "unauthorized" | "poweredOff" | "poweredOn"} CBCentralState */

/**
 * @typedef CBScanOptions
 * @type {object}
 * @property {string[]} serviceUUIDs
 * @property {object} options
 * @property {bool} options.allowDuplicates
 * @property {string[]} options.solicitedServiceUUIDs
 */

/**
 * @typedef CBDiscoveredPeripheral
 * @type {object}
 * @property {string?} name
 * @property {string} identifier
 * @property {number} rssi
 * @property {object} advertisementData
 * @property {number} advertisementData.timestamp
 * @property {object.<string, number[]>} advertisementData.serviceData
 * @property {number?} lastTimeUpdated
 */

/**
 * @typedef CBConnectOptions
 * @type {object}
 * @property {string} identifier
 * @property {object} options
 * @property {bool} options.enableAutoReconnect
 * @property {bool} options.enableTransportBridging not available on mac
 * @property {bool} options.notifyOnDisconnection
 * @property {bool} options.notifyOnNotification
 * @property {bool} options.requiresANCS not available on mac
 * @property {number} options.startDelay
 */

/** @typedef {"disconnected" | "connecting" | "connected" | "disconnecting" | "unknown"} CBConnectionState */
/**
 * @typedef CBPeripheralConnectionState
 * @type {object}
 * @property {string} identifier
 * @property {CBConnectionState} connectionState
 */

/**
 * @typedef CBPeripheral
 * @type {object}
 * @property {string} identifier
 * @property {string?} name
 * @property {CBConnectionState?} connectionState
 * @property {number?} rssi
 * @property {number?} rssiTimestamp
 * @property {boolean} _pendingRSSI
 * @property {Object.<string, CBService>?} services
 * @property {number?} _getServicesTimestamp
 * @property {string[]?} _pendingServices
 * @property {string[]?} _pendingIncludedServices
 * @property {number?} _characteristicValueTimestamp
 */

/**
 * @typedef CBPeripheralRSSI
 * @type {object}
 * @property {string} identifier
 * @property {number} rssi
 * @property {rssi} timestamp
 */

/**
 * @typedef CBService
 * @type {object}
 * @property {string} uuid
 * @property {Object.<string, CBCharacteristic>} characteristics
 * @property {string[]} includedServiceUUIDs
 * @property {string[]?} _pendingCharacteristics
 */

/**
 * @typedef CBCharacteristic
 * @type {object}
 * @property {string} uuid
 * @property {CBCharacteristicProperties} properties
 * @property {Object.<string, CBDescriptor>} descriptors
 * @property {boolean} isNotifying
 * @property {number[]?} value
 * @property {number?} valueTimestamp
 * @property {string[]} _pendingDescriptors
 * @property {boolean} _pendingValue
 * @property {boolean} _pendingIsNotifying
 */

/**
 * @typedef CBCharacteristicProperties
 * @type {object}
 * @property {boolean} read
 * @property {boolean} write
 * @property {boolean} notify
 * @property {boolean} indicate
 */

/**
 * @typedef CBUpdatedCharacteristicValue
 * @type {object}
 * @property {string} identifier
 * @property {string} serviceUUID
 * @property {string} characteristicUUID
 * @property {number[]} value
 * @property {number} timestamp
 */

/**
 * @typedef CBDescriptor
 * @type {object}
 * @property {string} uuid
 * @property {CBDescriptorValue} value
 */

/**
 * @typedef CBDescriptorValue
 * @type {object}
 * @property {string} type
 * @property {any} value
 */

class CBCentralManager {
    /** @type {CBCentralEventType[]} */
    static #EventsTypes = [
        "state",
        "isAvailable",
        "isScanning",
        "discoveredPeripheral",
        "expiredDiscoveredPeripheral",
        "peripheralConnectionState",
        "peripheralRSSI",
        "discoveredService",
        "discoveredServices",
        "discoveredCharacteristics",
        "discoveredCharacteristic",
        "characteristicNotifyValue",
        "characteristicValue",
    ];
    /** @type {CBCentralEventType[]} */
    get eventTypes() {
        return CBCentralManager.#EventsTypes;
    }
    #eventDispatcher = new EventDispatcher(this.eventTypes);

    /**
     * @param {CBCentralEventType} type
     * @param {CBCentralEventListener} listener
     * @param {EventDispatcherOptions?} options
     */
    addEventListener(type, listener, options) {
        return this.#eventDispatcher.addEventListener(...arguments);
    }
    /**
     * @param {CBCentralEventType} type
     * @param {CBCentralEventListener} listener
     * @returns {boolean}
     */
    removeEventListener(type, listener) {
        return this.#eventDispatcher.removeEventListener(...arguments);
    }
    /**
     * @param {CBCentralEventType} type
     * @param {CBCentralEventListener} listener
     * @returns {boolean}
     */
    hasEventListener(type, listener) {
        return this.#eventDispatcher.hasEventListener(...arguments);
    }
    /** @param {CBCentralEvent} event */
    #dispatchEvent(event) {
        return this.#eventDispatcher.dispatchEvent(event);
    }

    static #shared = new CBCentralManager();
    static get shared() {
        return this.#shared;
    }
    #prefix = "cbc";
    /**
     * @param {CBCentralMessage[]} messages
     * @returns {NKMessage[]}
     */
    #formatMessages(messages) {
        return messages.map((message) => Object.assign({}, message, { type: `${this.#prefix}-${message.type}` }));
    }

    /** @throws {Error} if singleton already exists */
    constructor() {
        _console.assertWithError(!this.shared, "CBCentralManager is a singleton - use CBCentralManager.shared");

        addAppListener(this.#getWindowLoadMessages.bind(this), "window.load");
        addAppListener(this.#onAppMessage.bind(this), this.#prefix);
        addAppListener(this.#getWindowUnloadMessages.bind(this), "window.unload");
    }

    get isSupported() {
        return true;
    }
    /** @throws {Error} if not supported */
    #assertIsSupported() {
        if (!this.isSupported) {
            throw Error("not supported");
        }
    }

    /** @returns {NKMessage[]?} */
    #getWindowLoadMessages() {
        /** @type {CBCentralMessage[]} */
        const messages = [];
        if (this.checkStateOnLoad) {
            messages.push({ type: "state" });
        }
        if (this.checkConnectedPeripheralsOnLoad) {
            messages.push({ type: "connectedPeripherals", serviceUUIDs: [] });
        }
        return this.#formatMessages(messages);
    }
    /** @returns {NKMessage[]?} */
    #getWindowUnloadMessages() {
        /** @type {CBCentralMessage[]} */
        const messages = [];
        if (this.#isScanning && this.#stopScanOnUnload) {
            messages.push({ type: "stopScan" });
        }
        if (this.#disconnectOnUnload && this.#peripherals.length > 0) {
            messages.push({ type: "disconnectAll" });
        }
        return this.#formatMessages(messages);
    }

    /** @param {CBCentralAppMessage} message */
    async #sendMessageToApp(message) {
        message.type = `${this.#prefix}-${message.type}`;
        return sendMessageToApp(message);
    }

    /** @type {boolean} */
    #checkStateOnLoad = false;
    get checkStateOnLoad() {
        return this.#checkStateOnLoad;
    }
    set checkStateOnLoad(newValue) {
        _console.assertTypeWithError(newValue, "boolean");
        this.#checkStateOnLoad = newValue;
    }

    /** @type {boolean} */
    #stopScanOnUnload = true;
    get stopScanOnUnload() {
        return this.#stopScanOnUnload;
    }
    set stopScanOnUnload(newValue) {
        _console.assertTypeWithError(newValue, "boolean");
        this.#stopScanOnUnload = newValue;
    }

    /** @type {boolean} */
    #disconnectOnUnload = true;
    get disconnectOnUnload() {
        return this.#disconnectOnUnload;
    }
    set disconnectOnUnload(newValue) {
        _console.assertTypeWithError(newValue, "boolean");
        this.#disconnectOnUnload = newValue;
    }

    /** @type {CBCentralState?} */
    #state = null;
    get state() {
        return this.#state || "unknown";
    }
    /** @param {CBCentralState} newState */
    #onState(newState) {
        if (this.#state == newState) {
            return;
        }

        this.#state = newState;
        _console.log("updated state", this.state);
        this.#dispatchEvent({ type: "state", message: { state: this.state } });
        this.#dispatchEvent({ type: "isAvailable", message: { isAvailable: this.isAvailable } });

        if (this.state == "poweredOn") {
            this.#checkIsScanning();
        }
        if (this.#state == "unknown") {
            this.#checkStatePoll.start();
        } else {
            this.#checkStatePoll.stop();
        }
    }
    #checkStatePoll = new AppMessagePoll({ type: "state" }, this.#prefix, 500);

    get isAvailable() {
        return this.state == "poweredOn";
    }
    /** @throws {Error} if not supported */
    #assertIsAvailable() {
        this.#assertIsSupported();
        _console.assertWithError(this.isAvailable, "not available");
    }

    /** @type {boolean?} */
    #isScanning = null;
    get isScanning() {
        return Boolean(this.#isScanning);
    }
    /** @param {boolean} newIsScanning */
    #onIsScanning(newIsScanning) {
        if (this.#isScanning == newIsScanning) {
            return;
        }

        this.#isScanning = newIsScanning;
        _console.log(`updated isScanning to ${this.#isScanning}`);
        this.#dispatchEvent({
            type: "isScanning",
            message: { isScanning: this.isScanning },
        });

        this.#isScanningPoll.stop();

        if (this.isScanning) {
            this.#discoveredPeripheralsPoll.start();
            this.#scanTimer.start();
        } else {
            this.#discoveredPeripheralsPoll.stop();
            this.#scanTimer.stop();
        }
    }
    async #checkIsScanning() {
        _console.log("checking isScanning");
        return this.#sendMessageToApp({ type: "isScanning" });
    }
    #isScanningPoll = new AppMessagePoll({ type: "isScanning" }, this.#prefix, 50);

    #checkDiscoveredPeripherals() {
        const now = Date.now();

        Object.entries(this.#discoveredPeripherals).forEach(([identifier, discoveredPeripheral]) => {
            const hasExpired = now - discoveredPeripheral.lastTimeUpdated > 4000;
            if (hasExpired) {
                delete this.#discoveredPeripherals[identifier];
                this.#dispatchEvent({
                    type: "expiredDiscoveredPeripheral",
                    message: { expiredDiscoveredPeripheral: discoveredPeripheral },
                });
            }
        });
    }
    #scanTimer = new Timer(this.#checkDiscoveredPeripherals.bind(this), 1000);

    /** @param {CBScanOptions?} scanOptions */
    async startScan(scanOptions) {
        this.#assertIsAvailable();
        _console.assertWithError(!this.isScanning, "already scanning");
        _console.log("starting scan", scanOptions);
        this.#discoveredPeripherals.length = 0;
        this.#isScanningPoll.start();
        return this.#sendMessageToApp({ type: "startScan", scanOptions });
    }
    async stopScan() {
        this.#assertIsAvailable();
        _console.assertWithError(this.isScanning, "already not scanning");
        _console.log("stopping scan");
        this.#isScanningPoll.start();
        return this.#sendMessageToApp({ type: "stopScan" });
    }

    async toggleScan() {
        this.#assertIsAvailable();
        if (this.isScanning) {
            return this.stopScan();
        } else {
            return this.startScan();
        }
    }

    /** @type {Object.<string, CBDiscoveredPeripheral>} */
    #discoveredPeripherals = {};
    get discoveredPeripherals() {
        return this.#discoveredPeripherals;
    }
    /** @param {string} identifier */
    #assertValidDiscoveredPeripheralIdentifier(identifier) {
        _console.assertWithError(
            identifier in this.#discoveredPeripherals,
            `no discovered peripheral with identifier "${identifier}" found`
        );
    }
    /** @param {CBDiscoveredPeripheral[]} newDiscoveredPeripherals */
    #onDiscoveredPeripherals(newDiscoveredPeripherals) {
        newDiscoveredPeripherals.forEach((discoveredPeripheral) => {
            this.#onDiscoveredPeripheral(discoveredPeripheral);
        });
    }
    /** @param {CBDiscoveredPeripheral} newDiscoveredPeripheral */
    #onDiscoveredPeripheral(newDiscoveredPeripheral) {
        var discoveredPeripheral = this.#discoveredPeripherals[newDiscoveredPeripheral.identifier];
        if (discoveredPeripheral) {
            Object.assign(discoveredPeripheral, newDiscoveredPeripheral);
        } else {
            this.#discoveredPeripherals[newDiscoveredPeripheral.identifier] = newDiscoveredPeripheral;
            discoveredPeripheral = newDiscoveredPeripheral;
        }
        discoveredPeripheral.lastTimeUpdated = Date.now();
        this.#dispatchEvent({ type: "discoveredPeripheral", message: { discoveredPeripheral } });
    }
    #discoveredPeripheralsPoll = new AppMessagePoll({ type: "discoveredPeripherals" }, this.#prefix, 200);

    /** @type {Object.<string, CBPeripheral>} */
    #peripherals = {};
    get peripherals() {
        return this.#peripherals;
    }
    /**
     * @param {string} identifier
     * @returns {CBPeripheral}
     */
    #assertValidPeripheralIdentifier(identifier) {
        const peripheral = this.#peripherals[identifier];
        _console.assertWithError(peripheral, `no peripheral with identifier "${identifier}" found`);
        return peripheral;
    }
    /**
     * @param {string} identifier
     * @returns {CBPeripheral}
     */
    #assertConnectedPeripheralIdentifier(identifier) {
        const peripheral = this.#assertValidPeripheralIdentifier(identifier);
        _console.assertWithError(peripheral.connectionState == "connected", "peripheral is not connected");
        return peripheral;
    }

    /**
     * @param {string} identifier
     * @param {string} serviceUUID
     * @returns {{peripheral: CBPeripheral, service: CBService}}
     */
    #assertValidServiceUUID(identifier, serviceUUID) {
        const peripheral = this.#assertValidPeripheralIdentifier(identifier);
        const service = peripheral.services[serviceUUID];
        _console.assert(service, `serviceUUID ${serviceUUID} not found`);
        return { peripheral, service };
    }

    /**
     * @param {string} identifier
     * @param {string} serviceUUID
     * @param {string} characteristicUUID
     * @returns {{peripheral: CBPeripheral, service: CBService, characteristic: CBCharacteristic}}
     */
    #assertValidCharacteristicUUID(identifier, serviceUUID, characteristicUUID) {
        const { peripheral, service } = this.#assertValidServiceUUID(identifier, serviceUUID);
        const characteristic = service.characteristics[characteristicUUID];
        _console.assert(characteristic, `characteristicUUID ${serviceUUID} not found`);
        return { peripheral, service, characteristic };
    }

    /**
     * @param {string} identifier
     * @param {string} serviceUUID
     * @param {string} characteristicUUID
     * @param {string} descriptorUUID
     * @returns {{peripheral: CBPeripheral, service: CBService, characteristic: CBCharacteristic, descriptor: CBDescriptor}}
     */
    #assertValidDescriptorUUID(identifier, serviceUUID, characteristicUUID, descriptorUUID) {
        const { peripheral, service, characteristic } = this.#assertValidCharacteristicUUID(
            identifier,
            serviceUUID,
            characteristicUUID
        );
        const descriptor = characteristic.descriptors[descriptorUUID];
        _console.assert(descriptor, `descriptorUUID ${descriptorUUID} not found`);
        return { peripheral, service, characteristic, descriptor };
    }

    /** @param {CBConnectOptions} connectOptions */
    async connect(connectOptions) {
        this.#assertIsAvailable();
        var peripheral = this.#peripherals[connectOptions.identifier];
        if (!peripheral) {
            const discoveredPeripheral = this.#discoveredPeripherals[connectOptions.identifier];
            this.#assertValidDiscoveredPeripheralIdentifier(connectOptions.identifier);
            peripheral = {
                identifier: connectOptions.identifier,
                name: discoveredPeripheral.name,
            };
            this.#peripherals[peripheral.identifier] = peripheral;
        } else {
            _console.assertWithError(
                peripheral.connectionState != "connected" && !peripheral.connectionState?.endsWith("ing"),
                `peripheral is in connectionState "${peripheral.connectionState}"`
            );
        }

        _console.log("connecting to peripheral", connectOptions);
        peripheral.connectionState = null;
        this.#checkPeripheralConnectionsPoll.start();
        if (isInApp) {
            this.#onPeripheralConnectionState({ identifier: connectOptions.identifier, connectionState: "connecting" });
        }
        return this.#sendMessageToApp({ type: "connect", connectOptions });
    }
    /** @param {string} identifier */
    async disconnect(identifier) {
        const peripheral = this.#assertValidPeripheralIdentifier(identifier);
        _console.assertWithError(
            !peripheral.connectionState.includes("disconnect"),
            "peripheral is already disconnected or disconnecting"
        );
        peripheral.connectionState = null;
        this.#checkPeripheralConnectionsPoll.start();
        _console.log("disconnecting from peripheral...", peripheral);
        if (isInApp) {
            this.#onPeripheralConnectionState({ identifier, connectionState: "disconnecting" });
        }
        return this.#sendMessageToApp({ type: "disconnect", identifier });
    }

    /** @returns {CBCentralAppMessage[]} */
    #checkPeripheralConnectionsMessage() {
        const peripheralsWithPendingConnections = Object.values(this.#peripherals).filter(
            (peripheral) => !peripheral.connectionState || peripheral.connectionState?.endsWith("ing")
        );
        if (peripheralsWithPendingConnections.length > 0) {
            return peripheralsWithPendingConnections.map((peripheral) => {
                return { type: "peripheralConnectionState", identifier: peripheral.identifier };
            });
        } else {
            this.#checkPeripheralConnectionsPoll.stop();
            return [];
        }
    }
    #checkPeripheralConnectionsPoll = new AppMessagePoll(
        this.#checkPeripheralConnectionsMessage.bind(this),
        this.#prefix,
        200
    );

    /** @type {boolean} */
    #checkConnectedPeripheralsOnLoad = false;
    get checkConnectedPeripheralsOnLoad() {
        return this.#checkConnectedPeripheralsOnLoad;
    }
    set checkConnectedPeripheralsOnLoad(newValue) {
        _console.assertTypeWithError(newValue, "boolean");
        this.#checkConnectedPeripheralsOnLoad = newValue;
    }

    /** @param {string[]} serviceUUIDs */
    checkConnectedPeripherals(serviceUUIDs) {
        _console.log("checkConnectedPeripherals", { serviceUUIDs });
        this.#sendMessageToApp({ type: "connectedPeripherals", serviceUUIDs });
    }

    /** @param {CBPeripheral[]} connectedPeripherals */
    #onConnectedPeripherals(connectedPeripherals) {
        connectedPeripherals.forEach((connectedPeripheral) => {
            this.#peripherals[connectedPeripheral.identifier] = connectedPeripheral;
            this.#onPeripheralConnectionState(
                {
                    identifier: connectedPeripheral.identifier,
                    connectionState: connectedPeripheral.connectionState,
                },
                true
            );
            if (Object.values(connectedPeripheral.services).length > 0) {
                this.#onGetServices(
                    {
                        identifier: connectedPeripheral.identifier,
                        services: connectedPeripheral.services,
                    },
                    true
                );
            }
        });
    }

    /**
     * @param {CBPeripheralConnectionState} peripheralConnectionState
     * @param {boolean} override
     */
    #onPeripheralConnectionState(peripheralConnectionState, override = false) {
        const peripheral = this.#assertValidPeripheralIdentifier(peripheralConnectionState.identifier);
        if (peripheral.connectionState == peripheralConnectionState.connectionState && !override) {
            return;
        }
        peripheral.connectionState = peripheralConnectionState.connectionState;
        this.#dispatchEvent({ type: "peripheralConnectionState", message: { peripheral } });

        if (this.#hasAtLeastOneConnectedConnectedPeripheral) {
            this.#checkDisconnectionsPoll.start();
        } else {
            this.#checkDisconnectionsPoll.stop();
        }
    }

    get #hasAtLeastOneConnectedConnectedPeripheral() {
        return Object.values(this.peripherals).some((peripheral) => peripheral.connectionState == "connected");
    }

    #checkDisconnectionsPoll = new AppMessagePoll({ type: "disconnectedPeripherals" }, this.#prefix, 2000);
    /** @param {string[]} disconnectedPeripheralIdentifiers */
    #onDisconnectedPeripherals(disconnectedPeripheralIdentifiers) {
        disconnectedPeripheralIdentifiers.forEach((disconnectedPeripheralIdentifier) => {
            this.#onPeripheralConnectionState({
                identifier: disconnectedPeripheralIdentifier,
                connectionState: "disconnected",
            });
        });
    }

    /** @param {...string} identifiers  */
    async readPeripheralRSSIs(...identifiers) {
        identifiers.forEach((identifier) => {
            const peripheral = this.#assertValidPeripheralIdentifier(identifier);
            peripheral._pendingRSSI = true;
        });
        if (identifiers.length > 0) {
            this.#checkPeripheralRSSIsPoll.start();
            this.#sendMessageToApp({ type: "readRSSI", identifiers });
        }
    }
    /** @param {string} identifier  */
    async readPeripheralRSSI(identifier) {
        return this.readPeripheralRSSIs(identifier);
    }

    #checkPeripheralRSSIsPoll = new AppMessagePoll(this.#checkPeripheralRSSIsMessage.bind(this), this.#prefix, 200);

    /** @returns {CBCentralAppMessage[]} */
    #checkPeripheralRSSIsMessage() {
        const peripheralsWithPendingRSSIs = Object.values(this.#peripherals).filter(
            (peripheral) => peripheral._pendingRSSI
        );
        if (peripheralsWithPendingRSSIs.length > 0) {
            return {
                type: "getRSSI",
                peripherals: peripheralsWithPendingRSSIs.map((peripheral) => ({
                    identifier: peripheral.identifier,
                    timestamp: peripheral.rssiTimestamp,
                })),
            };
        } else {
            this.#checkPeripheralRSSIsPoll.stop();
            return [];
        }
    }

    /** @param {CBPeripheralRSSI[]} peripheralRSSIs */
    #onPeripheralRSSIs(peripheralRSSIs) {
        peripheralRSSIs.forEach((peripheralRSSI) => {
            const peripheral = this.#peripherals[peripheralRSSI.identifier];
            if (peripheral) {
                peripheral.rssi = peripheralRSSI.rssi;
                peripheral.rssiTimestamp = peripheralRSSI.timestamp;
                peripheral._pendingRSSI = false;
                this.#dispatchEvent({ type: "peripheralRSSI", message: { peripheral } });
                if (this.#hasAtLeastOnePendingRSSIPeripheral) {
                    this.#checkPeripheralRSSIsPoll.stop();
                }
            } else {
                _console.error("no peripheral found for peripheralRSSI", peripheralRSSI);
            }
        });
    }

    get #hasAtLeastOnePendingRSSIPeripheral() {
        return Object.values(this.peripherals).some((peripheral) => peripheral._pendingRSSI);
    }

    /**
     * @param {string} identifier
     * @param {string[]?} serviceUUIDs
     */
    async discoverServices(identifier, serviceUUIDs) {
        const peripheral = this.#assertConnectedPeripheralIdentifier(identifier);
        if (serviceUUIDs) {
            serviceUUIDs = serviceUUIDs.filter((serviceUUID) => {
                if (peripheral.services?.[serviceUUID]) {
                    _console.error("already have service", { peripheral, serviceUUID });
                    return false;
                }
                if (peripheral._pendingServices?.[serviceUUID]) {
                    return false;
                }
                if (peripheral._pendingIncludedServices?.[serviceUUID]) {
                    return false;
                }
                return true;
            });
        }
        _console.log("discovering services", { identifier, serviceUUIDs });

        if (!peripheral._pendingServices) {
            peripheral._pendingServices = [];
        }
        if (serviceUUIDs?.length > 0) {
            peripheral._pendingServices.push(...serviceUUIDs);
        }
        if (!serviceUUIDs || serviceUUIDs.length > 0) {
            this.#getServicesPoll.start();
            return this.#sendMessageToApp({ type: "discoverServices", identifier, serviceUUIDs });
        }
    }
    /**
     * @param {string} identifier
     * @param {string} serviceUUID
     */
    async discoverService(identifier, serviceUUID) {
        return this.discoverServices(identifier, [serviceUUID]);
    }

    #getServicesPoll = new AppMessagePoll(this.#getServicesMessage.bind(this), this.#prefix, 100);
    /** @returns {CBCentralAppMessage[]} */
    #getServicesMessage() {
        /** @type {CBCentralAppMessage[]} */
        const messages = [];
        Object.values(this.#peripherals)
            .filter((peripheral) => peripheral.connectionState == "connected" && peripheral._pendingServices)
            .forEach((peripheral) => {
                const message = {
                    type: "getServices",
                    identifier: peripheral.identifier,
                    serviceUUIDs: peripheral._pendingServices,
                };
                if (peripheral._pendingServices.length == 0) {
                    message.serviceUUIDs = null;
                }
                messages.push(message);
            });

        if (messages.length == 0) {
            this.#getServicesPoll.stop();
        }

        return messages;
    }

    /**
     * @param {string} identifier
     * @param {string} serviceUUID
     * @param {string[]?} includedServiceUUIDs
     */
    async discoverIncludedServices(identifier, serviceUUID, includedServiceUUIDs) {
        const peripheral = this.#assertConnectedPeripheralIdentifier(identifier);
        this.#assertValidServiceUUID(identifier, serviceUUID);
        if (includedServiceUUIDs) {
            includedServiceUUIDs = includedServiceUUIDs.filter((includedServiceUUID) => {
                if (peripheral.services[includedServiceUUID]) {
                    _console.error("already have includedService", { peripheral, includedServiceUUID });
                    return false;
                }
                if (peripheral._pendingServices?.[serviceUUID]) {
                    return false;
                }
                if (peripheral._pendingIncludedServices?.[serviceUUID]) {
                    return false;
                }
                return true;
            });
        }
        _console.log("discovering includedServices", { identifier, serviceUUID, includedServiceUUIDs });

        if (!peripheral._pendingServices) {
            peripheral._pendingServices = [];
        }
        if (includedServiceUUIDs?.length > 0) {
            peripheral._pendingIncludedServices.push(...includedServiceUUIDs);
        }
        if (!includedServiceUUIDs || includedServiceUUIDs.length > 0) {
            this.#getIncludedServicesPoll.start();
            return this.#sendMessageToApp({
                type: "discoverIncludedServices",
                identifier,
                serviceUUID,
                includedServiceUUIDs,
            });
        }
    }
    /**
     * @param {string} identifier
     * @param {string} serviceUUID
     * @param {string} includedServiceUUID
     * @returns
     */
    async discoverIncludedService(identifier, serviceUUID, includedServiceUUID) {
        return this.discoverIncludedServices(identifier, serviceUUID, [includedServiceUUID]);
    }

    #getIncludedServicesPoll = new AppMessagePoll(this.#getIncludedServicesMessage.bind(this), this.#prefix, 500);
    /** @returns {CBCentralAppMessage[]} */
    #getIncludedServicesMessage() {
        // FILL - later
    }

    /**
     * @param {string} identifier
     * @param {string} serviceUUID
     * @param {string[]?} characteristicUUIDs
     */
    async discoverCharacteristics(identifier, serviceUUID, characteristicUUIDs) {
        const { service } = this.#assertValidServiceUUID(identifier, serviceUUID);
        if (characteristicUUIDs) {
            characteristicUUIDs = characteristicUUIDs.filter((characteristicUUID) => {
                if (service.characteristics[characteristicUUID]) {
                    _console.error("already have characteristic", { peripheral, characteristicUUID });
                    return false;
                }
                return true;
            });
        }
        _console.log("discovering characteristics", { identifier, serviceUUID, characteristicUUIDs });

        if (!service._pendingCharacteristics) {
            service._pendingCharacteristics = [];
        }
        if (characteristicUUIDs?.length > 0) {
            service._pendingCharacteristics.push(...characteristicUUIDs);
        }
        if (!characteristicUUIDs || characteristicUUIDs.length > 0) {
            this.#getCharacteristicsPoll.start();
            return this.#sendMessageToApp({
                type: "discoverCharacteristics",
                identifier,
                serviceUUID,
                characteristicUUIDs,
            });
        }
    }

    /**
     * @param {string} identifier
     * @param {string} serviceUUID
     * @param {string} characteristicUUID
     */
    async discoverCharacteristic(identifier, serviceUUID, characteristicUUID) {
        return this.discoverCharacteristics(identifier, serviceUUID, [characteristicUUID]);
    }

    #getCharacteristicsPoll = new AppMessagePoll(this.#getCharacteristicsMessage.bind(this), this.#prefix, 500);
    /** @returns {CBCentralAppMessage[]} */
    #getCharacteristicsMessage() {
        /** @type {CBCentralAppMessage[]} */
        const messages = [];

        Object.values(this.#peripherals)
            .filter((peripheral) => peripheral.connectionState == "connected")
            .forEach((peripheral) => {
                Object.values(peripheral.services)
                    .filter((service) => service._pendingCharacteristics)
                    .forEach((service) => {
                        const message = {
                            type: "getCharacteristics",
                            identifier: peripheral.identifier,
                            serviceUUID: service.uuid,
                            characteristicUUIDs: service._pendingCharacteristics,
                        };
                        if (service._pendingCharacteristics.length == 0) {
                            delete message.characteristicUUIDs;
                        }
                        messages.push(message);
                    });
            });

        if (messages.length == 0) {
            this.#getCharacteristicsPoll.stop();
        }

        return messages;
    }

    /**
     * @param {string} identifier
     * @param {string} serviceUUID
     * @param {string} characteristicUUID
     */
    async readCharacteristicValue(identifier, serviceUUID, characteristicUUID) {
        const { characteristic } = this.#assertValidCharacteristicUUID(identifier, serviceUUID, characteristicUUID);
        _console.log("reading characteristic value", { identifier, serviceUUID, characteristicUUID });
        characteristic._pendingValue = true;
        this.#getCharacteristicValuesPoll.start();
        return this.#sendMessageToApp({
            type: "readCharacteristicValue",
            identifier,
            serviceUUID,
            characteristicUUID,
        });
    }
    /**
     * @param {string} identifier
     * @param {string} serviceUUID
     * @param {string} characteristicUUID
     * @param {number[]} data
     */
    async writeCharacteristicValue(identifier, serviceUUID, characteristicUUID, data) {
        const peripheral = this.#assertConnectedPeripheralIdentifier(identifier);
        const { service, characteristic } = this.#assertValidCharacteristicUUID(
            identifier,
            serviceUUID,
            characteristicUUID
        );
        _console.log("reading characteristic data", { peripheral, service, characteristic, data });
        if (characteristic.properties.read) {
            characteristic._pendingValue = true;
            this.#getCharacteristicValuesPoll.start();
        }
        return this.#sendMessageToApp({
            type: "writeCharacteristicValue",
            identifier,
            serviceUUID,
            characteristicUUID,
            data,
        });
    }

    #getCharacteristicValuesPoll = new AppMessagePoll(
        this.#getCharacteristicValuesMessage.bind(this),
        this.#prefix,
        20
    );
    /** @returns {CBCentralAppMessage[]} */
    #getCharacteristicValuesMessage() {
        /** @type {CBCentralAppMessage[]} */
        const messages = [];
        Object.values(this.#peripherals).forEach((peripheral) => {
            if (peripheral.connectionState != "connected") {
                return;
            }
            var shouldRequestUpdatedValues = false;
            Object.values(peripheral.services).some((service) => {
                Object.values(service.characteristics).some((characteristic) => {
                    if (characteristic._pendingValue || characteristic.isNotifying) {
                        shouldRequestUpdatedValues = true;
                    }
                    return shouldRequestUpdatedValues;
                });
                return shouldRequestUpdatedValues;
            });

            if (shouldRequestUpdatedValues) {
                messages.push({
                    type: "updatedCharacteristicValues",
                    identifier: peripheral.identifier,
                    timestamp: peripheral._characteristicValueTimestamp || 0,
                });
            }
        });

        if (messages.length > 0) {
            return messages;
        } else {
            this.#getCharacteristicValuesPoll.stop();
        }
    }

    /**
     * @param {string} identifier
     * @param {string} serviceUUID
     * @param {string} characteristicUUID
     * @param {boolean} notifyValue
     */
    async setCharacteristicNotifyValue(identifier, serviceUUID, characteristicUUID, notifyValue) {
        this.#assertConnectedPeripheralIdentifier(identifier);
        const { characteristic } = this.#assertValidCharacteristicUUID(identifier, serviceUUID, characteristicUUID);
        _console.assertWithError(
            characteristic.properties.notify && characteristic.isNotifying != notifyValue,
            `characteristic isNotifying already has value "${notifyValue}"`
        );
        _console.log("setting characteristic notify value", {
            identifier,
            serviceUUID,
            characteristicUUID,
            notifyValue,
        });
        characteristic._pendingIsNotifying = true;
        this.#getCharacteristicNotifyValuesPoll.start();
        return this.#sendMessageToApp({
            type: "setCharacteristicNotifyValue",
            identifier,
            serviceUUID,
            characteristicUUID,
            notifyValue,
        });
    }

    #getCharacteristicNotifyValuesPoll = new AppMessagePoll(
        this.#getCharacteristicNotifyValuesMessage.bind(this),
        this.#prefix,
        100
    );
    /** @returns {CBCentralAppMessage[]} */
    #getCharacteristicNotifyValuesMessage() {
        /** @type {CBCentralAppMessage[]} */
        const messages = [];

        Object.values(this.#peripherals).forEach((peripheral) => {
            Object.values(peripheral.services).forEach((service) => {
                Object.values(service.characteristics).forEach((characteristic) => {
                    if (characteristic._pendingIsNotifying) {
                        messages.push({
                            type: "getCharacteristicNotifyValue",
                            identifier: peripheral.identifier,
                            serviceUUID: service.uuid,
                            characteristicUUID: characteristic.uuid,
                        });
                    }
                });
            });
        });

        if (messages.length == 0) {
            this.#getCharacteristicNotifyValuesPoll.stop();
        }
        return messages;
    }

    /**
     *
     * @param {string} identifier
     * @param {string} serviceUUID
     * @param {string} characteristicUUID
     */
    async discoverDescriptors(identifier, serviceUUID, characteristicUUID) {
        this.#assertValidCharacteristicUUID(identifier, serviceUUID, characteristicUUID);
        _console.log("discovering descriptors", {
            identifier,
            serviceUUID,
            characteristicUUID,
        });
        // FILL - poll for descriptors (later)
        this.#getDescriptorsPoll.start();
        return this.#sendMessageToApp({
            type: "discoverDescriptors",
            identifier,
            serviceUUID,
            characteristicUUID,
        });
    }

    #getDescriptorsPoll = new AppMessagePoll(this.#getDescriptorsMessage.bind(this), this.#prefix, 500);
    /** @returns {CBCentralAppMessage[]} */
    #getDescriptorsMessage() {
        // FILL - later
    }

    /**
     *
     * @param {string} identifier
     * @param {string} serviceUUID
     * @param {string} characteristicUUID
     * @param {string} descriptorUUID
     * @param {number} timestamp
     */
    async readDescriptorValue(identifier, serviceUUID, characteristicUUID, descriptorUUID, timestamp) {
        this.#assertValidDescriptorUUID(identifier, serviceUUID, characteristicUUID, descriptorUUID);
        _console.log("reading descriptor value", {
            identifier,
            serviceUUID,
            characteristicUUID,
            descriptorUUID,
            timestamp,
        });
        return this.#sendMessageToApp({
            type: "readDescriptorValue",
            identifier,
            serviceUUID,
            characteristicUUID,
            descriptorUUID,
            timestamp,
        });
    }
    /**
     *
     * @param {string} identifier
     * @param {string} serviceUUID
     * @param {string} characteristicUUID
     * @param {string} descriptorUUID
     * @param {any} value
     */
    async writeDescriptorValue(identifier, serviceUUID, characteristicUUID, descriptorUUID, value) {
        this.#assertValidDescriptorUUID(identifier, serviceUUID, characteristicUUID, descriptorUUID);
        _console.log("writing descriptor value", {
            identifier,
            serviceUUID,
            characteristicUUID,
            descriptorUUID,
            value,
        });
        // FILL - later
        this.#getDescriptorValuesPoll.start();
        return this.#sendMessageToApp({
            type: "writeDescriptorValue",
            identifier,
            serviceUUID,
            characteristicUUID,
            descriptorUUID,
            value,
        });
    }

    #getDescriptorValuesPoll = new AppMessagePoll(this.#getDescriptorValuesMessage.bind(this), this.#prefix, 500);
    /** @returns {CBCentralAppMessage[]} */
    #getDescriptorValuesMessage() {
        // FILL - later
    }

    /**
     * @param {object} object
     * @param {string} object.identifier
     * @param {Object.<string, CBService>} object.services
     * @param {boolean} override
     */
    #onGetServices({ identifier, services }, override = false) {
        const peripheral = this.#assertConnectedPeripheralIdentifier(identifier);
        if (!peripheral.services) {
            peripheral.services = [];
        }
        const newServices = Object.values(services).filter((service) => {
            if (!peripheral.services[service.uuid] || override) {
                _console.log("got service", { identifier, service });
                peripheral.services[service.uuid] = service;
                this.#dispatchEvent({ type: "discoveredService", message: { discoveredService: service, peripheral } });
                return true;
            } else {
                _console.warn("already have service", { identifier, service });
            }
        });

        if (peripheral._pendingServices) {
            peripheral._pendingServices = peripheral._pendingServices.filter(
                (serviceUUID) => !peripheral.services[serviceUUID]
            );
            if (peripheral._pendingServices.length == 0) {
                delete peripheral._pendingServices;
            }
        }

        this.#dispatchEvent({ type: "discoveredServices", message: { discoveredServices: newServices, peripheral } });

        Object.values(services).forEach((service) => {
            if (Object.values(service.characteristics).length > 0) {
                this.#onGetCharacteristics(
                    {
                        identifier: identifier,
                        serviceUUID: service.uuid,
                        characteristics: service.characteristics,
                    },
                    true
                );
            }
        });
    }

    /**
     * @param {object} object
     * @param {string} object.identifier
     * @param {string} object.serviceUUID
     * @param {CBService[]} object.includedServices
     */
    #onGetIncludedServices({ identifier, serviceUUID, includedServices }) {
        const { peripheral, service } = this.#assertValidServiceUUID(identifier, serviceUUID);
        const newDiscoveredIncludedServices = includedServices.filter((includedService) => {
            if (!peripheral.services[includedService.uuid]) {
                _console.log("got included service", { identifier, service, includedService });
                peripheral.services[includedService.uuid] = includedService;
                this.#dispatchEvent({
                    type: "discoveredIncludedService",
                    message: { discoveredIncludedService: includedService, peripheral, service },
                });
                this.#dispatchEvent({
                    type: "discoveredService",
                    message: { discoveredService: includedService, peripheral, service },
                });
                return true;
            } else {
                _console.warn("already have service", { identifier, includedService, service });
            }
        });

        this.#dispatchEvent({
            type: "discoveredIncludedServices",
            message: { discoveredIncludedServices: newDiscoveredIncludedServices, peripheral, service },
        });
        this.#dispatchEvent({
            type: "discoveredServices",
            message: { discoveredServices: newDiscoveredIncludedServices, peripheral, service },
        });
    }

    /**
     * @param {object} object
     * @param {string} object.identifier
     * @param {string} object.serviceUUID
     * @param {Object.<string, CBCharacteristic>} object.characteristics
     * @param {boolean} override
     */
    #onGetCharacteristics({ identifier, serviceUUID, characteristics }, override = false) {
        const { peripheral, service } = this.#assertValidServiceUUID(identifier, serviceUUID);
        const newCharacteristics = Object.values(characteristics).filter((characteristic) => {
            _console.log("got new characteristic", { identifier, service, characteristic });
            if (!service.characteristics[characteristic.uuid] || override) {
                service.characteristics[characteristic.uuid] = characteristic;
                this.#dispatchEvent({
                    type: "discoveredCharacteristic",
                    message: { discoveredCharacteristic: characteristic, peripheral, service },
                });
            } else {
                _console.warn("already have characteristic", { identifier, characteristic });
            }
        });

        if (service._pendingCharacteristics) {
            service._pendingCharacteristics = service._pendingCharacteristics.filter(
                (characteristicUUID) => !service.characteristics[characteristicUUID]
            );
            if (service._pendingCharacteristics.length == 0) {
                delete service._pendingCharacteristics;
            }
        }

        if (this.#hasAtLeastOneCharacteristicWithNotifyEnabled) {
            this.#getCharacteristicValuesPoll.start();
        }

        this.#dispatchEvent({
            type: "discoveredCharacteristics",
            message: { discoveredCharacteristics: newCharacteristics, peripheral, service },
        });
    }

    /**
     * @param {object} object
     * @param {string} object.identifier
     * @param {string} object.serviceUUID
     * @param {string} object.characteristicUUID
     * @param {number[]} object.value
     * @param {number} object.timestamp
     */
    #onGetCharacteristicValue({ identifier, serviceUUID, characteristicUUID, value, timestamp }) {
        const { peripheral, service, characteristic } = this.#assertValidCharacteristicUUID(
            identifier,
            serviceUUID,
            characteristicUUID
        );
        characteristic.value = value;
        characteristic.valueTimestamp = timestamp;
        this.#dispatchEvent({ type: "characteristicValue", message: { peripheral, service, characteristic } });
    }

    /**
     * @param {object} object
     * @param {string} object.identifier
     * @param {string} object.serviceUUID
     * @param {string} object.characteristicUUID
     * @param {boolean} object.isNotifying
     */
    #onGetCharacteristicNotifyValue({ identifier, serviceUUID, characteristicUUID, isNotifying }) {
        const { peripheral, service, characteristic } = this.#assertValidCharacteristicUUID(
            identifier,
            serviceUUID,
            characteristicUUID
        );

        if (characteristic.isNotifying != isNotifying) {
            _console.log("characteristic.isNotifying updated", { characteristic });
            characteristic.isNotifying = isNotifying;
            characteristic._pendingIsNotifying = false;
            this.#dispatchEvent({
                type: "characteristicNotifyValue",
                message: { peripheral, service, characteristic },
            });

            if (this.#hasAtLeastOneCharacteristicWithNotifyEnabled) {
                this.#getCharacteristicValuesPoll.start();
            }
        }
    }

    get #hasAtLeastOneCharacteristicWithNotifyEnabled() {
        return Object.values(this.peripherals)
            .filter((peripheral) => peripheral.connectionState == "connected")
            .some((peripheral) => {
                return Object.values(peripheral.services).some((service) => {
                    return Object.values(service.characteristics).some((characteristic) => characteristic.isNotifying);
                });
            });
    }

    /**
     * @param {CBUpdatedCharacteristicValue[]} updatedCharacteristicValues
     */
    #onUpdatedCharacteristicValues(updatedCharacteristicValues) {
        updatedCharacteristicValues.forEach((updatedCharacteristic) => {
            const { identifier, serviceUUID, characteristicUUID, value, timestamp } = updatedCharacteristic;
            const { peripheral, service, characteristic } = this.#assertValidCharacteristicUUID(
                identifier,
                serviceUUID,
                characteristicUUID
            );
            characteristic.value = value;
            characteristic.valueTimestamp = timestamp;
            _console.log("updated characteristicValue", { characteristic });
            this.#dispatchEvent({ type: "characteristicValue", message: { peripheral, service, characteristic } });
        });
    }

    /**
     * @param {object} object
     * @param {string} object.identifier
     * @param {string} object.serviceUUID
     * @param {string} object.characteristicUUID
     * @param {CBDescriptor[]} object.descriptors
     */
    #onGetDescriptors({ identifier, serviceUUID, characteristicUUID, descriptors }) {
        const { peripheral, service, characteristic } = this.#assertValidCharacteristicUUID(
            identifier,
            serviceUUID,
            characteristicUUID
        );

        const newDescriptors = descriptors.filter((descriptor) => {
            _console.log("got new descriptor", { peripheral, service, characteristic, descriptor });
            if (!characteristic.descriptors[descriptor.uuid]) {
                characteristic.descriptors[descriptor.uuid] = descriptor;
                this.#dispatchEvent({
                    type: "discoveredDescriptor",
                    message: { discoveredDescriptor: descriptor, peripheral, service, characteristic },
                });
            } else {
                _console.warn("already have descriptor", { peripheral, service, characteristic, descriptor });
            }
        });

        this.#dispatchEvent({
            type: "discoveredDescriptors",
            message: { peripheral, service, characteristic, discoveredDescriptors: newDescriptors },
        });
    }

    /**
     * @param {object} object
     * @param {string} object.identifier
     * @param {string} object.serviceUUID
     * @param {string} object.characteristicUUID
     * @param {string} object.descriptorUUID
     * @param {CBDescriptorValue} object.value
     */
    #onGetDescriptorValue({ identifier, serviceUUID, characteristicUUID, descriptorUUID, value }) {
        const { peripheral, service, characteristic, descriptor } = this.#assertValidDescriptorUUID(
            identifier,
            serviceUUID,
            characteristicUUID,
            descriptorUUID
        );
        descriptor.value = value;
        _console.log("descriptorValue", { descriptor });
        this.#dispatchEvent({ type: "descriptorValue", message: { peripheral, service, characteristic, descriptor } });
    }

    /** @param {CBCentralAppMessage} message */
    #onAppMessage(message) {
        _console.log(`received background message of type ${message.type}`, message);
        const { type } = message;
        switch (type) {
            case "state":
                _console.log("received state message", message.state);
                this.#onState(message.state);
                break;

            case "isScanning":
                _console.log("received isScanning message", message.isScanning);
                this.#onIsScanning(message.isScanning);
                break;
            case "discoveredPeripheral":
                _console.log("received discoveredPeripheral message", message.discoveredPeripheral);
                this.#onDiscoveredPeripheral(message.discoveredPeripheral);
                break;

            case "discoveredPeripherals":
                _console.log("received discoveredPeripherals message", message.discoveredPeripherals);
                this.#onDiscoveredPeripherals(message.discoveredPeripherals);
                break;
            case "peripheralConnectionState":
                _console.log("received peripheralConnectionState message", message.peripheralConnectionState);
                this.#onPeripheralConnectionState(message.peripheralConnectionState);
                break;
            case "connectedPeripherals":
                _console.log("received connectedPeripherals message", message.connectedPeripherals);
                this.#onConnectedPeripherals(message.connectedPeripherals);
                break;
            case "disconnectedPeripherals":
                _console.log("received disconnectedPeripherals message", message.disconnectedPeripherals);
                this.#onDisconnectedPeripherals(message.disconnectedPeripherals);
                break;

            case "getRSSI":
                _console.log("received getRSSI message", message.peripheralRSSIs);
                this.#onPeripheralRSSIs(message.peripheralRSSIs);
                break;

            case "getServices":
                _console.log("received getServices message", message.getServices);
                this.#onGetServices(message.getServices);
                break;
            case "getIncludedServices":
                _console.log("received getIncludedServices message", message.getIncludedServices);
                this.#onGetIncludedServices(message.getIncludedServices);
                break;

            case "getCharacteristics":
                _console.log("received getCharacteristics message", message.getCharacteristics);
                this.#onGetCharacteristics(message.getCharacteristics);
                break;
            case "getCharacteristicValue":
                _console.log("received getCharacteristicValue message", message.getCharacteristicValue);
                this.#onGetCharacteristicValue(message.getCharacteristicValue);
                break;
            case "getCharacteristicNotifyValue":
                _console.log("received getCharacteristicNotifyValue message", message.getCharacteristicNotifyValue);
                this.#onGetCharacteristicNotifyValue(message.getCharacteristicNotifyValue);
                break;
            case "updatedCharacteristicValues":
                _console.log("received updatedCharacteristicValues message", message.updatedCharacteristicValues);
                this.#onUpdatedCharacteristicValues(message.updatedCharacteristicValues);
                break;

            case "getDescriptors":
                _console.log("received getDescriptors message", message.getDescriptors);
                this.#onGetDescriptors(message.getDescriptors);
                break;
            case "getDescriptorValue":
                _console.log("received getDescriptorValue message", message.getDescriptorValue);
                this.#onGetDescriptorValue(message.getDescriptorValue);
                break;

            default:
                throw Error(`uncaught message type ${type}`);
        }
    }
}

var CBCentralManager$1 = CBCentralManager.shared;

export { ARSessionManager$1 as ARSessionManager, CBCentralManager$1 as CBCentralManager, HeadphoneMotionManager$1 as HeadphoneMotionManager, utils };
