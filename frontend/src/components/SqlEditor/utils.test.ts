// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { mapType } from './utils';
import { DIALECTS } from './constants';

const ALL_DIALECTS = DIALECTS.map(d => d.value);

describe('mapType Matrix Test', () => {

  const verifyMatrix = (baseTypes: string[], assertions: Record<string, string>) => {
    baseTypes.forEach(baseType => {
      ALL_DIALECTS.forEach(dialect => {
        const expected = assertions[dialect] || baseType;
        it(`converts ${baseType} to ${expected} in ${dialect}`, () => {
          expect(mapType(baseType, dialect)).toBe(expected);
        });
      });
    });
  };

  describe('Unbounded Strings', () => {
    const stringTypes = ['TEXT', 'CLOB', 'VARCHAR(MAX)'];
    const stringAssertions = {
      oracle: 'CLOB',
      redshift: 'VARCHAR(MAX)',
      postgres: 'TEXT',
      mysql: 'LONGTEXT',
      mariadb: 'LONGTEXT',
      mssql: 'VARCHAR(MAX)',
      bigquery: 'STRING',
      clickhouse: 'String',
      sqlite: 'TEXT',
      snowflake: 'VARCHAR',
      databricks: 'STRING',
      teradata: 'CLOB',
    };
    verifyMatrix(stringTypes, stringAssertions);
  });

  describe('Date and Time', () => {
    const dateTypes = ['DATETIME2', 'TIMESTAMP', 'DATETIME'];
    const dateAssertions = {
      oracle: 'TIMESTAMP',
      redshift: 'TIMESTAMP',
      postgres: 'TIMESTAMP',
      mysql: 'DATETIME',
      mariadb: 'DATETIME',
      mssql: 'DATETIME2',
      bigquery: 'TIMESTAMP',
      clickhouse: 'DateTime',
      sqlite: 'DATETIME',
      snowflake: 'TIMESTAMP_NTZ',
      databricks: 'TIMESTAMP',
      teradata: 'TIMESTAMP',
    };
    verifyMatrix(dateTypes, dateAssertions);
  });

  describe('Booleans', () => {
    const boolTypes = ['BOOLEAN', 'TINYINT(1)', 'BIT'];
    const boolAssertions = {
      oracle: 'NUMBER(1)',
      redshift: 'BOOLEAN',
      postgres: 'BOOLEAN',
      mysql: 'TINYINT(1)',
      mariadb: 'TINYINT(1)',
      mssql: 'BIT',
      bigquery: 'BOOL',
      clickhouse: 'UInt8',
      sqlite: 'INTEGER',
      snowflake: 'BOOLEAN',
      databricks: 'BOOLEAN',
      teradata: 'BYTEINT',
    };
    verifyMatrix(boolTypes, boolAssertions);
  });

  describe('JSON', () => {
    const jsonTypes = ['JSON', 'JSONB', 'VARIANT'];
    const jsonAssertions = {
      oracle: 'CLOB',
      redshift: 'SUPER',
      postgres: 'JSONB',
      mysql: 'JSON',
      mariadb: 'JSON',
      mssql: 'NVARCHAR(MAX)',
      bigquery: 'JSON',
      clickhouse: 'String',
      sqlite: 'TEXT',
      snowflake: 'VARIANT',
      databricks: 'STRING',
      teradata: 'JSON',
    };
    verifyMatrix(jsonTypes, jsonAssertions);
  });

  describe('Floating Point (Double)', () => {
    const floatTypes = ['DOUBLE', 'FLOAT8', 'DOUBLE PRECISION', 'FLOAT64'];
    const floatAssertions = {
      oracle: 'FLOAT',
      redshift: 'DOUBLE PRECISION',
      postgres: 'DOUBLE PRECISION',
      mysql: 'DOUBLE',
      mariadb: 'DOUBLE',
      mssql: 'FLOAT',
      bigquery: 'FLOAT64',
      clickhouse: 'Float64',
      sqlite: 'REAL',
      snowflake: 'FLOAT',
      databricks: 'DOUBLE',
      teradata: 'DOUBLE',
    };
    verifyMatrix(floatTypes, floatAssertions);
  });

  describe('Standard String (VARCHAR)', () => {
    const varcharTypes = ['VARCHAR(255)', 'VARCHAR2(255)', 'STRING(255)'];
    const varcharAssertions = {
      oracle: 'VARCHAR2(255)',
      redshift: 'VARCHAR(255)',
      postgres: 'VARCHAR(255)',
      mysql: 'VARCHAR(255)',
      mariadb: 'VARCHAR(255)',
      mssql: 'VARCHAR(255)',
      bigquery: 'STRING',
      clickhouse: 'String',
      sqlite: 'TEXT',
      snowflake: 'VARCHAR(255)',
      databricks: 'STRING',
      teradata: 'VARCHAR(255)',
    };
    verifyMatrix(varcharTypes, varcharAssertions);
  });
  
  describe('Integers', () => {
    const intTypes = ['INT', 'INTEGER', 'INT32'];
    const intAssertions = {
      oracle: 'NUMBER(10)',
      redshift: 'INT',
      postgres: 'INT',
      mysql: 'INT',
      mariadb: 'INT',
      mssql: 'INT',
      bigquery: 'INT64',
      clickhouse: 'Int32',
      sqlite: 'INTEGER',
      snowflake: 'INT',
      databricks: 'INT',
      teradata: 'INT',
    };
    verifyMatrix(intTypes, intAssertions);
  });
});
