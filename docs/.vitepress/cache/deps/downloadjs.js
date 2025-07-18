import {
  __commonJS
} from "./chunk-V4OQ3NZ2.js";

// node_modules/.pnpm/downloadjs@1.4.7/node_modules/downloadjs/download.js
var require_download = __commonJS({
  "node_modules/.pnpm/downloadjs@1.4.7/node_modules/downloadjs/download.js"(exports, module) {
    (function(root, factory) {
      if (typeof define === "function" && define.amd) {
        define([], factory);
      } else if (typeof exports === "object") {
        module.exports = factory();
      } else {
        root.download = factory();
      }
    })(exports, function() {
      return function download(data, strFileName, strMimeType) {
        var self = window, defaultMime = "application/octet-stream", mimeType = strMimeType || defaultMime, payload = data, url = !strFileName && !strMimeType && payload, anchor = document.createElement("a"), toString = function(a) {
          return String(a);
        }, myBlob = self.Blob || self.MozBlob || self.WebKitBlob || toString, fileName = strFileName || "download", blob, reader;
        myBlob = myBlob.call ? myBlob.bind(self) : Blob;
        if (String(this) === "true") {
          payload = [payload, mimeType];
          mimeType = payload[0];
          payload = payload[1];
        }
        if (url && url.length < 2048) {
          fileName = url.split("/").pop().split("?")[0];
          anchor.href = url;
          if (anchor.href.indexOf(url) !== -1) {
            var ajax = new XMLHttpRequest();
            ajax.open("GET", url, true);
            ajax.responseType = "blob";
            ajax.onload = function(e) {
              download(e.target.response, fileName, defaultMime);
            };
            setTimeout(function() {
              ajax.send();
            }, 0);
            return ajax;
          }
        }
        if (/^data:([\w+-]+\/[\w+.-]+)?[,;]/.test(payload)) {
          if (payload.length > 1024 * 1024 * 1.999 && myBlob !== toString) {
            payload = dataUrlToBlob(payload);
            mimeType = payload.type || defaultMime;
          } else {
            return navigator.msSaveBlob ? (
              // IE10 can't do a[download], only Blobs:
              navigator.msSaveBlob(dataUrlToBlob(payload), fileName)
            ) : saver(payload);
          }
        } else {
          if (/([\x80-\xff])/.test(payload)) {
            var i = 0, tempUiArr = new Uint8Array(payload.length), mx = tempUiArr.length;
            for (i; i < mx; ++i) tempUiArr[i] = payload.charCodeAt(i);
            payload = new myBlob([tempUiArr], { type: mimeType });
          }
        }
        blob = payload instanceof myBlob ? payload : new myBlob([payload], { type: mimeType });
        function dataUrlToBlob(strUrl) {
          var parts = strUrl.split(/[:;,]/), type = parts[1], decoder = parts[2] == "base64" ? atob : decodeURIComponent, binData = decoder(parts.pop()), mx2 = binData.length, i2 = 0, uiArr = new Uint8Array(mx2);
          for (i2; i2 < mx2; ++i2) uiArr[i2] = binData.charCodeAt(i2);
          return new myBlob([uiArr], { type });
        }
        function saver(url2, winMode) {
          if ("download" in anchor) {
            anchor.href = url2;
            anchor.setAttribute("download", fileName);
            anchor.className = "download-js-link";
            anchor.innerHTML = "downloading...";
            anchor.style.display = "none";
            document.body.appendChild(anchor);
            setTimeout(function() {
              anchor.click();
              document.body.removeChild(anchor);
              if (winMode === true) {
                setTimeout(function() {
                  self.URL.revokeObjectURL(anchor.href);
                }, 250);
              }
            }, 66);
            return true;
          }
          if (/(Version)\/(\d+)\.(\d+)(?:\.(\d+))?.*Safari\//.test(navigator.userAgent)) {
            if (/^data:/.test(url2)) url2 = "data:" + url2.replace(/^data:([\w\/\-\+]+)/, defaultMime);
            if (!window.open(url2)) {
              if (confirm("Displaying New Document\n\nUse Save As... to download, then click back to return to this page.")) {
                location.href = url2;
              }
            }
            return true;
          }
          var f = document.createElement("iframe");
          document.body.appendChild(f);
          if (!winMode && /^data:/.test(url2)) {
            url2 = "data:" + url2.replace(/^data:([\w\/\-\+]+)/, defaultMime);
          }
          f.src = url2;
          setTimeout(function() {
            document.body.removeChild(f);
          }, 333);
        }
        if (navigator.msSaveBlob) {
          return navigator.msSaveBlob(blob, fileName);
        }
        if (self.URL) {
          saver(self.URL.createObjectURL(blob), true);
        } else {
          if (typeof blob === "string" || blob.constructor === toString) {
            try {
              return saver("data:" + mimeType + ";base64," + self.btoa(blob));
            } catch (y) {
              return saver("data:" + mimeType + "," + encodeURIComponent(blob));
            }
          }
          reader = new FileReader();
          reader.onload = function(e) {
            saver(this.result);
          };
          reader.readAsDataURL(blob);
        }
        return true;
      };
    });
  }
});
export default require_download();
//# sourceMappingURL=downloadjs.js.map
