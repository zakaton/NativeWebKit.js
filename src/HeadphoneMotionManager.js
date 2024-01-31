import EventDispatcher from "./utils/EventDispatcher.js";
import { createConsole } from "./utils/Console.js";

import { sendMessageToApp, addAppListener } from "./utils/messaging.js";
import AppMessagePoll from "./utils/AppMessagePoll.js";

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

const _console = createConsole("HeadphoneMotionManager", { log: false });

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
        _console.assertWithError(
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
    set checkAvailabilityOnLoad(newValue) {
        _console.assertTypeWithError(newValue, "boolean");
        this.#checkAvailabilityOnLoad = newValue;
    }

    /** @type {boolean} */
    #stopUpdatesOnUnload = true;
    get stopUpdatesOnUnload() {
        return this.#stopUpdatesOnUnload;
    }
    set stopUpdatesOnUnload(newValue) {
        _console.assertTypeWithError(newValue, "boolean");
        this.#stopUpdatesOnUnload = newValue;
    }

    /**
     * @param {HMAppMessage} message
     */
    #onAppMessage(message) {
        _console.log(`received background message of type ${message.type}`, message);
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
        _console.assert(this.isAvailable, "not available");
    }
    /** @param {boolean} newValue */
    #onIsAvailableUpdated(newValue) {
        if (this.#isAvailable == newValue) {
            return;
        }
        this.#isAvailable = newValue;
        _console.log(`updated isAvailable to ${newValue}`);
        this.dispatchEvent({
            type: "isAvailable",
            message: { isAvailable: this.isAvailable },
        });
        if (this.#isAvailable) {
            this.#checkIsActive();
        }
    }
    async #checkIsAvailable() {
        _console.log("checking isAvailable...");
        return this.sendMessageToApp({ type: "isAvailable" });
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
        _console.log(`updated isActive to ${this.isActive}`);
        this.dispatchEvent({
            type: "isActive",
            message: { isActive: this.isActive },
        });

        this.#isActivePoll.stop();
        if (this.#isActive) {
            _console.log("starting motion data poll");
            this.#motionDataPoll.start();
        } else {
            _console.log("stopping motion data poll");
            this.#motionDataPoll.stop();
        }
    }
    async #checkIsActive() {
        _console.log("checking isActive");
        return this.sendMessageToApp({ type: "isActive" });
    }
    #isActivePoll = new AppMessagePoll({ type: "isActive" }, this.#prefix, 50, true);

    async startUpdates() {
        this.#assertIsAvailable();
        if (this.isActive) {
            _console.warn("already active");
            return;
        }
        _console.log("starting motion updates");
        this.#isActivePoll.start();
        return this.sendMessageToApp({ type: "startUpdates" });
    }
    async stopUpdates() {
        this.#assertIsAvailable();
        if (!this.isActive) {
            _console.warn("already inactive");
            return;
        }
        _console.log("stopping motion updates");
        this.#isActivePoll.start();
        return this.sendMessageToApp({ type: "stopUpdates" });
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
        _console.log(`updated sensor location to ${newValue}`);
        this.dispatchEvent({
            type: "sensorLocation",
            message: { sensorLocation: this.sensorLocation },
        });
    }

    /**
     * @param {HeadphoneMotionData} newMotionData
     */
    #onMotionData(newMotionData) {
        this.#motionData = newMotionData;
        _console.log("received headphone motion data", this.motionData);
        this.dispatchEvent({ type: "motionData", message: { motionData: this.motionData } });
        this.#onSensorLocationUpdated(newMotionData.sensorLocation);
    }

    /** @returns {HMAppMessage} */
    #checkMotionDataMessage() {
        return { type: "getData", timestamp: this.#motionDataTimestamp };
    }
    #motionDataPoll = new AppMessagePoll(this.#checkMotionDataMessage.bind(this), this.#prefix, 20);
}
export default HeadphoneMotionManager.shared;
