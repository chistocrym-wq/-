(() => {
  'use strict';
  if (window.__ottoWordWrapHotfixV11) return;
  window.__ottoWordWrapHotfixV11 = true;

  const originalCreateTreeWalker = Document.prototype.createTreeWalker;
  if (typeof originalCreateTreeWalker !== 'function') return;

  Document.prototype.createTreeWalker = function(root, whatToShow, filter, entityReferenceExpansion) {
    let safeFilter = filter;

    try {
      const isTextWalker = (Number(whatToShow) & Number(NodeFilter.SHOW_TEXT)) !== 0;
      const insideOttoApp = root instanceof Node && (root === document.getElementById('app') || root.parentElement?.closest?.('#app') || root.closest?.('#app'));
      const accept = typeof filter === 'function' ? filter : filter?.acceptNode;

      if (isTextWalker && insideOttoApp && typeof accept === 'function') {
        safeFilter = {
          acceptNode(node) {
            if (node?.parentElement?.closest?.('.otto-word-tap')) return NodeFilter.FILTER_REJECT;
            return typeof filter === 'function' ? filter(node) : filter.acceptNode(node);
          },
        };
      }
    } catch (_) {}

    return originalCreateTreeWalker.call(this, root, whatToShow, safeFilter, entityReferenceExpansion);
  };

  function flattenNestedWordTaps() {
    document.querySelectorAll('.otto-word-tap .otto-word-tap').forEach((inner) => {
      const outer = inner.parentElement?.closest?.('.otto-word-tap');
      if (!outer) return;
      const text = inner.textContent || '';
      inner.replaceWith(document.createTextNode(text));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', flattenNestedWordTaps, { once: true });
  } else {
    flattenNestedWordTaps();
  }

  window.OttoWordWrapHotfixV11 = { flattenNestedWordTaps };
})();
