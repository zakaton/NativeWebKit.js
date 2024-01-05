/** @type {"__NATIVEWEBKIT__DEV__" | "__NATIVEWEBKIT__PROD__"} */
const __NATIVEWEBKIT__ENVIRONMENT__ = "__NATIVEWEBKIT__DEV__";

const isInProduction = __NATIVEWEBKIT__ENVIRONMENT__ == "__NATIVEWEBKIT__PROD__";
const isInDev = __NATIVEWEBKIT__ENVIRONMENT__ == "__NATIVEWEBKIT__DEV__";

export { isInDev, isInProduction };
