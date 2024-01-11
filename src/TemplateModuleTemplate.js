import EventDispatcher from "./utils/EventDispatcher.js";
import Console from "./utils/Console.js";
import { sendMessageToApp, addAppListener } from "./utils/messaging.js";
import AppMessagePoll from "./utils/AppMessagePoll.js";

const _console = new Console("Template");

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

class TemplateModuleManager extends EventDispatcher {
    /** @type {TMEventType[]} */
    static #EventsTypes = ["test"];
    /** @type {TMEventType[]} */
    get eventTypes() {
        return TemplateModuleManager.#EventsTypes;
    }

    static #shared = new TemplateModuleManager();
    static get shared() {
        return this.#shared;
    }

    get _prefix() {
        return "tm";
    }
    /**
     * @param {TMMessage} message
     * @returns {NKMessage}
     */
    _formatMessage(message) {
        return super._formatMessage(message);
    }

    /**
     * @param {TMEventType} type
     * @param {TMEventListener} listener
     * @param {EventDispatcherOptions?} options
     */
    addEventListener(type, listener, options) {
        return super.addEventListener(...arguments);
    }
    /**
     * @param {TMEventType} type
     * @param {TMEventListener} listener
     * @returns {boolean}
     */
    removeEventListener(type, listener) {
        return super.removeEventListener(...arguments);
    }
    /**
     * @param {TMEventType} type
     * @param {TMEventListener} listener
     * @returns {boolean}
     */
    hasEventListener(type, listener) {
        return super.hasEventListener(...arguments);
    }
    /**
     * @param {TMEvent} event
     */
    dispatchEvent(event) {
        return super.dispatchEvent(...arguments);
    }

    /** TemplateModuleManager is a singleton - use TemplateModuleManager.shared */
    constructor() {
        super();

        console.assert(!this.shared, "TemplateModuleManager is a singleton - use TemplateModuleManager.shared");

        addAppListener(this.#getWindowLoadMessages.bind(this), "window.load");
        addAppListener(this.#onAppMessage.bind(this), this._prefix);
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

    /** @returns {NKMessage|NKMessage[]?} */
    #getWindowLoadMessages() {}
    /** @returns {NKMessage|NKMessage[]?} */
    #getWindowUnloadMessages() {}

    async sendTestMessage() {
        _console.log("test message...");
        return sendMessageToApp(this.#testMessage);
    }
    get #testMessage() {
        return this._formatMessage({ type: "test" });
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
