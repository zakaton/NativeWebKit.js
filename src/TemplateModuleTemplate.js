import EventDispatcher from "./utils/EventDispatcher.js";
import Console from "./utils/Console.js";
import { sendMessageToApp, addAppListener } from "./utils/messaging.js";
import AppMessagePoll from "./utils/AppMessagePoll.js";

const _console = new Console("Template");

/** @typedef {"test"} TMMessageType */

/** @typedef {"test"} TMEventType */

/** @typedef {import("./utils/messaging.js").NKMessage} NKMessage */

/**
 * @typedef TMMessage
 * @type {object}
 * @property {TMMessageType} type
 * @property {object} message
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
     * @param {object|undefined} options
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
     * @param {TMEventType} event
     */
    dispatchEvent(event) {
        return super.dispatchEvent(...arguments);
    }

    /** TemplateModuleManager is a singleton - use TemplateModuleManager.shared */
    constructor() {
        super();

        if (this.shared) {
            throw new Error("TemplateModuleManager is a singleton - use TemplateModuleManager.shared");
        }

        addAppListener(this.#onAppMessage.bind(this), this._prefix);

        window.addEventListener("load", () => {});
        window.addEventListener("unload", () => {});
    }

    async sendTestMessage() {
        _console.log("test message...");
        await sendMessageToApp(this.#testMessage);
    }
    get #testMessage() {
        return this._formatMessage({ type: "test" });
    }

    /**
     * @param {TMMessage} message
     */
    #onAppMessage(message) {
        _console.log(`received background message of type ${message.type}`, message);
        const { type } = message;
        switch (type) {
            case "test":
                _console.log("receivedt test message", message);
                break;
            default:
                _console.error(`uncaught message type ${type}`);
                break;
        }
    }
}

export default TemplateModuleManager.shared;