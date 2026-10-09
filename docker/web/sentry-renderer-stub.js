// Stand-in for @sentry/electron/renderer in the web build: the real SDK needs
// Electron's main process and would only produce errors in a browser.
const noop = () => undefined;

module.exports = {
  init: noop,
  captureException: noop,
  captureMessage: noop,
  addBreadcrumb: noop,
  setUser: noop,
  setTag: noop,
  setExtra: noop,
  setContext: noop,
  withScope: fn => fn({setTag: noop, setExtra: noop, setLevel: noop, setContext: noop}),
};
