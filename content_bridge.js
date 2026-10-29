/**
 * OldNewYouTube — Content Bridge (ISOLATED World)
 * Синхронизирует настройки из chrome.storage.local с контекстом страницы YouTube.
 */
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

  function broadcastToPage(settings) {
    try {
      localStorage.setItem('OLDNEWYT_EXT_SETTINGS', JSON.stringify(settings));
    } catch (_) {}

    const root = document.documentElement;
    if (root) {
      if (!settings.enabled) {
        root.removeAttribute('data-oldnewyt-enabled');
      } else {
        root.setAttribute('data-oldnewyt-enabled', 'true');
        root.setAttribute('data-oldnewyt-watch', settings.watchLayout2025 ? 'true' : 'false');
        root.setAttribute('data-oldnewyt-player', settings.classicPlayer2025 ? 'true' : 'false');
        root.setAttribute('data-oldnewyt-redbar', settings.redProgressBar ? 'true' : 'false');
        root.setAttribute('data-oldnewyt-grid', String(settings.gridColumns || '4'));
        root.setAttribute('data-oldnewyt-search-thumb', String(settings.searchThumbSize || 'medium'));
        root.setAttribute('data-oldnewyt-hide-ai', settings.hideAiSummary ? 'true' : 'false');
        root.setAttribute('data-oldnewyt-hide-shorts', settings.hideShorts ? 'true' : 'false');
        root.setAttribute('data-oldnewyt-corners', settings.classicCorners ? 'true' : 'false');
      }
    }

    window.dispatchEvent(new CustomEvent('OLDNEWYT_SETTINGS_UPDATED', {
      detail: settings
    }));
  }

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(DEFAULT_SETTINGS, function (items) {
      const merged = Object.assign({}, DEFAULT_SETTINGS, items || {});
      broadcastToPage(merged);
    });

    chrome.storage.onChanged.addListener(function (changes, areaName) {
      if (areaName !== 'local') return;
      chrome.storage.local.get(DEFAULT_SETTINGS, function (items) {
        const merged = Object.assign({}, DEFAULT_SETTINGS, items || {});
        broadcastToPage(merged);
      });
    });
  } else {
    broadcastToPage(DEFAULT_SETTINGS);
  }
})();
