import { ARSessionManager, utils } from "../../../src/NativeWebKit.js";
//import { ARSessionManager } from "../../../build/nativewebkit.module.js";
window.ARSessionManager = ARSessionManager;
console.log(ARSessionManager);

ARSessionManager.checkWorldTrackingSupportOnLoad = true;
ARSessionManager.checkFaceTrackingSupportOnLoad = true;
ARSessionManager.checkIsRunningOnLoad = true;
ARSessionManager.pauseOnUnload = true;

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

/** @type {"faceTracking" | "worldTracking"} */
var configurationType;

/** @type {HTMLSelectElement} */
const configurationTypeSelect = document.getElementById("configurationType");
configurationTypeSelect.addEventListener("input", () => {
    configurationType = configurationTypeSelect.value;
    console.log("configurationType", configurationType);
    setMirrorMode(false);
    if (ARSessionManager.isRunning) {
        runARSession();
    }
});
configurationType = configurationTypeSelect.value;
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
    const configuration = configurationType == "faceTracking" ? faceTrackingConfiguration : worldTrackingConfiguration;
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

/** @type {Vector3} */
const cameraPosition = new THREE.Vector3();
/** @type {Quaternion} */
const cameraQuaternion = new THREE.Quaternion();

var latestFocalLength;
ARSessionManager.addEventListener("camera", (event) => {
    /** @type {import("../../../src/ARSessionManager.js").ARSCamera} */
    const camera = event.message.camera;

    cameraPosition.set(...camera.position);
    cameraQuaternion.set(...camera.quaternion);

    if (configurationType == "faceTracking" && !isMirrorModeEnabled) {
        cameraPosition.x *= -1;
        mirrorQuaternionAboutAxes(cameraQuaternion, "z", "y");
        // cameraQuaternion.multiply(rotate180DegreesQuaternion); // to emulate the rear camera
    }

    virtualCameraEntity.object3D.position.lerp(cameraPosition, 0.5);
    virtualCameraEntity.object3D.quaternion.slerp(cameraQuaternion, 0.5);

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
/** @typedef {import("../../src/three/three.module.min.js").Euler} Euler */
/** @typedef {import("../../src/three/three.module.min.js").Quaternion} Quaternion */

/** @type {Vector3} */
const facePosition = new THREE.Vector3();
/** @type {Quaternion} */
const faceQuaternion = new THREE.Quaternion();

/** @type {Vector3} */
const leftEyePosition = new THREE.Vector3();
/** @type {Quaternion} */
const leftEyeQuaternion = new THREE.Quaternion();

/** @type {Vector3} */
const rightEyePosition = new THREE.Vector3();
/** @type {Quaternion} */
const rightEyeQuaternion = new THREE.Quaternion();
/** @type {Vector3} */
const lookAtPoint = new THREE.Vector3();

/** @type {Euler} */
const rotateYaw180DegreesEuler = new THREE.Euler();
rotateYaw180DegreesEuler.y = Math.PI;
/** @type {Quaternion} */
const rotate180DegreesQuaternion = new THREE.Quaternion();
rotate180DegreesQuaternion.setFromEuler(rotateYaw180DegreesEuler);

/** @typedef {import("../../../src/ARSessionManager.js").ARSFaceAnchor} ARSFaceAnchor */
ARSessionManager.addEventListener("faceAnchors", (event) => {
    /** @type {ARSFaceAnchor[]} */
    const faceAnchors = event.message.faceAnchors;
    const faceAnchor = faceAnchors[0];
    if (faceAnchor) {
        facePosition.set(...faceAnchor.position);
        faceQuaternion.set(...faceAnchor.quaternion);

        if (shouldCorrectData) {
            if (configurationType == "worldTracking") {
                faceQuaternion.multiply(rotate180DegreesQuaternion);
            }
        }

        if (configurationType == "faceTracking" && !isMirrorModeEnabled) {
            facePosition.x *= -1;
            mirrorQuaternionAboutAxes(faceQuaternion, "z", "y");
            faceQuaternion.multiply(rotate180DegreesQuaternion);
        }

        faceEntity.object3D.position.lerp(facePosition, 0.5);
        faceEntity.object3D.quaternion.slerp(faceQuaternion, 0.5);

        const isLeftEyeClosed = faceAnchor.blendShapes.eyeBlinkLeft > eyeBlinkThreshold;
        const isRightEyeClosed = faceAnchor.blendShapes.eyeBlinkRight > eyeBlinkThreshold;

        leftEyePosition.set(...faceAnchor.leftEye.position);
        leftEyeQuaternion.set(...faceAnchor.leftEye.quaternion);
        if (configurationType == "faceTracking" && !isMirrorModeEnabled) {
            mirrorQuaternionAboutAxes(leftEyeQuaternion, "y", "x");
        }
        if (configurationType == "worldTracking" && shouldCorrectData) {
            mirrorQuaternionAboutAxes(leftEyeQuaternion, "y", "x");
        }
        leftEyeEntity.object3D.position.lerp(leftEyePosition, 0.5);
        leftEyeEntity.object3D.quaternion.slerp(leftEyeQuaternion, 0.5);

        rightEyePosition.set(...faceAnchor.rightEye.position);
        rightEyeQuaternion.set(...faceAnchor.rightEye.quaternion);
        if (configurationType == "faceTracking" && !isMirrorModeEnabled) {
            mirrorQuaternionAboutAxes(rightEyeQuaternion, "y", "x");
        }
        if (configurationType == "worldTracking" && shouldCorrectData) {
            mirrorQuaternionAboutAxes(rightEyeQuaternion, "y", "x");
        }
        rightEyeEntity.object3D.position.lerp(rightEyePosition, 0.5);
        rightEyeEntity.object3D.quaternion.slerp(rightEyeQuaternion, 0.5);

        lookAtPoint.set(...faceAnchor.lookAtPoint);
        if (shouldCorrectData) {
            if (configurationType == "worldTracking") {
                lookAtPoint.z *= -1;
            }
        }
        if (configurationType == "faceTracking") {
            if (!isMirrorModeEnabled) {
                lookAtPoint.z *= -1;
            }
        }
        lookAtPointEntity.object3D.position.lerp(lookAtPoint, 0.5);
        lookAtPointEntity.object3D.lookAt(facePosition);

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
const virtualPrimaryLightEntity = document.getElementById("virtualPrimaryLight");
/** @type {Vector3} */
const virtualPrimaryLightPosition = new THREE.Vector3();

ARSessionManager.addEventListener("lightEstimate", (event) => {
    /** @type {ARSLightEstimate} */
    const lightEstimate = event.message.lightEstimate;
    ambientLight.components.light.light.intensity = lightEstimate.ambientIntensity / 1000;
    const lightColor = utils.colorTemperatureToRGB(lightEstimate.ambientColorTemperature);
    ambientLight.components.light.light.color.setRGB(...lightColor);
    directionalLight.components.light.light.color.setRGB(...lightColor);
    if (lightEstimate.primaryLightDirection) {
        directionalLight.components.light.light.intensity = lightEstimate.primaryLightIntensity / 1000;
        /** @type {Vector3} */
        const primaryLightDirection = new THREE.Vector3(...lightEstimate.primaryLightDirection.map((v) => -v));
        if (configurationType == "faceTracking" && !isMirrorModeEnabled) {
            primaryLightDirection.applyEuler(rotateYaw180DegreesEuler);
        }
        directionalLight.object3D.position.copy(primaryLightDirection);

        virtualPrimaryLightPosition.copy(facePosition);
        virtualPrimaryLightPosition.addScaledVector(primaryLightDirection, 0.5);
        virtualPrimaryLightEntity.object3D.position.copy(virtualPrimaryLightPosition);
        virtualPrimaryLightEntity.object3D.lookAt(facePosition);
    }
    if (virtualPrimaryLightEntity.object3D.visible != Boolean(lightEstimate.primaryLightDirection)) {
        virtualPrimaryLightEntity.object3D.visible = Boolean(lightEstimate.primaryLightDirection);
    }
});

var shouldCorrectData = false;
/** @type {HTMLButtonElement} */
const toggleDataCorrectionButton = document.getElementById("toggleDataCorrection");
toggleDataCorrectionButton.addEventListener("click", () => {
    shouldCorrectData = !shouldCorrectData;
    console.log("shouldCorrectData", shouldCorrectData);
    toggleDataCorrectionButton.innerText = shouldCorrectData ? "disable correction" : "enable correction";
});

/** @type {boolean} */
var isMirrorModeEnabled;
/** @type {HTMLButtonElement} */
const toggleMirrorModeButton = document.getElementById("toggleMirrorMode");
toggleMirrorModeButton.addEventListener("click", () => {
    setMirrorMode(!isMirrorModeEnabled);
});
ARSessionManager.addEventListener("configuration", () => {
    if (configurationType == "faceTracking") {
        toggleMirrorModeButton.removeAttribute("hidden");
        toggleDataCorrectionButton.setAttribute("hidden", "");
    } else {
        toggleMirrorModeButton.setAttribute("hidden", "");
        toggleDataCorrectionButton.removeAttribute("hidden");
    }
    configurationTypeSelect.value = ARSessionManager.configuration.type;
});

function setMirrorMode(newIsMirrorModeEnabled) {
    if (isMirrorModeEnabled === newIsMirrorModeEnabled) {
        return;
    }
    isMirrorModeEnabled = newIsMirrorModeEnabled;
    console.log({ isMirrorModeEnabled });
    toggleMirrorModeButton.innerText = isMirrorModeEnabled ? "disable mirror mode" : "enable mirror mode";

    faceEntity.querySelector(".nose").object3D.rotation.y = isMirrorModeEnabled ? 0 : Math.PI;
    leftEyeEntity.querySelector(".pupil").object3D.position.z = 0.01 * (isMirrorModeEnabled ? 1 : -1);
    rightEyeEntity.querySelector(".pupil").object3D.position.z = 0.01 * (isMirrorModeEnabled ? 1 : -1);
}
setMirrorMode(true);

/** @type {Euler} */
const mirrorEuler = new THREE.Euler(0, 0, 0, "YZX");
/**
 * @param {Quaternion} quaternion
 * @param  {...string} axes
 */
const mirrorQuaternionAboutAxes = (quaternion, ...axes) => {
    mirrorEuler.setFromQuaternion(quaternion);
    axes.forEach((axis) => {
        mirrorEuler[axis] *= -1;
    });
    quaternion.setFromEuler(mirrorEuler);
};
