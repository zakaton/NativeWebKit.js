import { CBCentralManager } from "../../../src/NativeWebKit.js";
import { sortObjectKeysAlphabetically } from "../../../src/utils/objectUtils.js";
//import { CBCentralManager } from "../../../build/nativewebkit.module.js";
window.CBCentralManager = CBCentralManager;
console.log(CBCentralManager);
CBCentralManager.checkStateOnLoad = true;
CBCentralManager.checkConnectedPeripheralsOnLoad = true;
CBCentralManager.stopScanOnUnload = true;
CBCentralManager.disconnectOnUnload = false;

/**
 * @param {HTMLTextAreaElement} textArea
 * @returns {string[]}
 */
const extractLinesFromTextarea = (textArea) => {
    return textArea.value
        .replace("\n", ",")
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
};

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

    const serviceUUIDs = extractLinesFromTextarea(serviceUUIDsTextarea);

    if (serviceUUIDs.length > 0) {
        scanOptions.serviceUUIDs = serviceUUIDs;
    }

    scanOptions.options.allowDuplicates = allowDuplicatesCheckbox.checked;

    const solicitedServiceUUIDs = extractLinesFromTextarea(solicitedServiceUUIDsTextarea);
    if (solicitedServiceUUIDs.length > 0) {
        scanOptions.options.solicitedServiceUUIDs = solicitedServiceUUIDs;
    }

    CBCentralManager.startScan(scanOptions);
});

/** @type {HTMLTextAreaElement} */
const connectedPeripheralsServiceUUIDsTextarea = document.getElementById("connectedPeripheralsServiceUUIDs");
/** @type {HTMLInputElement} */
const checkConnectedPeripheralsServiceUUIDsButton = document.getElementById("checkConnectedPeripheralsServiceUUIDs");

checkConnectedPeripheralsServiceUUIDsButton.addEventListener("click", () => {
    const serviceUUIDs = extractLinesFromTextarea(connectedPeripheralsServiceUUIDsTextarea);
    CBCentralManager.checkConnectedPeripherals(serviceUUIDs);
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
        setupDiscoveredPeripheralContainer(discoveredPeripheral);
    }

    updateDiscoveredPeripheralContainer(discoveredPeripheral);
});

/** @param {CBDiscoveredPeripheral} discoveredPeripheral  */
const setupDiscoveredPeripheralContainer = (discoveredPeripheral) => {
    if (discoveredPeripheralContainers[discoveredPeripheral.identifier]) {
        return;
    }
    const discoveredPeripheralContainer = discoveredPeripheralTemplate.content
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
};

