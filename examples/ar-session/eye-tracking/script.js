import { ARSessionManager, utils } from "../../../src/NativeWebKit.js";
//import { ARSessionManager } from "../../../build/nativewebkit.module.js";
window.ARSessionManager = ARSessionManager;
console.log(ARSessionManager);

ARSessionManager.checkFaceTrackingSupportOnLoad = true;
ARSessionManager.checkIsRunningOnLoad = true;
ARSessionManager.pauseOnUnload = false;
ARSessionManager.checkDebugOptionsOnLoad = true;
ARSessionManager.checkCameraModeOnLoad = true;
ARSessionManager.checkShowCameraOnLoad = true;

const scene = document.querySelector("a-scene");

/** @type {HTMLInputElement} */
const isSupportedCheckbox = document.getElementById("isSupported");
isSupportedCheckbox.checked = ARSessionManager.isSupported;

if (ARSessionManager.isSupported) {
    ARSessionManager.setCameraMode("ar");
    //ARSessionManager.setDebugOptions({ showAnchorOrigins: true });
    ARSessionManager.setMessageConfiguration({ faceAnchorEyes: true });
}

/** @type {HTMLInputElement} */
const isFaceTrackingSupportedCheckbox = document.getElementById("isFaceTrackingSupported");
ARSessionManager.addEventListener("faceTrackingSupport", (event) => {
    /** @type {import("../../../src/ARSessionManager.js").ARSFaceTrackingSupport} */
    const faceTrackingSupport = event.message.faceTrackingSupport;
    console.log("faceTrackingSupport", faceTrackingSupport);
    isFaceTrackingSupportedCheckbox.checked = faceTrackingSupport.isSupported;
});

/** @typedef {import("../../../src/ARSessionManager.js").ARSConfigurationType} ARSConfigurationType */
/** @typedef {import("../../../src/ARSessionManager.js").ARSConfiguration} ARSConfiguration */

/** @type {import("../../../src/ARSessionManager.js").ARSFaceTrackingConfiguration} */
var configuration = { type: "faceTracking", isWorldTrackingEnabled: false };

/** @type {HTMLButtonElement} */
const runButton = document.getElementById("run");
runButton.addEventListener("click", () => {
    ARSessionManager.run(configuration);
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

    eyeTrackingCursor.style.display = isRunning ? "block" : "none";

    runButton.disabled = isRunning;
    pauseButton.disabled = !isRunning;
});

/** @typedef {import("../../../src/ARSessionManager.js").ARSDebugOptions} ARSDebugOptions */
var isDebugEnabled = false;
/** @type {HTMLButtonElement} */
const toggleDebugButton = document.getElementById("toggleDebug");
toggleDebugButton.addEventListener("click", () => {
    const newIsDebugEnabled = !isDebugEnabled;
    ARSessionManager.setDebugOptions({
        showAnchorOrigins: newIsDebugEnabled,
    });
});
toggleDebugButton.disabled = !ARSessionManager.isSupported;

ARSessionManager.addEventListener("debugOptions", (event) => {
    /** @type {ARSDebugOptions} */
    const debugOptions = event.message.debugOptions;
    console.log("debugOptions", debugOptions);
    isDebugEnabled = debugOptions.showAnchorOrigins;
    toggleDebugButton.innerText = isDebugEnabled ? "hide debug" : "show debug";
});

/** @type {HTMLButtonElement} */
const toggleShowCameraButton = document.getElementById("toggleShowCamera");
toggleShowCameraButton.addEventListener("click", () => {
    ARSessionManager.setShowCamera(!ARSessionManager.showCamera);
});
toggleShowCameraButton.disabled = !ARSessionManager.isSupported;

ARSessionManager.addEventListener("showCamera", (event) => {
    /** @type {boolean} */
    const showCamera = event.message.showCamera;
    console.log("showCamera", showCamera);
    toggleShowCameraButton.innerText = showCamera ? "hide camera" : "show camera";
});

/** @typedef {import("../../src/three/three.module.min.js").Vector2} Vector2 */
/** @typedef {import("../../src/three/three.module.min.js").Vector3} Vector3 */
/** @typedef {import("../../src/three/three.module.min.js").Quaternion} Quaternion */
/** @typedef {import("../../src/three/three.module.min.js").Euler} Euler */
/** @typedef {import("../../src/three/three.module.min.js").Matrix4} Matrix4 */
/** @typedef {import("../../src/three/three.module.min.js").Box2} Box2 */
/** @typedef {import("../../src/three/three.module.min.js").PerspectiveCamera} PerspectiveCamera */

/** @type {Matrix4} */
const cameraMatrix = new THREE.Matrix4();
const cameraMatrixInverse = new THREE.Matrix4();
const aframeCamera = document.getElementById("camera");
/** @type {PerspectiveCamera} */
var threeCamera;
aframeCamera.addEventListener("loaded", () => {
    threeCamera = aframeCamera?.components?.camera?.camera;
    console.log("threeCamera", threeCamera);
});
var latestFocalLength;
ARSessionManager.addEventListener("camera", (event) => {
    /** @type {import("../../../src/ARSessionManager.js").ARSCamera} */
    const camera = event.message.camera;

    aframeCamera.object3D.position.set(...camera.position);
    cameraMatrix.setPosition(...camera.position);

    if (ARSessionManager.cameraMode == "ar") {
        const quaternion = new THREE.Quaternion(...camera.quaternion);
        aframeCamera.object3D.quaternion.copy(quaternion);
        cameraMatrix.makeRotationFromQuaternion(quaternion);
    } else {
        /** @type {Euler} */
        const euler = new THREE.Euler(...camera.eulerAngles);
        euler.z += Math.PI / 2;
        aframeCamera.object3D.rotation.copy(euler);
        cameraMatrix.makeRotationFromEuler(euler);
    }
    cameraMatrixInverse.copy(cameraMatrix).invert();

    if (threeCamera) {
        if (latestFocalLength != camera.focalLength) {
            threeCamera.setFocalLength(camera.focalLength * 1.14);
            latestFocalLength = camera.focalLength;
        }
    }

    scene.renderer.toneMappingExposure = camera.exposureOffset;
});

