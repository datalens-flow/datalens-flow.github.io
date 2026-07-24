export interface KnowledgeTopic {
  id: string;
  groupId: string;
  groupTitle: string;
  title: string;
  icon: string;
  tag: string;
  deepDive: string;
  example: string;
  extraDetails?: {
    type: 'list' | 'comparison';
    items?: { title: string; desc: string }[];
    table?: { headers: string[]; rows: string[][] };
  };
}

export const KNOWLEDGE_GROUPS = [
  { id: 'standards', title: '1. กลุ่มมาตรฐานและโครงสร้าง (Standards & Structure)', icon: '📐' },
  { id: 'security', title: '2. กลุ่มความปลอดภัยและสิทธิส่วนบุคคล (Security & Privacy)', icon: '🛡️' },
  { id: 'management', title: '3. กลุ่มการจัดการและการนำไปใช้ (Management & Integration)', icon: '⚙️' },
  { id: 'modern', title: '4. กลุ่มเทคโนโลยีและแนวคิดยุคใหม่ (Modern Concepts)', icon: '🚀' }
];

export const KNOWLEDGE_TOPICS: KnowledgeTopic[] = [
  // 1. กลุ่มมาตรฐานและโครงสร้าง
  {
    id: 'data-architecture',
    groupId: 'standards',
    groupTitle: 'กลุ่มมาตรฐานและโครงสร้าง (Standards & Structure)',
    title: 'Data Architecture (สถาปัตยกรรมข้อมูล)',
    icon: '🏗️',
    tag: 'Foundation',
    deepDive: 'เป็นการออกแบบ "พิมพ์เขียว" (Blueprint) ของระบบข้อมูลทั้งหมดในองค์กร กำหนดว่าองค์กรมีข้อมูลอะไรบ้าง ข้อมูลเหล่านั้นจะถูกเก็บไว้ที่ไหน (On-premise หรือ Cloud) ไหลผ่านระบบใดบ้าง และเชื่อมต่อกันอย่างไรเพื่อรองรับทั้งการใช้งานประจำวัน (Operational) และการวิเคราะห์ขั้นสูง (Analytics)',
    example: 'การวาดแผนผังว่าข้อมูลลูกค้าเมื่อสมัครผ่านแอปพลิเคชัน Mobile Banking จะต้องวิ่งไปเก็บที่ Transaction DB (PostgreSQL) หลังบ้าน จากนั้น CDC (Change Data Capture) จะคัดลอกข้อมูลไปยัง Data Lake บน AWS S3 สำหรับให้ทีม Data Analytics ดึงไปใช้วิเคราะห์ต่อโดยไม่กระทบความเร็วของแอปพลิเคชันหลัก'
  },
  {
    id: 'data-quality',
    groupId: 'standards',
    groupTitle: 'กลุ่มมาตรฐานและโครงสร้าง (Standards & Structure)',
    title: 'Data Quality (คุณภาพข้อมูล 6 มิติ)',
    icon: '🎯',
    tag: 'Quality Standard',
    deepDive: 'การทำให้แน่ใจว่าข้อมูลมีคุณภาพสมบูรณ์พร้อมใช้งานเพื่อการตัดสินใจที่ถูกต้อง โดยประเมินและวัดผลจาก 6 มิติหลักทางสถิติและวิศวกรรมข้อมูล (6 Quality Dimensions)',
    example: 'การตั้งระบบ Data Quality Rule อัตโนมัติใน Data Pipeline ตรวจสอบว่าเบอร์โทรศัพท์ลูกค้าต้องมี 10 หลักเท่านั้น หากใครกรอกมา 9 หลัก ระบบจะกักข้อมูลไว้ใน Staging Zone และส่งการแจ้งเตือนให้ทีมบริการลูกค้าแก้ไข',
    extraDetails: {
      type: 'list',
      items: [
        { title: '1. ความถูกต้อง (Accuracy)', desc: 'ข้อมูลสะท้อนความจริงโดยไม่มีข้อผิดพลาด (เช่น ยอดขายตรงกับสลิปโอนเงิน)' },
        { title: '2. ความครบถ้วน (Completeness)', desc: 'ไม่มีคอลัมน์สำคัญขาดหายไป (เช่น โปรไฟล์ลูกค้ามีทั้งชื่อ เบอร์โทร และอีเมล)' },
        { title: '3. ความสม่ำเสมอ (Consistency)', desc: 'ข้อมูลในทุกระบบตรงกัน ไม่ขัดแย้งกันเอง (เช่น วันเกิดในระบบขายกับระบบบัญชีตรงกัน)' },
        { title: '4. ความทันเวลา (Timeliness)', desc: 'ข้อมูลอัปเดตสดใหม่ทันต่อการใช้งาน (เช่น ยอดขาย Real-time สำหรับโปรโมชัน)' },
        { title: '5. ความสมเหตุสมผล (Validity)', desc: 'ข้อมูลเป็นไปตามรูปแบบและขอบเขตที่กำหนด (เช่น อายุต้องเป็นตัวเลขมากกว่า 0)' },
        { title: '6. ความไม่ซ้ำซ้อน (Uniqueness)', desc: 'ไม่มีระเบียนข้อมูลซ้ำซ้อนกันในฐานข้อมูล (ไม่มี Duplicate Records)' }
      ]
    }
  },
  {
    id: 'data-catalog',
    groupId: 'standards',
    groupTitle: 'กลุ่มมาตรฐานและโครงสร้าง (Standards & Structure)',
    title: 'Data Catalog & Data Dictionary',
    icon: '📖',
    tag: 'Documentation',
    deepDive: 'Data Dictionary คือพจนานุกรมอธิบายความหมายระดับเทคนิคของแต่ละคอลัมน์ (เช่น `cus_id` คือ รหัสประจำตัวลูกค้า PK) ส่วน Data Catalog ยกระดับขึ้นมาเป็น "Google Search ของข้อมูลองค์กร" ที่เปิดให้ทุกคนค้นหาชุดข้อมูลที่มี เจ้าของข้อมูล (Owner) และ Lineage การเชื่อมโยงได้ทันที',
    example: 'พนักงานฝ่ายการตลาดต้องการทำแคมเปญวันเกิด สามารถเข้า Data Catalog ค้นหาคำว่า "Customer Birthdate" ระบบจะแสดงทันทีว่าชุดข้อมูลนี้อยู่ที่ตาราง `dim_customers` บน Snowflake อัปเดตทุกเที่ยงคืน โดยมีหัวหน้าฝ่าย CRM เป็นเจ้าของอนุมัติสิทธิ์'
  },
  {
    id: 'data-stewardship',
    groupId: 'standards',
    groupTitle: 'กลุ่มมาตรฐานและโครงสร้าง (Standards & Structure)',
    title: 'Data Stewardship & Governance',
    icon: '👤',
    tag: 'Governance',
    deepDive: 'Data Governance คือการกำหนดนโยบายและกรอบกติกาบริหารจัดการข้อมูล ส่วน Data Steward คือ "ผู้ปฏิบัติงานจริง" ซึ่งเป็นตัวแทนจากฝ่ายธุรกิจและฝ่ายไอที คอยกำกับดูแล คุณภาพ ความถูกต้อง และการอนุมัติเข้าถึงข้อมูลในขอบเขตรับผิดชอบของตน',
    example: 'ฝ่ายทรัพยากรบุคคล (HR) มี Data Steward ทำหน้าที่ตรวจสอบสิทธิ์ว่าพนักงานคนใดสามารถดูข้อมูลเงินเดือนได้บ้าง และคอยตรวจสอบความถูกต้องของข้อมูลตำแหน่งพนักงานก่อนส่งให้ฝ่ายบัญชีจ่ายเงินเดือน'
  },

  // 2. กลุ่มความปลอดภัยและสิทธิส่วนบุคคล
  {
    id: 'data-security',
    groupId: 'security',
    groupTitle: 'กลุ่มความปลอดภัยและสิทธิส่วนบุคคล (Security & Privacy)',
    title: 'Data Security (ความปลอดภัยของข้อมูล)',
    icon: '🔒',
    tag: 'Security & Protection',
    deepDive: 'มุ่งเน้นมาตรการป้องกันทางเทคโนโลยีและการเข้าถึงจากผู้ไม่มีสิทธิ์ ประกอบด้วย 3 เสาหลัก: การเข้ารหัสข้อมูล (Encryption at Rest / In Transit), การบดบังข้อมูลสำคัญ (Data Masking / Anonymization) และการควบคุมสิทธิ์ตามบทบาท (Role-Based Access Control - RBAC)',
    example: 'การบดบังหมายเลขบัตรเครดิตและเลขบัตรประชาชนในหน้าจอของพนักงาน Call Center ให้เห็นเฉพาะ 4 หลักสุดท้าย (`****-****-****-1234`) เพื่อป้องกันการรั่วไหลของข้อมูลการเงิน'
  },
  {
    id: 'data-privacy',
    groupId: 'security',
    groupTitle: 'กลุ่มความปลอดภัยและสิทธิส่วนบุคคล (Security & Privacy)',
    title: 'Data Privacy (ความเป็นส่วนตัว & กฎหมาย PDPA/GDPR)',
    icon: '⚖️',
    tag: 'Compliance',
    deepDive: 'มุ่งเน้นการปฏิบัติตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล (เช่น PDPA ของไทย หรือ GDPR ของยุโรป) กำหนดให้องค์กรต้องจัดเก็บข้อมูลเฉพาะเท่าที่จำเป็น แจ้งวัตถุประสงค์ (Purpose) ขอความยินยอม (Consent) และรองรับสิทธิของเจ้าของข้อมูล เช่น สิทธิการขอทำลายข้อมูล (Right to be Forgotten)',
    example: 'เมื่อลูกค้ายกเลิกสมาชิกและใช้สิทธิ "ขอให้ลบข้อมูลส่วนบุคคล" ระบบสถาปัตยกรรมข้อมูลต้องสามารถตามไปลบระเบียนชื่อ-ที่อยู่-เบอร์โทร ของลูกค้าในทุกฐานข้อมูล ทั้ง Production DB, Data Lake และ Backup File ได้อย่างหมดจดภายใน 30 วัน'
  },

  // 3. กลุ่มการจัดการและการนำไปใช้
  {
    id: 'master-data-management',
    groupId: 'management',
    groupTitle: 'กลุ่มการจัดการและการนำไปใช้ (Management & Integration)',
    title: 'Master Data Management (MDM - ความจริงเพียงหนึ่งเดียว)',
    icon: '👑',
    tag: 'Single Source of Truth',
    deepDive: 'กระบวนการรวมและขจัดความขัดแย้งของข้อมูลหลัก (Customer, Product, Vendor) จากหลายระบบย่อย เพื่อสร้าง "ความจริงเพียงหนึ่งเดียว" (Single Source of Truth / Golden Record) ให้ทั้งองค์กรใช้งานตรงกัน',
    example: 'ฝ่ายขายระบุชื่อลูกค้าว่า "นายสมชาย" ฝ่ายบริการลูกค้าระบุว่า "Somchai" ฝ่ายบัญชีระบุว่า "คุณสมชาย ใจดี" ระบบ MDM จะทำ Matching Rule ยืนยันด้วยเลขบัตรประชาชน แล้วยุบรวมเป็น Golden Record ลูกค้ารหัส `CUST-001` รายเดียวกัน'
  },
  {
    id: 'data-integration',
    groupId: 'management',
    groupTitle: 'กลุ่มการจัดการและการนำไปใช้ (Management & Integration)',
    title: 'Data Integration & ETL / ELT',
    icon: '🔄',
    tag: 'Pipeline & Integration',
    deepDive: 'กระบวนการเชื่อมโยงและดึงข้อมูลจากแหล่งที่มากระจัดกระจาย (Database, API, Cloud SaaS) เข้าสู่คลังข้อมูลกลาง ผ่านท่อส่งข้อมูล ETL (Extract -> Transform -> Load) หรือ ELT (Extract -> Load -> Transform บน Cloud Data Warehouse)',
    example: 'ท่อส่งข้อมูลดึงยอดขายจากเครื่อง POS ตามหน้าร้าน (Extract) นำมาแปลงสกุลเงินเป็นบาทและปรับฟอร์แมตวันที่เป็น ค.ศ. (Transform) แล้วนำไปบันทึกลง Google BigQuery ทุกๆ 15 นาที (Load)'
  },
  {
    id: 'data-lifecycle',
    groupId: 'management',
    groupTitle: 'กลุ่มการจัดการและการนำไปใช้ (Management & Integration)',
    title: 'Data Lifecycle Management (DLM - วงจรชีวิตข้อมูล)',
    icon: '⏳',
    tag: 'Lifecycle & Archiving',
    deepDive: 'การบริหารวงจรชีวิตของข้อมูลตั้งแต่เริ่มสร้าง ใช้งาน จัดเก็บสำรอง (Archive) จนถึงทำลายทิ้งตามกฎหมาย เพื่อบริหารต้นทุน Storage และลดความเสี่ยงทางกฎหมายจากการเก็บข้อมูลที่หมดอายุ',
    example: 'ข้อมูลการโอนเงินปีปัจจุบันเก็บไว้ใน SSD ความเร็วสูง (Hot Storage) ข้อมูลอายุ 2-5 ปี ย้ายไปเก็บใน Cloud Cold Storage ที่ราคาถูกลง และข้อมูลธุรกรรมที่อายุครบ 10 ปีจะถูกลบทำลายทิ้งตามกฎหมายบัญชีโดยอัตโนมัติ'
  },

  // 4. กลุ่มเทคโนโลยีและแนวคิดยุคใหม่
  {
    id: 'warehouse-vs-lake',
    groupId: 'modern',
    groupTitle: 'กลุ่มเทคโนโลยีและแนวคิดยุคใหม่ (Modern Concepts)',
    title: 'Data Warehouse vs. Data Lake',
    icon: '🏛️',
    tag: 'Architecture Comparison',
    deepDive: 'การเปรียบเทียบสองสถาปัตยกรรมคลังข้อมูลหลัก: Data Warehouse เน้นจัดเก็บข้อมูลที่มีโครงสร้างชัดเจน (Structured Data) ผ่านการทำความสะอาดแล้ว เหมาะสำหรับ Business Intelligence & Dashboard ส่วน Data Lake เน้นเก็บข้อมูลดิบทุกรูปแบบ (Structured, Semi-Structured, Unstructured) เหมาะสำหรับ Data Science & AI',
    example: 'บริษัท E-Commerce ใช้ Data Warehouse (Snowflake) สำหรับทำรายงานยอดขายประจำเดือนให้ผู้บริหาร และใช้ Data Lake (AWS S3) สำหรับเก็บไฟล์รูปภาพสินค้าและ Log พฤติกรรมการคลิกเพื่อฝึกโมเดล AI แนะนำสินค้า',
    extraDetails: {
      type: 'comparison',
      table: {
        headers: ['คุณลักษณะ (Feature)', 'Data Warehouse 🏛️', 'Data Lake 🌊'],
        rows: [
          ['ประเภทข้อมูล', 'Structured Data (ตาราง SQL)', 'All Types (Text, Image, Video, Log, JSON)'],
          ['โครงสร้างข้อมูล', 'Schema-on-Write (ล๊อกโครงสร้างก่อนบันทึก)', 'Schema-on-Read (จัดโครงสร้างตอนเรียกใช้)'],
          ['กลุ่มผู้ใช้งานหลัก', 'Business Analysts, Executives', 'Data Scientists, Data Engineers'],
          ['วัตถุประสงค์', 'BI Reports, Dashboards, KPIs', 'Machine Learning, AI, Deep Analytics']
        ]
      }
    }
  },
  {
    id: 'mesh-vs-fabric',
    groupId: 'modern',
    groupTitle: 'กลุ่มเทคโนโลยีและแนวคิดยุคใหม่ (Modern Concepts)',
    title: 'Data Mesh vs. Data Fabric',
    icon: '🕸️',
    tag: 'Enterprise Paradigm',
    deepDive: 'Data Mesh เป็นแนวคิดระดับ "องค์กรและคน" (Organizational Paradigm) ที่กระจายอำนาจให้แต่ละแผนก (Domain) ดูแลและสร้างข้อมูลเป็น "ผลิตภัณฑ์ (Data as a Product)" ส่วน Data Fabric เป็นแนวคิดเชิง "เทคโนโลยี" (Technical Architecture Layer) ที่ใช้ AI/Metadata อัจฉริยะเชื่อมต่อทุกระบบข้อมูลเข้าด้วยกันเสมือนเป็นผืนผ้าชิ้นเดียว',
    example: 'องค์กรขนาดใหญ่ใช้ Data Mesh ให้ทีมฝ่ายขายและทีมฝ่ายผลิตดูแลคลังข้อมูลของตนเอง และส่งออก Data API ให้แผนกอื่นใช้ และใช้ Data Fabric คอยทำ Automated Data Cataloging และ Access Control สแกนทั่วทั้งองค์กร',
    extraDetails: {
      type: 'comparison',
      table: {
        headers: ['มิติการเปรียบเทียบ', 'Data Mesh 🕸️', 'Data Fabric 🧵'],
        rows: [
          ['จุดเน้นหลัก (Core Focus)', 'คนและโครงสร้างองค์กร (People & Domain)', 'เทคโนโลยีและ AI Integration (Tech Layer)'],
          ['การบริหารจัดการ', 'Decentralized (กระจายศูนย์ตามแผนก)', 'Centralized Smart Layer (โพลีการจัดการกลาง)'],
          ['การส่งมอบข้อมูล', 'Data as a Product (ผลิตภัณฑ์ข้อมูล)', 'Automated Unified Metadata (เมตาดาต้าอัตโนมัติ)'],
          ['ความเหมาะสม', 'องค์กรขนาดใหญ่ที่มีหลายทีมธุรกิจ', 'องค์กรที่มีระบบข้อมูลกระจัดกระจายหลาย Cloud']
        ]
      }
    }
  }
];
