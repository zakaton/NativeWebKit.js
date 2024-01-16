import EventDispatcher from "./utils/EventDispatcher.js";
import { createConsole } from "./Console.js";

import { sendMessageToApp, addAppListener } from "./utils/messaging.js";
import AppMessagePoll from "./utils/AppMessagePoll.js";

const _console = createConsole("Template", { log: false });

/** @typedef {"test"} TMMessageType */

/** @typedef {"test"} TMEventType */

/** @typedef {import("./utils/EventDispatcher.js").EventDispatcherOptions} EventDispatcherOptions */

/** @typedef {import("./utils/messaging.js").NKMessage} NKMessage */

/**
 * @typedef TMMessage
 * @type {object}
 * @property {TMMessageType} type
 * @property {object} message
 */

/**
 * @typedef TMAppMessage
 * @type {object}
 * @property {TMMessageType} type
 */

/**
 * @typedef TMEvent
 * @type {object}
 * @property {TMEventType} type
 * @property {object} message
 */

/**
 * @typedef {(event: TMEvent) => void} TMEventListener
 */

class TemplateModuleManager extends BaseManager {
    /** @type {TMEventType[]} */
    static #EventsTypes = ["test"];
    /** @type {TMEventType[]} */
    get eventTypes() {
        return TemplateModuleManager.#EventsTypes;
    }
    #eventDispatcher = new EventDispatcher(this.eventTypes);

    /**
     * @param {TMEventType} type
     * @param {TMEventListener} listener
     * @param {EventDispatcherOptions?} options
     */
    addEventListener(type, listener, options) {
        return this.#eventDispatcher.addEventListener(...arguments);
    }
    /**
     * @param {TMEventType} type
     * @param {TMEventListener} listener
     * @returns {boolean}
     */
    removeEventListener(type, listener) {
        return this.#eventDispatcher.removeEventListener(...arguments);
    }
    /**
     * @param {TMEventType} type
     * @param {TMEventListener} listener
     * @returns {boolean}
     */
    hasEventListener(type, listener) {
        return this.#eventDispatcher.hasEventListener(...arguments);
    }
    /**
     * @param {TMEvent} event
     */
    dispatchEvent(event) {
        return this.#eventDispatcher.dispatchEvent(event);
    }

    static #shared = new TemplateModuleManager();
    static get shared() {
        return this.#shared;
    }
    #prefix = "tm";
    /**
     * @param {TMMessage[]} messages
     * @returns {NKMessage[]}
     */
    #formatMessages(messages) {
        return messages.map((message) => Object.assign({}, message, { type: `${this.#prefix}-${message.type}` }));
    }

    /** @throws {Error} if singleton already exists */
    constructor() {
        super();

        _console.assertWithError(
            !this.shared,
            "TemplateModuleManager is a singleton - use TemplateModuleManager.shared"
        );

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
        /** @type {TMMessage[]} */
        const messages = [];
        return this.#formatMessages(messages);
    }
    /** @returns {NKMessage[]?} */
    #getWindowUnloadMessages() {
        /** @type {TMMessage[]} */
        const messages = [];
        return this.#formatMessages(messages);
    }

    /**
     * @param {TMAppMessage} message
     */
    async sendMessageToApp(message) {
        message.type = `${this.#prefix}-${message.type}`;
        return sendMessageToApp(message);
    }

    async sendTestMessage() {
        _console.log("test message...");
        return this.sendMessageToApp({ type: "test" });
    }

    /**
     * @param {TMAppMessage} message
     */
    #onAppMessage(message) {
        _console.log(`received background message of type ${message.type}`, message);
        const { type } = message;
        switch (type) {
            case "test":
                _console.log("received test message", message);
                break;
            default:
                throw Error(`uncaught message type ${type}`);
        }
    }
}

export default TemplateModuleManager.shared;
