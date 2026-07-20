// @ts-nocheck

import React from 'react';

export const features = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#grad1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <defs><linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#6366f1"/><stop offset="100%" stopColor="#06b6d4"/></linearGradient></defs>
        <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><path d="M10 6.5h4M6.5 10v4M17.5 10v4"/>
      </svg>
    ),
    title: 'Interactive ERD',
    desc: 'Paste SQL → ได้แผนภาพ ER Diagram แบบ interactive ลาก ย้าย zoom ได้ทันที'
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#grad2)" strokeWidth="1.5" strokeLinecap="round">
        <defs><linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#10b981"/><stop offset="100%" stopColor="#06b6d4"/></linearGradient></defs>
        <circle cx="5" cy="12" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="M7.5 12h4l3-6M11.5 12l3 6"/>
      </svg>
    ),
    title: 'Data Lineage',
    desc: 'วิเคราะห์ SQL procedures แสดง data flow จาก source ถึง target แบบ visual'
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#grad3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <defs><linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#f59e0b"/><stop offset="100%" stopColor="#f43f5e"/></linearGradient></defs>
        <path d="M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z"/><path d="M3 9h18M9 9v12"/>
      </svg>
    ),
    title: 'Data Dictionary',
    desc: 'จัดทำเอกสาร column descriptions, data classification, table summary ครบจบในที่เดียว'
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#grad4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <defs><linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#8b5cf6"/><stop offset="100%" stopColor="#ec4899"/></linearGradient></defs>
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
    title: 'Multi-format Export',
    desc: 'Export เป็น PNG, SVG, SQL, Markdown, Excel, draw.io, HTML Report ได้ทั้งหมด'
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#grad5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <defs><linearGradient id="grad5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#06b6d4"/><stop offset="100%" stopColor="#3b82f6"/></linearGradient></defs>
        <path d="M2 12C2 12 7 4 12 4C17 4 22 12 22 12C22 12 17 20 12 20C7 20 2 12 2 12Z" stroke="url(#grad5)" />
        <circle cx="12" cy="12" r="3" fill="url(#grad5)" stroke="none" />
        <path d="M4 12 Q 12 24 20 12" stroke="url(#grad5)" strokeWidth="1.5" />
      </svg>
    ),
    title: 'Multi-dialect SQL',
    desc: 'รองรับ PostgreSQL, MySQL, SQL Server, Oracle, SQLite, BigQuery, Snowflake, Redshift'
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#grad6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <defs><linearGradient id="grad6" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#f43f5e"/><stop offset="100%" stopColor="#f59e0b"/></linearGradient></defs>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: '100% Client-side',
    desc: 'ทำงานในเบราว์เซอร์ทั้งหมด ไม่ส่งข้อมูลไปที่ไหน SQL ของคุณปลอดภัย 100%'
  },
];

export const steps = [
  { num: '01', title: 'Paste SQL', desc: 'วาง DDL SQL หรือ import ไฟล์ .sql เข้ามา', color: '#6366f1' },
  { num: '02', title: 'Visualize', desc: 'ได้ ERD diagram, lineage, data dictionary ทันที', color: '#10b981' },
  { num: '03', title: 'Customize & Export', desc: 'ปรับแต่ง สี ตำแหน่ง เพิ่ม description แล้ว export', color: '#f59e0b' },
];
