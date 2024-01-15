import EventDispatcher from "./utils/EventDispatcher.js";
import { createConsole } from "./Console.js";

import { sendMessageToApp, addAppListener } from "./utils/messaging.js";
import AppMessagePoll from "./utils/AppMessagePoll.js";

const _console = createConsole("AudioSessionManager");

/** @typedef {} ASMessageType */

/** @typedef {} ASEventType */

/** @typedef {import("./utils/EventDispatcher.js").EventDispatcherOptions} EventDispatcherOptions */

/** @typedef {import("./utils/messaging.js").NKMessage} NKMessage */

/**
 * @typedef ASMessage
 * @type {object}
 * @property {ASMessageType} type
 * @property {object} message
 */

/**
 * @typedef ASAppMessage
 * @type {object}
 * @property {ASMessageType} type
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
     * @param {EventDispatcherOptions?} options
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

    /** @throws {Error} if singleton already exists */
    constructor() {
        super();

        _console.assertWithError(!this.shared, "AudioSessionManager is a singleton - use AudioSessionManager.shared");

        addAppListener(this.#onWindowLoad.bind(this), "window.load");
        addAppListener(this.#onAppMessage.bind(this), this._prefix);
        addAppListener(this.#onBeforeWindowUnload.bind(this), "window.unload");
    }

    /** @returns {NKMessage|NKMessage[]?} */
    #onWindowLoad() {}
    /** @returns {NKMessage|NKMessage[]?} */
    #onBeforeWindowUnload() {}

    /**
     * @param {ASAppMessage} message
     */
    #onAppMessage(message) {
        _console.log(`received background message of type ${message.type}`, message);
        const { type } = message;
        switch (type) {
            default:
                throw Error(`uncaught message type ${type}`);
        }
    }
}

export default AudioSessionManager.shared;
