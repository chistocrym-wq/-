(() => {
  'use strict';
  if (window.__ottoMutationSafetyV10) return;
  window.__ottoMutationSafetyV10 = true;

  const NativeMutationObserver = window.MutationObserver;
  if (!NativeMutationObserver) return;

  class SafeMutationObserver {
    constructor(callback) {
      this._callback = callback;
      this._target = null;
      this._options = null;
      this._running = false;
      this._observer = new NativeMutationObserver((records) => {
        if (this._running) return;
        this._running = true;
        const target = this._target;
        const options = this._options;
        this._observer.disconnect();
        try {
          this._callback(records, this);
        } catch (error) {
          console.error('Otto observer callback error', error);
          window.OttoClientLogV10?.send?.('observer-error', {
            message: error?.message || String(error),
            stack: error?.stack || ''
          });
        } finally {
          this._running = false;
          if (target && options && this._target === target) {
            this._observer.observe(target, options);
          }
        }
      });
    }

    observe(target, options) {
      this._target = target;
      this._options = options;
      this._observer.observe(target, options);
    }

    disconnect() {
      this._target = null;
      this._options = null;
      this._observer.disconnect();
    }

    takeRecords() {
      return this._observer.takeRecords();
    }
  }

  window.MutationObserver = SafeMutationObserver;
})();