/** @param {CBDiscoveredPeripheral} discoveredPeripheral  */
const updateDiscoveredPeripheralContainer = (discoveredPeripheral) => {
    const discoveredPeripheralContainer = discoveredPeripheralContainers[discoveredPeripheral.identifier];
    if (!discoveredPeripheralContainer) {
        return;
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
};

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

/** @type {HTMLElement} */
const peripheralsContainer = document.getElementById("peripherals");
/** @type {HTMLTemplateElement} */
const peripheralTemplate = document.getElementById("peripheralTemplate");
/** @type {Object.<string, HTMLElement>} */
var peripheralContainers = {};

CBCentralManager.addEventListener("peripheralConnectionState", (event) => {
    /** @type {CBPeripheral} */
    const peripheral = event.message.peripheral;

    var peripheralContainer = peripheralContainers[peripheral.identifier];
    if (!peripheralContainer) {
        setupPeripheralContainer(peripheral);
    }

    updatePeripheralContainerOnConnectionState(peripheral);
});

/** @param {CBPeripheral} peripheral  */
const setupPeripheralContainer = (peripheral) => {
    if (peripheralContainers[peripheral.identifier]) {
        return;
    }
    const peripheralContainer = peripheralTemplate.content.cloneNode(true).querySelector(".peripheral");
    peripheralContainer.querySelector(".identifier").innerText = peripheral.identifier;
    peripheralContainers[peripheral.identifier] = peripheralContainer;
    console.log("creating new container for peripheral", { peripheral, peripheralContainer });
    peripheralsContainer.appendChild(peripheralContainer);

    /** @type {HTMLButtonElement} */
    const connectButton = peripheralContainer.querySelector(".connect");
    connectButton.addEventListener("click", () => {
        CBCentralManager.connect({
            identifier: peripheral.identifier,
            //options: { enableAutoReconnect: true },
        });
    });

    /** @type {HTMLButtonElement} */
    const disconnectButton = peripheralContainer.querySelector(".disconnect");
    disconnectButton.addEventListener("click", () => {
        CBCentralManager.disconnect(peripheral.identifier);
    });

    peripheralContainer.querySelector(".name").innerText = peripheral.name;
    const nameSpan = peripheralContainer.querySelector(".name");
    const nameSpanParent = nameSpan.closest("li");
    if (peripheral.name) {
        nameSpanParent.removeAttribute("hidden");
    } else {
        nameSpanParent.setAttribute("hidden", "");
    }
    const rssiSpan = peripheralContainer.querySelector(".rssi");
    if ("rssi" in peripheral) {
        rssiSpan.innerText = peripheral.rssi;
    }

    const readRssiButton = peripheralContainer.querySelector(".readRSSI");
    readRssiButton.addEventListener("click", () => {
        CBCentralManager.readPeripheralRSSI(peripheral.identifier);
        readRssiButton.innerText = "reading rssi...";
        readRssiButton.disabled = true;
    });

    const discoverServicesButton = peripheralContainer.querySelector(".discoverServices");
    discoverServicesButton.disabled = peripheral.connectionState == "disconnected";
    discoverServicesButton.addEventListener("click", () => {
        CBCentralManager.discoverServices(peripheral.identifier);
        discoverServicesButton.innerText = "discovering services...";
        discoverServicesButton.disabled = true;
    });

    const servicesContainer = peripheralContainer.querySelector(".services");
};

/** @param {CBPeripheral} peripheral  */
const updatePeripheralContainerOnConnectionState = (peripheral) => {
    const peripheralContainer = peripheralContainers[peripheral.identifier];
    if (!peripheralContainer) {
        return;
    }

    peripheralContainer.querySelector(".connectionState").innerText = peripheral.connectionState;
    const connectButton = peripheralContainer.querySelector(".connect");
    const disconnectButton = peripheralContainer.querySelector(".disconnect");
    const servicesContainer = peripheralContainer.querySelector(".services");
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
            servicesContainer.innerHTML = ``;
            break;
    }

    const readRssiButton = peripheralContainer.querySelector(".readRSSI");
    readRssiButton.disabled = peripheral.connectionState != "connected";

    const discoverServicesButton = peripheralContainer.querySelector(".discoverServices");
    discoverServicesButton.disabled = peripheral.connectionState == "disconnected";
};

CBCentralManager.addEventListener("peripheralRSSI", (event) => {
    /** @type {CBPeripheral} */
    const peripheral = event.message.peripheral;
    console.log("peripheralRSSI", peripheral.rssi);

    const peripheralContainer = peripheralContainers[peripheral.identifier];
    peripheralContainer.querySelector(".rssi").innerText = `${peripheral.rssi} [${peripheral.rssiTimestamp}]`;

    const readRssiButton = peripheralContainer.querySelector(".readRSSI");
    readRssiButton.innerText = "read rssi";
    readRssiButton.disabled = false;
});

/** @type {HTMLTemplateElement} */
const serviceTemplate = document.getElementById("serviceTemplate");
/** @type {HTMLTemplateElement} */
const characteristicTemplate = document.getElementById("characteristicTemplate");

/** @typedef {import("../../../src/CBCentralManager.js").CBService} CBService */
/** @typedef {import("../../../src/CBCentralManager.js").CBCharacteristic} CBCharacteristic */

CBCentralManager.addEventListener("discoveredService", (event) => {
    /** @type {CBPeripheral} */
    const peripheral = event.message.peripheral;
    /** @type {CBService} */
    const service = event.message.discoveredService;
    console.log({ peripheral, service });

    const peripheralContainer = peripheralContainers[peripheral.identifier];
    const servicesContainer = peripheralContainer.querySelector(".services");
    const serviceContainer = serviceTemplate.content.cloneNode(true).querySelector(".service");
    serviceContainer.dataset.serviceUuid = service.uuid;
    serviceContainer.querySelector(".serviceUUID").innerText = service.uuid;
    const discoverCharacteristicsButton = serviceContainer.querySelector(".discoverCharacteristics");
    discoverCharacteristicsButton.disabled = peripheral.connectionState != "connected";
    discoverCharacteristicsButton.addEventListener("click", () => {
        CBCentralManager.discoverCharacteristics(peripheral.identifier, service.uuid);
    });
    servicesContainer.appendChild(serviceContainer);
});

