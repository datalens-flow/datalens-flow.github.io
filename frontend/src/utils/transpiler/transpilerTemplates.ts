import { SqlDialect } from './sqlTranspilerEngine';

export interface MigrationTemplate {
  id: string;
  title: string;
  description: string;
  sourceDialect: SqlDialect;
  targetDialect: SqlDialect;
  sql: string;
}

export const MIGRATION_TEMPLATES: MigrationTemplate[] = [
  {
    id: 'oracle-to-bigquery',
    title: '🏛️ Oracle DW ➔ Google BigQuery Migration',
    description: 'Converts Oracle PL/SQL DDL, NVL, NVL2, DECODE, SYSDATE, and FROM DUAL clauses into BigQuery Standard SQL.',
    sourceDialect: 'oracle',
    targetDialect: 'bigquery',
    sql: `-- Sample Oracle PL/SQL Migration to Google BigQuery
CREATE TABLE ext_customer_orders (
  order_id NUMBER(10),
  customer_name VARCHAR2(100),
  order_amount NUMBER(12,2),
  notes CLOB,
  created_date DATE DEFAULT SYSDATE
);

INSERT INTO ext_customer_orders (order_id, customer_name, order_amount)
VALUES (101, NVL(customer_name, 'Unknown'), 1500.50);

SELECT 
  order_id, 
  NVL(customer_name, 'N/A') AS cust_name, 
  NVL2(customer_name, 'HasName', 'NoName') AS status_tag,
  DECODE(order_amount, 0, 'Zero', 100, 'Basic', 'Premium') AS tier,
  order_amount
FROM ext_customer_orders
WHERE created_date >= SYSDATE - 30
FETCH FIRST 50 ROWS ONLY;`
  },
  {
    id: 'tsql-to-postgres',
    title: '🏢 T-SQL Stored Procedure ➔ PostgreSQL Migration',
    description: 'Converts T-SQL ISNULL, GETDATE, IDENTITY(1,1), BIT, TOP N, and bracket identifiers into Postgres SQL.',
    sourceDialect: 'tsql',
    targetDialect: 'postgres',
    sql: `-- Sample Microsoft SQL Server (T-SQL) Migration to PostgreSQL
CREATE TABLE [tbl_account_summary] (
  [account_id] INT IDENTITY(1,1),
  [account_name] NVARCHAR(120),
  [is_vip] BIT,
  [balance] DECIMAL(18,4),
  [updated_at] DATETIME2 DEFAULT GETDATE()
);

SELECT TOP 100 
  [account_id], 
  ISNULL([account_name], 'Unassigned') AS account_label,
  LEN([account_name]) AS name_length,
  CHARINDEX('Corp', [account_name]) AS corp_index
FROM [tbl_account_summary]
WHERE [updated_at] >= DATEADD(day, -90, GETDATE());`
  },
  {
    id: 'mysql-to-snowflake',
    title: '🐬 MySQL / MariaDB ➔ Snowflake Migration',
    description: 'Converts MySQL backtick identifiers, IFNULL, NOW, AUTO_INCREMENT, and SUBSTR into Snowflake SQL.',
    sourceDialect: 'mysql',
    targetDialect: 'snowflake',
    sql: `-- Sample MySQL / MariaDB Migration to Snowflake
CREATE TABLE \`user_sessions\` (
  \`session_id\` INT AUTO_INCREMENT,
  \`user_code\` VARCHAR(64),
  \`last_active\` DATETIME DEFAULT NOW()
);

SELECT 
  \`session_id\`, 
  IFNULL(\`user_code\`, 'ANONYMOUS') AS user_id, 
  SUBSTR(\`user_code\`, 1, 8) AS short_code
FROM \`user_sessions\`
WHERE \`last_active\` >= NOW() - INTERVAL 7 DAY;`
  },
  {
    id: 'postgres-to-bigquery',
    title: '🐘 PostgreSQL ➔ BigQuery Analytics Migration',
    description: 'Converts PostgreSQL VARCHAR, INT, POSITION, and CURRENT_TIMESTAMP into BigQuery strict data types.',
    sourceDialect: 'postgres',
    targetDialect: 'bigquery',
    sql: `-- Sample PostgreSQL Migration to Google BigQuery Analytics
CREATE TABLE dw_sales_summary (
  sale_id INT,
  store_name VARCHAR(100),
  amount FLOAT,
  is_verified BOOLEAN,
  sale_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SELECT 
  sale_id, 
  store_name, 
  POSITION('Store' IN store_name) AS pos_idx
FROM dw_sales_summary
WHERE sale_timestamp >= CURRENT_TIMESTAMP - INTERVAL '14 day';`
  }
];
