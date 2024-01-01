import EventDispatcher from "./utils/EventDispatcher.js";
import Console from "./utils/Console.js";
import { sendMessageToApp, addAppListener } from "./utils/messaging.js";
import AppMessagePoll from "./utils/AppMessagePoll.js";

/** @typedef {"isAvailable" | "isActive" | "startUpdates" | "stopUpdates" | "getData"} HMMessageType */

/** @typedef {import("./utils/messaging.js").NKMessage} NKMessage */
/**
 * @typedef HMMessage
 * @type {object}
 * @property {HMMessageType} type
 */

/** @typedef {"default" | "left headphone" | "right headphone" | "unknown"} HeadphoneMotionSensorLocation */

/**
 * @typedef HeadphoneMotionData
 * @type {object}
 * @property {number} timestamp
 * @property {HeadphoneMotionSensorLocation} sensorLocation
 * @property {[number]} quaternion
 * @property {[number]} euler
 * @property {number} heading
 * @property {[number]} userAcceleration
 * @property {[number]} gravity
 * @property {[number]} rotationRate
 */

const _console = new Console("HeadphoneMotionManager");

class HeadphoneMotionManager extends EventDispatcher {
    static #shared = new HeadphoneMotionManager();
    static get shared() {
        return this.#shared;
    }

    #prefix = "hm";
    /**
     * @param {HMMessage} message
     * @returns {NKMessage}
     */
    #formatMessage(message) {
        /** @type {NKMessage} */
        const formattedMessage = { ...message };
        formattedMessage.type = `${this.#prefix}-${message.type}`;
        return formattedMessage;
    }

    /** HeadphoneMotionManager is a singleton - use HeadphoneMotionManager.shared */
    constructor() {
        super();

        if (this.shared) {
            throw new Error("HeadphoneMotionManager is a singleton - use HeadphoneMotionManager.shared");
        }

        addAppListener(this.#onAppMessage.bind(this), this.#prefix);

        window.addEventListener("load", () => {
            //this.checkIsAvailable();
        });
        window.addEventListener("unload", () => {
            if (this.#isActive) {
                this.stopUpdates();
            }
        });
    }

    /** @type {boolean} */
    #isAvailable = null;
    get isAvailable() {
        return this.#isAvailable;
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
        await sendMessageToApp(this.#formatMessage({ type: "isAvailable" }));
    }

    /** @type {boolean} */
    #isActive = null;
    get isActive() {
        return this.#isActive;
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
        await sendMessageToApp(this.#checkIsActiveMessage());
    }
    #checkIsActiveMessage() {
        return this.#formatMessage({ type: "isActive" });
    }
    #isActivePoll = new AppMessagePoll(this.#checkIsActiveMessage.bind(this), 50);

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
        await sendMessageToApp(this.#startHeadphoneMotionUpdatesMessage);
    }
    get #startHeadphoneMotionUpdatesMessage() {
        return this.#formatMessage({ type: "startUpdates" });
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
        await sendMessageToApp(this.#stopHeadphoneMotionUpdatesMessage);
    }
    get #stopHeadphoneMotionUpdatesMessage() {
        return this.#formatMessage({ type: "stopUpdates" });
    }

    async toggleMotionUpdates() {
        if (!this.isAvailable) {
            _console.log("not available");
            return;
        }
        if (this.isActive) {
            await this.stopUpdates();
        } else {
            await this.startUpdates();
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
    /**
     * @param {HeadphoneMotionData} newMotionData
     */
    #onMotionData(newMotionData) {
        this.#motionData = newMotionData;
        _console.log("received headphone motion data", this.motionData);
        this.dispatchEvent({ type: "motionData", message: { motionData: this.motionData } });
    }

    async checkMotionData() {
        _console.log("checkMotionData");
        await sendMessageToApp(this.#checkMotionDataMessage);
    }
    #checkMotionDataMessage() {
        return this.#formatMessage({ type: "getData", timestamp: this.#motionDataTimestamp });
    }
    #motionDataPoll = new AppMessagePoll(this.#checkMotionDataMessage.bind(this), 1000);

    /**
     * @param {HMMessage} message
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
                this.#onMotionData(message);
                break;
            default:
                _console.error(`uncaught message type ${type}`);
                break;
        }
    }
}
export default HeadphoneMotionManager.shared;
