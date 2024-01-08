import EventDispatcher from "./utils/EventDispatcher.js";
import Console from "./utils/Console.js";
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

const _console = new Console("HeadphoneMotionManager");

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
                _console.error(`uncaught message type ${type}`);
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
            _console.log(`updated isAvailable to ${newValue}`);
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
        _console.log("checking isAvailable...");
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
    }
    async checkIsActive() {
        _console.log("checking isActive");
        return sendMessageToApp(this.#checkIsActiveMessage());
    }
    #checkIsActiveMessage() {
        return this._formatMessage({ type: "isActive" });
    }
    #isActivePoll = new AppMessagePoll(this.#checkIsActiveMessage.bind(this), 50, true);

    async startUpdates() {
        if (!this.isAvailable) {
            _console.warn("not available");
            return;
        }
        if (this.isActive) {
            _console.warn("already active");
            return;
        }
        _console.log("starting motion updates");
        this.#isActivePoll.start();
        return sendMessageToApp(this.#startUpdatesMessage);
    }
    get #startUpdatesMessage() {
        return this._formatMessage({ type: "startUpdates" });
    }
    async stopUpdates() {
        if (!this.isAvailable) {
            _console.warn("not available");
            return;
        }
        if (!this.isActive) {
            _console.warn("already inactive");
            return;
        }
        _console.log("stopping motion updates");
        this.#isActivePoll.start();
        return sendMessageToApp(this.#stopUpdatesMessage);
    }
    get #stopUpdatesMessage() {
        return this._formatMessage({ type: "stopUpdates" });
    }

    async toggleMotionUpdates() {
        if (!this.isAvailable) {
            _console.log("not available");
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
            _console.log(`updated sensor location to ${newValue}`);
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
        _console.log("received headphone motion data", this.motionData);
        this.dispatchEvent({ type: "motionData", message: { motionData: this.motionData } });
        this.#onSensorLocationUpdated(newMotionData.sensorLocation);
    }

    async checkMotionData() {
        _console.log("checkMotionData");
        return sendMessageToApp(this.#checkMotionDataMessage);
    }
    #checkMotionDataMessage() {
        return this._formatMessage({ type: "getData", timestamp: this.#motionDataTimestamp });
    }
    #motionDataPoll = new AppMessagePoll(this.#checkMotionDataMessage.bind(this), 20);
}
export default HeadphoneMotionManager.shared;
