import { CoreBluetoothManager } from "../../../src/NativeWebKit.js";
import { sortObjectKeysAlphabetically } from "../../../src/utils/objectUtils.js";
//import { CoreBluetoothManager } from "../../../build/nativewebkit.module.js";
window.CoreBluetoothManager = CoreBluetoothManager;
console.log(CoreBluetoothManager);
CoreBluetoothManager.checkStateOnLoad = true;
CoreBluetoothManager.stopScanOnUnload = true;

/** @type {HTMLInputElement} */
const stateInput = document.getElementById("state");
CoreBluetoothManager.addEventListener("state", (event) => {
    /** @type {import("../../../src/CoreBluetoothManager.js").CBState} */
    const state = event.message.state;
    console.log({ state });
    stateInput.value = CoreBluetoothManager.state;
});

/** @type {HTMLInputElement} */
const isAvailableCheckbox = document.getElementById("isAvailable");
CoreBluetoothManager.addEventListener("isAvailable", (event) => {
    const isAvailable = event.message.isAvailable;
    console.log({ isAvailable });
    isAvailableCheckbox.checked = isAvailable;
});

/** @type {HTMLButtonElement} */
const startScanButton = document.getElementById("startScan");
/** @type {HTMLButtonElement} */
const stopScanButton = document.getElementById("stopScan");

CoreBluetoothManager.addEventListener("isScanning", (event) => {
    const isScanning = event.message.isScanning;
    console.log({ isScanning });
    if (isScanning) {
        discoveredPeripheralContainers = {};
        discoveredPeripheralsContainer.innerHTML = "";
    }
    startScanButton.disabled = isScanning;
    stopScanButton.disabled = !isScanning;
});

/** @type {HTMLTextAreaElement} */
const serviceUUIDsTextarea = document.getElementById("serviceUUIDs");
/** @type {HTMLInputElement} */
const allowDuplicatesCheckbox = document.getElementById("allowDuplicates");
/** @type {HTMLTextAreaElement} */
const solicitedServiceUUIDsTextarea = document.getElementById("solicitedServiceUUIDs");

startScanButton.addEventListener("click", () => {
    /** @type {import("../../../src/CoreBluetoothManager.js").CBScanOptions} */
    const scanOptions = { options: {} };

    const serviceUUIDs = serviceUUIDsTextarea.value
        .replace("\n", ",")
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

    if (serviceUUIDs.length > 0) {
        scanOptions.serviceUUIDs = serviceUUIDs;
    }

    scanOptions.options.allowDuplicates = allowDuplicatesCheckbox.checked;

    const solicitedServiceUUIDs = solicitedServiceUUIDsTextarea.value
        .replace("\n", ",")
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
    if (solicitedServiceUUIDs.length > 0) {
        scanOptions.options.solicitedServiceUUIDs = solicitedServiceUUIDs;
    }

    CoreBluetoothManager.startScan(scanOptions);
});

stopScanButton.addEventListener("click", () => {
    CoreBluetoothManager.stopScan();
});

/** @type {HTMLElement} */
const discoveredPeripheralsContainer = document.getElementById("discoveredPeripherals");
/** @type {HTMLTemplateElement} */
const discoveredPeripheralTemplate = document.getElementById("discoveredPeripheralTemplate");
/** @type {object.<string, HTMLElement>} */
var discoveredPeripheralContainers = {};

CoreBluetoothManager.addEventListener("discoveredPeripheral", (event) => {
    /** @type {import("../../../src/CoreBluetoothManager.js").CBDiscoveredPeripheral} */
    const discoveredPeripheral = event.message.discoveredPeripheral;
    console.log({ discoveredPeripheral });

    /** @type {HTMLElement} */
    var discoveredPeripheralContainer = discoveredPeripheralContainers[discoveredPeripheral.identifier];
    if (!discoveredPeripheralContainer) {
        discoveredPeripheralContainer = discoveredPeripheralTemplate.content
            .cloneNode(true)
            .querySelector(".discoveredPeripheral");
        discoveredPeripheralContainer.querySelector(".identifier").innerText = discoveredPeripheral.identifier;
        discoveredPeripheralContainers[discoveredPeripheral.identifier] = discoveredPeripheralContainer;
        console.log("creating new container for peripheral", { discoveredPeripheral, discoveredPeripheralContainer });
        discoveredPeripheralsContainer.appendChild(discoveredPeripheralContainer);

        /** @type {HTMLButtonElement} */
        const connectButton = discoveredPeripheralContainer.querySelector(".connect");
        connectButton.addEventListener("click", () => {
            CoreBluetoothManager.connect({
                identifier: discoveredPeripheral.identifier,
                //options: { enableAutoReconnect: true },
            });
        });
        /** @type {HTMLButtonElement} */
        const disconnectButton = discoveredPeripheralContainer.querySelector(".disconnect");
        disconnectButton.addEventListener("click", () => {
            CoreBluetoothManager.disconnect(discoveredPeripheral.identifier);
        });
    }

    discoveredPeripheralContainer.querySelector(".name").innerText = discoveredPeripheral.name;
    const nameSpan = discoveredPeripheralContainer.querySelector(".name");
    const nameSpanParent = nameSpan.closest("li");
    if (discoveredPeripheral.name) {
        nameSpanParent.removeAttribute("hidden");
    } else {
        nameSpanParent.setAttribute("hidden", "");
    }
    discoveredPeripheralContainer.querySelector(".rssi").innerText = discoveredPeripheral.rssi;
    discoveredPeripheralContainer.querySelector(".advertisementData").innerText = JSON.stringify(
        sortObjectKeysAlphabetically(discoveredPeripheral.advertisementData)
    );
});
