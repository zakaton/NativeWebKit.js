import { ARSessionManager, utils } from "../../../src/NativeWebKit.js";
//import { ARSessionManager } from "../../../build/nativewebkit.module.js";
window.ARSessionManager = ARSessionManager;
console.log(ARSessionManager);

/** @typedef {import("../../src/three/three.module.min.js").Vector3} Vector3 */
/** @typedef {import("../../src/three/three.module.min.js").Euler} Euler */
/** @typedef {import("../../src/three/three.module.min.js").Quaternion} Quaternion */
/** @typedef {import("../../src/three/three.module.min.js").PerspectiveCamera} PerspectiveCamera */

/** @type {Euler} */
const rotateYaw180DegreesEuler = new THREE.Euler();
rotateYaw180DegreesEuler.y = Math.PI;
/** @type {Quaternion} */
const rotate180DegreesQuaternion = new THREE.Quaternion();
rotate180DegreesQuaternion.setFromEuler(rotateYaw180DegreesEuler);

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

ARSessionManager.checkFaceTrackingSupportOnLoad = true;
ARSessionManager.checkIsRunningOnLoad = true;
ARSessionManager.pauseOnUnload = true;
ARSessionManager.checkShowCameraOnLoad = true;

const scene = document.querySelector("a-scene");
//const sceneContainerEntity = document.getElementById("sceneContainer");
const sceneContainerEntity = document.getElementById("avatarRotation");

/** @type {HTMLInputElement} */
const isSupportedCheckbox = document.getElementById("isSupported");
isSupportedCheckbox.checked = ARSessionManager.isSupported;

if (ARSessionManager.isSupported) {
    ARSessionManager.setShowCamera(false);
    ARSessionManager.setMessageConfiguration({ faceAnchorEyes: true });
}

/** @type {HTMLInputElement} */
const isFaceTrackingSupportedWithWorldTrackingCheckbox = document.getElementById(
    "isFaceTrackingSupportedWithWorldTracking"
);
ARSessionManager.addEventListener("faceTrackingSupport", (event) => {
    /** @type {import("../../../src/ARSessionManager.js").ARSFaceTrackingSupport} */
    const faceTrackingSupport = event.message.faceTrackingSupport;
    console.log("faceTrackingSupport", faceTrackingSupport);
    isFaceTrackingSupportedWithWorldTrackingCheckbox.checked =
        faceTrackingSupport.isSupported && faceTrackingSupport.supportsWorldTracking;
});

/** @typedef {import("../../../src/ARSessionManager.js").ARSConfigurationType} ARSConfigurationType */
/** @typedef {import("../../../src/ARSessionManager.js").ARSConfiguration} ARSConfiguration */
/** @typedef {import("../../../src/ARSessionManager.js").ARSFaceTrackingConfiguration} ARSFaceTrackingConfiguration */

