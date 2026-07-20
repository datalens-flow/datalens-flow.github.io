// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { mapType } from './utils';

describe('mapType', () => {
  it('converts Oracle VARCHAR2 to Redshift VARCHAR', () => {
    expect(mapType('VARCHAR2(100)', 'redshift')).toBe('VARCHAR(100)');
  });

  it('converts MySQL TINYINT(1) to PostgreSQL BOOLEAN', () => {
    expect(mapType('TINYINT(1)', 'postgres')).toBe('BOOLEAN');
  });

  it('converts PostgreSQL BOOLEAN to Oracle NUMBER(1)', () => {
    expect(mapType('BOOLEAN', 'oracle')).toBe('NUMBER(1)');
  });

  it('converts SQL Server DATETIME2 to Redshift TIMESTAMP', () => {
    expect(mapType('DATETIME2', 'redshift')).toBe('TIMESTAMP');
  });

  it('converts standard INT to Oracle NUMBER(10)', () => {
    expect(mapType('INT', 'oracle')).toBe('NUMBER(10)');
  });

  it('converts BigQuery INT64 to MySQL BIGINT', () => {
    expect(mapType('INT64', 'mysql')).toBe('BIGINT');
  });

  it('converts Oracle NUMBER to PostgreSQL INT/DECIMAL based on precision', () => {
    // Current logic maps NUMBER without args to INT, and NUMBER(x,y) to DECIMAL
    expect(mapType('NUMBER', 'postgres')).toBe('INT');
    expect(mapType('NUMBER(10,2)', 'postgres')).toBe('DECIMAL(10,2)');
  });

  it('converts strings to ClickHouse String', () => {
    expect(mapType('VARCHAR(255)', 'clickhouse')).toBe('String');
    expect(mapType('TEXT', 'clickhouse')).toBe('String');
  });

  it('handles spaces in type correctly', () => {
    expect(mapType('VARCHAR (255)', 'postgres')).toBe('VARCHAR (255)');
  });

  it('returns standard types for snowflake', () => {
    expect(mapType('VARCHAR2(50)', 'snowflake')).toBe('VARCHAR(50)');
  });

  it('converts to SQLite correctly', () => {
    expect(mapType('VARCHAR(100)', 'sqlite')).toBe('TEXT');
    expect(mapType('DECIMAL(10,2)', 'sqlite')).toBe('REAL');
  });
});
