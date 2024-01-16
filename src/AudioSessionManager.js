import EventDispatcher from "./utils/EventDispatcher.js";
import { createConsole } from "./Console.js";

import { sendMessageToApp, addAppListener } from "./utils/messaging.js";
import AppMessagePoll from "./utils/AppMessagePoll.js";

const _console = createConsole("AudioSessionManager", { log: false });

/** @typedef {} ASMessageType */

/** @typedef {} ASEventType */

/** @typedef {import("./utils/EventDispatcher.js").EventDispatcherOptions} EventDispatcherOptions */

/** @typedef {import("./utils/messaging.js").EventDispatcherEvent} EventDispatcherEvent */

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

class AudioSessionManager {
    /** @type {ASEventType[]} */
    static #EventsTypes = [];
    /** @type {ASEventType[]} */
    get eventTypes() {
        return AudioSessionManager.#EventsTypes;
    }
    #eventDispatcher = new EventDispatcher(this.eventTypes);

    /**
     * @param {ASEventType} type
     * @param {ASEventListener} listener
     * @param {EventDispatcherOptions?} options
     */
    addEventListener(type, listener, options) {
        return this.#eventDispatcher.addEventListener(type, listener, options);
    }
    /**
     * @param {ASEventType} type
     * @param {ASEventListener} listener
     * @returns {boolean}
     */
    removeEventListener(type, listener) {
        return this.#eventDispatcher.removeEventListener(type, listener);
    }
    /**
     * @param {ASEventType} type
     * @param {ASEventListener} listener
     * @returns {boolean}
     */
    hasEventListener(type, listener) {
        return this.#eventDispatcher.hasEventListener(type, listener);
    }
    /**
     * @param {ASEventType} event
     */
    dispatchEvent(event) {
        return this.#eventDispatcher.dispatchEvent(event);
    }

    static #shared = new AudioSessionManager();
    static get shared() {
        return this.#shared;
    }
    #prefix = "ars";
    /**
     * @param {ASMessage[]} messages
     * @returns {NKMessage[]}
     */
    #formatMessages(messages) {
        return messages.map((message) => Object.assign({}, message, { type: `${this.#prefix}-${message.type}` }));
    }

    /** @throws {Error} if singleton already exists */
    constructor() {
        _console.assertWithError(!this.shared, "AudioSessionManager is a singleton - use AudioSessionManager.shared");

        addAppListener(this.#onWindowLoad.bind(this), "window.load");
        addAppListener(this.#onAppMessage.bind(this), this.#prefix);
        addAppListener(this.#onBeforeWindowUnload.bind(this), "window.unload");
    }

    /** @returns {NKMessage[]?} */
    #onWindowLoad() {}
    /** @returns {NKMessage[]?} */
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
