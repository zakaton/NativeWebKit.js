import { ARSessionManager, utils } from "../../../src/NativeWebKit.js";
//import { ARSessionManager } from "../../../build/nativewebkit.module.js";
window.ARSessionManager = ARSessionManager;
console.log(ARSessionManager);

ARSessionManager.checkWorldTrackingSupportOnLoad = true;
ARSessionManager.checkFaceTrackingSupportOnLoad = true;
ARSessionManager.checkIsRunningOnLoad = true;
ARSessionManager.pauseOnUnload = true;
ARSessionManager.checkCameraModeOnLoad = true;

const scene = document.querySelector("a-scene");

/** @type {HTMLInputElement} */
const isSupportedCheckbox = document.getElementById("isSupported");
isSupportedCheckbox.checked = ARSessionManager.isSupported;

if (ARSessionManager.isSupported) {
    ARSessionManager.setShowCamera(false);
    ARSessionManager.setMessageConfiguration({ faceAnchorEyes: true });
}

/** @type {HTMLInputElement} */
const isWorldTrackingSupportedWithFaceTrackingCheckbox = document.getElementById(
    "isWorldTrackingSupportedWithFaceTracking"
);
ARSessionManager.addEventListener("worldTrackingSupport", (event) => {
    /** @type {import("../../../src/ARSessionManager.js").ARSWorldTrackingSupport} */
    const worldTrackingSupport = event.message.worldTrackingSupport;
    console.log("worldTrackingSupport", worldTrackingSupport);
    isWorldTrackingSupportedWithFaceTrackingCheckbox.checked =
        worldTrackingSupport.isSupported && worldTrackingSupport.supportsUserFaceTracking;
});
/** @type {HTMLInputElement} */
const isFaceTrackingSupportedWithWorldTrackingCheckbox = document.getElementById(
    "isFaceTrackingSupportedWithWorldTracking"
);
ARSessionManager.addEventListener("faceTrackingSupport", (event) => {
    /** @type {import("../../../src/ARSessionManager.js").ARSFaceTrackingSupport} */
    const faceTrackingSupport = event.message.faceTrackingSupport;
    console.log("faceTrackingSupper", faceTrackingSupport);
    isFaceTrackingSupportedWithWorldTrackingCheckbox.checked =
        faceTrackingSupport.isSupported && faceTrackingSupport.supportsWorldTracking;
});

/** @type {HTMLSelectElement} */
const configurationTypeSelect = document.getElementById("configurationType");
configurationTypeSelect.addEventListener("input", () => {
    if (ARSessionManager.isRunning) {
        runARSession();
    }
});
ARSessionManager.addEventListener("configuration", () => {
    configurationTypeSelect.value = ARSessionManager.configuration.type;
});

/** @typedef {import("../../../src/ARSessionManager.js").ARSConfigurationType} ARSConfigurationType */
/** @typedef {import("../../../src/ARSessionManager.js").ARSConfiguration} ARSConfiguration */
/** @typedef {import("../../../src/ARSessionManager.js").ARSWorldTrackingConfiguration} ARSWorldTrackingConfiguration */
/** @typedef {import("../../../src/ARSessionManager.js").ARSFaceTrackingConfiguration} ARSFaceTrackingConfiguration */

/** @type {ARSFaceTrackingConfiguration} */
var faceTrackingConfiguration = { type: "faceTracking", isWorldTrackingEnabled: true };
/** @type {ARSWorldTrackingConfiguration} */
var worldTrackingConfiguration = { type: "worldTracking", userFaceTrackingEnabled: true };

function runARSession() {
    const configuration =
        configurationTypeSelect.value == "faceTracking" ? faceTrackingConfiguration : worldTrackingConfiguration;
    ARSessionManager.run(configuration);
}

/** @type {HTMLButtonElement} */
const runButton = document.getElementById("run");
runButton.addEventListener("click", () => {
    runARSession();
});
runButton.disabled = !ARSessionManager.isSupported;

/** @type {HTMLButtonElement} */
const pauseButton = document.getElementById("pause");
pauseButton.addEventListener("click", () => {
    ARSessionManager.pause();
});
pauseButton.disabled = true;

ARSessionManager.addEventListener("isRunning", (event) => {
    /** @type {Boolean} */
    const isRunning = event.message.isRunning;
    console.log("isRunning", isRunning);

    runButton.disabled = isRunning;
    pauseButton.disabled = !isRunning;
});

const virtualCameraEntity = document.getElementById("virtualCamera");
const faceEntity = document.getElementById("face");

