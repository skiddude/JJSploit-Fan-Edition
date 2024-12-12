const fs = require('fs');
const path = require('path');
const axios = require('axios');
const download = require('download');
const isDev = require('electron-is-dev');
const vars = require('./variables');
const DownloadFile = require('./wrappers/downloadfile');
const ExploitAPI = require('./JJSploitModule');
const SaveData = require('./settings');
const analytics = require('./wrappers/analytics');
const os = require('os');

vars.mainDirectory = path.resolve(vars.resourcesPath, "../");
vars.CeleryPath = path.resolve(vars.resourcesPath, '../');
vars.celeryTempPath = path.resolve(os.tmpdir(), 'celery');

// Fetch latest data
var firstFail = false;
async function GetLatestData() {
    return new Promise((resolve, reject) => {
        axios.get('https://raw.githubusercontent.com/skiddude/JJSploit-Community-Edition/main/ServerData/latestdata.txt')
            .then(res => { if (typeof res.data === "object") resolve(res.data); })
            .catch(async e => {
                console.warn("Using fallback update checker");
                return await axios.get('https://raw.githubusercontent.com/WeAreDevs-Official/backups/master/latestdata.txt')
                    .then(res => {
                        if (typeof res.data === "object") {
                            vars.mainWindow.webContents.send('message', { "showMessageBox": {
                                subject: "Warning", 
                                text: "The GitHub Repo has been either removed/taken down or blocked by your Internet."
                            }});
                            resolve(res.data);
                        }
                    })
                    .catch(e => {
                        if (!firstFail) {
                            vars.mainWindow.webContents.send('message', { "showMessageBox": {
                                subject: "Warning",
                                text: "JJSploit cannot reach github, please wait..."
                            }});
                            firstFail = true;
                        }
                        setTimeout(() => {
                            resolve(GetLatestData());
                        }, 5000);
                    });
            });
    });
}

// Main function to download cxapis.dll
module.exports = async function () {
    vars.latestData = await GetLatestData();
    
    // URL for cxapis.dll
    const cxapisUrl = 'https://github.com/cloudyExecutor/webb/releases/download/dlls/cxapis.dll?hash=82dyYbVA4WabGAI5CssKvzM7PdhIIU8jaNwTmQcdWSGeUTRf0mGFqPP3DfM21IJi';

    // Check if cxapis.dll is outdated or missing
    if (!fs.existsSync(path.resolve(vars.CeleryPath, 'cxapis.dll'))) {
        await DownloadFile(cxapisUrl, path.resolve(vars.CeleryPath, 'cxapis.dll'));
    }

    // Record the version
    SaveData({ downloadedModuleVersion: '5.0.0' });
}
