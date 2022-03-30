/**
 * @name 对WebRequest进行重写
 * @des 包括 xhr 和 fetch
 */

import { getGlobalObject } from "src/utils";

const global = getGlobalObject() as any;

type RequestHandlersKeys = 'fetch' | 'xhr'
type RequestHandlersIntegrations = Record<RequestHandlersKeys, boolean>

export class RequestHandlers {
  static id = 'RequestHandlers'

  private readonly _options: RequestHandlersIntegrations;

  private _installFunc: Record<RequestHandlersKeys, (() => void) | undefined> = {
    fetch: _installFetchHandler,
    xhr: _installXhrHandler
  }

  constructor(options?: RequestHandlersIntegrations) {
    this._options = {
      fetch: true,
      xhr: true,
      ...options
    }
  }

  setup() {
    const options = this._options;
    for (const key in options) {
      const installFunc = this._installFunc[key as RequestHandlersKeys];
      if (installFunc && options[key as RequestHandlersKeys]) {
        installFunc();
        this._installFunc[key as RequestHandlersKeys] = undefined;
      }
    }
  }
}

function _installFetchHandler() {
  const _originalFetch = global.fetch;

  if (!_originalFetch) return

  global.fetch = function (...args: any[]) {
    const fetchData = {
      method: getFetchMethod(args),
      url: getFetchUrl(args),
    }
    return _originalFetch.apply(this, args).then(
      (res: Response) => res,
      (error: Error) => {
        // triggerHandlers('fetch', {
        //   ...handlerData,
        //   endTimestamp: Date.now(),
        //   error,
        // });
        console.log(fetchData);
        console.log(error);

        throw error;
      }
    );
  }
}

function _installXhrHandler() {

  if (!('XMLHttpRequest' in global)) return

  const _xmlHttpRequest = global.XMLHttpRequest;
  const _originOpen = _xmlHttpRequest.prototype.open;
  const _originSend = _xmlHttpRequest.prototype.send;
  let start: number;

  if (!_xmlHttpRequest) return

  _xmlHttpRequest.prototype.open = function (...args: any) {

    const [method = 'GET', url = ''] = args;

    // TODO: 上报的接口不用处理  
    if (!url.match(/logstores/) && !url.match(/sockjs/)) {
      this.__xhrData__ = { url, method };
    }
    return _originOpen.apply(this, args)
  }

  _xmlHttpRequest.prototype.send = function (...args: any[]) {
    if (this.__xhrData__) {
      start = Date.now();
      let handler = (type: string) => () => {
        let status = this.status;
        let statusText = this.statusText;
        let duration = Date.now() - start;
        console.log({
          type: "xhr", //xhr
          eventType: type, //load error abort
          pathname: this.__xhrData__.url, //接口的url地址
          method: this.__xhrData__.method,
          status: status + "-" + statusText,
          duration: duration, //接口耗时
          response: this.response ? JSON.stringify(this.response) : "",
          params: args || "",
        });
      };
      this.addEventListener("load", handler("load"), false);
      this.addEventListener("error", handler("error"), false);
      this.addEventListener("abort", handler("abort"), false);
    }

    return _originSend.apply(this, args)
  }
}

/** 获取请求方法 */
function getFetchMethod(fetchArgs: any[] = []) {

  const [target1, target2] = fetchArgs as any[];

  if ("Request" in global && target1 instanceof Request && target1.method)
    return String(target1.method).toUpperCase();

  if (target2 && target2.method) return String(target2.method).toUpperCase();

  return "GET";
}
/** 获取请求的url */
function getFetchUrl(fetchArgs: any[] = []) {

  const target = fetchArgs[0] as unknown;
  if (typeof target === "string") return target;
  if ("Request" in global && target instanceof Request && target.method)
    return target.url;
  return String(target);
}
