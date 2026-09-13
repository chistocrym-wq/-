(() => {
  'use strict';
  const root = document.querySelector('#app');
  if (!root) return;
  const mark = () => {
    root.querySelectorAll('button:not([data-no-word-tap])').forEach((el) => el.setAttribute('data-no-word-tap', '1'));
    root.querySelectorAll('.otto-word-tap:not([data-no-word-tap])').forEach((el) => el.setAttribute('data-no-word-tap', '1'));
  };
  new MutationObserver(mark).observe(root, { childList: true, subtree: true });
  mark();
})();
