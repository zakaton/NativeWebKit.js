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

    /** @type {Object.<string, [function]?>?} */
    #listeners;

    /**
     * @param {string} type
     * @param {EventListener} listener
     * @param {EventDispatcherOptions?} options
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

export default EventDispatcher;
