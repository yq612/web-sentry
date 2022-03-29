/**
 * @name 全局对象相关
 */

const emptyGlobalObject = {};
/**
 * 安全返回全局对象
 */
export function getBlobalObject() {
  return isNodeEnv()
    ? global
    : typeof window !== "undefined" // eslint-disable-line no-restricted-globals
      ? window // eslint-disable-line no-restricted-globals
      : typeof self !== "undefined"
        ? self
        : emptyGlobalObject;
}

/** 是否是 Node 环境 */
function isNodeEnv(): boolean {
  return (
    Object.prototype.toString.call(
      typeof process !== "undefined" ? process : 0
    ) === "[object process]"
  );
}
