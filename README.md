# NativeWebKit.js
_Javascript Library that interfaces with the NativeWebKit App and Safari Web Extension_

## 📚 Table of Contents
[📦 Setup](#-setup)  
[🎧 HeadphoneMotionManager](#-headphonemotionmanager)

## 📦 Setup
Using any of the build files in the [/build](https://github.com/zakaton/NativeWebKit.js/tree/main/build) directory, you can either add it to your webpage:
```html
<script src="nativewebkit.js"></script>
<!-- or minified -->
<script src="nativewebkit.min.js"></script>
```

which adds a `NativeWebKit` object into the global scope:
```javascript
console.log("NativeWebKit is now available", NativeWebKit);
NativeWebKit.HeadphoneMotionManager.addEventListener("motionData", (event) => {
    const motionData = event.message.motionData;
    console.log("received headphone motionData", motionData);
});
```

or you can import it as a module into your javascript files:

```javascript
import { HeadphoneMotionManager } from "nativewebkit.module.js"; // or "nativewebkit.module.min.js"
HeadphoneMotionManager.addEventListener("motionData", (event) => {
    const motionData = event.message.motionData;
    console.log("received headphone motionData", motionData);
});
```

## 🎧 HeadphoneMotionManager
_HeadphoneMotionManager manages motion data from AirPods Pro, AirPods (3rd gen), AirPods Max, and Beats Fit Pro._

```javascript
import { HeadphoneMotionManager } from "nativewebkit.module.js";

// set to true to check if your device supports headphone motion data on webpage load
HeadphoneMotionManager.checkAvailabilityOnLoad = true;

// set to true to turn off headphone motion updates when the page closes/reloads/redirects
HeadphoneMotionManager.stopUpdatesOnUnload = true;

// listen to "isAvailable" event so you can know if your device supports headphone motion data
HeadphoneMotionManager.addEventListener("isAvailable", (event) => {
    console.log("isAvailable", event.message.isAvailable);
});

// start receiving updates - can trigger in response to a user event, or automatically in the "isAvailable" event
// HeadphoneMotionManager.startUpdates();

// stop receiving updates - can trigger in response to a user event, or you can set HeadphoneMotionManager.stopUpdatesOnUnload to false to stop automatically when the webpage leaves
// HeadphoneMotionManager.stopUpdates();

// listen to "isActive" event so you can know when your device has started/stopped receiving headphone motion data
// this will trigger after you call HeadphoneMotionManager.startUpdates or HeadphoneMotionManager.stopUpdates, assuming "isActive" changes state
HeadphoneMotionManager.addEventListener("isActive", (event) => {
    console.log("isActive", event.message.isActive);
});

// the part you care about - triggers when new headphone motion data is available
HeadphoneMotionManager.addEventListener("motionData", (event) => {
    const motionData = event.message.motionData;
    console.log("received headphone motionData", motionData);
    const {timestamp, sensorLocation, quaternion, euler, userAcceleration, gravity, rotationRate} = motionData;
    console.log("timestamp", timestamp); // a number (milliseconds)
    console.log("sensorLocation", sensorLocation); // "left headphone", "right headphone", "default", or "unknown"
    console.log("quaternion", quaternion); // an array of 4 numbers - compatible with three.js Quaternion
    console.log("euler", euler); // an array of 3 numbers - compatible with three.js Euler
    console.log("userAcceleration", userAcceleration); // an array of 3 numbers - compatible with three.js Vector3
    console.log("gravity", gravity); // an array of 3 numbers - compatible with three.js Vector3
    console.log("rotationRate", rotationRate); // an array of 3 numbers - compatible with three.js Euler
});
```
