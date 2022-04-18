/* Magic Frame
 * The Core App (Client)
 *
 * By Speidy674 https://speidy674.de
 * MIT Licensed.
 */
const Log = require("logger");
const { address } = require("../config/config");

Log.log("Starting MagicFrame Client: v" + global.version);

/**
 * The Core App (Client)
 *
 * @class
 */
function App() {

  const config = {};
  const { app, BrowserWindow } = require('electron')
  let win;

  function getServerAddress() {
    /**
     * Get command line parameters
     * Assumes that a cmdline parameter is defined with `--key [value]`
     *
     * @param {string} key key to look for at the command line
     * @param {string} defaultValue value if no key is given at the command line
     * @returns {string} the value of the parameter
     */
    function getCommandLineParameter(key, defaultValue = undefined) {
      const index = process.argv.indexOf(`--${key}`);
      const value = index > -1 ? process.argv[index + 1] : undefined;
      return value !== undefined ? String(value) : defaultValue;
    }

    ["address", "port"].forEach((key) => {
      config[key] = getCommandLineParameter(key, process.env[key.toUpperCase()]);
    });

    config["tls"] = process.argv.indexOf("--use-tls") > 0;
  }

  /**
   * Gets the config from the specified server url
   *
   * @param {string} url location where the server is running.
   * @returns {Promise} the config
   */
  function getServerConfig(url) {

    return new Promise((resolve, reject) => {
      const lib = url.startsWith("https") ? require("https") : require("http");
      const request = lib.get(url, (response) => {
        let configData = "";

        response.on("data", function (chunk) {
          configData += chunk;
        });

        response.on("end", function () {
          resolve(JSON.parse(configData));
        });
      });

      request.on("error", function (error) {
        reject(new Error(`Unable to read config from server (${url} (${error.message}`));
      });
    });
  }

  function createWindow(url) {
    win = new BrowserWindow({
      width: 800,
      height: 450,
      x: 0,
      y: 0,
      darkTheme: true,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false
      },
      backgroundColor: "#000000",
      autoHideMenuBar: true,
      fullscreen: true

    })
  }

  app.whenReady().then(() => {

    //get infos first

    getServerAddress();

    if (config.address == undefined) { config.address = global.config.address; }
    if (config.port == undefined) { config.port = global.config.port; }
    if (config.frameid == undefined) { config.frameid = global.config.frameid; }

    console.log(config);

    const prefix = config.tls ? "https://" : "http://";

    url = prefix + config.address + ":" + config.port + "/#"+config.frameid;

    console.log(url);

    createWindow()

    win.loadURL(url);
  })

}

module.exports = new App();