const leftEyeEntity = document.getElementById("leftEye");
const rightEyeEntity = document.getElementById("rightEye");
const faceEntity = document.getElementById("face");
const lookAtPointEntity = document.getElementById("lookAtPoint");
var eyeBlinkThreshold = 0.5;
/** @type {Matrix4} */
const faceMatrix = new THREE.Matrix4();
/** @type {Matrix4} */
const faceMatrixInverse = new THREE.Matrix4();

const eyeTrackingCursor = document.getElementById("eyeTrackingCursor");
/** @type {Vector2} */
const eyeTrackingPoint = new THREE.Vector2();
/** @type {Box2} */
const eyeTrackingRange = new THREE.Box2();

/** @type {HTMLButtonElement} */
const resetEyeCalibrationButton = document.getElementById("resetEyeCalibration");
resetEyeCalibrationButton.addEventListener("click", () => {
    eyeTrackingRange.makeEmpty();
});
resetEyeCalibrationButton.disabled = !ARSessionManager.isSupported;

var calibratingEyeTrackingRange = false;
/** @type {HTMLButtonElement} */
const toggleEyeCalibrationButton = document.getElementById("toggleEyeCalibration");
toggleEyeCalibrationButton.addEventListener("click", () => {
    calibratingEyeTrackingRange = !calibratingEyeTrackingRange;
    toggleEyeCalibrationButton.innerText = calibratingEyeTrackingRange
        ? "stop calibrating eye-tracking"
        : "calibrate eye-tracking";
});
toggleEyeCalibrationButton.disabled = !ARSessionManager.isSupported;

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

        faceMatrix.makeRotationFromQuaternion(newQuaternion);
        faceMatrix.setPosition(newPosition);
        faceMatrixInverse.copy(faceMatrix).invert();

        faceEntity.object3D.position.lerp(newPosition, 0.5);
        faceEntity.object3D.quaternion.slerp(newQuaternion, 0.5);

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
        const lookAtPoint = new THREE.Vector3(...faceAnchor.lookAtPoint);
        const newLookAtPointEntityPosition = lookAtPoint.clone().normalize().multiplyScalar(0.3);
        lookAtPointEntity.object3D.position.lerp(newLookAtPointEntityPosition, 0.5);

        const isLeftEyeClosed = faceAnchor.blendShapes.eyeBlinkLeft > eyeBlinkThreshold;
        const showLeftEye = !isLeftEyeClosed;
        if (leftEyeEntity.object3D.visible != showLeftEye) {
            leftEyeEntity.object3D.visible = showLeftEye;
        }

        const isRightEyeClosed = faceAnchor.blendShapes.eyeBlinkRight > eyeBlinkThreshold;
        const showRightEye = !isRightEyeClosed;
        if (rightEyeEntity.object3D.visible != showRightEye) {
            rightEyeEntity.object3D.visible = showRightEye;
        }

        const lookAtPointInWorld = lookAtPoint.clone().applyMatrix4(faceMatrix);
        const lookAtPointEntityInWorld = new THREE.Vector3();
        lookAtPointEntity.object3D.getWorldPosition(lookAtPointEntityInWorld);
        const lookAtPointInCamera = lookAtPointInWorld.clone().applyMatrix4(cameraMatrixInverse);
        /** @type {Vector2} */
        const lookAtPointInCameraPoint = new THREE.Vector2(lookAtPointInCamera.x, lookAtPointInCamera.y);
        if (calibratingEyeTrackingRange && !isLeftEyeClosed && !isRightEyeClosed) {
            eyeTrackingRange.expandByPoint(lookAtPointInCameraPoint);
        }
        eyeTrackingRange.getParameter(lookAtPointInCameraPoint, eyeTrackingPoint);

        eyeTrackingCursor.style.left = `${eyeTrackingPoint.x * 100}%`;
        eyeTrackingCursor.style.top = `${(1 - eyeTrackingPoint.y) * 100}%`;

        faceSpan.innerText = JSON.stringify(newPosition.toArray().map((v) => v.toFixed(6)));
        lookAtPointSpan.innerText = JSON.stringify(lookAtPoint.toArray().map((v) => v.toFixed(6)));
        lookAtPointEntitySpan.innerText = JSON.stringify(lookAtPointEntityInWorld.toArray().map((v) => v.toFixed(6)));
        lookAtPointInWorldSpan.innerText = JSON.stringify(lookAtPointInWorld.toArray().map((v) => v.toFixed(6)));
        lookAtPointInCameraSpan.innerText = JSON.stringify(lookAtPointInCamera.toArray().map((v) => v.toFixed(6)));
        eyeTrackingPointSpan.innerText = JSON.stringify(eyeTrackingPoint.toArray().map((v) => v.toFixed(6)));
    }
});
const faceSpan = document.getElementById("faceSpan");
const lookAtPointSpan = document.getElementById("lookAtPointSpan");
const lookAtPointInCameraSpan = document.getElementById("lookAtPointInCameraSpan");
const lookAtPointInWorldSpan = document.getElementById("lookAtPointInWorldSpan");
const lookAtPointEntitySpan = document.getElementById("lookAtPointEntitySpan");
const eyeTrackingPointSpan = document.getElementById("eyeTrackingPointSpan");

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
