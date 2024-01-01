import { HeadphoneMotionManager } from "../../../src/NativeWebKit.js";
console.log(HeadphoneMotionManager);
window.HeadphoneMotionManager = HeadphoneMotionManager;

window.addEventListener("load", () => {
    console.log("checking availability");
    HeadphoneMotionManager.checkIsAvailable();
});
