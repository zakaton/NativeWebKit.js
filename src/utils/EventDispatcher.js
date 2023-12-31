// based on https://github.com/mrdoob/eventdispatcher.js/
class EventDispatcher {
    /** @type {Object.<string, [function]|undefined>|undefined} */
    #listeners;

    /**
     * @param {string} type
     * @param {function} listener
     * @param {object|undefined} options
     */
    addEventListener(type, listener, options) {
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
     * @param {function} listener
     * @returns {boolean}
     */
    hasEventListener(type, listener) {
        return this.#listeners?.[type]?.includes(listener);
    }

    /**
     * @param {string} type
     * @param {function} listener
     * @returns {boolean}
     */
    removeEventListener(type, listener) {
        if (this.hasEventListener(type, listener)) {
            const index = this.#listeners[type].indexOf(listener);
            this.#listeners[type].splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     *
     * @param {object} event
     * @param {string} event.type
     */
    dispatchEvent(event) {
        if (this.#listeners?.[event.type]) {
            event.target = this;

            // Make a copy, in case listeners are removed while iterating.
            const array = this.#listeners[event.type].slice(0);

            for (let i = 0, l = array.length; i < l; i++) {
                array[i].call(this, event);
            }
        }
    }
}

export default EventDispatcher;
