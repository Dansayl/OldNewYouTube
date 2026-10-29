(function () {
  'use strict';

  const DEFAULT_SETTINGS = {
    enabled: true,
    watchLayout2025: true,
    classicPlayer2025: true,
    redProgressBar: true,
    restoreMiniplayer: true,
    gridColumns: "4",
    searchThumbSize: "medium",
    hideAiSummary: true,
    hideShorts: false,
    classicCorners: false,
    customDonateUrl: "https://pay.cloudtips.ru/p/41588f5e"
  };

  const CHECKBOX_IDS = [
    'enabled',
    'watchLayout2025',
    'classicPlayer2025',
    'redProgressBar',
    'restoreMiniplayer',
    'hideAiSummary',
    'hideShorts',
    'classicCorners'
  ];

  const SELECT_IDS = [
    'gridColumns',
    'searchThumbSize'
  ];

  const statusMsg = document.getElementById('status-msg');
  const reloadBtn = document.getElementById('reload-btn');
  const container = document.getElementById('settings-container');

  const openDonateBtn = document.getElementById('open-donate-btn');
  const closeDonateBtn = document.getElementById('close-donate-btn');
  const donateModal = document.getElementById('donate-modal');
  const chipBtns = document.querySelectorAll('.chip-btn');
  const customDonateUrlInput = document.getElementById('custom-donate-url');
  const saveDonateUrlBtn = document.getElementById('save-donate-url-btn');
  const donateUrlStatus = document.getElementById('donate-url-status');
  const primaryDonateLink = document.getElementById('donate-primary-link');

  function updateDisabledState(enabled) {
    container.style.opacity = enabled ? '1' : '0.45';
    container.style.pointerEvents = enabled ? 'auto' : 'none';
  }

  function showSavedNotice(needsReload) {
    if (needsReload) {
      statusMsg.textContent = 'Обновите вкладку для применения флагов';
      statusMsg.style.color = '#ffb74d';
    } else {
      statusMsg.textContent = 'Сохранено и применено!';
      statusMsg.style.color = '#81c784';
      setTimeout(() => {
        statusMsg.textContent = 'Настройки применяются автоматически';
        statusMsg.style.color = '#aaaaaa';
      }, 2000);
    }
  }

  function applyCustomDonateUrl(url) {
    const targetUrl = (url && url.trim().startsWith('http')) ? url.trim() : "https://pay.cloudtips.ru/p/41588f5e";
    if (primaryDonateLink) primaryDonateLink.href = targetUrl;
    chipBtns.forEach(btn => {
      btn.href = targetUrl;
    });
  }

  chrome.storage.local.get(DEFAULT_SETTINGS, function (settings) {
    CHECKBOX_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.checked = Boolean(settings[id]);
    });
    SELECT_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = String(settings[id]);
    });
    const url = settings.customDonateUrl || "https://pay.cloudtips.ru/p/41588f5e";
    if (customDonateUrlInput) customDonateUrlInput.value = url;
    applyCustomDonateUrl(url);
    updateDisabledState(Boolean(settings.enabled));
  });

  CHECKBOX_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', function () {
      const val = el.checked;
      chrome.storage.local.set({ [id]: val }, function () {
        if (id === 'enabled') updateDisabledState(val);
        const needsReload = (id === 'watchLayout2025' || id === 'classicPlayer2025' || id === 'enabled');
        showSavedNotice(needsReload);
      });
    });
  });

  SELECT_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', function () {
      const val = el.value;
      chrome.storage.local.set({ [id]: val }, function () {
        showSavedNotice(false);
      });
    });
  });

  if (openDonateBtn && donateModal) {
    openDonateBtn.addEventListener('click', function () {
      donateModal.style.display = 'flex';
    });
  }

  if (closeDonateBtn && donateModal) {
    closeDonateBtn.addEventListener('click', function () {
      donateModal.style.display = 'none';
    });
  }

  if (saveDonateUrlBtn && customDonateUrlInput) {
    saveDonateUrlBtn.addEventListener('click', function () {
      const url = customDonateUrlInput.value.trim();
      chrome.storage.local.set({ customDonateUrl: url }, function () {
        applyCustomDonateUrl(url);
        donateUrlStatus.textContent = 'Ссылка сохранена!';
        setTimeout(() => {
          donateUrlStatus.textContent = '';
        }, 2500);
      });
    });
  }

  reloadBtn.addEventListener('click', function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.reload(tabs[0].id);
        window.close();
      }
    });
  });
})();
