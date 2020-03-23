/* Common functionality */

function timelens(container, options) {
  // Load VTT file asynchronously, then continue with the initialization.
  let vttUrl;
  if (options.thumbnails) {
    vttUrl = options.thumbnails;
  }

  const request = new XMLHttpRequest();
  request.open("GET", vttUrl, true);
  request.send(null);
  request.onreadystatechange = function() {
    if (request.readyState === 4 && request.status === 200) {
      const type = request.getResponseHeader("Content-Type");
      if (type.indexOf("text") !== 1) {
        timelens2(container, request.responseText, options);
      }
    }
  };
}

// Actually initialize Timelens.
function timelens2(container, vtt, options) {
  const thumbnails = parseVTT(vtt);
  const duration = thumbnails[thumbnails.length - 1].to;

  // Use querySelector if a selector string is specified.
  if (typeof container == "string")
    container = document.querySelector(container);

  // This will be our main .timelens div, which will contain all new elements.
  if (container.className != "") {
    container.className += " ";
  }
  container.className += "timelens";

  // Create div which contains the preview thumbnails.
  const thumbnail = document.createElement("div");
  thumbnail.className = "timelens-thumbnail";

  // Create div which contains the thumbnail time.
  const time = document.createElement("div");
  time.className = "timelens-time";

  // Create .timeline img, which displays the visual timeline.
  const timeline = document.createElement("img");
  timeline.src = options.timeline;
  // Prevent the timeline image to be dragged
  timeline.setAttribute("draggable", "false");

  // Create .marker div, which is used to display the current position.
  if (options.position) {
    var marker = document.createElement("div");
    marker.className = "timelens-marker-border";
    container.appendChild(marker);

    var markerInner = document.createElement("div");
    markerInner.className = "timelens-marker";
    marker.appendChild(markerInner);
  }

  // Assemble everything together.
  container.appendChild(timeline);
  container.appendChild(thumbnail);
  thumbnail.appendChild(time);

  // When clicking the timeline, seek to the respective position.
  if (options.seek) {
    timeline.onclick = function(event) {
      const progress = progressAtMouse(event, timeline);
      options.seek(progress * duration);
    };
  }

  timeline.onmousemove = function(event) {
    // Calculate click position in seconds.
    const progress = progressAtMouse(event, timeline);
    const seconds = progress * duration;
    const x = progress * timeline.offsetWidth;

    const thumbnailDir = options.thumbnails.substring(
      0,
      options.thumbnails.lastIndexOf("/") + 1
    );

    // Find the first entry in `thumbnails` which contains the current position.
    let activeThumbnail = null;
    for (let t of thumbnails) {
      if (seconds >= t.from && seconds <= t.to) {
        activeThumbnail = t;
        break;
      }
    }

    // Set respective background image.
    thumbnail.style["background-image"] =
      "url(" + thumbnailDir + activeThumbnail.file + ")";
    // Move background to the correct location.
    thumbnail.style["background-position"] =
      -activeThumbnail.x + "px " + -activeThumbnail.y + "px";

    // Set thumbnail div to correct size.
    thumbnail.style.width = activeThumbnail.w + "px";
    thumbnail.style.height = activeThumbnail.h + "px";

    // Move thumbnail div to the correct position.
    thumbnail.style.marginLeft =
      Math.min(
        Math.max(0, x - thumbnail.offsetWidth / 2),
        timeline.offsetWidth - thumbnail.offsetWidth
      ) + "px";

    time.innerHTML = toTimestamp(seconds);
  };

  if (options.position) {
    setInterval(function() {
      marker.style.marginLeft =
        (options.position() / duration) * timeline.offsetWidth + "px";
    }, 1);
  }
}

// Convert a WebVTT timestamp (which has the format [HH:]MM:SS.mmm) to seconds.
function fromTimestamp(timestamp) {
  const matches = timestamp.match(/(.*):(.*)\.(.*)/);

  const minutes = parseInt(matches[1]);
  const seconds = parseInt(matches[2]);
  const mseconds = parseInt(matches[3]);

  const secondsTotal = mseconds / 1000 + seconds + 60 * minutes;

  return secondsTotal;
}

// Convert a position in seconds to a [H:]MM:SS timestamp.
function toTimestamp(secondsTotal) {
  const hours = Math.floor(secondsTotal / 60 / 60);
  const minutes = Math.floor(secondsTotal / 60 - hours * 60);
  const seconds = Math.floor(secondsTotal - 60 * minutes - hours * 60 * 60);

  const timestamp = minutes + ":" + pad(seconds, 2);

  if (hours > 0) {
    return hours + ":" + pad(timestamp, 5);
  } else {
    return timestamp;
  }
}

// How far is the mouse into the timeline, in a range from 0 to 1?
function progressAtMouse(event, timeline) {
  const x = event.offsetX ? event.offsetX : event.pageX - timeline.offsetLeft;
  return x / timeline.offsetWidth;
}

// Parse a VTT file pointing to JPEG files using media fragment notation.
function parseVTT(vtt) {
  let from = 0;
  let to = 0;

  let thumbnails = [];

  for (let line of vtt.split("\n")) {
    if (/-->/.test(line)) {
      // Parse a "cue timings" part.
      const matches = line.match(/(.*) --> (.*)/);

      from = fromTimestamp(matches[1]);
      to = fromTimestamp(matches[2]);
    } else if (/jpg/.test(line)) {
      // Parse a "cue payload" part.
      const matches = line.match(/(.*)\?xywh=(.*),(.*),(.*),(.*)/);

      thumbnails.push({
        from: from,
        to: to,
        file: matches[1],
        x: matches[2],
        y: matches[3],
        w: matches[4],
        h: matches[5]
      });
    }
  }

  return thumbnails;
}

function pad(num, size) {
  return ("000000000" + num).substr(-size);
}

function extendMediaElement() {
  if (typeof MediaElementPlayer === "undefined") return;
  Object.assign(MediaElementPlayer.prototype, {
    buildtimelens(player, controls, layers, media) {
      const t = this;

      // Get the timeline from the video's "timeline" attribute.
      const vid = media.querySelector("video");
      const timeline = vid.dataset.timeline;

      // Get the thumbnails VTT from a "thumbnails" track.
      const thumbnailsTrack = vid.querySelector('track[label="thumbnails"]');

      // When there's insufficient data, don't initialize Timelens.
      if (!timeline || !thumbnailsTrack) {
        return;
      }

      const thumbnails = thumbnailsTrack.src;

      const slider = controls.querySelector(
        "." + t.options.classPrefix + "time-slider"
      );

      // Initialize the Timelens interface.
      timelens(slider, {
        timeline: timeline,
        thumbnails: thumbnails,
        position: function() {
          return player.currentTime;
        }
      });
    }
  });
}

function createClapprPlugin() {
  if (typeof Clappr === "undefined") return;
  class Plugin extends Clappr.UICorePlugin {
    get name() {
      return "timelens";
    }

    constructor(core) {
      super(core);
    }

    bindEvents() {
      this.listenTo(
        this.core.mediaControl,
        Clappr.Events.MEDIACONTROL_RENDERED,
        this._init
      );
    }

    _init() {
      const bar = this.core.mediaControl.el.querySelector(".bar-background");

      let t = this;

      // Initialize the Timelens interface.
      timelens(bar, {
        timeline: this.core.options.timelens.timeline,
        thumbnails: this.core.options.timelens.thumbnails,
        position: function() {
          return t.core.containers[0].getCurrentTime();
        }
      });
    }
  }
  return Plugin;
}

module.exports = {
  timelens,
  createClapprPlugin,
  extendMediaElement
};
