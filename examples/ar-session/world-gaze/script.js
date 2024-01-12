import { ARSessionManager, utils } from "../../../src/NativeWebKit.js";
//import { ARSessionManager } from "../../../build/nativewebkit.module.js";
window.ARSessionManager = ARSessionManager;
console.log(ARSessionManager);

ARSessionManager.checkWorldTrackingSupportOnLoad = true;
ARSessionManager.checkIsRunningOnLoad = true;
ARSessionManager.pauseOnUnload = true;
ARSessionManager.checkDebugOptionsOnLoad = true;
ARSessionManager.checkCameraModeOnLoad = true;
ARSessionManager.checkShowCameraOnLoad = true;

const scene = document.querySelector("a-scene");

/** @type {HTMLInputElement} */
const isSupportedCheckbox = document.getElementById("isSupported");
isSupportedCheckbox.checked = ARSessionManager.isSupported;

if (ARSessionManager.isSupported) {
    ARSessionManager.setCameraMode("ar");
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

/** @typedef {import("../../../src/ARSessionManager.js").ARSConfigurationType} ARSConfigurationType */
/** @typedef {import("../../../src/ARSessionManager.js").ARSConfiguration} ARSConfiguration */

/** @type {import("../../../src/ARSessionManager.js").ARSWorldTrackingConfiguration} */
var configuration = { type: "worldTracking", userFaceTrackingEnabled: true };

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

const sky = document.querySelector("a-sky");
ARSessionManager.addEventListener("showCamera", (event) => {
    /** @type {boolean} */
    const showCamera = event.message.showCamera;
    console.log("showCamera", showCamera);
    const newVisible = !showCamera;
    if (newVisible != sky.object3D.visible) {
        sky.object3D.visible = newVisible;
    }
});

/** @typedef {import("../../src/three/three.module.min.js").Vector2} Vector2 */
/** @typedef {import("../../src/three/three.module.min.js").Vector3} Vector3 */
/** @typedef {import("../../src/three/three.module.min.js").Quaternion} Quaternion */
/** @typedef {import("../../src/three/three.module.min.js").Euler} Euler */
/** @typedef {import("../../src/three/three.module.min.js").Matrix4} Matrix4 */

const aframeCamera = document.getElementById("camera");
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

    if (ARSessionManager.cameraMode == "ar") {
        const quaternion = new THREE.Quaternion(...camera.quaternion);
        aframeCamera.object3D.quaternion.copy(quaternion);
    } else {
        /** @type {Euler} */
        const euler = new THREE.Euler(...camera.eulerAngles);
        euler.z += Math.PI / 2;
        aframeCamera.object3D.rotation.copy(euler);
    }

    if (threeCamera) {
        if (latestFocalLength != camera.focalLength) {
            threeCamera.setFocalLength(camera.focalLength);
            latestFocalLength = camera.focalLength;
        }
    }

    scene.renderer.toneMappingExposure = camera.exposureOffset;
});

const faceEntity = document.getElementById("face");
const lookAtPointEntity = document.getElementById("lookAtPoint");
const lookAtPointSpan = document.getElementById("lookAtPointSpan");
const facePositionSpan = document.getElementById("facePositionSpan");
const faceRotationSpan = document.getElementById("faceRotationSpan");
const cameraPositionSpan = document.getElementById("cameraPositionSpan");
const cameraRotationSpan = document.getElementById("cameraRotationSpan");
var eyeBlinkThreshold = 0.5;

/** @typedef {import("../../../src/ARSessionManager.js").ARSFaceAnchor} ARSFaceAnchor */
ARSessionManager.addEventListener("faceAnchors", (event) => {
    /** @type {ARSFaceAnchor[]} */
    const faceAnchors = event.message.faceAnchors;
    const faceAnchor = faceAnchors[0];
    if (faceAnchor) {
        /** @type {Vector3} */
        const newPosition = new THREE.Vector3();
        /** @type {Vector3} */
        const newScale = new THREE.Vector3();
        /** @type {Quaternion} */
        const newQuaternion = new THREE.Quaternion();

        /** @type {Matrix4} */
        const newMatrix = new THREE.Matrix4();
        newMatrix.elements = faceAnchor.transform.flat();
        newMatrix.decompose(newPosition, newQuaternion, newScale);

        faceEntity.object3D.position.lerp(newPosition, 0.5);
        faceEntity.object3D.quaternion.slerp(newQuaternion, 0.5);

        faceBox.object3D.quaternion.slerp(newQuaternion, 0.5);

        const isLeftEyeClosed = faceAnchor.blendShapes.eyeBlinkLeft > eyeBlinkThreshold;
        const isRightEyeClosed = faceAnchor.blendShapes.eyeBlinkRight > eyeBlinkThreshold;

        /** @type {Vector3} */
        const lookAtPoint = new THREE.Vector3(...faceAnchor.lookAtPoint);
        lookAtPoint.x *= -1;

        const newLookAtPointEntityPosition = lookAtPoint.clone();
        lookAtPointEntity.object3D.position.lerp(newLookAtPointEntityPosition, 0.5);
        var lookAtPointWorldPosition = new THREE.Vector3();
        lookAtPointEntity.object3D.getWorldPosition(lookAtPointWorldPosition);
        cameraPositionSpan.innerText = aframeCamera.object3D.position.toArray().map((v) => v.toFixed(4));
        cameraRotationSpan.innerText = aframeCamera.object3D.rotation
            .toArray()
            .slice(0, 3)
            .map((v) => v.toFixed(4));
        facePositionSpan.innerText = faceEntity.object3D.position.toArray().map((v) => v.toFixed(4));
        faceRotationSpan.innerText = faceEntity.object3D.rotation
            .toArray()
            .slice(0, 3)
            .map((v) => v.toFixed(4));
        lookAtPointSpan.innerText = lookAtPointWorldPosition.toArray().map((v) => v.toFixed(4));
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