function runARSession() {
    /** @type {ARSFaceTrackingConfiguration} */
    const configuration = { type: "faceTracking", isWorldTrackingEnabled: false };
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

/** @type {Vector3} */
const cameraPosition = new THREE.Vector3();
/** @type {Quaternion} */
const cameraQuaternion = new THREE.Quaternion();
/** @type {Quaternion} */
const cameraQuaternionWithoutRoll = new THREE.Quaternion();
/** @type {PerspectiveCamera} */
var threeCamera;

const aframeCamera = document.getElementById("camera");
var latestFocalLength;
ARSessionManager.addEventListener("camera", (event) => {
    /** @type {import("../../../src/ARSessionManager.js").ARSCamera} */
    const camera = event.message.camera;

    cameraPosition.set(...camera.position);
    cameraQuaternion.set(...camera.quaternion);

    cameraPosition.x *= -1;
    mirrorQuaternionAboutAxes(cameraQuaternion, "z", "y");
    rearCameraQuaternion.copy(cameraQuaternion);
    rearCameraQuaternion.multiply(rotate180DegreesQuaternion); // to emulate the rear camera
    rearCameraQuaternionInverse.copy(rearCameraQuaternion);
    rearCameraQuaternionInverse.invert();

    cameraQuaternionWithoutRoll.copy(rearCameraQuaternion);
    removeAxesFromQuaternion(cameraQuaternionWithoutRoll, "z");

    aframeCamera.object3D.position.lerp(cameraPosition, 0.5);
    aframeCamera.object3D.quaternion.slerp(cameraQuaternion, 0.5);

    inverseCameraQuaternion.copy(cameraQuaternion);
    inverseCameraQuaternion.invert();

    threeCamera = threeCamera || aframeCamera?.components?.camera?.camera;
    if (threeCamera) {
        if (latestFocalLength != camera.focalLength) {
            threeCamera.setFocalLength(camera.focalLength * 1.14);
            latestFocalLength = camera.focalLength;
        }
    }

    scene.renderer.toneMappingExposure = camera.exposureOffset;
});

const faceEntity = document.getElementById("face");
const leftEyeEntity = document.getElementById("leftEye");
const rightEyeEntity = document.getElementById("rightEye");
const lookAtPointEntity = document.getElementById("lookAtPoint");
const eyeBlinkThreshold = 0.5;

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

const faceDistanceRange = [0.2, 0.8];
const focalLengthRange = [2, 20]; // FIX
const zoomRange = [8, 2]; // FIX
/** @type {Vector3} */
const upVector = new THREE.Vector3(0, 1, 0);
/** @type {Matrix4} */
const faceLookAtCameraMatrix = new THREE.Matrix4();
/** @type {Quaternion} */
const faceLookAtCameraQuaternion = new THREE.Quaternion();
/** @type {Quaternion} */
const sceneContainerQuaternion = new THREE.Quaternion();
/** @type {Quaternion} */
const inverseCameraQuaternion = new THREE.Quaternion();
/** @type {Quaternion} */
const rearCameraQuaternion = new THREE.Quaternion();
/** @type {Quaternion} */
const rearCameraQuaternionInverse = new THREE.Quaternion();
var faceAnchorFound = false;

/** @typedef {import("../../src/three/three.module.min.js").Vector3} Vector3 */
/** @typedef {import("../../src/three/three.module.min.js").Quaternion} Quaternion */
/** @typedef {import("../../../src/ARSessionManager.js").ARSFaceAnchor} ARSFaceAnchor */
ARSessionManager.addEventListener("faceAnchors", (event) => {
    /** @type {ARSFaceAnchor[]} */
    const faceAnchors = event.message.faceAnchors;
    const faceAnchor = faceAnchors[0];
    faceAnchorFound = Boolean(faceAnchor);

    if (faceAnchor) {
        facePosition.set(...faceAnchor.position);
        faceQuaternion.set(...faceAnchor.quaternion);

        facePosition.x *= -1;
        console.log(facePosition);
        mirrorQuaternionAboutAxes(faceQuaternion, "z", "y");
        faceQuaternion.multiply(rotate180DegreesQuaternion);

        faceEntity.object3D.position.lerp(facePosition, 0.5);
        faceEntity.object3D.quaternion.slerp(faceQuaternion, 0.5);

        if (threeCamera) {
            const faceDistance = facePosition.distanceTo(cameraPosition);
            var distanceInterpolation = THREE.MathUtils.inverseLerp(...faceDistanceRange, faceDistance);
            distanceInterpolation = THREE.MathUtils.clamp(distanceInterpolation, 0, 1);
            const newFocalLength = THREE.MathUtils.lerp(...focalLengthRange, distanceInterpolation);
            const newZoom = THREE.MathUtils.lerp(...zoomRange, distanceInterpolation);
            console.log({ faceDistance, distanceInterpolation, newFocalLength, newZoom });
            threeCamera.zoom = newZoom;
            threeCamera.setFocalLength(newFocalLength);
        }
        //aframeCamera.object3D.position.lerp(facePosition, 0.5);

        sceneContainerEntity.object3D.position.lerp(facePosition, 0.5);
        sceneContainerEntity.object3D.position.z *= 1;
        sceneContainerEntity.object3D.position.x = 0;
        sceneContainerEntity.object3D.position.y = 0;

        faceLookAtCameraMatrix.lookAt(cameraPosition, facePosition, upVector);
        faceLookAtCameraQuaternion.setFromRotationMatrix(faceLookAtCameraMatrix);
        faceLookAtCameraQuaternion.premultiply(inverseCameraQuaternion);
        removeAxesFromQuaternion(faceLookAtCameraQuaternion, "z");
        mirrorQuaternionAboutAxes(faceLookAtCameraQuaternion, "y");
        sceneContainerQuaternion.copy(faceLookAtCameraQuaternion);
        sceneContainerEntity.object3D.quaternion.slerp(sceneContainerQuaternion, 0.5);

        const isLeftEyeClosed = faceAnchor.blendShapes.eyeBlinkLeft > eyeBlinkThreshold;
        const isRightEyeClosed = faceAnchor.blendShapes.eyeBlinkRight > eyeBlinkThreshold;

        leftEyePosition.set(...faceAnchor.leftEye.position);
        leftEyeQuaternion.set(...faceAnchor.leftEye.quaternion);
        //mirrorQuaternionAboutAxes(leftEyeQuaternion, "x", "y");
        leftEyeEntity.object3D.position.lerp(leftEyePosition, 0.5);
        leftEyeEntity.object3D.quaternion.slerp(leftEyeQuaternion, 0.5);

        rightEyePosition.set(...faceAnchor.rightEye.position);
        rightEyeQuaternion.set(...faceAnchor.rightEye.quaternion);
        //mirrorQuaternionAboutAxes(rightEyeQuaternion, "x", "y");
        rightEyeEntity.object3D.position.lerp(rightEyePosition, 0.5);
        rightEyeEntity.object3D.quaternion.slerp(rightEyeQuaternion, 0.5);

        lookAtPoint.set(...faceAnchor.lookAtPoint);
        lookAtPoint.z *= -1;
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
    } else {
        if (leftEyeEntity.object3D.visible) {
            leftEyeEntity.object3D.visible = false;
        }
        if (rightEyeEntity.object3D.visible) {
            rightEyeEntity.object3D.visible = false;
        }
    }
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
    toggleShowCameraButton.innerText = showCamera ? "hide camera" : "show camera";
});

/** @typedef {import("../../../src/ARSessionManager.js").ARSLightEstimate} ARSLightEstimate */

const ambientLight = document.getElementById("ambientLight");
const directionalLight = document.getElementById("directionalLight");
/** @type {Vector3} */
const primaryLightDirection = new THREE.Vector3();

ARSessionManager.addEventListener("lightEstimate", (event) => {
    /** @type {ARSLightEstimate} */
    const lightEstimate = event.message.lightEstimate;
    ambientLight.components.light.light.intensity = lightEstimate.ambientIntensity / 1000;
    const lightColor = utils.colorTemperatureToRGB(lightEstimate.ambientColorTemperature);
    ambientLight.components.light.light.color.setRGB(...lightColor);
    directionalLight.components.light.light.color.setRGB(...lightColor);
    if (lightEstimate.primaryLightDirection) {
        directionalLight.components.light.light.intensity = lightEstimate.primaryLightIntensity / 1000;
        primaryLightDirection.set(...lightEstimate.primaryLightDirection.map((v) => -v));
        //primaryLightDirection.applyEuler(rotateYaw180DegreesEuler);
        directionalLight.object3D.position.lerp(primaryLightDirection, 0.5);
    }
});
