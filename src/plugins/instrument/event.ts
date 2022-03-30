/**
 * @name 重写事件
 * @use 捕获js异常、静态资源加载异常
 */
import { getGlobalObject } from "src/utils";

const global = getGlobalObject() as any;
const isSupported = 'addEventListener' in global;

type EventHandlersKeys = 'error' | 'unhandledrejection'
type EventHandlersIntegrations = Record<EventHandlersKeys, boolean>


export class EventHandlers {
  static id = 'EventHandlers'

  private readonly _options: EventHandlersIntegrations

  private _installFunc: Record<EventHandlersKeys, (() => void) | undefined> = {
    error: _installErrorHandler,
    unhandledrejection: _installRejectionHandler
  }

  constructor(options?: EventHandlersIntegrations) {

    this._options = {
      error: true,
      unhandledrejection: true,
      ...options
    }
  }

  setup() {
    if (!isSupported) return

    const options = this._options;
    for (const key in options) {
      const installFunc = this._installFunc[key as EventHandlersKeys];
      if (installFunc && options[key as EventHandlersKeys]) {
        installFunc();
        this._installFunc[key as EventHandlersKeys] = undefined;
      }
    }
  }
}

function _installErrorHandler() {
  globalImagesHandler();

  global.addEventListener(
    "error",
    function (event: any) {
      if (event.target && ((event.target as any).src || (event.target as any).href)) {
        console.log("开始追踪资源错误");
        console.log(event);
        // report() 数据上报
      } else {
        console.log("js 执行错误");
        console.log(event);
      }
    },
    true
  );
}

function _installRejectionHandler() {
  global.addEventListener(
    "unhandledrejection",
    function (event: PromiseRejectionEvent) {
      let message = "";
      let line = 0;
      let column = 0;
      let file = "";
      let stack = "";

      if (typeof event.reason === "string") {
        message = event.reason;
      } else if (typeof event.reason === "object") {
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

      console.log(
        {
          type: "error", //jsError
          errorType: "promiseError", //unhandledrejection
          message: message, //标签名
          filename: file,
          position: line + ":" + column, //行列
          stack,
          // selector: lastEvent
          //   ? getSelector(lastEvent.path || lastEvent.target)
          //   : "",
        }
      );
    },
    true
  );
}

/** 处理全局图片资源 */
function globalImagesHandler() {
  // TODO: 监听之前，可能已经有资源加载失败，为了
  // 弥补这种情况，监听之前，获取所有的图片，和加载后的图片，做对比，然后上报
  const allImgs = global.document.getElementsByTagName('image')

  const loadedImgs = global.performance.getEntries().filter((i: any) => i.initiatorType === 'img')
  console.log(allImgs);
  console.log(loadedImgs);

}

