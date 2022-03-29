import { instrumentFetch } from "./plugins/error/fetch";

class WebSentry {
  fetach = true
  constructor(options: any) {
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
export default WebSentry;
