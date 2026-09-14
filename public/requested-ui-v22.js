(() => {
  'use strict';
  if (window.__ottoRequestedUiV22) return;
  window.__ottoRequestedUiV22 = true;

  const root = document.getElementById('app');
  if (!root) return;

  function applyRequestedUi() {
    const top = root.querySelector('.v12-top');
    if (top) {
      const subtitle = top.querySelector('.v12-brand small');
      if (subtitle && subtitle.textContent.includes('абсолютного нуля')) {
        subtitle.textContent = 'От уровня "ноль" к тренажёру А1';
      }

      top.querySelector('[data-action="nav-more"]')?.remove();

      if (!top.querySelector('[data-v22-top-actions]')) {
        const actions = document.createElement('div');
        actions.className = 'v22-top-actions';
        actions.dataset.v22TopActions = '1';
        actions.innerHTML = '<button class="v12-btn secondary small" type="button" data-action="support">Поддержка</button><button class="v12-btn secondary small" type="button" data-action="share">Поделиться</button>';
        top.appendChild(actions);
      }
    }

    const ottoRule = root.querySelector('.v12-app[data-v15-screen="Главная"] .v12-note');
    if (ottoRule && ottoRule.textContent.trim().startsWith('Правило Otto:')) {
      ottoRule.innerHTML = '<b>Правило Otto:</b> Главное — регулярность. Даже короткие, но системные занятия дают устойчивый результат.';
    }

    const roadmapActions = root.querySelector('[data-v16-a1-roadmap] .v16-a1-actions');
    if (roadmapActions) {
      roadmapActions.querySelector('[data-action="alphabet-guide"]')?.remove();
      roadmapActions.querySelector('[data-action="reading-guide"]')?.remove();
    }

    document.querySelectorAll('.v12-modal').forEach((modal) => {
      const title = modal.querySelector('.v12-modal-head b')?.textContent?.trim();
      if (title === 'Поддержка') modal.classList.add('v12-support', 'v22-support-modal');
    });
  }

  let pending = false;
  const schedule = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      applyRequestedUi();
    });
  };

  root.addEventListener('click', (event) => {
    const completed = event.target.closest?.('[data-action="complete-unit"]');
    if (!completed) return;

    setTimeout(() => {
      const api = window.OttoStartV15;
      const state = api?.state?.();
      if (!state) return;

      if (Number(state.unitIndex) >= Number(api.readinessIndex)) return;

      const next = root.querySelector('[data-action="start-unit"]');
      if (next) next.click();
    }, 0);
  });

  new MutationObserver(schedule).observe(root, { childList: true, subtree: true });
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  schedule();
})();
