(() => {
  'use strict';
  const root = document.querySelector('#app');
  if (!root) return;

  const INTERACTIVE = [
    'button','a','input','textarea','select','option','label','summary',
    '[role="button"]','[data-go]','[data-setting]','[data-speak]','[data-letter]',
    '[data-start-audio]','[data-pronounce]','[data-otto-pronounce]',
    '.otto-word-tap','.word-actions','.options','.bottom-nav','.topbar',
    '.otto-reading-gate','.otto-transfer-card','.otto-speech-speed'
  ].join(',');

  function markElement(el) {
    if (!(el instanceof Element)) return;
    if (el.matches(INTERACTIVE)) el.setAttribute('data-no-word-tap', '1');
    el.querySelectorAll?.(INTERACTIVE).forEach(node => node.setAttribute('data-no-word-tap', '1'));
  }

  // Mark the current tree once. Afterwards only process newly inserted branches,
  // instead of scanning the full application after every small DOM mutation.
  markElement(root);

  const observer = new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.addedNodes) markElement(node);
    }
  });
  observer.observe(root, { childList: true, subtree: true });

  window.OttoStartWordTapGuard = { version: '6.0.0', observer };
})();
