import { SchemaResponse } from '../../types/schema';
import { getHtmlBase } from './htmlTemplate';

export function generateHtmlReport(
  schema: SchemaResponse,
  descriptions: Record<string, Record<string, string>>,
  tableColors: Record<string, string>
): string {
  const tableRows = schema.tables.map(t => {
    const color = tableColors[t.id] || '#6366f1';
    return `
      <tr>
        <td>
          <a href="#table-${t.id}" style="color: ${color}; font-weight: bold; text-decoration: none;">
            ${t.name}
          </a>
        </td>
        <td><code>${t.columns.length}</code></td>
        <td>
          ${t.columns.filter(c => c.is_pk).map(c => `<code>${c.name}</code>`).join(', ') || '-'}
        </td>
        <td>
          ${t.columns.filter(c => c.is_fk).map(c => `<code>${c.name} ➔ ${c.fk_ref_table}.${c.fk_ref_column}</code>`).join('<br>') || '-'}
        </td>
      </tr>
    `;
  }).join('');

  const tableSections = schema.tables.map(t => {
    const color = tableColors[t.id] || '#6366f1';
    const colRows = t.columns.map(c => {
      const isPk = c.is_pk ? '<span class="badge badge-pk">PK</span>' : '';
      const isFk = c.is_fk ? `<span class="badge badge-fk" title="References ${c.fk_ref_table}.${c.fk_ref_column}">FK</span>` : '';
      const comment = descriptions[t.id]?.[c.name] || c.comment || '';
      return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 6px;">
              <strong>${c.name}</strong>
              ${isPk}
              ${isFk}
            </div>
          </td>
          <td><code>${c.type}</code></td>
          <td><code>${c.nullable ? 'NULL' : 'NOT NULL'}</code></td>
          <td>
            ${c.is_fk ? `<code>${c.fk_ref_table}.${c.fk_ref_column}</code>` : '-'}
          </td>
          <td class="comment-cell">${comment || '<span style="color: #94a3b8; font-style: italic;">No description</span>'}</td>
        </tr>
      `;
    }).join('');

    const colDefs: string[] = t.columns.map(col => {
      let colStr = `  ${col.name} ${col.type}`;
      if (col.is_pk) colStr += ' PRIMARY KEY';
      if (!col.nullable) colStr += ' NOT NULL';
      return colStr;
    });
    t.columns.forEach(col => {
      if (col.is_fk) {
        colDefs.push(`  FOREIGN KEY (${col.name}) REFERENCES ${col.fk_ref_table}(${col.fk_ref_column})`);
      }
    });
    const tableSql = `CREATE TABLE ${t.name} (\\n${colDefs.join(',\\n')}\\n);`;

    return `
      <section id="table-${t.id}" class="table-section">
        <h2 class="table-title" style="border-left: 5px solid ${color}; padding-left: 10px;">
          ${t.name}
        </h2>
        <p style="margin: -8px 0 16px 0; color: #64748b; font-size: 13px;">
          Total: ${t.columns.length} columns | Tag Color: <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${color};"></span> ${color}
        </p>

        <table>
          <thead>
            <tr>
              <th style="width: 25%;">Column Name</th>
              <th style="width: 15%;">Data Type</th>
              <th style="width: 15%;">Nullable</th>
              <th style="width: 20%;">FK Reference</th>
              <th style="width: 25%;">Description</th>
            </tr>
          </thead>
          <tbody>
            ${colRows}
          </tbody>
        </table>

        <div class="sql-box">
          <button class="copy-btn" onclick="navigator.clipboard.writeText(this.nextElementSibling.innerText); alert('Copied SQL to clipboard!');">Copy SQL</button>
          <pre><code>${tableSql}</code></pre>
        </div>
      </section>
    `;
  }).join('');

  return getHtmlBase(tableRows, tableSections, schema.tables.length);
}
