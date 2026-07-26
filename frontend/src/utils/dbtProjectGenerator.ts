import JSZip from 'jszip';
import { parseLineage } from './lineageParser';

export interface DbtProjectFile {
  path: string;
  content: string;
}

export interface GeneratedDbtProject {
  projectName: string;
  files: DbtProjectFile[];
}

export function generateDbtProject(sql: string, projectName: string = 'datalens_dbt_project'): GeneratedDbtProject {
  const result = parseLineage(sql);
  const flows = result.flows || [];

  const sources = new Set<string>();
  const stagingModels = new Set<string>();
  const martsModels = new Set<string>();
  const modelColumns = new Map<string, Set<string>>();
  const dependencies = new Map<string, Set<string>>();

  // Classify tables into dbt layers
  flows.forEach(flow => {
    const src = flow.sourceTable;
    const tgt = flow.targetTable;
    const srcLower = src.toLowerCase();
    const tgtLower = tgt.toLowerCase();

    // Track columns
    if (flow.sourceCol && flow.sourceCol !== '*') {
      if (!modelColumns.has(src)) modelColumns.set(src, new Set());
      modelColumns.get(src)!.add(flow.sourceCol);
    }
    if (flow.targetCol && flow.targetCol !== '*') {
      if (!modelColumns.has(tgt)) modelColumns.set(tgt, new Set());
      modelColumns.get(tgt)!.add(flow.targetCol);
    }

    // Determine layers
    if (srcLower.startsWith('raw_') || srcLower.startsWith('src_') || srcLower.startsWith('ext_') || !flows.some(f => f.targetTable === src)) {
      sources.add(src);
    } else if (srcLower.startsWith('stg_') || srcLower.startsWith('tmp_') || srcLower.startsWith('temp_') || srcLower.startsWith('int_')) {
      stagingModels.add(src);
    } else {
      martsModels.add(src);
    }

    if (tgtLower.startsWith('stg_') || tgtLower.startsWith('tmp_') || tgtLower.startsWith('temp_') || tgtLower.startsWith('int_')) {
      stagingModels.add(tgt);
    } else {
      martsModels.add(tgt);
    }

    // Model dependencies
    if (!dependencies.has(tgt)) dependencies.set(tgt, new Set());
    dependencies.get(tgt)!.add(src);
  });

  const files: DbtProjectFile[] = [];

  // 1. dbt_project.yml
  files.push({
    path: 'dbt_project.yml',
    content: `name: '${projectName}'
version: '1.0.0'
config-version: 2

profile: 'default'

model-paths: ["models"]
analysis-paths: ["analyses"]
test-paths: ["tests"]
seed-paths: ["seeds"]
macro-paths: ["macros"]

target-path: "target"
clean-targets:
  - "target"
  - "dbt_packages"

models:
  ${projectName}:
    staging:
      +materialized: view
      +schema: staging
    marts:
      +materialized: table
      +schema: marts
`
  });

  // 2. models/staging/src_sources.yml
  const sourceTableList = Array.from(sources).length > 0 ? Array.from(sources) : ['raw_transactions', 'raw_customers'];
  const sourcesYml = `version: 2

sources:
  - name: raw_data
    description: "Raw operational source data imported via DataLens Flow"
    schema: public
    tables:
${sourceTableList.map(t => `      - name: ${t}
        description: "Raw source table ${t}"
        columns:
${Array.from(modelColumns.get(t) || ['id', 'created_at']).map(c => `          - name: ${c}
            description: "Column ${c}"`).join('\n')}`).join('\n')}
`;
  files.push({ path: 'models/staging/src_sources.yml', content: sourcesYml });

  // 3. Staging Models
  sourceTableList.forEach(srcTable => {
    const modelName = srcTable.startsWith('stg_') ? srcTable : `stg_${srcTable}`;
    const cols = Array.from(modelColumns.get(srcTable) || ['*']);
    const colSelect = cols.includes('*') || cols.length === 0 ? '*' : cols.join(',\n    ');
    
    files.push({
      path: `models/staging/${modelName}.sql`,
      content: `with source as (
    select * from {{ source('raw_data', '${srcTable}') }}
),

renamed as (
    select
        ${colSelect}
    from source
)

select * from renamed
`
    });
  });

  // 4. Marts Models
  const martTableList = Array.from(martsModels).length > 0 ? Array.from(martsModels) : ['fct_sales_summary'];
  martTableList.forEach(martTable => {
    const modelName = martTable.startsWith('fct_') || martTable.startsWith('dim_') ? martTable : `fct_${martTable}`;
    const deps = Array.from(dependencies.get(martTable) || []);
    
    let fromClause = '';
    if (deps.length > 0) {
      fromClause = deps.map((d, i) => {
        const refName = sources.has(d) ? `stg_${d}` : d;
        return i === 0 ? `from {{ ref('${refName}') }}` : `left join {{ ref('${refName}') }} on 1=1`;
      }).join('\n');
    } else {
      fromClause = `from {{ ref('stg_${sourceTableList[0] || 'transactions'}') }}`;
    }

    files.push({
      path: `models/marts/${modelName}.sql`,
      content: `{{ config(materialized='table') }}

with transformed as (
    select
        *
    ${fromClause}
)

select * from transformed
`
    });
  });

  // 5. models/marts/schema.yml (dbt Quality Tests)
  const schemaYml = `version: 2

models:
${martTableList.map(m => {
    const modelName = m.startsWith('fct_') || m.startsWith('dim_') ? m : `fct_${m}`;
    const cols = Array.from(modelColumns.get(m) || ['id', 'created_at']);
    return `  - name: ${modelName}
    description: "Data Mart model ${modelName} generated by DataLens Flow"
    columns:
${cols.map(c => `      - name: ${c}
        description: "Attribute ${c}"
        tests:
          - not_null`).join('\n')}`;
  }).join('\n')}
`;
  files.push({ path: 'models/marts/schema.yml', content: schemaYml });

  // 6. README.md
  files.push({
    path: 'README.md',
    content: `# ${projectName}

Automated dbt Core Project generated by **DataLens Flow Enterprise**.

## Quick Start

1. Install dbt:
   \`\`\`bash
   pip install dbt-postgres # or dbt-snowflake, dbt-bigquery
   \`\`\`

2. Test connection:
   \`\`\`bash
   dbt debug
   \`\`\`

3. Run models:
   \`\`\`bash
   dbt run
   \`\`\`

4. Run tests:
   \`\`\`bash
   dbt test
   \`\`\`

5. Generate documentation DAG:
   \`\`\`bash
   dbt docs generate && dbt docs serve
   \`\`\`
`
  });

  return { projectName, files };
}

export async function downloadDbtProjectZip(files: DbtProjectFile[], zipName: string = 'dbt_project.zip') {
  const zip = new JSZip();

  files.forEach(f => {
    zip.file(f.path, f.content);
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipName;
  a.click();
  URL.revokeObjectURL(url);
}
