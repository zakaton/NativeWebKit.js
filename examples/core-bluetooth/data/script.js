import { CoreBluetoothManager } from "../../../src/NativeWebKit.js";
import { sortObjectKeysAlphabetically } from "../../../src/utils/objectUtils.js";
//import { CoreBluetoothManager } from "../../../build/nativewebkit.module.js";
window.CoreBluetoothManager = CoreBluetoothManager;
console.log(CoreBluetoothManager);
CoreBluetoothManager.checkStateOnLoad = true;

/** @type {HTMLInputElement} */
const stateInput = document.getElementById("state");
CoreBluetoothManager.addEventListener("state", (event) => {
    console.log("state", event.message.state);
    stateInput.value = CoreBluetoothManager.state;
});

/** @type {HTMLInputElement} */
const isAvailableCheckbox = document.getElementById("isAvailable");
CoreBluetoothManager.addEventListener("isAvailable", (event) => {
    const isAvailable = event.message.isAvailable;
    console.log("isAvailable", isAvailable);
    isAvailableCheckbox.checked = isAvailable;
});

/** @type {HTMLButtonElement} */
const startScanButton = document.getElementById("startScan");
/** @type {HTMLButtonElement} */
const stopScanButton = document.getElementById("stopScan");

CoreBluetoothManager.addEventListener("isScanning", (event) => {
    const isScanning = event.message.isScanning;
    console.log("isScanning", isScanning);
    startScanButton.disabled = isScanning;
    stopScanButton.disabled = !isScanning;
});

startScanButton.addEventListener("click", () => {
    CoreBluetoothManager.startScan();
});
stopScanButton.addEventListener("click", () => {
    CoreBluetoothManager.stopScan();
});
