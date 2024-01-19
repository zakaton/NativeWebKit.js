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
const euler = new THREE.Euler(0, 0, 0, "YZX");
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

ARSessionManager.checkWorldTrackingSupportOnLoad = true;
ARSessionManager.checkFaceTrackingSupportOnLoad = true;
ARSessionManager.checkIsRunningOnLoad = true;
ARSessionManager.pauseOnUnload = true;
ARSessionManager.checkShowCameraOnLoad = true;

const scene = document.querySelector("a-scene");
const sceneContainerEntity = document.getElementById("sceneContainer");

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
    if (ARSessionManager.isRunning) {
        runARSession();
    }
});
configurationType = configurationTypeSelect.value;
ARSessionManager.addEventListener("configuration", () => {
    configurationTypeSelect.value = configurationType = ARSessionManager.configuration.type;
    console.log({ configurationType });
    sceneContainerEntity.object3D.rotation.y = configurationType == "faceTracking" ? Math.PI : 0;
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

/** @type {Vector3} */
const cameraPosition = new THREE.Vector3();
/** @type {Quaternion} */
const cameraQuaternion = new THREE.Quaternion();
/** @type {PerspectiveCamera} */
var threeCamera;

const aframeCamera = document.getElementById("camera");
var latestFocalLength;
ARSessionManager.addEventListener("camera", (event) => {
    /** @type {import("../../../src/ARSessionManager.js").ARSCamera} */
    const camera = event.message.camera;

    cameraPosition.set(...camera.position);
    cameraQuaternion.set(...camera.quaternion);

    if (configurationType == "faceTracking") {
        cameraPosition.x *= -1;
        mirrorQuaternionAboutAxes(cameraQuaternion, "z", "y");
        cameraQuaternion.multiply(rotate180DegreesQuaternion);
    }

    if (aframeCamera.object3D.rotation.order == "YXZ") {
        aframeCamera.object3D.rotation.reorder("ZYX");
    }

    if (!isHologramEnabled) {
        aframeCamera.object3D.position.lerp(cameraPosition, 0.5);
    }
    if (faceAnchorFound && isHologramEnabled) {
        if (configurationType == "worldTracking") {
            removeAxesFromQuaternion(cameraQuaternion, "x", "y");
        }
    }
    aframeCamera.object3D.quaternion.slerp(cameraQuaternion, 0.5);

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

const faceDistanceRange = [0.2, 1];
const focalLengthRange = [5, 30]; // FIX
const zoomRange = [2, 1]; // FIX
/** @type {Vector3} */
const upVector = new THREE.Vector3(0, 1, 0);
/** @type {Matrix4} */
const faceLookAtCameraMatrix = new THREE.Matrix4();

var faceAnchorFound = false;

/** @typedef {import("../../src/three/three.module.min.js").Vector3} Vector3 */
/** @typedef {import("../../src/three/three.module.min.js").Quaternion} Quaternion */
/** @typedef {import("../../src/three/three.module.min.js").Matrix4} Matrix4 */

/** @typedef {import("../../../src/ARSessionManager.js").ARSFaceAnchor} ARSFaceAnchor */
ARSessionManager.addEventListener("faceAnchors", (event) => {
    /** @type {ARSFaceAnchor[]} */
    const faceAnchors = event.message.faceAnchors;
    const faceAnchor = faceAnchors[0];
    faceAnchorFound = Boolean(faceAnchor);
    if (faceAnchor) {
        facePosition.set(...faceAnchor.position);
        faceQuaternion.set(...faceAnchor.quaternion);

        if (configurationType == "worldTracking") {
            faceQuaternion.multiply(rotate180DegreesQuaternion);
        }

        if (configurationType == "faceTracking") {
            facePosition.x *= -1;
            mirrorQuaternionAboutAxes(faceQuaternion, "z", "y");
            faceQuaternion.multiply(rotate180DegreesQuaternion);
        }

        if (isHologramEnabled) {
            if (threeCamera) {
                const faceDistance = facePosition.distanceTo(cameraPosition);
                var distanceInterpolation = THREE.MathUtils.inverseLerp(...faceDistanceRange, faceDistance);
                distanceInterpolation = THREE.MathUtils.clamp(distanceInterpolation, 0, 1);
                const newFocalLength = THREE.MathUtils.lerp(...focalLengthRange, distanceInterpolation);
                const newZoom = THREE.MathUtils.lerp(...zoomRange, distanceInterpolation);
                //console.log({ faceDistance, distanceInterpolation, newFocalLength, newZoom });
                threeCamera.zoom = newZoom;
                threeCamera.setFocalLength(newFocalLength);
            }
            aframeCamera.object3D.position.lerp(facePosition, 0.5);

            //threeCamera.lookAt(cameraPosition); // doesn't work how you'd want it to...
            //aframeCamera.lookAt(cameraPosition); // this neither...

            faceLookAtCameraMatrix.lookAt(facePosition, cameraPosition, upVector);
            aframeCamera.object3D.setRotationFromMatrix(faceLookAtCameraMatrix);
        }

        faceEntity.object3D.position.lerp(facePosition, 0.5);
        faceEntity.object3D.quaternion.slerp(faceQuaternion, 0.5);

        const isLeftEyeClosed = faceAnchor.blendShapes.eyeBlinkLeft > eyeBlinkThreshold;
        const isRightEyeClosed = faceAnchor.blendShapes.eyeBlinkRight > eyeBlinkThreshold;

        leftEyePosition.set(...faceAnchor.leftEye.position);
        leftEyeQuaternion.set(...faceAnchor.leftEye.quaternion);
        if (configurationType == "faceTracking") {
            //mirrorQuaternionAboutAxes(leftEyeQuaternion, "x", "y");
        }
        if (configurationType == "worldTracking") {
            //mirrorQuaternionAboutAxes(leftEyeQuaternion, "x", "y");
        }
        leftEyeEntity.object3D.position.lerp(leftEyePosition, 0.5);
        leftEyeEntity.object3D.quaternion.slerp(leftEyeQuaternion, 0.5);

        rightEyePosition.set(...faceAnchor.rightEye.position);
        rightEyeQuaternion.set(...faceAnchor.rightEye.quaternion);
        if (configurationType == "faceTracking") {
            //mirrorQuaternionAboutAxes(rightEyeQuaternion, "x", "y");
        }
        if (configurationType == "worldTracking") {
            //mirrorQuaternionAboutAxes(rightEyeQuaternion, "x", "y");
        }
        rightEyeEntity.object3D.position.lerp(rightEyePosition, 0.5);
        rightEyeEntity.object3D.quaternion.slerp(rightEyeQuaternion, 0.5);

        lookAtPoint.set(...faceAnchor.lookAtPoint);
        if (configurationType == "worldTracking") {
            lookAtPoint.z *= -1;
        }
        if (configurationType == "faceTracking") {
            lookAtPoint.z *= -1;
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
    } else {
        if (leftEyeEntity.object3D.visible) {
            leftEyeEntity.object3D.visible = false;
        }
        if (rightEyeEntity.object3D.visible) {
            rightEyeEntity.object3D.visible = false;
        }
    }
});

var isHologramEnabled = null;
/** @type {HTMLButtonElement} */
const toggleHologramButton = document.getElementById("toggleHologram");
toggleHologramButton.addEventListener("click", () => {
    setIsHologramEnabled(!isHologramEnabled);
});
toggleHologramButton.disabled = !ARSessionManager.isSupported;
function setIsHologramEnabled(newIsHologramEnabled) {
    if (newIsHologramEnabled == isHologramEnabled) {
        return;
    }
    isHologramEnabled = newIsHologramEnabled;
    if (!isHologramEnabled) {
        threeCamera.setFocalLength(latestFocalLength);
    }
    console.log({ isHologramEnabled });
    toggleHologramButton.innerText = isHologramEnabled ? "disable hologram" : "enable hologram";
}
setIsHologramEnabled(true);

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
        primaryLightDirection.set(...lightEstimate.primaryLightDirection.map((v) => -v));
        if (configurationType == "faceTracking") {
            primaryLightDirection.applyEuler(rotateYaw180DegreesEuler);
        }
        directionalLight.components.light.light.intensity = lightEstimate.primaryLightIntensity / 1000;
        directionalLight.object3D.position.lerp(primaryLightDirection, 0.5);
    }
});
