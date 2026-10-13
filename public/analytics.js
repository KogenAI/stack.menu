// Aggregate pageviews belong only to the public production site.
if (location.origin === 'https://stack.menu') {
  window.plausible = window.plausible || function () {
    (window.plausible.q = window.plausible.q || []).push(arguments);
  };
  window.plausible.init = window.plausible.init || function (options) {
    window.plausible.o = options;
  };
  window.plausible.init({
    fileDownloads: false,
    outboundLinks: false,
    formSubmissions: false,
    captureOnLocalhost: false,
    autoCapturePageviews: true,
    transformRequest: (payload) => {
      // Requirement queries/fragments are removed from both visited and referring URLs.
      const event = {...payload, u: location.origin + location.pathname};
      if (event.r) {
        try {
          const referrer = new URL(event.r);
          event.r = referrer.origin + referrer.pathname;
        } catch {
          event.r = null;
        }
      }
      return event;
    },
  });
  const tracker = document.createElement('script');
  tracker.async = true;
  tracker.src = 'https://plausible.io/js/pa-veKK3M5Tbk-tALwBwj0yK.js';
  document.head.appendChild(tracker);
}
