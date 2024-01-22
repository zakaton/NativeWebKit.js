import { HeadphoneMotionManager, utils } from "../../../src/NativeWebKit.js";
//import { HeadphoneMotionManager } from "../../../build/nativewebkit.module.min.js";
console.log(HeadphoneMotionManager);
window.HeadphoneMotionManager = HeadphoneMotionManager;
HeadphoneMotionManager.checkAvailabilityOnLoad = true;
HeadphoneMotionManager.stopUpdatesOnUnload = true;

/** @type {HTMLInputElement} */
const isAvailableCheckbox = document.getElementById("isAvailable");
HeadphoneMotionManager.addEventListener("isAvailable", (event) => {
    console.log("isAvailable", event.message.isAvailable);
    isAvailableCheckbox.checked = HeadphoneMotionManager.isAvailable;
});

/** @type {HTMLInputElement} */
const isActiveCheckbox = document.getElementById("isActive");
HeadphoneMotionManager.addEventListener("isActive", (event) => {
    console.log("isActive", event.message.isActive);

    isActiveCheckbox.checked = HeadphoneMotionManager.isActive;

    startUpdatesButton.disabled = HeadphoneMotionManager.isActive;
    stopUpdatesButton.disabled = !HeadphoneMotionManager.isActive;

    resetOrientationButton.disabled = !HeadphoneMotionManager.isActive;
});

/** @type {HTMLButtonElement} */
const startUpdatesButton = document.getElementById("startUpdates");
startUpdatesButton.addEventListener("click", () => {
    console.log("starting updates");
    HeadphoneMotionManager.startUpdates();
});
/** @type {HTMLButtonElement} */
const stopUpdatesButton = document.getElementById("stopUpdates");
stopUpdatesButton.addEventListener("click", () => {
    console.log("stopping updates");
    HeadphoneMotionManager.stopUpdates();
});

/** @typedef {import("../../../src/HeadphoneMotionManager.js").HeadphoneMotionData} HeadphoneMotionData */

HeadphoneMotionManager.addEventListener("motionData", (event) => {
    /** @type {import("../../../src/HeadphoneMotionManager.js").HeadphoneMotionData}} */
    const motionData = event.message.motionData;
    //console.log("received headphone motionData", motionData);
    onHeadphoneMotionData(motionData);
});

/** @typedef {import("../../src/three/three.module.min.js").Vector3} Vector3 */
/** @typedef {import("../../src/three/three.module.min.js").Quaternion} Quaternion */
/** @typedef {import("../../src/three/three.module.min.js").Euler} Euler */

/** @type {Euler} */
const headphoneEulerOffset = new THREE.Euler();
headphoneEulerOffset.order = "YXZ";
/** @type {Euler} */
const _euler = new THREE.Euler();
_euler.order = "YXZ";
/** @type {Quaternion} */
const headQuaternion = new THREE.Quaternion();
/** @type {Quaternion} */
const calibratedHeadQuaternion = new THREE.Quaternion();

/** @type {Euler} */
const rotateYaw180DegreesEuler = new THREE.Euler();
rotateYaw180DegreesEuler.y = Math.PI;
/** @type {Quaternion} */
const rotate180DegreesQuaternion = new THREE.Quaternion();
rotate180DegreesQuaternion.setFromEuler(rotateYaw180DegreesEuler);

/** @type {Euler} */
const rotatePitch90DegreesEuler = new THREE.Euler();
rotatePitch90DegreesEuler.x = -Math.PI / 2;
/** @type {Quaternion} */
const rotatePitch90DegreesQuaternion = new THREE.Quaternion();
rotatePitch90DegreesQuaternion.setFromEuler(rotatePitch90DegreesEuler);

/** @type {Euler} */
const euler = new THREE.Euler(0, 0, 0, "YXZ");
/**
 * @param {Quaternion} quaternion
 * @param  {...string} axes
 */
const mirrorQuaternionAboutAxes = (quaternion, ...axes) => {
    euler.setFromQuaternion(quaternion);
    axes.forEach((axis) => {
        euler[axis] *= -1;
    });
    quaternion.setFromEuler(euler);
};
/**
 * @param {Quaternion} quaternion
 * @param  {...string} axes
 */
