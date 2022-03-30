import { EventHandlers } from "./plugins/instrument/event";
import { RequestHandlers } from "./plugins/instrument/request";

class WebSentry {
  constructor(options?: any) {
    Object.assign(this, options);
    this.setup();
  }
  setup() {
    const request = new RequestHandlers();
    request.setup()

    const ev = new EventHandlers()
    ev.setup()
    console.log("前端监控系统 ==》 安装插件");
  }
  start() {
    console.log("前端监控系统 ==》 启动");
  }
}

export default WebSentry;
