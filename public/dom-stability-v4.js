(() => {
  'use strict';

  const text = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
  if (text?.get && text?.set) {
    Object.defineProperty(Node.prototype, 'textContent', {
      configurable: text.configurable,
      enumerable: text.enumerable,
      get: text.get,
      set(value) {
        const next = value == null ? '' : String(value);
        if (text.get.call(this) === next) return;
        text.set.call(this, value);
      },
    });
  }

  const html = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  if (html?.get && html?.set) {
    Object.defineProperty(Element.prototype, 'innerHTML', {
      configurable: html.configurable,
      enumerable: html.enumerable,
      get: html.get,
      set(value) {
        const next = value == null ? '' : String(value);
        if (html.get.call(this) === next) return;
        html.set.call(this, value);
      },
    });
  }
})();
