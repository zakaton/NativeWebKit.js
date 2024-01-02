import { HeadphoneMotionManager } from "../../../src/NativeWebKit.js";
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
    console.log("received headphone motionData", motionData);
    onHeadphoneMotionData(motionData);
});

/** @type {HTMLSelectElement} */
const orientationSelect = document.getElementById("orientation");
/** @typedef {"quaternion" | "euler" | "rotation rate" | "no orientation"} OrientationMode */
/** @type {OrientationMode} */
var orientationMode = orientationSelect.value;
orientationSelect.addEventListener("input", () => {
    targetEntity.object3D.quaternion.identity();
    orientationMode = orientationSelect.value;
    console.log("new orientation mode", orientationMode);
});

/** @type {HTMLSelectElement} */
const translationSelect = document.getElementById("translation");
/** @typedef {"user acceleration" | "gravity" | "no translation"} TranslationMode */
/** @type {TranslationMode} */
var translationMode = translationSelect.value;
translationSelect.addEventListener("input", () => {
    targetEntity.object3D.position.set(0, 0, 0);
    translationMode = translationSelect.value;
    console.log("new translation mode", translationMode);
});

/** @type {boolean} */
var isMirrorModeEnabled = false;
/** @type {HTMLButtonElement} */
const toggleMirrorModeButton = document.getElementById("toggleMirrorMode");
toggleMirrorModeButton.addEventListener("click", () => {
    isMirrorModeEnabled = !isMirrorModeEnabled;
    console.log(`updated isMirrorModeEnabled to ${isMirrorModeEnabled}`);
    toggleMirrorModeButton.innerText = isMirrorModeEnabled ? "disable mirror" : "enable mirror";

    let airpodX = Math.abs(leftAirpodEntity.object3D.position.x);
    airpodX = isMirrorModeEnabled ? -airpodX : airpodX;
    leftAirpodEntity.object3D.position.x = -airpodX;
    rightAirpodEntity.object3D.position.x = airpodX;
});

/** @typedef {import("../../src/three/three.module.min.js").Vector3} Vector3 */
/** @typedef {import("../../src/three/three.module.min.js").Quaternion} Quaternion */
/** @typedef {import("../../src/three/three.module.min.js").Euler} Euler */

/** @type {Euler} */
const eulerOffset = new THREE.Euler();
eulerOffset.order = "YXZ";
/** @type {HTMLButtonElement} */
const resetOrientationButton = document.getElementById("resetOrientation");
resetOrientationButton.addEventListener("click", () => {
    console.log("resetting orientation");
    /** @type {Quaternion} */
    const quaternion = new THREE.Quaternion(...HeadphoneMotionManager.motionData.quaternion);
    eulerOffset.setFromQuaternion(quaternion);
});

const targetEntity = document.getElementById("target");
const targetPositionOffsetEntity = document.getElementById("targetPositionOffset");
const targetRotationOffsetEntity = document.getElementById("targetRotationOffset");

/** @param {HeadphoneMotionData} motionData */
function onHeadphoneMotionData(motionData) {
    /** @type {Vector3|undefined} */
    var newPosition;
    switch (translationMode) {
        case "no translation":
            break;
        case "user acceleration":
            newPosition = new THREE.Vector3(...motionData.userAcceleration);
            break;
        case "gravity":
            newPosition = new THREE.Vector3(...motionData.gravity);
            break;
        default:
            throw Error(`uncaught translation mode ${translationMode}`);
    }
    if (newPosition) {
        if (isMirrorModeEnabled) {
            newPosition.z *= -1;
        }
        targetPositionOffsetEntity.object3D.position.lerp(newPosition, 0.5);
    }

    /** @type {Euler|undefined} */
    var newEuler;
    switch (orientationMode) {
        case "no orientation":
            break;
        case "euler":
        case "quaternion":
            if (orientationMode == "euler") {
                newEuler = new THREE.Euler(...motionData.euler, "YXZ");
            } else {
                newEuler = new THREE.Euler()
                    .setFromQuaternion(new THREE.Quaternion(...motionData.quaternion))
                    .reorder("YXZ");
            }
            newEuler.x -= eulerOffset.x;
            newEuler.y -= eulerOffset.y;
            newEuler.z -= eulerOffset.z;
            break;
        case "rotation rate":
            newEuler = new THREE.Euler(...motionData.rotationRate, "YXZ");
            break;
        default:
            throw Error(`uncaught orientation mode ${orientationMode}`);
    }

    if (newEuler) {
        if (isMirrorModeEnabled) {
            newEuler.z *= -1;
            newEuler.y *= -1;
            newEuler.y += Math.PI;
        }

        const newQuaternion = new THREE.Quaternion().setFromEuler(newEuler);
        targetRotationOffsetEntity.object3D.quaternion.slerp(newQuaternion, 0.5);
    }
}

/** @typedef {import("../../../src/HeadphoneMotionManager.js").HeadphoneMotionSensorLocation} HeadphoneMotionSensorLocation */

HeadphoneMotionManager.addEventListener("sensorLocation", (event) => {
    /** @type {HeadphoneMotionSensorLocation} */
    const sensorLocation = event.message.sensorLocation;
    console.log("updated sensor location", sensorLocation);
    onSensorLocationUpdate(sensorLocation);
});

/** @type {HTMLElement} */
const leftAirpodEntity = document.getElementById("leftAirpod");
/** @type {HTMLElement} */
const rightAirpodEntity = document.getElementById("rightAirpod");

/**
 * @param {HeadphoneMotionSensorLocation} sensorLocation
 * @throws {Error}
 */
function onSensorLocationUpdate(sensorLocation) {
    var showLeftAirpod = false;
    var showRightAirpod = false;

    switch (sensorLocation) {
        case "default":
            break;
        case "left headphone":
            showLeftAirpod = true;
            break;
        case "right headphone":
            showRightAirpod = true;
            break;
        case "unknown":
            break;
        default:
            throw Error("uncaught sensor location", sensorLocation);
    }

    if (leftAirpodEntity.object3D.visible != showLeftAirpod) {
        leftAirpodEntity.object3D.visible = showLeftAirpod;
    }
    if (rightAirpodEntity.object3D.visible != showRightAirpod) {
        rightAirpodEntity.object3D.visible = showRightAirpod;
    }
}
