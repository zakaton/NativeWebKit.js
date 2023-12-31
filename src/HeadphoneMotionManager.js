import EventDispatcher from "./utils/EventDispatcher.js";
import Console from "./utils/Console.js";

/** @typedef {"default" | "left headphone" | "right headphone" | "unknown"} HeadphoneMotionSensorLocation */

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

class HeadphoneMotionManager extends EventDispatcher {
    static #shared = new HeadphoneMotionManager();
    static get shared() {
        return this.#shared;
    }
}
export default HeadphoneMotionManager.shared;
