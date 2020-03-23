"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _createSuper(Derived) { return function () { var Super = _getPrototypeOf(Derived), result; if (_isNativeReflectConstruct()) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createForOfIteratorHelper(o) { if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (o = _unsupportedIterableToArray(o))) { var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var it, normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(n); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

/* Common functionality */
function timelens(container, options) {
  // Load VTT file asynchronously, then continue with the initialization.
  var vttUrl;

  if (options.thumbnails) {
    vttUrl = options.thumbnails;
  }

  var request = new XMLHttpRequest();
  request.open("GET", vttUrl, true);
  request.send(null);

  request.onreadystatechange = function () {
    if (request.readyState === 4 && request.status === 200) {
      var type = request.getResponseHeader("Content-Type");

      if (type.indexOf("text") !== 1) {
        timelens2(container, request.responseText, options);
      }
    }
  };
} // Actually initialize Timelens.


function timelens2(container, vtt, options) {
  var thumbnails = parseVTT(vtt);
  var duration = thumbnails[thumbnails.length - 1].to; // Use querySelector if a selector string is specified.

  if (typeof container == "string") container = document.querySelector(container); // This will be our main .timelens div, which will contain all new elements.

  if (container.className != "") {
    container.className += " ";
  }

  container.className += "timelens"; // Create div which contains the preview thumbnails.

  var thumbnail = document.createElement("div");
  thumbnail.className = "timelens-thumbnail"; // Create div which contains the thumbnail time.

  var time = document.createElement("div");
  time.className = "timelens-time"; // Create .timeline img, which displays the visual timeline.

  var timeline = document.createElement("img");
  timeline.src = options.timeline; // Prevent the timeline image to be dragged

  timeline.setAttribute("draggable", "false"); // Create .marker div, which is used to display the current position.

  if (options.position) {
    var marker = document.createElement("div");
    marker.className = "timelens-marker-border";
    container.appendChild(marker);
    var markerInner = document.createElement("div");
    markerInner.className = "timelens-marker";
    marker.appendChild(markerInner);
  } // Assemble everything together.


  container.appendChild(timeline);
  container.appendChild(thumbnail);
  thumbnail.appendChild(time); // When clicking the timeline, seek to the respective position.

  if (options.seek) {
    timeline.onclick = function (event) {
      var progress = progressAtMouse(event, timeline);
      options.seek(progress * duration);
    };
  }

  timeline.onmousemove = function (event) {
    // Calculate click position in seconds.
    var progress = progressAtMouse(event, timeline);
    var seconds = progress * duration;
    var x = progress * timeline.offsetWidth;
    var thumbnailDir = options.thumbnails.substring(0, options.thumbnails.lastIndexOf("/") + 1); // Find the first entry in `thumbnails` which contains the current position.

    var activeThumbnail = null;

    var _iterator = _createForOfIteratorHelper(thumbnails),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var t = _step.value;

        if (seconds >= t.from && seconds <= t.to) {
          activeThumbnail = t;
          break;
        }
      } // Set respective background image.

    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }

    thumbnail.style["background-image"] = "url(" + thumbnailDir + activeThumbnail.file + ")"; // Move background to the correct location.

    thumbnail.style["background-position"] = -activeThumbnail.x + "px " + -activeThumbnail.y + "px"; // Set thumbnail div to correct size.

    thumbnail.style.width = activeThumbnail.w + "px";
    thumbnail.style.height = activeThumbnail.h + "px"; // Move thumbnail div to the correct position.

    thumbnail.style.marginLeft = Math.min(Math.max(0, x - thumbnail.offsetWidth / 2), timeline.offsetWidth - thumbnail.offsetWidth) + "px";
    time.innerHTML = toTimestamp(seconds);
  };

  if (options.position) {
    setInterval(function () {
      marker.style.marginLeft = options.position() / duration * timeline.offsetWidth + "px";
    }, 1);
  }
} // Convert a WebVTT timestamp (which has the format [HH:]MM:SS.mmm) to seconds.


function fromTimestamp(timestamp) {
  var matches = timestamp.match(/(.*):(.*)\.(.*)/);
  var minutes = parseInt(matches[1]);
  var seconds = parseInt(matches[2]);
  var mseconds = parseInt(matches[3]);
  var secondsTotal = mseconds / 1000 + seconds + 60 * minutes;
  return secondsTotal;
} // Convert a position in seconds to a [H:]MM:SS timestamp.


