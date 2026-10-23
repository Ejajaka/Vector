"use strict";

// Popup UI: type a prompt, analyze it, accept clauses, copy the improved prompt.
(function () {
  const el = {
    prompt: document.getElementById("prompt"),
    analyze: document.getElementById("btn-analyze"),
    deep: document.getElementById("btn-deep"),
    sample: document.getElementById("btn-sample"),
    settings: document.getElementById("btn-settings"),
    results: document.getElementById("results"),
    improvedWrap: document.getElementById("improved-wrap"),
    improved: document.getElementById("improved"),
    copy: document.getElementById("btn-copy"),
    hint: document.getElementById("hint")
  };

  const SAMPLE =
    "Create an S3 bucket to store user documents and an EC2 instance running a web server " +
    "with a security group that allows SSH from 0.0.0.0/0. Give the instance an IAM role with admin access.";

  let settings = Object.assign({}, VectorSettings.DEFAULTS);
  let report = null;
  let state = { accepted: {} };
  let prevReport = null;     // the snapshot it was computed against
  let hadHistory = false;    // whether any comparable history existed

  function toast(msg) {
    let t = document.querySelector(".vp-toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "vp-toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(function () { t.classList.remove("show"); }, 1500);
  }

  function updateImproved() {
    if (!report) return;
    // No improved prompt for input that is not an infrastructure prompt.
    if (report.outOfScope) {
      el.improvedWrap.classList.add("hidden");
      return;
    }
    const clauses = VectorUI.acceptedClauses(report, state);
    el.improved.textContent = VectorUI.buildImprovedPrompt(report.prompt, clauses);
    el.improvedWrap.classList.remove("hidden");
  }

  function render() {
    // Recompute the delta live so accepting a clause updates "What changed"
    // immediately (projected state), not only after a fresh analysis.
    const liveDelta = prevReport
      ? VectorAnalyzer.projectDelta(prevReport, report, state.accepted)
      : null;
    VectorUI.render(el.results, report, state, {
      onToggle: function (id) { state.accepted[id] = !state.accepted[id]; render(); },
      onAcceptAll: function () {
        report.missing.forEach(function (m) { state.accepted[m.id] = true; });
        report.riskyFindings.forEach(function (f) { state.accepted[f.id] = true; });
        render();
      },
      onClearAll: function () { state.accepted = {}; render(); },
      onHarden: hardenNow
    }, { delta: liveDelta, prevReport: prevReport, hadHistory: hadHistory });
    updateImproved();
  }

  function hardenNow() {
    if (!report) return;
    const h = VectorAnalyzer.harden(report.prompt);
    report = h.report;
    state.accepted = {};
    render();
    setHint();
    toast("Hardened · risk " + report.riskScore + " · coverage " + report.coverageScore + "%");
  }

  function setHint() {
    if (!report) return;
    if (report.outOfScope) {
      el.hint.textContent = "Not an AWS infrastructure prompt";
      return;
    }
    if (report.aiClean && !report.missing.length && !report.riskyFindings.length) {
      el.hint.textContent = "No issues found";
      return;
    }
    el.hint.innerHTML =
      report.riskLevel + " risk &middot; " + report.stats.missing + " missing &middot; confidence " +
      report.confidenceScore + "% (" + report.confidence + ")" +
      (report.baselineOnly ? " &middot; baseline" : "") +
      (report.requiresDeepScan || report.needsDeepScan
        ? " &middot; <em>" + (settings.autoDeepScan ? "deep scan recommended" : "deep scan required - enable Auto deep scan in Settings") + "</em>"
        : "");
  }

  // When the rule engine cannot trust the prompt (low confidence or quality
  // issues), hide the report until a deep scan has actually run.
  function showGate() {
    if (!report) return;
    const provider = VectorLLM.localAvailable() || !!settings.apiKey;
    const issues = (report.promptIssues || []).length;
    el.results.classList.remove("hidden");
    el.improvedWrap.classList.add("hidden");
    el.results.innerHTML =
      '<div class="v-banner warn"><strong>Deep scan required.</strong> ' +
      "Confidence " + report.confidenceScore + "%" +
      (issues ? " and " + issues + " prompt-quality issue(s)" : "") +
      ". Results are hidden until the deep scan finishes." +
      '<div class="v-header-actions v-bulk">' +
      '<button class="v-btn primary" type="button" id="gate-scan">Run deep scan</button>' +
      (provider ? "" : '<button class="v-btn ghost" type="button" id="gate-settings">Open settings</button>') +
      '<button class="v-btn ghost" type="button" id="gate-show">Show rule-only results</button>' +
      "</div></div>";
    const scan = document.getElementById("gate-scan");
    const openSettings = document.getElementById("gate-settings");
    const show = document.getElementById("gate-show");
    if (scan) scan.addEventListener("click", deepScanNow);
    if (openSettings) openSettings.addEventListener("click", function () {
      if (chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
    });
    if (show) show.addEventListener("click", function () { render(); setHint(); });
    el.hint.textContent = "Deep scan required before showing the full result";
  }

  function analyzeNow() {
    const prompt = el.prompt.value.trim();
    if (!prompt) { el.hint.textContent = "Enter a prompt first"; return; }
    report = VectorSettings.analyze(prompt, settings);
    state.accepted = {};

    const willScan =
      (report.requiresDeepScan || report.needsDeepScan) && settings.autoDeepScan &&
      (VectorLLM.localAvailable() || !!settings.apiKey);

    // Security Delta: compare against the last comparable stored snapshot,
    // then store this one for the next comparison.
    VectorSettings.getComparable(report).then(function (prev) {
      prevReport = prev;
      hadHistory = !!prev;
      VectorSettings.addHistory(report);
      if (!willScan) {
        if (report.requiresDeepScan) showGate();
        else render();
      }
    });

    el.results.classList.remove("hidden");
    if (willScan) {
      // Never show the rule-only answer first: reveal rules + AI together.
      el.results.innerHTML = '<div class="v-busy">Analysing and deep scanning this prompt&hellip;</div>';
      el.improvedWrap.classList.add("hidden");
      el.hint.textContent = "Deep scan in progress...";
      deepScanNow();
    } else if (!report.requiresDeepScan) {
      render();
      setHint();
    }
  }

  async function deepScanNow() {
    const prompt = el.prompt.value.trim();
    if (!prompt) { el.hint.textContent = "Enter a prompt first"; return; }
    if (!VectorLLM.localAvailable() && !settings.apiKey) {
      el.hint.innerHTML = "Deep scan needs the on-device model or an API key (see Settings).";
      return;
    }
    if (!report) report = VectorSettings.analyze(prompt, settings);
    const base = report; // keep the rule-only result until the AI answers

    el.deep.disabled = true;
    el.deep.textContent = "Scanning...";
    // Hide the rule-based answer and the improved prompt while the AI runs, so
    // the two results never appear side by side. Everything shows together after.
    el.results.innerHTML = '<div class="v-busy">Running deep scan on this prompt&hellip;</div>';
    el.improvedWrap.classList.add("hidden");
    el.hint.textContent = "Deep scan in progress...";

    try {
      const result = await VectorLLM.deepScan(prompt, settings, base);
      report = VectorAnalyzer.mergeFindings(base, result.findings);
      render();
      setHint();
      toast(result.findings.clean ? "Deep scan: no additional issues" : "Deep scan merged (" + result.via + ")");
    } catch (err) {
      report = base; // restore the rule-based answer on failure
      if (base.requiresDeepScan) showGate();
      else { render(); setHint(); }
      toast(err.message || "Deep scan failed");
    } finally {
      el.deep.disabled = false;
      el.deep.textContent = "Deep scan";
    }
  }

  el.analyze.addEventListener("click", analyzeNow);
  el.deep.addEventListener("click", deepScanNow);
  el.sample.addEventListener("click", function () { el.prompt.value = SAMPLE; analyzeNow(); });
  el.settings.addEventListener("click", function () {
    if (chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
  });
  el.prompt.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") analyzeNow();
  });
  el.copy.addEventListener("click", function () {
    navigator.clipboard.writeText(el.improved.textContent).then(
      function () { toast("Copied improved prompt"); },
      function () { toast("Copy failed"); }
    );
  });

  VectorSettings.get().then(function (s) { settings = s; });
})();