var latestFocalLength;
ARSessionManager.addEventListener("camera", (event) => {
    /** @type {import("../../../src/ARSessionManager.js").ARSCamera} */
    const camera = event.message.camera;

    virtualCameraEntity.object3D.position.set(...camera.position);
    virtualCameraEntity.object3D.quaternion.set(...camera.quaternion);

    if (virtualCameraEntity.object3D) {
        if (latestFocalLength != camera.focalLength) {
            // FILL - set angle of cone to match focal length?
            latestFocalLength = camera.focalLength;
        }
    }

    scene.renderer.toneMappingExposure = camera.exposureOffset;
});

const leftEyeEntity = document.getElementById("leftEye");
const rightEyeEntity = document.getElementById("rightEye");
const lookAtPointEntity = document.getElementById("lookAtPoint");
const eyeBlinkThreshold = 0.5;

/** @typedef {import("../../src/three/three.module.min.js").Vector3} Vector3 */
/** @typedef {import("../../src/three/three.module.min.js").Quaternion} Quaternion */
/** @typedef {import("../../../src/ARSessionManager.js").ARSFaceAnchor} ARSFaceAnchor */
ARSessionManager.addEventListener("faceAnchors", (event) => {
    /** @type {ARSFaceAnchor[]} */
    const faceAnchors = event.message.faceAnchors;
    const faceAnchor = faceAnchors[0];
    if (faceAnchor) {
        /** @type {Vector3} */
        const newPosition = new THREE.Vector3(...faceAnchor.position);
        /** @type {Quaternion} */
        const newQuaternion = new THREE.Quaternion(...faceAnchor.quaternion);

        faceEntity.object3D.position.lerp(newPosition, 0.5);
        faceEntity.object3D.quaternion.slerp(newQuaternion, 0.5);

        const isLeftEyeClosed = faceAnchor.blendShapes.eyeBlinkLeft > eyeBlinkThreshold;
        const isRightEyeClosed = faceAnchor.blendShapes.eyeBlinkRight > eyeBlinkThreshold;

        /** @type {Vector3} */
        const newLeftEyePosition = new THREE.Vector3(...faceAnchor.leftEye.position);
        /** @type {Quaternion} */
        const newLeftEyeQuaternion = new THREE.Quaternion(...faceAnchor.leftEye.quaternion);
        leftEyeEntity.object3D.position.lerp(newLeftEyePosition, 0.5);
        leftEyeEntity.object3D.quaternion.slerp(newLeftEyeQuaternion, 0.5);

        /** @type {Vector3} */
        const newRightEyePosition = new THREE.Vector3(...faceAnchor.rightEye.position);
        /** @type {Quaternion} */
        const newRightEyeQuaternion = new THREE.Quaternion(...faceAnchor.rightEye.quaternion);
        rightEyeEntity.object3D.position.lerp(newRightEyePosition, 0.5);
        rightEyeEntity.object3D.quaternion.slerp(newRightEyeQuaternion, 0.5);

        /** @type {Vector3} */
        const newLookAtPointEntityPosition = new THREE.Vector3(...faceAnchor.lookAtPoint);
        lookAtPointEntity.object3D.position.lerp(newLookAtPointEntityPosition, 0.5);

        const showLeftEye = !isLeftEyeClosed;
        if (leftEyeEntity.object3D.visible != showLeftEye) {
            leftEyeEntity.object3D.visible = showLeftEye;
        }

        const showRightEye = !isRightEyeClosed;
        if (rightEyeEntity.object3D.visible != showRightEye) {
            rightEyeEntity.object3D.visible = showRightEye;
        }
    }
});

/** @typedef {import("../../../src/ARSessionManager.js").ARSLightEstimate} ARSLightEstimate */

const ambientLight = document.getElementById("ambientLight");
const directionalLight = document.getElementById("directionalLight");

ARSessionManager.addEventListener("lightEstimate", (event) => {
    /** @type {ARSLightEstimate} */
    const lightEstimate = event.message.lightEstimate;
    ambientLight.components.light.light.intensity = lightEstimate.ambientIntensity / 1000;
    const lightColor = utils.colorTemperatureToRGB(lightEstimate.ambientColorTemperature);
    ambientLight.components.light.light.color.setRGB(...lightColor);
    directionalLight.components.light.light.color.setRGB(...lightColor);
    if (lightEstimate.primaryLightDirection) {
        directionalLight.components.light.light.intensity = lightEstimate.primaryLightIntensity / 1000;
        directionalLight.object3D.position.set(...lightEstimate.primaryLightDirection.map((v) => -v));
    }
});
