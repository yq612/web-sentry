/**
 * @name 重写 fetch 方法
 */

import { getBlobalObject } from "src/utils";

const global = getBlobalObject() as any;
const _originalFetch = global.fetch;

/** 重写 fetch */
function instrumentFetch() {
  if (!_originalFetch) return;

  global.fetch = function (...args: any[]) {
    const fetchData = {
      method: getFetchMethod(args),
      url: getFetchUrl(args),
    };

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
  };
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

export { instrumentFetch }