/**
 * OldNewYouTube — MAIN World Patch
 * Синхронно перехватывает конфигурацию YouTube (yt.config_ и ytcfg) до инициализации Polymer,
 * отключая экспериментальные флаги 2026 года (боковые комментарии, новый плеер Delhi и др.).
 */
(function () {
  'use strict';

  const DEFAULT_SETTINGS = {
    enabled: true,
    watchLayout2025: true,     // Комментарии и описание под видео, рекомендации справа, рабочий режим кинотеатра
    classicPlayer2025: true,   // Классический плеер без Delhi-капсул и полноэкранной сетки
    redProgressBar: true,      // Классическая красная полоса вместо розового градиента
    restoreMiniplayer: true,   // Кнопка мини-плеера в нижней панели
    gridColumns: "4",          // Количество видео в ряд на главной (auto, 3, 4, 5, 6)
    searchThumbSize: "medium", // Размер превью в поиске (large, medium, small)
    hideAiSummary: true,       // Скрыть ИИ-пересказ и кнопку Ask AI
    hideShorts: false,         // Скрыть полки Shorts
    classicCorners: false      // Уменьшить скругления превью и плеера
  };

  const WATCH_LAYOUT_2026_FLAGS = {
    web_watch_eligible_to_switch_to_grid: false,
    web_watch_enable_single_column_grid_view: false,
    web_fixed_panel_watch_next_grid_swap: false,
    web_watch_fixed_default_panels: false,
    web_engagement_panel_show_description: false,
    web_watch_move_summary_to_sd: false,
    web_watch_hero_list: false,
    web_watch_split_scroll: false,
    web_side_rail_dismissible_panels: false,
    kevlar_watch_hide_comments_while_panel_open: false,
    disable_theater_mode: false,
    kevlar_watch_grid: false,
    kevlar_watch_comments_panel_button: false,
    web_watch_compact_comments: false,
    web_watch_right_side_comments: false
  };

  const DELHI_PLAYER_FLAGS = {
    delhi_modern_web_player: false,
    delhi_modern_web_player_icons: false,
    delhi_modern_web_player_fullscreen_grid: false,
    delhi_modern_web_player_quick_actions: false,
    web_player_move_autonav_toggle: false
  };

  let currentSettings = Object.assign({}, DEFAULT_SETTINGS);

  try {
    const saved = localStorage.getItem('OLDNEWYT_EXT_SETTINGS');
    if (saved) {
      currentSettings = Object.assign({}, DEFAULT_SETTINGS, JSON.parse(saved));
    }
  } catch (_) {}

  function applyRootAttributes(settings) {
    const root = document.documentElement;
    if (!root) return;
    if (!settings.enabled) {
      root.removeAttribute('data-oldnewyt-enabled');
      return;
    }
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

  applyRootAttributes(currentSettings);

  window.addEventListener('OLDNEWYT_SETTINGS_UPDATED', function (e) {
    if (e && e.detail) {
      currentSettings = Object.assign({}, DEFAULT_SETTINGS, e.detail);
      try {
        localStorage.setItem('OLDNEWYT_EXT_SETTINGS', JSON.stringify(currentSettings));
      } catch (_) {}
      applyRootAttributes(currentSettings);
      patchAllYouTubeConfigs();
      if (currentSettings.enabled && currentSettings.restoreMiniplayer) {
        ensureMiniplayerButton();
      } else {
        removeMiniplayerButton();
      }
    }
  });

  function sanitizeSerializedFlags(str) {
    if (typeof str !== 'string') return str;
    let out = str;
    if (currentSettings.classicPlayer2025) {
      out = out
        .replace(/&?delhi_modern_web_player=true/g, '')
        .replace(/&?delhi_modern_web_player_icons=true/g, '')
        .replace(/&?delhi_modern_web_player_fullscreen_grid=true/g, '')
        .replace(/&?delhi_modern_web_player_quick_actions=true/g, '');
    }
    if (currentSettings.watchLayout2025) {
      for (const flag of Object.keys(WATCH_LAYOUT_2026_FLAGS)) {
        const re = new RegExp('&?' + flag + '=true', 'g');
        out = out.replace(re, '&' + flag + '=false');
      }
    }
    return out.replace(/&&+/g, '&').replace(/^&+/, '').replace(/&+$/, '');
  }

  function patchExperimentFlagsObject(flagsObj) {
    if (!flagsObj || typeof flagsObj !== 'object' || !currentSettings.enabled) return;
    if (currentSettings.watchLayout2025) {
      Object.assign(flagsObj, WATCH_LAYOUT_2026_FLAGS);
    }
    if (currentSettings.classicPlayer2025) {
      Object.assign(flagsObj, DELHI_PLAYER_FLAGS);
    }
  }

  function patchPlayerContextConfigs(ctxConfigs) {
    if (!ctxConfigs || typeof ctxConfigs !== 'object' || !currentSettings.enabled) return;
    for (const key in ctxConfigs) {
      const cfg = ctxConfigs[key];
      if (cfg && typeof cfg.serializedExperimentFlags === 'string') {
        cfg.serializedExperimentFlags = sanitizeSerializedFlags(cfg.serializedExperimentFlags);
      }
    }
  }

  function patchConfigObject(cfg) {
    if (!cfg || typeof cfg !== 'object' || !currentSettings.enabled) return;
    if (cfg.EXPERIMENT_FLAGS) {
      patchExperimentFlagsObject(cfg.EXPERIMENT_FLAGS);
    }
    if (cfg.WEB_PLAYER_CONTEXT_CONFIGS) {
      patchPlayerContextConfigs(cfg.WEB_PLAYER_CONTEXT_CONFIGS);
    }
  }

  function patchAllYouTubeConfigs() {
    if (!currentSettings.enabled) return;
    try {
      if (window.yt && window.yt.config_) {
        patchConfigObject(window.yt.config_);
      }
      if (window.ytcfg) {
        if (window.ytcfg.data_) {
          patchConfigObject(window.ytcfg.data_);
        }
        if (typeof window.ytcfg.get === 'function') {
          const expFlags = window.ytcfg.get('EXPERIMENT_FLAGS');
          if (expFlags) patchExperimentFlagsObject(expFlags);
          const playerCfgs = window.ytcfg.get('WEB_PLAYER_CONTEXT_CONFIGS');
          if (playerCfgs) patchPlayerContextConfigs(playerCfgs);
        }
      }
    } catch (_) {}
  }

  function hookYtcfgObject(ytcfgObj) {
    if (!ytcfgObj || typeof ytcfgObj !== 'object' || ytcfgObj.__oldNewYtHooked) return;
    const origSet = ytcfgObj.set;
    if (typeof origSet === 'function') {
      ytcfgObj.set = function () {
        if (currentSettings.enabled) {
          if (arguments.length === 1 && typeof arguments[0] === 'object') {
            patchConfigObject(arguments[0]);
          } else if (arguments.length >= 2) {
            if (arguments[0] === 'EXPERIMENT_FLAGS' && typeof arguments[1] === 'object') {
              patchExperimentFlagsObject(arguments[1]);
            } else if (arguments[0] === 'WEB_PLAYER_CONTEXT_CONFIGS' && typeof arguments[1] === 'object') {
              patchPlayerContextConfigs(arguments[1]);
            }
          }
        }
        const res = origSet.apply(this, arguments);
        patchAllYouTubeConfigs();
        return res;
      };
      ytcfgObj.__oldNewYtHooked = true;
    }
  }

  try {
    let _ytcfg = window.ytcfg;
    if (_ytcfg) hookYtcfgObject(_ytcfg);
    Object.defineProperty(window, 'ytcfg', {
      configurable: true,
      enumerable: true,
      get: function () {
        return _ytcfg;
      },
      set: function (val) {
        _ytcfg = val;
        hookYtcfgObject(val);
        patchAllYouTubeConfigs();
      }
    });
  } catch (_) {}

  let earlyTicks = 0;
  const earlyTimer = setInterval(function () {
    earlyTicks++;
    if (window.ytcfg) hookYtcfgObject(window.ytcfg);
    patchAllYouTubeConfigs();
    applyRootAttributes(currentSettings);
    if (earlyTicks > 80) clearInterval(earlyTimer);
  }, 50);

  const MINIPLAYER_BTN_ID = 'oldnewyt-miniplayer-button';
  const MINIPLAYER_OLD_PATH = 'M25,17 L17,17 L17,23 L25,23 L25,17 L25,17 Z M29,25 L29,10.98 C29,9.88 28.1,9 27,9 L9,9 C7.9,9 7,9.88 7,10.98 L7,25 C7,26.1 7.9,27 9,27 L27,27 C28.1,27 29,26.1 29,25 L29,25 Z M27,25.02 L9,25.02 L9,10.97 L27,10.97 L27,25.02 L27,25.02 Z';

  function cleanDelhiFullscreenNodes() {
    if (!currentSettings.enabled || !currentSettings.classicPlayer2025) return;
    const nodes = document.querySelectorAll('.ytp-fullscreen-quick-actions, .ytp-fullscreen-grid');
    nodes.forEach(el => {
      try { el.remove(); } catch (_) {}
    });
    const player = document.getElementById('movie_player');
    if (player && player.classList.contains('ytp-delhi-modern')) {
      player.classList.remove('ytp-delhi-modern');
    }
  }

  function ensureMiniplayerButton() {
    if (!currentSettings.enabled || !currentSettings.restoreMiniplayer) return false;
    if (document.getElementById(MINIPLAYER_BTN_ID)) return true;
    const existingNative = document.querySelector('.ytp-chrome-bottom .ytp-miniplayer-button');
    if (existingNative && getComputedStyle(existingNative).display !== 'none') return true;

    const sizeBtn = document.querySelector('.ytp-chrome-bottom .ytp-size-button');
    if (!sizeBtn || !sizeBtn.parentElement) return false;

    const btn = document.createElement('button');
    btn.id = MINIPLAYER_BTN_ID;
    btn.className = 'ytp-button';
    btn.title = 'Мини-проигрыватель (i)';
    btn.setAttribute('aria-label', 'Мини-проигрыватель (i)');
    btn.setAttribute('aria-keyshortcuts', 'i');
    btn.style.display = 'inline-flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('height', '100%');
    svg.setAttribute('width', '100%');
    svg.setAttribute('viewBox', '0 0 36 36');
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', MINIPLAYER_OLD_PATH);
    path.setAttribute('fill', '#fff');
    path.setAttribute('fill-rule', 'evenodd');
    svg.appendChild(path);
    btn.appendChild(svg);

    sizeBtn.parentElement.insertBefore(btn, sizeBtn);
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      document.dispatchEvent(new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        code: 'KeyI',
        key: 'i',
        keyCode: 73,
        which: 73
      }));
    }, { capture: true });
    return true;
  }

  function removeMiniplayerButton() {
    const btn = document.getElementById(MINIPLAYER_BTN_ID);
    if (btn) {
      try { btn.remove(); } catch (_) {}
    }
  }

  function onDomReady() {
    applyRootAttributes(currentSettings);
    patchAllYouTubeConfigs();
    cleanDelhiFullscreenNodes();
    ensureMiniplayerButton();

    const observer = new MutationObserver(function () {
      if (!currentSettings.enabled) return;
      if (window.ytcfg) hookYtcfgObject(window.ytcfg);
      cleanDelhiFullscreenNodes();
      if (currentSettings.restoreMiniplayer && !document.getElementById(MINIPLAYER_BTN_ID)) {
        ensureMiniplayerButton();
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDomReady, { once: true });
  } else {
    onDomReady();
  }

  window.addEventListener('yt-navigate-start', function () {
    if (window.ytcfg) hookYtcfgObject(window.ytcfg);
    patchAllYouTubeConfigs();
  }, true);

  window.addEventListener('yt-navigate-finish', function () {
    if (window.ytcfg) hookYtcfgObject(window.ytcfg);
    patchAllYouTubeConfigs();
    cleanDelhiFullscreenNodes();
    setTimeout(ensureMiniplayerButton, 300);
  }, true);
})();
