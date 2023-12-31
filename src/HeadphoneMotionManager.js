import EventDispatcher from "./utils/EventDispatcher.js";
import Console from "./utils/Console.js";
import { sendMessageToApp, addAppListener } from "./utils/messaging.js";
import AppMessagePoll from "./utils/AppMessagePoll.js";

/** @typedef {"default" | "left headphone" | "right headphone" | "unknown"} HeadphoneMotionSensorLocation */

/** @typedef {"isHeadphoneMotionAvailable" | "isHeadphoneMotionActive" | "startHeadphoneMotionUpdates" | "stopHeadphoneMotionUpdates" | "headphoneMotionData"} HMMessageType */

/**
 * @typedef HeadphoneMotionData
 * @type {object}
 * @property {number} timestamp
 * @property {HeadphoneMotionSensorLocation} sensorLocation
 * @property {[number]} quaternion
 * @property {[number]} userAcceleration
 * @property {[number]} rotationRate
 * @property {[number]} gravity
 */

/** @typedef {import("./utils/messaging.js").NKMessage} NKMessage */
/**
 * @typedef HMMessage
 * @type {object}
 * @property {HMMessageType} type
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

        addAppListener(this.#onAppMessage.bind(this));

        window.addEventListener("load", () => {
            //this.checkIsAvailable();
        });
        window.addEventListener("unload", () => {
            if (this.#isActive) {
                this.stopMotionUpdates();
            }
        });
    }

    /**
     * @param {NKMessage} message
     */
    async #sendMessageToApp(message) {
        return sendMessageToApp(message);
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
        await this.#sendMessageToApp({ type: "isHeadphoneMotionAvailable" });
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
            this.eventDispatcher.dispatchEvent({
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
        await this.#sendMessageToApp(this.#checkIsActiveMessage);
    }
    #checkIsActiveMessage() {
        return this.#formatMessage({ type: "isHeadphoneMotionActive" });
    }
    #isActivePoll = new AppMessagePoll(this.#checkIsActiveMessage.bind(this), 50);

    async startMotionUpdates() {
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
        await this.#sendMessageToApp(this.#startHeadphoneMotionUpdatesMessage);
    }
    get #startHeadphoneMotionUpdatesMessage() {
        return this.#formatMessage({ type: "startHeadphoneMotionUpdates" });
    }
    async stopMotionUpdates() {
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
        await this.#sendMessageToApp(this.#stopHeadphoneMotionUpdatesMessage);
    }
    get #stopHeadphoneMotionUpdatesMessage() {
        return this.#formatMessage({ type: "stopHeadphoneMotionUpdates" });
    }

    async toggleMotionUpdates() {
        if (!this.isAvailable) {
            _console.log("not available");
            return;
        }
        if (this.isActive) {
            await this.stopMotionUpdates();
        } else {
            await this.startMotionUpdates();
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
        await this.#sendMessageToApp(this.#checkMotionDataMessage);
    }
    #checkMotionDataMessage() {
        return this.#formatMessage({ type: "headphoneMotionData", timestamp: this.#motionDataTimestamp });
    }
    #motionDataPoll = new AppMessagePoll(this.#checkMotionDataMessage.bind(this), 20);

    /**
     * @param {HMMessage} message
     */
    #onAppMessage(message) {
        _console.log(`received background message of type ${message.type}`, message);
        const { type } = message;
        switch (type) {
            case "isHeadphoneMotionAvailable":
                this.#onIsAvailableUpdated(message.isHeadphoneMotionAvailable);
                break;
            case "isHeadphoneMotionActive":
                this.#onIsActiveUpdated(message.isHeadphoneMotionActive);
                break;
            case "headphoneMotionData":
                this.#onMotionData(message);
                break;
            default:
                _console.error(`uncaught message type ${type}`);
                break;
        }
    }
}
export default HeadphoneMotionManager.shared;