CBCentralManager.addEventListener("discoveredCharacteristic", (event) => {
    /** @type {CBPeripheral} */
    const peripheral = event.message.peripheral;
    /** @type {CBService} */
    const service = event.message.service;
    /** @type {CBCharacteristic} */
    const characteristic = event.message.discoveredCharacteristic;
    console.log({ peripheral, service, characteristic });

    const peripheralContainer = peripheralContainers[peripheral.identifier];
    const serviceContainer = peripheralContainer.querySelector(`[data-service-uuid="${service.uuid}"]`);
    const characteristicContainer = characteristicTemplate.content.cloneNode(true).querySelector(".characteristic");
    characteristicContainer.dataset.characteristicUuid = characteristic.uuid;
    characteristicContainer.querySelector(".characteristicUUID").innerText = characteristic.uuid;
    characteristicContainer.querySelector(".characteristicProperties").innerText = JSON.stringify(
        characteristic.properties
    );

    const readValueButton = characteristicContainer.querySelector(".readValue");
    if (!characteristic.properties.read) {
        readValueButton.setAttribute("hidden", "");
    }
    readValueButton.disabled = peripheral.connectionState != "connected";
    readValueButton.addEventListener("click", () => {
        CBCentralManager.readCharacteristicValue(peripheral.identifier, service.uuid, characteristic.uuid);
    });

    const toggleNotificationsButton = characteristicContainer.querySelector(".toggleNotifications");
    if (!characteristic.properties.notify) {
        toggleNotificationsButton.setAttribute("hidden", "");
    }
    toggleNotificationsButton.disabled = peripheral.connectionState != "connected";
    toggleNotificationsButton.innerText = characteristic.isNotifying ? "disable notifications" : "enable notifications";
    toggleNotificationsButton.addEventListener("click", () => {
        console.log(peripheral, service, characteristic);
        CBCentralManager.setCharacteristicNotifyValue(
            peripheral.identifier,
            service.uuid,
            characteristic.uuid,
            !peripheral.services[service.uuid].characteristics[characteristic.uuid].isNotifying
        );
    });

    /** @type {HTMLInputElement} */
    const valueToWriteInput = characteristicContainer.querySelector(".valueToWrite");
    valueToWriteInput.disabled = !characteristic.properties.write;

    const writeValueButton = characteristicContainer.querySelector(".writeValue");
    writeValueButton.disabled = !characteristic.properties.write;
    writeValueButton.addEventListener("click", () => {
        const data = valueToWriteInput.value.split(",").map((value) => Number(value));
        data.unshift(0x03);
        data.push(XORNumbers(data));
        CBCentralManager.writeCharacteristicValue(peripheral.identifier, service.uuid, characteristic.uuid, data);
    });

    serviceContainer.appendChild(characteristicContainer);
});

CBCentralManager.addEventListener("characteristicNotifyValue", (event) => {
    /** @type {CBPeripheral} */
    const peripheral = event.message.peripheral;
    /** @type {CBService} */
    const service = event.message.service;
    /** @type {CBCharacteristic} */
    const characteristic = event.message.characteristic;
    console.log({ peripheral, service, characteristic });

    const peripheralContainer = peripheralContainers[peripheral.identifier];
    const serviceContainer = peripheralContainer.querySelector(`[data-service-uuid="${service.uuid}"]`);
    const characteristicContainer = serviceContainer.querySelector(
        `[data-characteristic-uuid="${characteristic.uuid}"]`
    );
    const toggleNotificationsButton = characteristicContainer.querySelector(".toggleNotifications");
    toggleNotificationsButton.innerText = characteristic.isNotifying ? "disable notifications" : "enable notifications";
});

CBCentralManager.addEventListener("characteristicValue", (event) => {
    /** @type {CBPeripheral} */
    const peripheral = event.message.peripheral;
    /** @type {CBService} */
    const service = event.message.service;
    /** @type {CBCharacteristic} */
    const characteristic = event.message.characteristic;
    /** @type {number[]} */
    const value = characteristic.value;
    console.log({ peripheral, service, characteristic, value });

    const peripheralContainer = peripheralContainers[peripheral.identifier];
    const serviceContainer = peripheralContainer.querySelector(`[data-service-uuid="${service.uuid}"]`);
    const characteristicContainer = serviceContainer.querySelector(
        `[data-characteristic-uuid="${characteristic.uuid}"]`
    );
    characteristicContainer.querySelector(".value").innerText = value;

    // FILL
    decentScale.onDataCharacteristicValueChanged({ target: { value: new DataView(Uint8Array.from(value).buffer) } });
});
