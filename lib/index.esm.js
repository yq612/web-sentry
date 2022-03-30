/**
 * @name 全局对象相关
 */
const emptyGlobalObject = {};
/**
 * 安全返回全局对象
 */
function getGlobalObject() {
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
 * @name 重写事件
 * @use 捕获js异常、静态资源加载异常
 */
const global$2 = getGlobalObject();
const isSupported = 'addEventListener' in global$2;
class EventHandlers {
    static id = 'EventHandlers';
    _options;
    _installFunc = {
        error: _installErrorHandler,
        unhandledrejection: _installRejectionHandler
    };
    constructor(options) {
        this._options = {
            error: true,
            unhandledrejection: true,
            ...options
        };
    }
    setup() {
        if (!isSupported)
            return;
        const options = this._options;
        for (const key in options) {
            const installFunc = this._installFunc[key];
            if (installFunc && options[key]) {
                installFunc();
                this._installFunc[key] = undefined;
            }
        }
    }
}
function _installErrorHandler() {
    globalImagesHandler();
    global$2.addEventListener("error", function (event) {
        if (event.target && (event.target.src || event.target.href)) {
            console.log("开始追踪资源错误");
            console.log(event);
            // report() 数据上报
        }
        else {
            console.log("js 执行错误");
            console.log(event);
        }
    }, true);
}
function _installRejectionHandler() {
    global$2.addEventListener("unhandledrejection", function (event) {
        let message = "";
        let line = 0;
        let column = 0;
        let file = "";
        let stack = "";
        if (typeof event.reason === "string") {
            message = event.reason;
        }
        else if (typeof event.reason === "object") {
            message = event.reason.message;
        }
        let reason = event.reason;
        if (typeof reason === "object") {
            if (reason.stack) {
                var matchResult = reason.stack.match(/at\s+(.+):(\d+):(\d+)/);
                if (matchResult) {
                    file = matchResult[1];
                    line = matchResult[2];
                    column = matchResult[3];
                }
                stack = reason.stack;
            }
        }
        console.log({
            type: "error",
            errorType: "promiseError",
            message: message,
            filename: file,
            position: line + ":" + column,
            stack,
            // selector: lastEvent
            //   ? getSelector(lastEvent.path || lastEvent.target)
            //   : "",
        });
    }, true);
}
/** 处理全局图片资源 */
function globalImagesHandler() {
    // TODO: 监听之前，可能已经有资源加载失败，为了
    // 弥补这种情况，监听之前，获取所有的图片，和加载后的图片，做对比，然后上报
    const allImgs = global$2.document.getElementsByTagName('image');
    const loadedImgs = global$2.performance.getEntries().filter((i) => i.initiatorType === 'img');
    console.log(allImgs);
    console.log(loadedImgs);
}

/**
 * @name 对WebRequest进行重写
 * @des 包括 xhr 和 fetch
 */
const global$1 = getGlobalObject();
class RequestHandlers {
    static id = 'RequestHandlers';
    _options;
    _installFunc = {
        fetch: _installFetchHandler,
        xhr: _installXhrHandler
    };
    constructor(options) {
        this._options = {
            fetch: true,
            xhr: true,
            ...options
        };
    }
    setup() {
        const options = this._options;
        for (const key in options) {
            const installFunc = this._installFunc[key];
            if (installFunc && options[key]) {
                installFunc();
                this._installFunc[key] = undefined;
            }
        }
    }
}
function _installFetchHandler() {
    const _originalFetch = global$1.fetch;
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
function _installXhrHandler() {
    if (!('XMLHttpRequest' in global$1))
        return;
    const _xmlHttpRequest = global$1.XMLHttpRequest;
    const _originOpen = _xmlHttpRequest.prototype.open;
    const _originSend = _xmlHttpRequest.prototype.send;
    let start;
    if (!_xmlHttpRequest)
        return;
    _xmlHttpRequest.prototype.open = function (...args) {
        const [method = 'GET', url = ''] = args;
        // TODO: 上报的接口不用处理  
        if (!url.match(/logstores/) && !url.match(/sockjs/)) {
            this.__xhrData__ = { url, method };
        }
        return _originOpen.apply(this, args);
    };
    _xmlHttpRequest.prototype.send = function (...args) {
        if (this.__xhrData__) {
            start = Date.now();
            let handler = (type) => () => {
                let status = this.status;
                let statusText = this.statusText;
                let duration = Date.now() - start;
                console.log({
                    type: "xhr",
                    eventType: type,
                    pathname: this.__xhrData__.url,
                    method: this.__xhrData__.method,
                    status: status + "-" + statusText,
                    duration: duration,
                    response: this.response ? JSON.stringify(this.response) : "",
                    params: args || "",
                });
            };
            this.addEventListener("load", handler("load"), false);
            this.addEventListener("error", handler("error"), false);
            this.addEventListener("abort", handler("abort"), false);
        }
        return _originSend.apply(this, args);
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
    constructor(options) {
        Object.assign(this, options);
        this.setup();
    }
    setup() {
        const request = new RequestHandlers();
        request.setup();
        const ev = new EventHandlers();
        ev.setup();
        console.log("前端监控系统 ==》 安装插件");
    }
    start() {
        console.log("前端监控系统 ==》 启动");
    }
}

export { WebSentry as default };
