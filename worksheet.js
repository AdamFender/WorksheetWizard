:root{
  --bg: #f7f9fc;
  --panel-bg: #fff;
  --muted: #6b7280;
  --accent: #0ea5a4;
  --text: #0f172a;
  --paper-width: 820px;
  --paper-padding: 28px;
  --radius: 12px;
}

/* Themes */
.theme-default { --accent: #0ea5a4; --card-bg:#fff; --bg: #f7f9fc; }
.theme-chalk { --accent: #e6b800; --card-bg:#f4f8f1; --bg: #d7e3d3; font-family: "Courier New", monospace; }
.theme-pastel { --accent: #ff7ab6; --card-bg:#fffaf6; --bg:#fff0f5; }
.theme-mono { --accent: #111827; --card-bg:#ffffff; --bg:#f8fafc; color-scheme: light; }

*{box-sizing:border-box}
html,body{height:100%}
body{
  margin:0; font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  background:var(--bg); color:var(--text);
}

/* Layout */
.app{display:flex; min-height:100vh}
.panel{
  width:340px; padding:20px; background:var(--panel-bg);
  border-right:1px solid rgba(15,23,42,0.04);
  display:flex; flex-direction:column; gap:12px;
}
.preview-area{flex:1; padding:28px; display:flex; gap:18px; align-items:flex-start; justify-content:center}
.answer-key{width:260px; background:white; padding:16px; border-radius:10px; box-shadow:0 8px 20px rgba(2,6,23,0.06); position:sticky; top:28px}

/* Controls */
header h1{margin:0; font-size:1.25rem}
.muted{color:var(--muted)}
.control-group{display:flex; flex-direction:column; gap:6px}
.control-group.two{display:flex; gap:12px}
.control-group input[type="text"], .control-group input[type="number"], select, input[type="file"]{
  padding:10px 12px; border-radius:10px; border:1px solid rgba(15,23,42,0.08); outline:none;
}
.buttons{display:flex; gap:8px; margin-top:6px}
button{cursor:pointer; padding:9px 12px; border-radius:10px; border:1px solid rgba(15,23,42,0.06); background:#fff}
button.primary{background:var(--accent); color:white; border-color:transparent; box-shadow:0 6px 14px rgba(14,165,164,0.12)}
.small-controls{display:flex; gap:8px; margin-top:8px; align-items:center}
.small{font-size:0.8rem}

/* Worksheet */
.worksheet{
  width:var(--paper-width); min-height:1120px; padding:var(--paper-padding);
  background:var(--card-bg); border-radius:10px; box-shadow: 0 10px 30px rgba(2,6,23,0.06);
  overflow:auto;
}
.sheet-header{display:flex; justify-content:space-between; gap:12px; margin-bottom:14px}
.sheet-title{font-size:1.6rem; margin:0 0 6px 0}
.sheet-meta{font-size:0.9rem; color:var(--muted)}

.section-title{display:flex; gap:10px; align-items:center; margin-top:12px; margin-bottom:8px}
.section-title h3{margin:0; font-size:1.05rem}

.question{padding:12px; border-radius:8px; border:1px dashed rgba(0,0,0,0.04); margin-bottom:8px; background: linear-gradient(180deg, rgba(255,255,255,0.6), transparent)}
.question .qnum{font-weight:600; margin-right:8px}
.qrow{display:flex; gap:8px; align-items:flex-start}
.options{margin-top:8px; display:flex; flex-direction:column; gap:6px}
.option{display:flex; gap:8px; align-items:center}
.blank-line{display:inline-block; min-width:160px; border-bottom:2px dotted rgba(0,0,0,0.12); padding:4px 6px}

.match-grid{display:grid; grid-template-columns: 1fr 1fr; gap:8px}
.match-cell{padding:8px; border-radius:8px; background:rgba(0,0,0,0.02); border:1px solid rgba(0,0,0,0.03)}

/* QR */
.qr-wrap{margin-top:8px; display:flex; gap:8px; align-items:center; flex-direction:column;}

/* Print */
@media print{
  body{background:white}
  .panel, .answer-key, .buttons, .small-controls, footer{display:none}
  .worksheet{box-shadow:none; width:100%}
  .question{page-break-inside:avoid}
}

/* small screens */
@media (max-width:1100px){
  .app{flex-direction:column}
  .panel{width:100%}
  .preview-area{padding:12px; flex-direction:column; align-items:center}
  .answer-key{position:static; width:100%}
  .worksheet{width:100%}
}