"use strict";

/**
 * Vector optional "deep scan".
 *
 * Two ways to run it, tried in this order:
 *   1. On-device  - Chrome's built-in model (Gemini Nano). No API key, no network.
 *   2. Hosted API - OpenAI-compatible endpoint. Needs an API key.
 *
 * Either way we only ASK an existing model for controls we may have missed and
 * merge the answer back in. We never train or ship our own model.
 */

(function (root) {
  // Shared instruction for both providers.
  const SYSTEM_PROMPT =
    "You are an AWS cloud security reviewer. Given an infrastructure prompt, " +
    "list security controls that are MISSING from it (do not repeat ones already stated). " +
    "You may also be given a list of controls the rule engine flagged as missing; if the " +
    "prompt actually satisfies any of them, list their EXACT labels in \"satisfied\". " +
    "Reply with STRICT JSON only: " +
    '{"missing":[{"label":"","severity":"high|medium|low","description":"","clause":""}],' +
    '"risky":[{"label":"","severity":"high|medium|low","description":"","fix":""}],' +
    '"satisfied":["exact label from the supplied rule list"]}. ' +
    "If nothing is missing and nothing is risky, return empty arrays. " +
    "At most 10 missing, 5 risky and 10 satisfied. Each clause is one imperative sentence.";

  function userMessage(prompt, ruleReport) {
    let msg = "Infrastructure prompt:\n\n" + String(prompt || "");
    const labels = ((ruleReport && ruleReport.missing) || [])
      .map((m) => m && m.label)
      .filter(Boolean);
    if (labels.length) {
      msg +=
        "\n\nThe rule engine flagged these exact controls as missing:\n" +
        labels.map((l) => "- " + l).join("\n") +
        "\n\nIf the prompt already satisfies any of these exact labels, list those labels in \"satisfied\". " +
        "Only include a label when you are confident.";
    }
    return msg;
  }

  function normSeverity(s) {
    const v = String(s || "").toLowerCase();
    return v === "high" || v === "medium" || v === "low" ? v : "medium";
  }

  // Turn the model's text output into { missing, risky } (tolerant of extra prose).
  function parseFindings(text) {
    const match = String(text || "").match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Model returned no JSON.");
    const data = JSON.parse(match[0]);

    const missing = (Array.isArray(data.missing) ? data.missing : [])
      .filter((m) => m && m.label)
      .slice(0, 10)
      .map((m) => ({
        label: String(m.label),
        severity: normSeverity(m.severity),
        description: String(m.description || "Identified by deep scan."),
        clause: String(m.clause || m.description || m.label),
        source: "ai"
      }));

    const risky = (Array.isArray(data.risky) ? data.risky : [])
      .filter((r) => r && r.label)
      .slice(0, 5)
      .map((r) => ({
        label: String(r.label),
        severity: normSeverity(r.severity),
        description: String(r.description || "Identified by deep scan."),
        fix: String(r.fix || r.description || r.label),
        source: "ai"
      }));

    // The model is told to return empty arrays when nothing is missing.
    // Mark that as "clean" so the UI can say "no issues" rather than showing
    // an empty, confusing report.
    const satisfied = (Array.isArray(data.satisfied) ? data.satisfied : [])
      .map((s) => (typeof s === "string" ? s : s && s.label))
      .filter(Boolean)
      .map((s) => String(s))
      .slice(0, 10);

    return {
      missing: missing,
      risky: risky,
      satisfied: satisfied,
      clean: missing.length === 0 && risky.length === 0
    };
  }

  // --- Tier 1: on-device (Chrome built-in AI), no key and no network ---
  function localModel() {
    if (typeof self === "undefined") return null;
    return self.LanguageModel || (self.ai && self.ai.languageModel) || null;
  }

  function localAvailable() {
    return !!localModel();
  }

  async function localDeepScan(prompt, ruleReport) {
    const LM = localModel();
    if (!LM) throw new Error("On-device model not available.");
    if (LM.availability) {
      const state = await LM.availability();
      if (state === "unavailable") throw new Error("On-device model unavailable.");
      if (state === "downloadable" && LM.create) {
        // create() will trigger the one-time download.
      }
    }
    const session = await LM.create({ systemPrompt: SYSTEM_PROMPT });
    const text = await session.prompt(userMessage(prompt, ruleReport));
    if (session.destroy) session.destroy();
    return parseFindings(text);
  }

  // --- Tier 2: hosted API (OpenAI-compatible), needs a key ---
  async function hostedDeepScan(prompt, settings, ruleReport) {
    const apiKey = settings && settings.apiKey;
    if (!apiKey) throw new Error("No API key set.");
    const baseUrl = ((settings && settings.baseUrl) || "https://api.openai.com/v1").replace(/\/+$/, "");
    const model = (settings && settings.model) || "gpt-4o-mini";

    const res = await fetch(baseUrl + "/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
      body: JSON.stringify({
        model: model,
        temperature: 0,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage(prompt, ruleReport) }
        ]
      })
    });
    if (!res.ok) {
      let detail = "";
      try {
        const body = await res.json();
        const err = Array.isArray(body) ? body[0] && body[0].error : body && body.error;
        detail = (err && (err.message || err.status)) || "";
      } catch (e) {
        /* ignore */
      }
      let msg = "Deep scan failed (" + res.status + ")";
      if (detail) msg += ": " + detail;
      if (res.status === 404) {
        msg += "  Check the model name in Settings (current Gemini models include gemini-2.5-flash and gemini-3.7-flash).";
      }
      throw new Error(msg);
    }
    const data = await res.json();
    const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    return parseFindings(text);
  }

  /**
   * Run a deep scan, preferring the free on-device model.
   * Resolves to { findings, via } where via is "on-device" or "api".
   */
  async function deepScan(prompt, settings, ruleReport) {
    if (localAvailable()) {
      try {
        return { findings: await localDeepScan(prompt, ruleReport), via: "on-device" };
      } catch (e) {
        // fall through to hosted if a key exists
      }
    }
    if (settings && settings.apiKey) {
      return { findings: await hostedDeepScan(prompt, settings, ruleReport), via: "api" };
    }
    throw new Error("Deep scan needs the on-device model or an API key.");
  }

  root.VectorLLM = {
    deepScan: deepScan,
    localDeepScan: localDeepScan,
    localAvailable: localAvailable,
    hostedDeepScan: hostedDeepScan,
    parseFindings: parseFindings,
    normSeverity: normSeverity,
    SYSTEM_PROMPT: SYSTEM_PROMPT
  };
  if (typeof module !== "undefined" && module.exports) module.exports = root.VectorLLM;
})(typeof globalThis !== "undefined" ? globalThis : this);
