(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global["web-sentry"] = factory());
})(this, (function () { 'use strict';

  class WebSentrey {
      name = 123;
  }

  return WebSentrey;

}));
