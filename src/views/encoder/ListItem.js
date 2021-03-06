/**
 * Created by plter on 10/21/16.
 */

const child_process = require("child_process");
const Config = require("./Config");

class ListItem {


    constructor(file) {
        this._file = file;
        this._fileNameWithoutExtension = this._file.name.substring(0, this._file.name.lastIndexOf("."));
        this._videoLength = 0;

        this._regExpVideoLength = /Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2}),/;
        this._regExpCurrentTime = /time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/;

        this._li = document.createElement("li");
        this._jquery = $(this._li);
        this._jquery.css({display: "block"});

        this._jquery.html(`
<div style="display: flex;">
    <div style="flex: 1;">${this._file.name}</div>
    <div class="progress-bar-container" style="width: 200px;height: 16px;">
        <div class="progress-bar" style="width: 200px;height: 16px;position: absolute;"></div>
        <div class="progress-bar-text" style="width: 200px;height: 16px;position: absolute;text-align: center;"></div>
    </div>
</div>`);

        this._progressBar = this._jquery.find(".progress-bar");
        this._progressBarText = this._jquery.find(".progress-bar-text");
    }

    toJQuery() {
        return this._jquery;
    }

    checkToGetVideoLength(data) {
        if (!this._videoLength) {
            var result = this._regExpVideoLength.exec(data);
            if (result) {
                this._videoLength = this.getMsByRegExpResult(result);
            }
        }
    }

    getMsByRegExpResult(result) {
        if (result.length >= 5) {
            return parseInt(result[1]) * 60 * 60 * 1000 + parseInt(result[2]) * 60 * 1000 + parseInt(result[3]) * 1000 + parseInt(result[4]) * 10;
        } else {
            return 0;
        }
    }

    /**
     * Start encode this video
     */
    startEncode() {

        var option = indexedApp.getCurrentSelectedExportSizeOption();

        var cmdArgs = [];
        cmdArgs.push("-y");
        cmdArgs.push("-i");
        cmdArgs.push(this.file.path);
        if (option.ffmpegArg) {
            cmdArgs.push("-s");
            cmdArgs.push(option.ffmpegArg);
        }
        cmdArgs.push(`${indexedApp.getCurrentPathForSaving()}/${this._fileNameWithoutExtension}.mp4`);

        var process = child_process.execFile(Config.ffmpegFile, cmdArgs);
        process.stderr.on("data", data=> {

            // console.log(data);

            this.checkToGetVideoLength(data);
            let result = this._regExpCurrentTime.exec(data);
            if (result) {
                var currentTime = this.getMsByRegExpResult(result);
                if (currentTime) {
                    if (this._videoLength) {
                        this._progressBarText.html(`${Math.round(currentTime / this._videoLength * 100)}%`);
                        this._progressBar.progressbar({value: currentTime, max: this._videoLength});
                    } else {
                        this._progressBarText.html(`${result[1]}:${result[2]}:${result[3]}`);
                    }
                }
            }
        });
        process.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            if (!code) {
                this._progressBarText.html("完成");
            }
        });
    }

    get file() {
        return this._file;
    }
}

module.exports = ListItem;