const removeAxesFromQuaternion = (quaternion, ...axes) => {
    euler.setFromQuaternion(quaternion);
    axes.forEach((axis) => {
        euler[axis] = 0;
    });
    quaternion.setFromEuler(euler);
};

/** @type {HTMLButtonElement} */
const resetOrientationButton = document.getElementById("resetOrientation");
resetOrientationButton.addEventListener("click", () => {
    console.log("resetting orientation");
    /** @type {Quaternion} */
    const quaternion = new THREE.Quaternion();

    if (HeadphoneMotionManager.motionData) {
        /** @type {Quaternion} */
        quaternion.set(...HeadphoneMotionManager.motionData.quaternion);
        headphoneEulerOffset.setFromQuaternion(quaternion);
    }

    quaternion.copy(deviceQuaternion);
    deviceEulerOffset.setFromQuaternion(quaternion);
    deviceEulerOffset.x = 0;
    deviceEulerOffset.z = 0;
    deviceEulerOffset.y *= -1;
    deviceQuaternionOffset.setFromEuler(deviceEulerOffset);
});

const parallaxTargetEntity = document.getElementById("rotation");
/** @type {Quaternion} */
const parallaxTargetQuaternion = new THREE.Quaternion();

/** @param {HeadphoneMotionData} motionData */
function onHeadphoneMotionData(motionData) {
    headQuaternion.set(...motionData.quaternion);
    _euler.setFromQuaternion(headQuaternion);
    _euler.x -= headphoneEulerOffset.x;
    _euler.y -= headphoneEulerOffset.y;
    _euler.z -= headphoneEulerOffset.z;
    _euler.z = 0;

    calibratedHeadQuaternion.setFromEuler(_euler);

    parallaxTargetQuaternion.copy(calibratedHeadQuaternion);
    parallaxTargetQuaternion.premultiply(inverseDeviceQuaternion);
    removeAxesFromQuaternion(parallaxTargetQuaternion, "z");
    mirrorQuaternionAboutAxes(parallaxTargetQuaternion, "x", "y");

    parallaxTargetEntity.object3D.quaternion.slerp(parallaxTargetQuaternion, 0.5);
}

/** @type {Euler} */
const deviceEuler = new THREE.Euler();
deviceEuler.order = "YXZ";
/** @type {Quaternion} */
const deviceQuaternion = new THREE.Quaternion();
/** @type {Euler} */
const deviceEulerOffset = new THREE.Euler(0, 0, 0, "YXZ");
/** @type {Quaternion} */
const deviceQuaternionOffset = new THREE.Quaternion();
/** @type {Quaternion} */
const calibratedDeviceQuaternion = new THREE.Quaternion();
/** @type {Quaternion} */
const inverseDeviceQuaternion = new THREE.Quaternion();
window.addEventListener("deviceorientation", (event) => {
    const { alpha, beta, gamma } = event;
    const pitch = THREE.MathUtils.degToRad(beta);
    const yaw = THREE.MathUtils.degToRad(alpha);
    const roll = -THREE.MathUtils.degToRad(gamma);
    deviceEuler.set(pitch, yaw, roll);

    deviceQuaternion.setFromEuler(deviceEuler);
    deviceQuaternion.multiply(rotatePitch90DegreesQuaternion);
    removeAxesFromQuaternion(deviceQuaternion, "z");

    calibratedDeviceQuaternion.copy(deviceQuaternion);
    calibratedDeviceQuaternion.premultiply(deviceQuaternionOffset);

    inverseDeviceQuaternion.copy(calibratedDeviceQuaternion);
    inverseDeviceQuaternion.invert();

    //parallaxTargetEntity.object3D.quaternion.slerp(calibratedDeviceQuaternion, 0.5);
});

if (utils.is_iOS) {
    document.addEventListener(
        "click",
        () => {
            DeviceMotionEvent.requestPermission();
        },
        { once: true }
    );
}
