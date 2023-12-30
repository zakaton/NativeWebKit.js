import Console from "./Console.js";
import { isNativeWebKitEnabled, isInApp, isSafariExtensionInstalled } from "./context";

const _console = new Console();

/**
 * @param {object} message
 * @returns {Promise<object>}
 */
async function sendMessageToApp(message) {}

export { sendMessageToApp };
