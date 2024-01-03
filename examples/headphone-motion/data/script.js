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

/** @type {HTMLPreElement} */
const motionDataElement = document.getElementById("motionData");
HeadphoneMotionManager.addEventListener("motionData", (event) => {
    /** @type {import("../../../src/HeadphoneMotionManager.js").HeadphoneMotionData} */
    const motionData = event.message.motionData;
    motionDataElement.textContent = JSON.stringify(motionData, null, 2);
});