function toTimestamp(secondsTotal) {
  var hours = Math.floor(secondsTotal / 60 / 60);
  var minutes = Math.floor(secondsTotal / 60 - hours * 60);
  var seconds = Math.floor(secondsTotal - 60 * minutes - hours * 60 * 60);
  var timestamp = minutes + ":" + pad(seconds, 2);

  if (hours > 0) {
    return hours + ":" + pad(timestamp, 5);
  } else {
    return timestamp;
  }
} // How far is the mouse into the timeline, in a range from 0 to 1?


function progressAtMouse(event, timeline) {
  var x = event.offsetX ? event.offsetX : event.pageX - timeline.offsetLeft;
  return x / timeline.offsetWidth;
} // Parse a VTT file pointing to JPEG files using media fragment notation.


function parseVTT(vtt) {
  var from = 0;
  var to = 0;
  var thumbnails = [];

  var _iterator2 = _createForOfIteratorHelper(vtt.split("\n")),
      _step2;

  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      var line = _step2.value;

      if (/-->/.test(line)) {
        // Parse a "cue timings" part.
        var matches = line.match(/(.*) --> (.*)/);
        from = fromTimestamp(matches[1]);
        to = fromTimestamp(matches[2]);
      } else if (/jpg/.test(line)) {
        // Parse a "cue payload" part.
        var _matches = line.match(/(.*)\?xywh=(.*),(.*),(.*),(.*)/);

        thumbnails.push({
          from: from,
          to: to,
          file: _matches[1],
          x: _matches[2],
          y: _matches[3],
          w: _matches[4],
          h: _matches[5]
        });
      }
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }

  return thumbnails;
}

function pad(num, size) {
  return ("000000000" + num).substr(-size);
}

function extendMediaElement() {
  if (typeof MediaElementPlayer === "undefined") return;
  Object.assign(MediaElementPlayer.prototype, {
    buildtimelens: function buildtimelens(player, controls, layers, media) {
      var t = this; // Get the timeline from the video's "timeline" attribute.

      var vid = media.querySelector("video");
      var timeline = vid.dataset.timeline; // Get the thumbnails VTT from a "thumbnails" track.

      var thumbnailsTrack = vid.querySelector('track[label="thumbnails"]'); // When there's insufficient data, don't initialize Timelens.

      if (!timeline || !thumbnailsTrack) {
        return;
      }

      var thumbnails = thumbnailsTrack.src;
      var slider = controls.querySelector("." + t.options.classPrefix + "time-slider"); // Initialize the Timelens interface.

      timelens(slider, {
        timeline: timeline,
        thumbnails: thumbnails,
        position: function position() {
          return player.currentTime;
        }
      });
    }
  });
}

function createClapprPlugin() {
  if (typeof Clappr === "undefined") return;

  var Plugin = /*#__PURE__*/function (_Clappr$UICorePlugin) {
    _inherits(Plugin, _Clappr$UICorePlugin);

    var _super = _createSuper(Plugin);

    _createClass(Plugin, [{
      key: "name",
      get: function get() {
        return "timelens";
      }
    }]);

    function Plugin(core) {
      _classCallCheck(this, Plugin);

      return _super.call(this, core);
    }

    _createClass(Plugin, [{
      key: "bindEvents",
      value: function bindEvents() {
        this.listenTo(this.core.mediaControl, Clappr.Events.MEDIACONTROL_RENDERED, this._init);
      }
    }, {
      key: "_init",
      value: function _init() {
        var bar = this.core.mediaControl.el.querySelector(".bar-background");
        var t = this; // Initialize the Timelens interface.

        timelens(bar, {
          timeline: this.core.options.timelens.timeline,
          thumbnails: this.core.options.timelens.thumbnails,
          position: function position() {
            return t.core.containers[0].getCurrentTime();
          }
        });
      }
    }]);

    return Plugin;
  }(Clappr.UICorePlugin);

  return Plugin;
}

module.exports = {
  timelens: timelens,
  createClapprPlugin: createClapprPlugin,
  extendMediaElement: extendMediaElement
};