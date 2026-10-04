(function () {
  'use strict';

  document.addEventListener('keydown', function (e) {
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'i', 'j', 'c'].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    if (e.ctrlKey && ['U', 'u'].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    if (e.ctrlKey && ['S', 's'].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    if (e.ctrlKey && ['P', 'p'].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    if (e.metaKey && e.altKey && ['I', 'J', 'C', 'i', 'j', 'c'].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    if (e.metaKey && ['U', 'S', 'P', 'u', 's', 'p'].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    return false;
  });

  document.addEventListener('copy', function (e) {
    e.preventDefault();
    return false;
  });

  document.addEventListener('cut', function (e) {
    e.preventDefault();
    return false;
  });

  document.addEventListener('paste', function (e) {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') {
      return true;
    }
    e.preventDefault();
    return false;
  });

  document.addEventListener('dragstart', function (e) {
    e.preventDefault();
    return false;
  });

  document.addEventListener('drop', function (e) {
    e.preventDefault();
    return false;
  });

  document.addEventListener('selectstart', function (e) {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return true;
    e.preventDefault();
    return false;
  });

  let devtoolsOpen = false;
  const threshold = 160;

  function detectDevTools() {
    const widthDiff  = window.outerWidth  - window.innerWidth  > threshold;
    const heightDiff = window.outerHeight - window.innerHeight > threshold;

    if (widthDiff || heightDiff) {
      if (!devtoolsOpen) {
        devtoolsOpen = true;
        document.body.innerHTML = '';
        window.location.reload();
      }
    } else {
      devtoolsOpen = false;
    }
  }

  setInterval(detectDevTools, 1000);

  try {
    const noop = function () {};
    window.console = window.console || {};
    const methods = ['log', 'warn', 'error', 'info', 'debug', 'trace', 'dir', 'table', 'clear'];
    methods.forEach(function (m) {
      try {
        Object.defineProperty(window.console, m, {
          get: function () { return noop; },
          set: function () {}
        });
      } catch (e) {
        window.console[m] = noop;
      }
    });
  } catch (e) {}

  setInterval(function () {
    (function () {
      return false;
    })['constructor']('debugger')['call']();
  }, 4000);

  try {
    if (window.top !== window.self) {
      window.top.location = window.self.location;
    }
  } catch (e) {}

  if (window.location.protocol === 'view-source:') {
    window.location.href = 'about:blank';
  }

  document.addEventListener('keyup', function (e) {
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      return false;
    }
  }, true);

  function warnAccess() {
    try {
      if (!sessionStorage.getItem('warned')) {
        sessionStorage.setItem('warned', '1');
      }
    } catch (e) {}
  }
  warnAccess();

  // ============ CHỐNG CURL / WGET / POSTMAN / FETCH TOOL ============
  (function blockCurl() {
    const ua = (navigator.userAgent || '').toLowerCase();
    const badAgents = [
      'curl', 'wget', 'python', 'python-requests', 'python-urllib',
      'httpie', 'postman', 'insomnia', 'axios', 'node-fetch',
      'go-http-client', 'java/', 'okhttp', 'libwww-perl',
      'scrapy', 'phantomjs', 'headlesschrome', 'puppeteer',
      'playwright', 'selenium', 'bot', 'spider', 'crawler'
    ];

    for (let i = 0; i < badAgents.length; i++) {
      if (ua.indexOf(badAgents[i]) !== -1) {
        document.documentElement.innerHTML = '';
        document.body.innerHTML = '';
        try { window.stop(); } catch (e) {}
        try { window.location.href = 'about:blank'; } catch (e) {}
        throw new Error('Blocked');
      }
    }

    if (!navigator.userAgent || navigator.userAgent.length < 10) {
      document.documentElement.innerHTML = '';
      document.body.innerHTML = '';
      try { window.stop(); } catch (e) {}
      throw new Error('Blocked');
    }

    if (navigator.webdriver === true) {
      document.documentElement.innerHTML = '';
      document.body.innerHTML = '';
      try { window.stop(); } catch (e) {}
      throw new Error('Blocked');
    }

    const plugins = navigator.plugins ? navigator.plugins.length : 0;
    const languages = navigator.languages ? navigator.languages.length : 0;
    if (plugins === 0 && languages === 0) {
      document.documentElement.innerHTML = '';
      document.body.innerHTML = '';
      try { window.stop(); } catch (e) {}
      throw new Error('Blocked');
    }
  })();

  // ============ CHỐNG XEM HTML QUA VIEW-SOURCE / SAVE AS ============
  (function blockViewHTML() {
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && ['U', 'u', 'S', 's'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        return false;
      }
    }, true);

    window.addEventListener('beforeprint', function (e) {
      e.preventDefault();
      document.body.style.display = 'none';
      return false;
    });

    window.addEventListener('afterprint', function () {
      document.body.style.display = '';
    });

    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && ['P', 'p'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);

    let lastKey = 0;
    document.addEventListener('keydown', function (e) {
      const now = Date.now();
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        navigator.clipboard.writeText('').catch(function () {});
        if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
        lastKey = now;
        return false;
      }
    });

    window.addEventListener('keyup', function (e) {
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        navigator.clipboard.writeText('').catch(function () {});
      }
    });
  })();

  // ============ CHỐNG XEM SOURCE QUA DRAG / DROP FILE ============
  (function blockSourceInspect() {
    window.addEventListener('load', function () {
      const checkInspect = function () {
        try {
          const devtools = /./;
          devtools.toString = function () {
            this.opened = true;
          };
        } catch (e) {}
      };
      checkInspect();
    });

    Object.defineProperty(window, 'sourceURL', {
      get: function () { return undefined; }
    });
  })();

})();