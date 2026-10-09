'use strict';

// A stand-in for the `electron` module so Bob's main process can run under
// plain Node. The "main window" is every browser connected to the web server:
// webContents.send() broadcasts to all of them through `transport`.

const EventEmitter = require('events');
const os = require('os');
const path = require('path');

const transport = {
  // Replaced by server.js once the WebSocket server is up.
  broadcast(channel, args) {},
};

const home = process.env.HOME || os.homedir();
const paths = {
  home,
  appData: process.env.BOB_APP_DATA || path.join(home, '.config'),
  temp: os.tmpdir(),
  documents: path.join(home, 'Documents'),
  downloads: path.join(home, 'Downloads'),
};

class App extends EventEmitter {
  constructor() {
    super();
    this.name = 'Bob LearnHNS';
    this.isPackaged = true;
    this._ready = false;
    this._quitting = false;
  }

  getName() { return this.name; }
  setName(name) { this.name = name; }
  getVersion() { return process.env.BOB_VERSION || '0.0.0'; }
  getLocale() { return process.env.BOB_LOCALE || 'en-US'; }
  getAppPath() { return path.resolve(__dirname, '..', 'bob'); }

  getPath(name) {
    if (name === 'userData') {
      return paths.userData || path.join(paths.appData, this.name);
    }
    if (name === 'logs') return path.join(this.getPath('userData'), 'logs');
    if (!(name in paths)) throw new Error(`Unknown app path: ${name}`);
    return paths[name];
  }

  setPath(name, value) { paths[name] = value; }

  isReady() { return this._ready; }
  whenReady() {
    return this._ready ? Promise.resolve() : new Promise(resolve => this.once('ready', resolve));
  }

  requestSingleInstanceLock() { return true; }
  setAsDefaultProtocolClient() { return true; }
  setAboutPanelOptions() {}
  focus() {}

  quit() {
    if (this._quitting) return;
    const event = {
      defaultPrevented: false,
      preventDefault() { this.defaultPrevented = true; },
    };
    this.emit('before-quit', event);
    // Bob's handler prevents the first quit, closes its databases, then calls quit() again.
    if (event.defaultPrevented) return;
    this.exit(0);
  }

  exit(code = 0) {
    this._quitting = true;
    this.emit('will-quit');
    this.emit('quit');
    process.exit(code);
  }
}

const app = new App();

class IpcMain extends EventEmitter {
  constructor() {
    super();
    this.handlers = new Map();
  }

  handle(channel, fn) { this.handlers.set(channel, fn); }
  handleOnce(channel, fn) { this.handlers.set(channel, fn); }
  removeHandler(channel) { this.handlers.delete(channel); }
}

const ipcMain = new IpcMain();

class WebContents extends EventEmitter {
  constructor() {
    super();
    this.url = 'about:blank';
  }

  send(channel, ...args) { transport.broadcast(channel, args); }
  isDestroyed() { return false; }
  isLoadingMainFrame() { return false; }
  setWindowOpenHandler() {}
  getURL() { return this.url; }
  getOSProcessId() { return process.pid; }
  openDevTools() {}
  reload() {}
}

class BrowserWindow extends EventEmitter {
  constructor() {
    super();
    this.webContents = new WebContents();
    BrowserWindow._windows.add(this);
  }

  static getAllWindows() { return [...BrowserWindow._windows]; }

  loadURL(url) {
    this.webContents.url = url;
    // There is no page to load on the server; browsers fetch it on demand.
    setImmediate(() => this.webContents.emit('did-finish-load'));
    return Promise.resolve();
  }

  isDestroyed() { return false; }
  isMinimized() { return false; }
  isVisible() { return true; }
  restore() {}
  show() {}
  focus() {}
  minimize() {}
  setMenu() {}
  close() { this.destroy(); }
  destroy() {
    BrowserWindow._windows.delete(this);
    this.emit('closed');
  }
}
BrowserWindow._windows = new Set();

// Native dialogs can't open on a headless server. File dialogs are handled in
// the browser (see bridge.js); anything else is logged.
const dialog = {
  showMessageBox(win, options) {
    const opts = options || win || {};
    console.error(`[Bob dialog] ${opts.title || ''}: ${opts.message || ''}\n${opts.detail || ''}`);
    return Promise.resolve({response: 0, checkboxChecked: false});
  },
  showMessageBoxSync(win, options) {
    dialog.showMessageBox(win, options);
    return 0;
  },
  showErrorBox(title, content) {
    console.error(`[Bob dialog] ${title}: ${content}`);
  },
  showOpenDialog() { return Promise.resolve({canceled: true, filePaths: []}); },
  showOpenDialogSync() { return undefined; },
  showSaveDialog() { return Promise.resolve({canceled: true}); },
  showSaveDialogSync() { return undefined; },
};

const shell = {
  // The browser opens links itself; there is nothing to open on the server.
  openExternal() { return Promise.resolve(); },
  openPath() { return Promise.resolve(''); },
  showItemInFolder() {},
};

const Menu = {
  buildFromTemplate() { return {popup() {}}; },
  setApplicationMenu() {},
};

const nativeTheme = Object.assign(new EventEmitter(), {shouldUseDarkColors: false, themeSource: 'system'});
const powerSaveBlocker = {start() { return 0; }, stop() {}, isStarted() { return false; }};

module.exports = {
  app,
  ipcMain,
  BrowserWindow,
  dialog,
  shell,
  Menu,
  nativeTheme,
  powerSaveBlocker,
  transport,
};
