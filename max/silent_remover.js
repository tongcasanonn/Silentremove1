autowatch = 1;
inlets = 1;
outlets = 2; // 0: status text, 1: progress/log

/*
Silent Remover (Max for Live JS prototype)
- Scan mode: all tracks OR selected tracks
- Action mode: mute OR delete (placeholder actions)
- Detect candidate silent clip segments using external analysis hook

This script focuses on robust LiveAPI traversal and batch targeting.
Audio-content analysis is stubbed so you can swap in your preferred analyzer.
*/

var state = {
  thresholdDb: -40,
  minLengthMs: 120,
  marginMs: 20,
  scope: "selected", // selected|all
  action: "mute",    // mute|delete
  dryRun: 1,
};

function loadbang() {
  postStatus("SilentRemover ready. Use 'run' to process.");
}

function set_threshold(v) {
  state.thresholdDb = parseFloat(v);
  postStatus("thresholdDb=" + state.thresholdDb);
}

function set_min_length(v) {
  state.minLengthMs = parseInt(v, 10);
  postStatus("minLengthMs=" + state.minLengthMs);
}

function set_margin(v) {
  state.marginMs = parseInt(v, 10);
  postStatus("marginMs=" + state.marginMs);
}

function set_scope(v) {
  var s = String(v);
  if (s !== "selected" && s !== "all") {
    postStatus("Invalid scope. Use selected|all");
    return;
  }
  state.scope = s;
  postStatus("scope=" + state.scope);
}

function set_action(v) {
  var a = String(v);
  if (a !== "mute" && a !== "delete") {
    postStatus("Invalid action. Use mute|delete");
    return;
  }
  state.action = a;
  postStatus("action=" + state.action);
}

function set_dry_run(v) {
  state.dryRun = v ? 1 : 0;
  postStatus("dryRun=" + state.dryRun);
}

function run() {
  try {
    var song = new LiveAPI("live_set");
    var targets = collectTargetClips(song, state.scope);

    if (!targets.length) {
      postStatus("No target audio clips found.");
      return;
    }

    postStatus("Found " + targets.length + " target clips.");

    for (var i = 0; i < targets.length; i++) {
      processClip(targets[i], i + 1, targets.length);
    }

    postStatus("Done.");
  } catch (err) {
    postStatus("ERROR: " + err);
  }
}

function collectTargetClips(song, scope) {
  var trackIds = [];

  if (scope === "all") {
    var tracks = song.get("tracks"); // ["id", x, "id", y, ...]
    trackIds = idsFromApiList(tracks);
  } else {
    // Live API supports one selected track reliably.
    // If multiple tracks are selected in UI, this still returns the primary selected track.
    var track = new LiveAPI("live_set view selected_track");
    if (track && track.id !== 0) trackIds.push(track.id);
  }

  var clips = [];
  for (var t = 0; t < trackIds.length; t++) {
    var trackApi = new LiveAPI("id " + trackIds[t]);
    var slots = trackApi.get("clip_slots");
    var slotIds = idsFromApiList(slots);

    for (var s = 0; s < slotIds.length; s++) {
      var slotApi = new LiveAPI("id " + slotIds[s]);
      var hasClip = intOf(slotApi.get("has_clip"));
      if (!hasClip) continue;

      var clipIds = idsFromApiList(slotApi.get("clip"));
      if (!clipIds.length) continue;

      var clipApi = new LiveAPI("id " + clipIds[0]);
      var isAudio = intOf(clipApi.get("is_audio_clip"));
      if (!isAudio) continue;

      clips.push({
        trackId: trackIds[t],
        slotId: slotIds[s],
        clipId: clipIds[0],
        clipPath: "id " + clipIds[0]
      });
    }
  }

  return clips;
}

function processClip(target, idx, total) {
  var clip = new LiveAPI(target.clipPath);
  var name = safeToString(clip.get("name"));

  logProgress("[" + idx + "/" + total + "] " + name);

  var regions = detectNonSilentRegions(clip, state.thresholdDb, state.minLengthMs, state.marginMs);

  if (!regions.length) {
    logProgress("  no non-silent regions (skip)");
    return;
  }

  if (state.dryRun) {
    logProgress("  dry-run: " + regions.length + " regions detected");
    return;
  }

  if (state.action === "mute") {
    applyMuteMode(clip, regions);
  } else {
    applyDeleteMode(clip, regions);
  }
}

function detectNonSilentRegions(clipApi, thresholdDb, minLengthMs, marginMs) {
  // NOTE:
  // LiveAPI does not directly expose audio sample buffers.
  // Production approach:
  // 1) Resolve sample file path for this clip.
  // 2) Analyze with external helper (node/python/ffmpeg/librosa).
  // 3) Return regions in milliseconds or beats.
  //
  // This prototype returns one region covering the whole clip to keep workflow testable.
  // Replace this with real analysis.

  var start = floatOf(clipApi.get("start_time"));
  var end = floatOf(clipApi.get("end_time"));
  if (end <= start) return [];

  return [{
    startTime: start,
    endTime: end
  }];
}

function applyMuteMode(clipApi, regions) {
  // Placeholder: in a full version, write clip gain envelope to mute silent areas.
  logProgress("  mute mode: TODO envelope write (" + regions.length + " regions kept)");
}

function applyDeleteMode(clipApi, regions) {
  // Placeholder: in a full version, duplicate/split clip and delete silent ranges.
  logProgress("  delete mode: TODO split/delete (" + regions.length + " regions kept)");
}

function idsFromApiList(raw) {
  var out = [];
  if (!raw || !raw.length) return out;
  for (var i = 0; i < raw.length - 1; i++) {
    if (raw[i] === "id") {
      out.push(parseInt(raw[i + 1], 10));
      i++;
    }
  }
  return out;
}

function intOf(v) {
  if (Array.isArray(v)) return parseInt(v[0], 10) || 0;
  return parseInt(v, 10) || 0;
}

function floatOf(v) {
  if (Array.isArray(v)) return parseFloat(v[0]) || 0;
  return parseFloat(v) || 0;
}

function safeToString(v) {
  if (Array.isArray(v)) return String(v[0]);
  return String(v);
}

function postStatus(msg) {
  outlet(0, msg);
  post("[SilentRemover] " + msg + "\n");
}

function logProgress(msg) {
  outlet(1, msg);
  post("[SilentRemover] " + msg + "\n");
}
