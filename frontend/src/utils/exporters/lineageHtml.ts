import { splitProcedures } from '../lineage/procedureSplitter';
import { parseLineage } from '../lineageParser';

export function generateLineageReportHtml(sql: string): string {
  const procedures = splitProcedures(sql);
  
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Data Lineage Summary Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1000px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
    h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    h2 { color: #2980b9; margin-top: 30px; }
    .procedure-card { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .box { border: 1px solid #eee; border-radius: 6px; padding: 15px; }
    .box-source { border-left: 4px solid #2ecc71; background: #f4fcf6; }
    .box-target { border-left: 4px solid #9b59b6; background: #faf4fc; }
    h3 { margin-top: 0; font-size: 16px; color: #555; }
    ul { margin: 0; padding-left: 20px; font-size: 14px; }
    li { margin-bottom: 4px; }
    .empty { color: #999; font-style: italic; }
  </style>
</head>
<body>
  <h1>Data Lineage Summary Report</h1>
  <p>Generated at: ${new Date().toLocaleString()}</p>
  <p>Total Procedures Detected: ${procedures.length === 1 && procedures[0].name === 'Global Script' ? 1 : procedures.length}</p>
`;

  procedures.forEach(proc => {
    const result = parseLineage(proc.sql);
    
    html += `
  <div class="procedure-card">
    <h2>Procedure: ${proc.name}</h2>
    <div class="grid">
      <div class="box box-source">
        <h3>Sources (Inputs)</h3>
        ${result.sources.length > 0 ? `<ul>${result.sources.map(s => `<li>${s}</li>`).join('')}</ul>` : `<p class="empty">No sources detected.</p>`}
      </div>
      <div class="box box-target">
        <h3>Targets (Outputs)</h3>
        ${result.targets.length > 0 ? `<ul>${result.targets.map(t => `<li>${t}</li>`).join('')}</ul>` : `<p class="empty">No targets detected.</p>`}
      </div>
    </div>
  </div>`;
  });

  html += `
</body>
</html>`;

  return html;
}
