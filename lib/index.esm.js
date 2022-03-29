/**
 * @name 全局对象相关
 */
const emptyGlobalObject = {};
/**
 * 安全返回全局对象
 */
function getBlobalObject() {
    return isNodeEnv()
        ? global
        : typeof window !== "undefined" // eslint-disable-line no-restricted-globals
            ? window // eslint-disable-line no-restricted-globals
            : typeof self !== "undefined"
                ? self
                : emptyGlobalObject;
}
/** 是否是 Node 环境 */
function isNodeEnv() {
    return (Object.prototype.toString.call(typeof process !== "undefined" ? process : 0) === "[object process]");
}

/**
 * @name 重写 fetch 方法
 */
const global$1 = getBlobalObject();
const _originalFetch = global$1.fetch;
/** 重写 fetch */
function instrumentFetch() {
    if (!_originalFetch)
        return;
    global$1.fetch = function (...args) {
        const fetchData = {
            method: getFetchMethod(args),
            url: getFetchUrl(args),
        };
        return _originalFetch.apply(this, args).then((res) => res, (error) => {
            // triggerHandlers('fetch', {
            //   ...handlerData,
            //   endTimestamp: Date.now(),
            //   error,
            // });
            console.log(fetchData);
            console.log(error);
            throw error;
        });
    };
}
/** 获取请求方法 */
function getFetchMethod(fetchArgs = []) {
    const [target1, target2] = fetchArgs;
    if ("Request" in global$1 && target1 instanceof Request && target1.method)
        return String(target1.method).toUpperCase();
    if (target2 && target2.method)
        return String(target2.method).toUpperCase();
    return "GET";
}
/** 获取请求的url */
function getFetchUrl(fetchArgs = []) {
    const target = fetchArgs[0];
    if (typeof target === "string")
        return target;
    if ("Request" in global$1 && target instanceof Request && target.method)
        return target.url;
    return String(target);
}

class WebSentry {
    fetach = true;
    constructor(options) {
        Object.assign(this, options);
        this.setup();
    }
    setup() {
        console.log("前端监控系统 ==》 安装插件");
        this.fetach && instrumentFetch();
    }
    start() {
        console.log("前端监控系统 ==》 启动");
    }
}

export { WebSentry as default };
