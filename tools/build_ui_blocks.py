"""Generate the local UI block/template library used by the asset catalog.

These are original, self-contained HTML/CSS screens built for Vector. They do not
copy any third-party template file, so there is no redistribution question.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "ui" / "web-app" / "public" / "template-library"
OUT = ROOT / "blocks"
OUT.mkdir(parents=True, exist_ok=True)

CSS = """
:root {
  --bg:#08090a; --panel:#101113; --panel2:#161719; --line:#1e1f22; --line2:#2a2b2f;
  --ink:#f7f8f8; --ink2:#c9ccd1; --muted:#8a8f98; --faint:#62666d;
  --accent:#7170ff; --accent2:#5e6ad2; --good:#6ea8fe; --warn:#f2c94c; --bad:#eb5757;
}
* { box-sizing: border-box; }
html, body { margin:0; padding:0; }
body { background:var(--bg); color:var(--ink); font-family:Inter,system-ui,sans-serif; font-size:13px; -webkit-font-smoothing:antialiased; }
button, input, textarea, select { font:inherit; }
a { color:inherit; text-decoration:none; }
.top { height:52px; display:flex; align-items:center; gap:10px; padding:0 16px; border-bottom:1px solid var(--line); background:var(--bg); }
.brand { display:flex; align-items:center; gap:8px; font-weight:600; font-size:13px; }
.mark { width:19px; height:19px; border-radius:5px; background:linear-gradient(145deg,#8f8eff,#5e6ad2); display:grid; place-items:center; }
.mark i { width:7px; height:7px; border:1.5px solid #fff; transform:rotate(45deg); border-radius:1px; display:block; }
.crumb { color:var(--faint); font-size:12px; }
.crumb b { color:var(--ink2); font-weight:500; }
.search { margin-left:auto; width:260px; height:30px; border:1px solid var(--line); border-radius:6px; background:var(--panel); color:var(--muted); padding:0 10px; font-size:11.5px; }
.actions { margin-left:auto; display:flex; gap:6px; align-items:center; }
.btn { height:30px; padding:0 11px; border:1px solid var(--line2); border-radius:6px; background:var(--panel2); color:var(--ink); font-size:12px; font-weight:500; display:inline-flex; align-items:center; gap:6px; }
.btn.primary { background:var(--accent2); border-color:var(--accent2); color:#fff; }
.btn.ghost { background:transparent; border-color:transparent; color:var(--muted); }
.layout { display:flex; min-height:calc(100vh - 52px); }
.side { width:204px; flex-shrink:0; border-right:1px solid var(--line); background:#0b0c0d; padding:10px 8px; }
.side .label { margin:14px 8px 5px; font-size:10px; font-weight:500; letter-spacing:.05em; text-transform:uppercase; color:var(--faint); }
.side .item { height:29px; display:flex; align-items:center; gap:8px; padding:0 8px; border-radius:5px; color:var(--muted); font-size:12px; }
.side .item.on { background:var(--panel2); color:var(--ink); }
.dot { width:11px; height:11px; border-radius:3px; background:rgba(255,255,255,.1); }
.item.on .dot { background:var(--accent); }
.main { flex:1; min-width:0; padding:24px; }
.eyebrow { font-size:10.5px; font-weight:500; letter-spacing:.06em; text-transform:uppercase; color:var(--faint); }
h1 { margin:5px 0 6px; font-size:26px; line-height:1.15; letter-spacing:-.025em; font-weight:550; }
h2 { margin:0 0 12px; font-size:15px; font-weight:550; letter-spacing:-.01em; }
h3 { margin:0 0 6px; font-size:13px; font-weight:550; }
p { margin:0; color:var(--muted); line-height:1.55; }
.mono { font-family:"JetBrains Mono",ui-monospace,monospace; }
.head { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:18px; }
.head p { max-width:560px; font-size:12px; }
.stats { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
.card { border:1px solid var(--line); border-radius:8px; background:var(--panel); padding:14px; }
.stat span { display:block; font-size:10.5px; font-weight:500; letter-spacing:.03em; text-transform:uppercase; color:var(--faint); }
.stat b { display:block; margin-top:5px; font-size:23px; font-weight:550; letter-spacing:-.03em; }
.stat em { font-style:normal; font-size:11px; color:var(--muted); }
.cols { display:grid; grid-template-columns:1.5fr 1fr; gap:10px; margin-top:10px; }
.row { display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid rgba(255,255,255,.05); font-size:12px; color:var(--muted); }
.row:last-child { border-bottom:0; }
.row b { color:var(--ink2); font-weight:500; }
.row .right { margin-left:auto; color:var(--faint); font-size:10.5px; }
.tag { display:inline-flex; align-items:center; gap:5px; padding:2px 7px; border:1px solid var(--line2); border-radius:999px; font-size:10px; color:var(--muted); background:var(--panel2); }
.tag i { width:5px; height:5px; border-radius:50%; background:var(--accent); }
.tag.good i { background:var(--good); }
.tag.warn i { background:var(--warn); }
.chart { height:170px; display:flex; align-items:flex-end; gap:6px; padding:12px 4px 0; border-top:1px solid var(--line); margin-top:10px; }
.bar { flex:1; border-radius:3px 3px 0 0; background:rgba(113,112,255,.22); position:relative; min-height:8px; }
.bar.on { background:var(--accent); }
.bar span { position:absolute; inset:0; border-radius:inherit; }
.table { width:100%; border-collapse:collapse; font-size:11.5px; }
.table th { text-align:left; font-size:9.5px; font-weight:500; letter-spacing:.06em; text-transform:uppercase; color:var(--faint); padding:9px 8px; border-bottom:1px solid var(--line); }
.table td { padding:10px 8px; border-bottom:1px solid rgba(255,255,255,.05); color:var(--muted); }
.table td b { color:var(--ink2); font-weight:500; }
.filters { display:flex; gap:6px; margin-bottom:12px; flex-wrap:wrap; }
.chip { height:26px; padding:0 9px; border:1px solid var(--line); border-radius:5px; background:transparent; color:var(--muted); font-size:11px; }
.chip.on { background:var(--panel2); border-color:var(--line2); color:var(--ink); }
.notice { border:1px solid rgba(113,112,255,.28); background:rgba(113,112,255,.06); border-radius:8px; padding:12px; font-size:11.5px; color:var(--muted); }
.field { width:100%; height:34px; border:1px solid var(--line2); border-radius:6px; background:var(--bg); color:var(--ink); padding:0 10px; font-size:12px; }
.label { display:block; margin:10px 0 5px; font-size:10.5px; font-weight:500; color:var(--faint); text-transform:uppercase; letter-spacing:.04em; }
.center { min-height:100vh; display:grid; place-items:center; padding:24px; }
.hero { padding:64px 24px 40px; max-width:1000px; margin:0 auto; }
.hero h1 { font-size:52px; max-width:760px; line-height:1.02; letter-spacing:-.04em; font-weight:500; }
.hero p { max-width:520px; margin-top:14px; font-size:14px; }
.hero-actions { display:flex; gap:8px; margin-top:22px; }
.product { display:grid; grid-template-columns:1.1fr 1fr; gap:20px; }
.gallery { border:1px solid var(--line); border-radius:8px; background:var(--panel2); min-height:360px; display:grid; place-items:center; color:var(--faint); }
.price-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:16px; }
.price { border:1px solid var(--line); border-radius:8px; background:var(--panel); padding:16px; }
.price.on { border-color:rgba(113,112,255,.45); background:rgba(113,112,255,.06); }
.price h3 { font-size:12px; color:var(--muted); }
.price b { display:block; font-size:26px; font-weight:550; letter-spacing:-.03em; margin:8px 0 2px; }
.price ul { list-style:none; padding:0; margin:12px 0; font-size:11.5px; color:var(--muted); }
.price li { padding:5px 0; border-bottom:1px solid rgba(255,255,255,.05); }
.auth { display:grid; grid-template-columns:1fr 1fr; min-height:100vh; }
.auth-side { padding:40px; border-right:1px solid var(--line); background:var(--panel); display:flex; flex-direction:column; justify-content:space-between; }
.auth-form { padding:40px; display:grid; place-items:center; }
.auth-card { width:100%; max-width:340px; }
.phone { width:300px; height:600px; border:1px solid var(--line2); border-radius:32px; padding:12px; background:#0b0c0d; margin:40px auto; box-shadow:0 30px 80px rgba(0,0,0,.5); }
.phone-screen { height:100%; border:1px solid var(--line); border-radius:22px; overflow:hidden; background:var(--bg); padding:14px; }
.chat { display:grid; grid-template-columns:220px 1fr; height:calc(100vh - 52px); }
.threads { border-right:1px solid var(--line); background:#0b0c0d; padding:10px; }
.thread { padding:9px; border-radius:6px; font-size:11.5px; color:var(--muted); }
.thread.on { background:var(--panel2); color:var(--ink); }
.messages { padding:18px; overflow:hidden; display:flex; flex-direction:column; gap:10px; }
.msg { max-width:72%; padding:9px 11px; border:1px solid var(--line); border-radius:8px; background:var(--panel); font-size:11.5px; color:var(--ink2); line-height:1.5; }
.msg.me { margin-left:auto; background:var(--accent2); border-color:var(--accent2); color:#fff; }
.composer { margin-top:auto; display:flex; gap:6px; }
.grid3 { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
.thumb { border:1px solid var(--line); border-radius:8px; overflow:hidden; background:var(--panel); }
.thumb .cover { height:120px; background:linear-gradient(145deg,#1b1c2a,#0e0f13); }
.thumb .body { padding:10px; }
.empty { border:1px dashed var(--line2); border-radius:8px; padding:40px; text-align:center; color:var(--faint); }
@media (max-width: 900px) {
  .side { display:none; }
  .stats, .grid3 { grid-template-columns:1fr 1fr; }
  .cols, .product, .auth, .price-grid { grid-template-columns:1fr; }
  .hero h1 { font-size:38px; }
  .auth-side { display:none; }
  .chat { grid-template-columns:1fr; }
  .threads { display:none; }
}
"""


def page(title: str, body: str) -> str:
    return f"""<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} - Vector block</title><link rel="stylesheet" href="blocks.css"></head>
<body>{body}</body></html>"""


def top(crumb: str = "Workspace") -> str:
    return f"""<div class="top"><span class="brand"><span class="mark"><i></i></span>Vector</span><span class="crumb">/ <b>{crumb}</b></span><input class="search" placeholder="Search projects, briefs, templates..." /><div class="actions"><button class="btn ghost">Ask AI</button><button class="btn primary">Create</button></div></div>"""


def sidebar(active: str) -> str:
    items = [("Home", "Home"), ("Projects", "Projects"), ("Templates", "Templates"), ("Library", "Library"), ("Learn", "Learn")]
    return '<div class="side">' + "".join(
        f'<div class="item {"on" if label == active else ""}"><span class="dot"></span>{label}</div>' for label, _ in items
    ) + "</div>"


BLOCKS = []

BLOCKS.append(("dashboard-overview", "Dashboard overview", "Dashboard", f"""
{top("Home")}
<div class="layout">{sidebar("Home")}
  <div class="main">
    <div class="head"><div><div class="eyebrow">Workspace</div><h1>What will you build today?</h1><p>Turn one sentence into a complete, reviewed prompt. Track readiness and the next best action.</p></div><button class="btn primary">New project</button></div>
    <div class="stats">
      <div class="card stat"><span>Brief readiness</span><b>92%</b><em>+8% this week</em></div>
      <div class="card stat"><span>Requirements</span><b>8 / 8</b><em>All approved</em></div>
      <div class="card stat"><span>Pending suggestions</span><b>7</b><em>2 high severity</em></div>
      <div class="card stat"><span>Criteria covered</span><b>16 / 16</b><em>All covered</em></div>
    </div>
    <div class="cols">
      <div class="card"><h2>Latest brief</h2>
        <div class="row"><b>Audience</b><span class="right">Ops leads and finance admins</span></div>
        <div class="row"><b>Goal</b><span class="right">Weekly revenue at a glance</span></div>
        <div class="row"><b>Surface</b><span class="right">Dashboard 1200 x 800</span></div>
        <div class="row"><b>Components</b><span class="right">4 KPI / chart / table</span></div>
        <div class="row"><b>System</b><span class="right">Vector default</span></div>
      </div>
      <div class="card"><h2>Next best action</h2><h3 style="font-size:20px">Review 7 suggestions.</h3><p>Edge cases and implicit behaviours were detected. Accept the high-confidence ones, then the prompt unlocks.</p><button class="btn primary" style="margin-top:14px">Open review</button></div>
    </div>
    <div class="card" style="margin-top:10px"><h2>Recent activity</h2>
      <div class="row"><b>Roshna</b> approved 4 requirements<span class="right">12 min ago</span></div>
      <div class="row"><b>Vector</b> found 2 high-severity suggestions<span class="right">18 min ago</span></div>
      <div class="row"><b>You</b> saved brief v.04<span class="right">31 min ago</span></div>
    </div>
  </div>
</div>"""))

BLOCKS.append(("analytics-report", "Analytics report", "Dashboard", f"""
{top("Reports")}
<div class="layout">{sidebar("Projects")}
  <div class="main">
    <div class="head"><div><div class="eyebrow">Reports</div><h1>Revenue by month</h1><p>Last 9 months, all teams. Updated automatically from the warehouse.</p></div><div class="actions"><button class="btn">7 days</button><button class="btn primary">30 days</button></div></div>
    <div class="stats">
      <div class="card stat"><span>Revenue</span><b>Rs 48,210</b><em>+12.4%</em></div>
      <div class="card stat"><span>Churn</span><b>2.1%</b><em>-0.4%</em></div>
      <div class="card stat"><span>Signups</span><b>914</b><em>+8.2%</em></div>
      <div class="card stat"><span>MRR</span><b>Rs 8.2k</b><em>+4.1%</em></div>
    </div>
    <div class="card" style="margin-top:10px"><h2>Revenue by month</h2><div class="chart">
      <div class="bar" style="height:38%"></div><div class="bar" style="height:55%"></div><div class="bar" style="height:44%"></div><div class="bar" style="height:68%"></div><div class="bar" style="height:51%"></div><div class="bar on" style="height:82%"></div><div class="bar" style="height:64%"></div><div class="bar" style="height:91%"></div><div class="bar" style="height:58%"></div><div class="bar" style="height:74%"></div><div class="bar" style="height:47%"></div><div class="bar" style="height:86%"></div>
    </div></div>
    <div class="cols">
      <div class="card"><h2>Top segments</h2><div class="row"><b>Self serve</b><span class="right">Rs 21,420</span></div><div class="row"><b>Mid market</b><span class="right">Rs 15,800</span></div><div class="row"><b>Enterprise</b><span class="right">Rs 10,990</span></div></div>
      <div class="card"><h2>Notes</h2><p>Enterprise renewals land in the last week of the month. The dip in March is a billing calendar artefact.</p></div>
    </div>
  </div>
</div>"""))

BLOCKS.append(("projects-grid", "Projects grid", "Projects", f"""
{top("Projects")}
<div class="layout">{sidebar("Projects")}
  <div class="main">
    <div class="head"><div><div class="eyebrow">Workspace</div><h1>Projects</h1><p>Requirements, prompts, design systems and history stay together in one place.</p></div><button class="btn primary">New project</button></div>
    <div class="filters"><button class="chip on">All projects</button><button class="chip">Recents</button><button class="chip">Shared</button><button class="chip">Trash</button></div>
    <div class="grid3">
      <div class="thumb"><div class="cover"></div><div class="body"><b>SaaS Analytics Dashboard</b><p style="font-size:10.5px;margin-top:3px">Dashboard / 5 blocks</p><div style="margin-top:8px"><span class="tag"><i></i>Current</span></div></div></div>
      <div class="thumb"><div class="cover" style="background:linear-gradient(145deg,#1a1b24,#0e0f13)"></div><div class="body"><b>Product Detail Page</b><p style="font-size:10.5px;margin-top:3px">Commerce / 5 blocks</p><div style="margin-top:8px"><span class="tag">Open</span></div></div></div>
      <div class="thumb"><div class="cover" style="background:linear-gradient(145deg,#161720,#0e0f13)"></div><div class="body"><b>Settings &amp; Profile</b><p style="font-size:10.5px;margin-top:3px">Dashboard / 5 blocks</p><div style="margin-top:8px"><span class="tag">Open</span></div></div></div>
    </div>
    <div class="card" style="margin-top:10px"><h2>Recent activity</h2><div class="row"><b>Template Test</b> moved to review<span class="right">2 min ago</span></div><div class="row"><b>Auth &amp; Onboarding</b> updated<span class="right">1 hour ago</span></div></div>
  </div>
</div>"""))

BLOCKS.append(("requirements-table", "Requirements table", "Data", f"""
{top("Requirements")}
<div class="layout">{sidebar("Projects")}
  <div class="main">
    <div class="head"><div><div class="eyebrow">Project / Requirements</div><h1>Requirements</h1><p>Every extracted statement keeps its source page and character offsets.</p></div><button class="btn primary">Choose document</button></div>
    <div class="filters"><button class="chip on">All 8</button><button class="chip">Functional 6</button><button class="chip">Non-functional 2</button></div>
    <div class="card">
      <table class="table"><thead><tr><th>ID</th><th>Requirement</th><th>Type</th><th>Priority</th><th>Status</th></tr></thead><tbody>
        <tr><td class="mono">REQ-01</td><td><b>Employees sign in with company email and password.</b><br><span style="font-size:10px">Page 1 / chars 40-118</span></td><td>Functional</td><td>Critical</td><td><span class="tag good"><i></i>Approved</span></td></tr>
        <tr><td class="mono">REQ-02</td><td><b>Employees can edit name, phone and photo.</b><br><span style="font-size:10px">Page 1 / chars 120-204</span></td><td>Functional</td><td>High</td><td><span class="tag good"><i></i>Approved</span></td></tr>
        <tr><td class="mono">REQ-03</td><td><b>The form validates phone and photo size.</b><br><span style="font-size:10px">Page 1 / chars 210-302</span></td><td>Functional</td><td>High</td><td><span class="tag good"><i></i>Approved</span></td></tr>
        <tr><td class="mono">REQ-08</td><td><b>The app is usable on phones and tablets.</b><br><span style="font-size:10px">Page 2 / chars 80-160</span></td><td>Non-functional</td><td>Medium</td><td><span class="tag warn"><i></i>Review</span></td></tr>
      </tbody></table>
    </div>
  </div>
</div>"""))

BLOCKS.append(("review-suggestions", "Review suggestions", "Workflow", f"""
{top("Review & acceptance")}
<div class="layout">{sidebar("Projects")}
  <div class="main">
    <div class="head"><div><div class="eyebrow">Project / Review</div><h1>Review &amp; acceptance</h1><p>AI-inferred behaviours stay suggestions until you accept them.</p></div><button class="btn primary">Accept all high confidence</button></div>
    <div class="cols" style="grid-template-columns:360px 1fr">
      <div class="card" style="padding:0">
        <div class="row" style="padding:11px 12px;background:rgba(113,112,255,.08);border-left:2px solid var(--accent)"><span style="color:var(--bad)">*</span><b>Button action is vague</b><span class="right">HIGH</span></div>
        <div class="row" style="padding:11px 12px"><span style="color:var(--bad)">*</span><b>Missing empty state</b><span class="right">HIGH</span></div>
        <div class="row" style="padding:11px 12px"><span style="color:var(--warn)">*</span><b>Validation timing unclear</b><span class="right">MEDIUM</span></div>
        <div class="row" style="padding:11px 12px"><span style="color:var(--warn)">*</span><b>Export scope unclear</b><span class="right">MEDIUM</span></div>
      </div>
      <div class="card">
        <span class="tag" style="color:#ff9a9a;border-color:rgba(235,87,87,.28);background:rgba(235,87,87,.08)">HIGH SEVERITY</span>
        <h2 style="font-size:22px;margin-top:12px">Button action is vague.</h2>
        <p>The signup button says it opens the form, but the destination, transition and failure state are not defined.</p>
        <div class="notice" style="margin-top:12px">Why it matters: this is the first action a new user takes. Ambiguity produces a dead end or a duplicate screen.</div>
        <div class="card" style="margin-top:10px;background:var(--bg);padding:11px"><span class="mono" style="font-size:10px;color:var(--accent)">REQ-01</span><p style="font-size:11.5px">Employees must sign in with their company email and password before they can access the profile area.</p></div>
        <div style="display:flex;gap:6px;margin-top:14px"><button class="btn primary" style="flex:1">Accept suggestion</button><button class="btn" style="flex:1">Edit then accept</button><button class="btn" style="flex:1">Reject</button></div>
      </div>
    </div>
  </div>
</div>"""))

BLOCKS.append(("prompt-studio", "Prompt studio", "Workflow", f"""
{top("Prompt studio")}
<div class="layout">{sidebar("Projects")}
  <div class="main">
    <div class="head"><div><div class="eyebrow">Project / Prompt studio</div><h1>UI Specification &amp; Prompt</h1><p>The source-of-truth brief, built from approved requirements and criteria.</p></div><div class="actions"><button class="btn">Refresh</button><button class="btn primary">Copy prompt</button></div></div>
    <div class="cols" style="grid-template-columns:1fr 300px">
      <div class="card">
        <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:12px"><b style="font-size:15px">UI Specification &amp; Prompt</b><span class="tag good"><i></i>Draft v.04</span></div>
        <div class="eyebrow">01 / Context</div><p style="margin:5px 0 12px">Build a <b style="color:var(--ink2)">responsive analytics dashboard</b> for ops leads and finance admins. The screen should feel quiet, data-first and trustworthy.</p>
        <div class="eyebrow">02 / Layout</div><p style="margin:5px 0 12px">Fixed top navigation; collapsible left sidebar; content area with four KPI cards, a full-width 30-day trend chart and a recent-orders table. Stack KPI cards 2-up below 768px.</p>
        <div class="eyebrow">03 / Components</div><p style="margin:5px 0 12px"><b style="color:var(--ink2)">KPI card x4</b> with label, value and delta. <b style="color:var(--ink2)">Trend chart</b> with line + area and a 7/30/90-day selector. <b style="color:var(--ink2)">Recent orders</b> table with search, filter and CSV export.</p>
        <div class="eyebrow">04 / Interaction</div><p style="margin:5px 0 0">Date range changes the chart in place. Export downloads the visible range as CSV. Empty states explain how data appears. Errors are inline and retryable.</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div class="card"><div class="eyebrow">Coverage</div><b style="display:block;font-size:28px;font-weight:550;margin-top:6px">92%</b><div style="height:4px;background:var(--panel2);border-radius:999px;margin:8px 0"><div style="height:100%;width:92%;background:var(--accent);border-radius:999px"></div></div><p style="font-size:11px">8 of 8 requirements and 16 of 16 criteria covered.</p></div>
        <div class="card"><div class="eyebrow">Source of truth</div><div class="row"><b>Requirements</b><span class="right">8 / 8</span></div><div class="row"><b>Criteria</b><span class="right">16 / 16</span></div><div class="row"><b>Suggestions</b><span class="right">7 pending</span></div></div>
        <div class="card"><div class="eyebrow">Generate</div><p style="font-size:11px;margin-bottom:8px">Copy the prompt or send it to a tool.</p><button class="btn primary" style="width:100%">Copy prompt</button></div>
      </div>
    </div>
  </div>
</div>"""))

BLOCKS.append(("settings-profile", "Settings & profile", "Settings", f"""
{top("Settings")}
<div class="layout">{sidebar("Home")}
  <div class="main" style="max-width:860px">
    <div class="head"><div><div class="eyebrow">Account / Settings</div><h1>Settings</h1><p>Account, appearance, local data and the manual.</p></div><button class="btn">Open manual</button></div>
    <div class="card" style="margin-bottom:10px"><div class="eyebrow">Profile</div>
      <div style="display:flex;align-items:center;gap:12px;margin-top:12px"><div style="width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,#5e6ad2,#7170ff);display:grid;place-items:center;font-weight:600">LW</div><div style="flex:1"><b style="font-size:14px">Lena Wu</b><p style="font-size:11.5px">lena@northwind.co</p></div><span class="tag">Free plan</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px"><div class="card" style="background:var(--bg);padding:10px"><div class="eyebrow">Account type</div><b style="display:block;margin-top:3px;font-weight:500">Vector account</b></div><div class="card" style="background:var(--bg);padding:10px"><div class="eyebrow">Projects</div><b style="display:block;margin-top:3px;font-weight:500">2 included</b></div></div>
      <button class="btn" style="margin-top:12px">Manage plan</button>
    </div>
    <div class="card" style="margin-bottom:10px"><h2>Appearance</h2><p style="font-size:11.5px">Vector is dark-only. The interface uses the deep canvas, hairline borders and the indigo accent.</p><div style="display:flex;align-items:center;gap:10px;border:1px solid var(--line);border-radius:6px;padding:10px;margin-top:10px"><span class="dot" style="background:var(--accent)"></span><b style="flex:1;font-weight:500">Vector Obsidian</b><span class="tag good"><i></i>Active</span></div></div>
    <div class="card"><h2>Local data</h2><p style="font-size:11.5px">Prompt-analysis history is cached in this browser. Clearing it does not delete project data.</p><button class="btn" style="margin-top:10px;color:#ff9a9a;border-color:rgba(235,87,87,.28)">Clear local history</button></div>
  </div>
</div>"""))

BLOCKS.append(("billing-plans", "Billing plans", "Settings", f"""
{top("Plans")}
<div class="main" style="max-width:1000px;margin:0 auto;padding:40px 24px">
  <div style="text-align:center"><div class="eyebrow">Plans</div><h1>Plans that grow with the work</h1><p style="max-width:480px;margin:8px auto 0">Two full projects are free. Nothing is charged until you choose a plan.</p></div>
  <div class="price-grid">
    <div class="price"><h3>Free</h3><b>Rs 0</b><p style="font-size:11px">Try the full engine on two projects.</p><ul><li>2 projects</li><li>Base44 + v0</li><li>Local history</li><li>Design systems</li></ul><button class="btn" style="width:100%">Current plan</button></div>
    <div class="price on"><h3>Pro</h3><b>Rs 499 <span style="font-size:11px;color:var(--faint)">/ month</span></b><p style="font-size:11px">For builders shipping every week.</p><ul><li>Unlimited projects</li><li>All generators</li><li>Prompt versions</li><li>Shared systems</li></ul><button class="btn primary" style="width:100%">Choose Pro</button></div>
    <div class="price"><h3>Team</h3><b>Rs 1,499 <span style="font-size:11px;color:var(--faint)">/ month</span></b><p style="font-size:11px">For product teams and agencies.</p><ul><li>Everything in Pro</li><li>Shared workspace</li><li>Review and approvals</li><li>Priority support</li></ul><button class="btn" style="width:100%">Choose Team</button></div>
  </div>
</div>"""))

BLOCKS.append(("auth-login", "Login", "Auth", f"""
<div class="auth">
  <div class="auth-side"><div><span class="brand"><span class="mark"><i></i></span>Vector</span><h1 style="font-size:32px;margin-top:40px">Requirements in.<br>Interfaces that hold up.</h1><p style="margin-top:10px;max-width:320px">Traceable requirements, reviewed edge cases and a build-ready specification.</p></div><p style="font-size:11px">Vector / Requirement engineering for UI teams</p></div>
  <div class="auth-form"><div class="auth-card"><div class="eyebrow">Welcome back</div><h1 style="font-size:24px">Sign in to Vector</h1><p style="font-size:11.5px">Use your work email to continue.</p>
    <label class="label">Email</label><input class="field" placeholder="you@company.com" />
    <label class="label">Password</label><input class="field" type="password" placeholder="Password" />
    <button class="btn primary" style="width:100%;margin-top:14px">Sign in</button>
    <p style="font-size:10.5px;margin-top:10px;text-align:center">New here? Create an account</p>
  </div></div>
</div>"""))

BLOCKS.append(("landing-hero", "Landing page", "Marketing", f"""
{top("Product")}
<div class="hero"><span class="tag"><i></i>New / Vector 2.0</span><h1>The requirement-to-interface system for product teams.</h1><p>Turn a rough brief into traceable requirements, reviewed decisions and one complete prompt.</p><div class="hero-actions"><button class="btn primary" style="height:36px">Start building</button><button class="btn" style="height:36px">See how it works</button></div></div>
<div style="max-width:1000px;margin:0 auto;padding:0 24px"><div style="border:1px solid var(--line);border-radius:10px;overflow:hidden;background:var(--panel)"><div class="top" style="height:38px;padding:0 12px"><span class="brand" style="font-size:11px"><span class="mark" style="width:15px;height:15px"></span>Vector</span><span class="crumb">Projects / Dashboard</span></div><div style="display:grid;grid-template-columns:160px 1fr;min-height:260px"><div style="border-right:1px solid var(--line);padding:12px"><div class="row" style="padding:6px 0"><b>Overview</b></div><div class="row" style="padding:6px 0">Editor</div><div class="row" style="padding:6px 0">Brief</div><div class="row" style="padding:6px 0">Review</div></div><div style="padding:18px"><div class="stats" style="grid-template-columns:repeat(3,1fr)"><div class="card stat"><span>Brief</span><b>92%</b></div><div class="card stat"><span>Requirements</span><b>8 / 8</b></div><div class="card stat"><span>Suggestions</span><b>7</b></div></div><div class="chart" style="height:120px"><div class="bar" style="height:40%"></div><div class="bar" style="height:62%"></div><div class="bar on" style="height:78%"></div><div class="bar" style="height:55%"></div><div class="bar" style="height:88%"></div><div class="bar" style="height:66%"></div></div></div></div></div></div>"""))

BLOCKS.append(("commerce-product", "Product detail", "Commerce", f"""
{top("Shop")}
<div class="main" style="max-width:1000px;margin:0 auto;padding:24px">
  <div class="product">
    <div class="gallery">Product image / 4 views</div>
    <div><div class="eyebrow">Merino / Outerwear</div><h1>Merino Wool Coat</h1><b style="display:block;font-size:24px;font-weight:550;margin:6px 0 10px">Rs 8,400</b><p>Mid-weight merino with a clean shoulder and a hidden placket. Made in a small run.</p>
      <label class="label">Size</label><div class="filters"><button class="chip">S</button><button class="chip on">M</button><button class="chip">L</button><button class="chip">XL</button></div>
      <button class="btn primary" style="width:100%;height:38px">Add to bag</button>
      <div class="row" style="margin-top:12px"><b>Shipping</b><span class="right">Free over Rs 5,000</span></div><div class="row"><b>Returns</b><span class="right">30 days</span></div>
    </div>
  </div>
  <div class="cols" style="margin-top:18px"><div class="card"><h2>Details</h2><p>100% merino wool. Fully lined. Two interior pockets. Dry clean.</p></div><div class="card"><h2>Reviews</h2><p>4.8 / 5 from 124 orders. Most mention the fit and the weight.</p></div></div>
</div>"""))

BLOCKS.append(("chat-interface", "Chat interface", "Collaboration", f"""
{top("Inbox")}
<div class="chat"><div class="threads"><input class="search" style="width:100%;margin:0 0 8px" placeholder="Search threads" /><div class="thread on">Design review</div><div class="thread">Northwind handoff</div><div class="thread">Prompt quality</div><div class="thread">Billing question</div></div>
<div class="messages"><div class="msg">Can you take a look at the review suggestions before we generate?</div><div class="msg me">Yes. The empty state and export scope are the two I want to resolve first.</div><div class="msg">I accepted the high-confidence ones. Coverage is at 92%.</div><div class="composer"><input class="field" placeholder="Message the team..." /><button class="btn primary">Send</button></div></div></div>"""))

BLOCKS.append(("onboarding-steps", "Onboarding", "Workflow", f"""
<div class="center"><div style="width:100%;max-width:520px"><div class="eyebrow">New project</div><h1>How do you want to start?</h1><p style="margin-bottom:16px">Choose a template, start blank, or import a design. You can change any of this later.</p><div class="grid3" style="grid-template-columns:1fr 1fr 1fr"><div class="card" style="border-color:rgba(113,112,255,.45);background:rgba(113,112,255,.06)"><div class="dot" style="background:var(--accent);width:22px;height:22px"></div><h3 style="margin-top:8px">Use a template</h3><p style="font-size:10.5px">Start with a proven layout.</p></div><div class="card"><div class="dot" style="width:22px;height:22px"></div><h3 style="margin-top:8px">Start blank</h3><p style="font-size:10.5px">An empty 1200x800 canvas.</p></div><div class="card"><div class="dot" style="width:22px;height:22px"></div><h3 style="margin-top:8px">Import a design</h3><p style="font-size:10.5px">Bring in Figma or another source.</p></div></div><div class="card" style="margin-top:12px"><h2>Suggested for you</h2><div class="row"><b>SaaS Analytics Dashboard</b><span class="right">Dashboard / 5 blocks</span></div><div class="row"><b>Admin Data Table</b><span class="right">Data / 5 blocks</span></div></div><div style="display:flex;justify-content:space-between;margin-top:14px"><button class="btn">Back</button><button class="btn primary">Create project</button></div></div></div>"""))

BLOCKS.append(("empty-state", "Empty state", "Utility", f"""
{top("Projects")}
<div class="layout">{sidebar("Projects")}<div class="main"><div class="head"><div><div class="eyebrow">Workspace</div><h1>Projects</h1><p>Requirements, prompts, design systems and history stay together.</p></div><button class="btn primary">New project</button></div><div class="empty"><div style="font-size:26px;margin-bottom:8px">[]</div><b style="display:block;color:var(--ink);font-size:14px;margin-bottom:5px">No projects yet</b>Create one, or start from a template.<div style="margin-top:14px"><button class="btn primary">Browse templates</button></div></div></div></div>"""))

BLOCKS.append(("not-found", "404", "Utility", f"""
<div class="center"><div style="text-align:center"><div class="eyebrow">404</div><h1 style="font-size:40px">This screen does not exist.</h1><p style="max-width:380px;margin:8px auto 0">The link may be broken, or the project may have moved. Head back to the workspace to continue.</p><div style="margin-top:18px"><button class="btn primary">Back to workspace</button></div></div></div>"""))

BLOCKS.append(("mobile-app", "Mobile app", "Mobile", f"""
<div class="phone"><div class="phone-screen"><div style="display:flex;justify-content:space-between;font-size:9px;color:var(--faint)"><span>9:41</span><span>5G / 100%</span></div><div style="margin-top:14px"><div class="eyebrow">Today</div><h1 style="font-size:20px">Good morning, Lena.</h1><div class="card" style="margin-top:12px;background:rgba(113,112,255,.1);border-color:rgba(113,112,255,.3)"><span class="tag"><i></i>Next action</span><h3 style="margin-top:8px">Review 7 suggestions</h3><p style="font-size:10px">Two are high severity.</p></div><div class="card" style="margin-top:8px"><div class="stats" style="grid-template-columns:1fr 1fr"><div><span class="eyebrow">Readiness</span><b style="display:block;font-size:18px">92%</b></div><div><span class="eyebrow">Criteria</span><b style="display:block;font-size:18px">16/16</b></div></div></div></div><div style="position:absolute;bottom:28px;left:24px;right:24px;display:flex;justify-content:space-around;border-top:1px solid var(--line);padding-top:10px;font-size:9px;color:var(--faint)"><span style="color:var(--accent)">Home</span><span>Projects</span><span>Review</span><span>More</span></div></div></div>"""))

BLOCKS.append(("portfolio-grid", "Portfolio grid", "Marketing", f"""
{top("Work")}
<div class="main" style="max-width:1000px;margin:0 auto"><div class="head"><div><div class="eyebrow">Selected work</div><h1>Design at the speed of thought.</h1><p>Product design, design systems and interfaces for teams that ship.</p></div></div><div class="grid3">
  <div class="thumb"><div class="cover" style="height:160px;background:linear-gradient(145deg,#23243a,#11121a)"></div><div class="body"><b>Northwind</b><p style="font-size:10.5px">Analytics dashboard / 2026</p></div></div>
  <div class="thumb"><div class="cover" style="height:160px;background:linear-gradient(145deg,#1a2a32,#10151a)"></div><div class="body"><b>Meridian</b><p style="font-size:10.5px">Commerce system / 2025</p></div></div>
  <div class="thumb"><div class="cover" style="height:160px;background:linear-gradient(145deg,#2b2030,#141016)"></div><div class="body"><b>Arc Studio</b><p style="font-size:10.5px">Identity + product / 2025</p></div></div>
</div></div>"""))


def main() -> None:
    (OUT / "blocks.css").write_text(CSS, encoding="utf-8")
    manifest = []
    for slug, title, category, body in BLOCKS:
        (OUT / f"{slug}.html").write_text(page(title, body), encoding="utf-8")
        manifest.append({"slug": slug, "title": title, "category": category, "file": f"blocks/{slug}.html"})
    (OUT / "blocks.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"blocks={len(manifest)}")


if __name__ == "__main__":
    main()
