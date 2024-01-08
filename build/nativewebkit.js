/**
 * @copyright Zack Qattan 2024
 * @license MIT
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.NativeWebKit = {}));
})(this, (function (exports) { 'use strict';

	/** @typedef {import("./messaging.js").NKMessage} NKMessage */

	/**
	 * @typedef EventDispatcherEvent
	 * @type {object}
	 * @property {string} type
	 */

	/**
	 * @typedef EventDispatcherOptions
	 * @type {object}
	 * @property {boolean} once
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
	     * @param {EventDispatcherOptions|undefined} options
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
	    isLoggingEnabled = true;
	    /** @type {LogFunction} */
	    get log() {
	        return this.#emptyFunction;
	    }
	    #log = console.log.bind(console);

	    /** @type {boolean} */
	    isWarningEnabled = true;
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

	const _console$5 = new Console();

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
	/** @type {NKMessagePromise|undefined} */
	var pendingMessagesPromise;
	/** @type {PromiseLike<boolean>|undefined} */
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
	     * @param {boolean} runInApp
	     */
	    constructor(generateMessage, interval, runInApp = false) {
	        this.#generateMessage = generateMessage;
	        this.#interval = interval;
	        this.#runInApp = runInApp;
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

	const _console$1 = new Console("HeadphoneMotionManager");

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
	     * @param {EventDispatcherOptions|undefined} options
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
	     * @param {HMEvent} event
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

	        addAppListener(this.#getWindowLoadMessages.bind(this), "window.load");
	        addAppListener(this.#onAppMessage.bind(this), this._prefix);
	        addAppListener(this.#getWindowUnloadMessages.bind(this), "window.unload");
	    }

	    /** @returns {NKMessage|NKMessage[]|undefined} */
	    #getWindowLoadMessages() {
	        if (this.#checkAvailabilityOnLoad) {
	            return this.#checkIsAvailableMessage;
	        }
	    }
	    /** @returns {NKMessage|NKMessage[]|undefined} */
	    #getWindowUnloadMessages() {
	        if (this.#isActive && this.#stopUpdatesOnUnload) {
	            return this.#stopUpdatesMessage;
	        }
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
	    #stopUpdatesOnUnload = true;
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
	                _console$1.error(`uncaught message type ${type}`);
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
	            _console$1.log(`updated isAvailable to ${newValue}`);
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
	        _console$1.log("checking isAvailable...");
	        return sendMessageToApp(this.#checkIsAvailableMessage);
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
	    async checkIsActive() {
	        _console$1.log("checking isActive");
	        return sendMessageToApp(this.#checkIsActiveMessage());
	    }
	    #checkIsActiveMessage() {
	        return this._formatMessage({ type: "isActive" });
	    }
	    #isActivePoll = new AppMessagePoll(this.#checkIsActiveMessage.bind(this), 50, true);

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
	        return sendMessageToApp(this.#startUpdatesMessage);
	    }
	    get #startUpdatesMessage() {
	        return this._formatMessage({ type: "startUpdates" });
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
	        return sendMessageToApp(this.#stopUpdatesMessage);
	    }
	    get #stopUpdatesMessage() {
	        return this._formatMessage({ type: "stopUpdates" });
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
	    /** @type {HeadphoneMotionSensorLocation|null} */
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

	    async checkMotionData() {
	        _console$1.log("checkMotionData");
	        return sendMessageToApp(this.#checkMotionDataMessage);
	    }
	    #checkMotionDataMessage() {
	        return this._formatMessage({ type: "getData", timestamp: this.#motionDataTimestamp });
	    }
	    #motionDataPoll = new AppMessagePoll(this.#checkMotionDataMessage.bind(this), 20);
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

	const _console = new Console("ARSession");

	/** @typedef {"worldTrackingSupport" | "faceTrackingSupport" | "run" | "pause" | "isRunning" | "frame"} ARSMessageType */

	/** @typedef {"worldTrackingSupport" | "faceTrackingSupport" | "isRunning" | "frame" | "camera"} ARSEventType */

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

	/**
	 * @typedef ARSFrame
	 * @type {object}
	 * @property {ARSCamera} camera
	 */

	/**
	 * @typedef ARSCamera
	 * @type {object}
	 * @property {number[]} position
	 * @property {number[]} quaternion
	 * @property {number[]} position
	 * @property {number[]} eulerAngles
	 */

	class ARSessionManager extends EventDispatcher {
	    /** @type {ARSEventType[]} */
	    static #EventsTypes = ["worldTrackingSupport", "faceTrackingSupport", "isRunning", "frame", "camera"];
	    /** @type {ARSEventType[]} */
	    get eventTypes() {
	        return ARSessionManager.#EventsTypes;
	    }

	    static #shared = new ARSessionManager();
	    static get shared() {
	        return this.#shared;
	    }

	    get _prefix() {
	        return "ars";
	    }
	    /**
	     * @param {ARSMessage} message
	     * @returns {NKMessage}
	     */
	    _formatMessage(message) {
	        return super._formatMessage(message);
	    }

	    /**
	     * @param {ARSEventType} type
	     * @param {ARSEventListener} listener
	     * @param {EventDispatcherOptions|undefined} options
	     */
	    addEventListener(type, listener, options) {
	        return super.addEventListener(...arguments);
	    }
	    /**
	     * @param {ARSEventType} type
	     * @param {ARSEventListener} listener
	     * @returns {boolean}
	     */
	    removeEventListener(type, listener) {
	        return super.removeEventListener(...arguments);
	    }
	    /**
	     * @param {ARSEventType} type
	     * @param {ARSEventListener} listener
	     * @returns {boolean}
	     */
	    hasEventListener(type, listener) {
	        return super.hasEventListener(...arguments);
	    }
	    /**
	     * @param {ARSEvent} event
	     */
	    dispatchEvent(event) {
	        return super.dispatchEvent(...arguments);
	    }

	    /** ARSessionManager is a singleton - use ARSessionManager.shared */
	    constructor() {
	        super();

	        if (this.shared) {
	            throw new Error("ARSessionManager is a singleton - use ARSessionManager.shared");
	        }

	        addAppListener(this.#getWindowLoadMessages.bind(this), "window.load");
	        addAppListener(this.#onAppMessage.bind(this), this._prefix);
	        addAppListener(this.#getWindowUnloadMessages.bind(this), "window.unload");
	    }

	    get isSupported() {
	        return is_iOS && isInApp;
	    }
	    #warnNotSupported() {
	        if (isMac) {
	            _console.warn("AR Session is not supported on Mac");
	        } else {
	            _console.warn("AR Session not supported in iOS Safari");
	        }
	    }

	    /** @returns {NKMessage|NKMessage[]|undefined} */
	    #getWindowLoadMessages() {
	        if (!this.isSupported) {
	            return;
	        }

	        const messages = [];
	        if (this.checkFaceTrackingSupportOnLoad) {
	            messages.push(this.#checkFaceTrackingSupportMessage);
	        }
	        if (this.checkWorldTrackingSupportOnLoad) {
	            messages.push(this.#checkWorldTrackingSupportMessage);
	        }
	        if (this.checkIsRunningOnLoad) {
	            messages.push(this.#checkIsRunningMessage);
	        }
	        return messages;
	    }
	    /** @returns {NKMessage|NKMessage[]|undefined} */
	    #getWindowUnloadMessages() {
	        if (!this.isSupported) {
	            return;
	        }

	        const messages = [];
	        if (this.pauseOnUnload && this.isRunning) {
	            messages.push(this.#pauseMessage);
	        }
	        return messages;
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
	        if (typeof newValue == "boolean") {
	            this.#checkWorldTrackingSupportOnLoad = newValue;
	        } else {
	            throw Error(`invalid newValue for checkWorldTrackingSupportOnLoad`, newValue);
	        }
	    }

	    async checkWorldTrackingSupport() {
	        if (!this.isSupported) {
	            this.#warnNotSupported();
	            return;
	        }

	        _console.log("checking world tracking support...");
	        return sendMessageToApp(this.#checkWorldTrackingSupportMessage);
	    }
	    get #checkWorldTrackingSupportMessage() {
	        return this._formatMessage({ type: "worldTrackingSupport" });
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
	        if (typeof newValue == "boolean") {
	            this.#checkFaceTrackingSupportOnLoad = newValue;
	        } else {
	            throw Error(`invalid newValue for checkFaceTrackingSupportOnLoad`, newValue);
	        }
	    }

	    async checkFaceTrackingSupport() {
	        if (!this.isSupported) {
	            this.#warnNotSupported();
	            return;
	        }

	        _console.log("checking face tracking support...");
	        return sendMessageToApp(this.#checkFaceTrackingSupportMessage);
	    }
	    get #checkFaceTrackingSupportMessage() {
	        return this._formatMessage({ type: "faceTrackingSupport" });
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
	        }
	    }
	    async checkIsRunning() {
	        if (!this.isSupported) {
	            this.#warnNotSupported();
	            return;
	        }

	        _console.log("checking isRunning...");
	        return sendMessageToApp(this.#checkIsRunningMessage);
	    }
	    get #checkIsRunningMessage() {
	        return this._formatMessage({ type: "isRunning" });
	    }

	    /** @type {boolean} */
	    #checkIsRunningOnLoad = false;
	    get checkIsRunningOnLoad() {
	        return this.#checkIsRunningOnLoad;
	    }
	    /** @throws {Error} if newValue is not a boolean */
	    set checkIsRunningOnLoad(newValue) {
	        if (typeof newValue == "boolean") {
	            this.#checkIsRunningOnLoad = newValue;
	        } else {
	            throw Error(`invalid newValue for checkIsRunningOnLoad`, newValue);
	        }
	    }

	    /** @type {boolean} */
	    #pauseOnUnload = true;
	    get pauseOnUnload() {
	        return this.#pauseOnUnload;
	    }
	    /** @throws {Error} if newValue is not a boolean */
	    set pauseOnUnload(newValue) {
	        if (typeof newValue == "boolean") {
	            this.#pauseOnUnload = newValue;
	        } else {
	            throw Error(`invalid newValue for pauseOnUnload`, newValue);
	        }
	    }

	    async run() {
	        _console.log("run...");
	        return sendMessageToApp(this.#runMessage);
	    }
	    get #runMessage() {
	        return this._formatMessage({ type: "run" });
	    }

	    async pause() {
	        _console.log("pause...");
	        return sendMessageToApp(this.#pauseMessage);
	    }
	    get #pauseMessage() {
	        return this._formatMessage({ type: "pause" });
	    }

	    /** @type {ARSFrame|null} */
	    #frame = null;
	    get frame() {
	        return this.#frame;
	    }
	    /** @type {ARSCamera|null} */
	    #camera;
	    get camera() {
	        return this.#camera;
	    }

	    /** @param {ARSFrame} frame */
	    #onFrame(frame) {
	        this.#frame = frame;
	        _console.log("received frame", this.frame);
	        this.dispatchEvent({ type: "frame", message: { frame: this.frame } });
	        this.#onCamera(frame.camera);
	    }

	    /** @param {ARSCamera} camera */
	    #onCamera(camera) {
	        this.#camera = camera;
	        _console.log("received camera", this.camera);
	        this.dispatchEvent({ type: "camera", message: { camera: this.camera } });
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
	            case "frame":
	                _console.log("received frame message", message);
	                this.#onFrame(message.frame);
	                break;
	            default:
	                _console.error(`uncaught message type ${type}`);
	                break;
	        }
	    }
	}

	var ARSessionManager$1 = ARSessionManager.shared;

	var utils = /*#__PURE__*/Object.freeze({
		__proto__: null,
		areObjectsEqual: areObjectsEqual,
		checkIfNativeWebKitEnabled: checkIfNativeWebKitEnabled,
		checkIfSafariExtensionIsInstalled: checkIfSafariExtensionIsInstalled,
		isInApp: isInApp,
		isInSafari: isInSafari,
		isMac: isMac,
		is_iOS: is_iOS,
		openInApp: openInApp
	});

	exports.ARSessionManager = ARSessionManager$1;
	exports.HeadphoneMotionManager = HeadphoneMotionManager$1;
	exports.utils = utils;

}));
