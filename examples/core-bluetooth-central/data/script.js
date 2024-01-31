import { CBCentralManager } from "../../../src/NativeWebKit.js";
import { sortObjectKeysAlphabetically } from "../../../src/utils/objectUtils.js";
//import { CBCentralManager } from "../../../build/nativewebkit.module.js";
window.CBCentralManager = CBCentralManager;
console.log(CBCentralManager);
CBCentralManager.checkStateOnLoad = true;
CBCentralManager.stopScanOnUnload = true;

/** @type {HTMLInputElement} */
const stateInput = document.getElementById("state");
CBCentralManager.addEventListener("state", (event) => {
    /** @type {import("../../../src/CBCentralManager.js").CBCentralState} */
    const state = event.message.state;
    console.log({ state });
    stateInput.value = CBCentralManager.state;
});

/** @type {HTMLInputElement} */
const isAvailableCheckbox = document.getElementById("isAvailable");
CBCentralManager.addEventListener("isAvailable", (event) => {
    const isAvailable = event.message.isAvailable;
    console.log({ isAvailable });
    isAvailableCheckbox.checked = isAvailable;
});

/** @type {HTMLButtonElement} */
const startScanButton = document.getElementById("startScan");
/** @type {HTMLButtonElement} */
const stopScanButton = document.getElementById("stopScan");

CBCentralManager.addEventListener("isScanning", (event) => {
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
    /** @type {import("../../../src/CBCentralManager.js").CBScanOptions} */
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

    CBCentralManager.startScan(scanOptions);
});

stopScanButton.addEventListener("click", () => {
    CBCentralManager.stopScan();
});

/** @type {HTMLElement} */
const discoveredPeripheralsContainer = document.getElementById("discoveredPeripherals");
/** @type {HTMLTemplateElement} */
const discoveredPeripheralTemplate = document.getElementById("discoveredPeripheralTemplate");
/** @type {Object.<string, HTMLElement>} */
var discoveredPeripheralContainers = {};

/** @typedef {import("../../../src/CBCentralManager.js").CBDiscoveredPeripheral} CBDiscoveredPeripheral */
/** @typedef {import("../../../src/CBCentralManager.js").CBPeripheral} CBPeripheral */

CBCentralManager.addEventListener("discoveredPeripheral", (event) => {
    /** @type {CBDiscoveredPeripheral} */
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
            CBCentralManager.connect({
                identifier: discoveredPeripheral.identifier,
                //options: { enableAutoReconnect: true },
            });
        });
        /** @type {HTMLButtonElement} */
        const disconnectButton = discoveredPeripheralContainer.querySelector(".disconnect");
        disconnectButton.addEventListener("click", () => {
            CBCentralManager.disconnect(discoveredPeripheral.identifier);
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

CBCentralManager.addEventListener("expiredDiscoveredPeripheral", (event) => {
    /** @type {CBDiscoveredPeripheral} */
    const expiredDiscoveredPeripheral = event.message.expiredDiscoveredPeripheral;
    console.log({ expiredDiscoveredPeripheral });
    const discoveredPeripheralContainer = discoveredPeripheralContainers[expiredDiscoveredPeripheral.identifier];
    if (discoveredPeripheralContainer) {
        console.log("removing container", discoveredPeripheralContainer);
        discoveredPeripheralContainer.remove();
        delete discoveredPeripheralContainers[expiredDiscoveredPeripheral.identifier];
    }
});

CBCentralManager.addEventListener("peripheralConnectionState", (event) => {
    /** @type {CBPeripheral} */
    const peripheral = event.message.peripheral;
    console.log({ peripheral });
    const discoveredPeripheralContainer = discoveredPeripheralContainers[peripheral.identifier];
    if (discoveredPeripheralContainer) {
        discoveredPeripheralContainer.querySelector(".connectionState").innerText = peripheral.connectionState;
        const connectButton = discoveredPeripheralContainer.querySelector(".connect");
        const disconnectButton = discoveredPeripheralContainer.querySelector(".disconnect");
        switch (peripheral.connectionState) {
            case "connected":
            case "connecting":
                connectButton.disabled = true;
                disconnectButton.disabled = false;
                break;
            case "disconnected":
            case "disconnecting":
                connectButton.disabled = false;
                disconnectButton.disabled = true;
                break;
        }
    }
});
