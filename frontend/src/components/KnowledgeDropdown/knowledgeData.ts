export interface KnowledgeTopic {
  id: string;
  groupId: string;
  groupTitle: string;
  title: string;
  iconKey: string;
  tag: string;
  deepDive: string;
  example: string;
  useCase: string;
  imageUrl?: string;
  deepDiveImageUrl?: string;
  exampleImageUrl?: string;
  useCaseImageUrl?: string;
  extraDetails?: {
    type: 'list' | 'comparison';
    items?: { title: string; desc: string }[];
    table?: { headers: string[]; rows: string[][] };
  };
}

export const KNOWLEDGE_GROUPS = [
  { id: 'standards', title: '1. กลุ่มมาตรฐานและโครงสร้าง (Standards & Structure)', iconKey: 'standards' },
  { id: 'security', title: '2. กลุ่มความปลอดภัยและสิทธิส่วนบุคคล (Security & Privacy)', iconKey: 'security' },
  { id: 'management', title: '3. กลุ่มการจัดการและการนำไปใช้ (Management & Integration)', iconKey: 'management' },
  { id: 'modern', title: '4. กลุ่มเทคโนโลยีและแนวคิดยุคใหม่ (Modern Concepts)', iconKey: 'modern' },
  { id: 'dmbok', title: '5. กรอบ DAMA-DMBOK ทางปฏิบัติ (People, Process, Tech & Risk)', iconKey: 'dmbok' }
];

export const KNOWLEDGE_TOPICS: KnowledgeTopic[] = [
  // 1. กลุ่มมาตรฐานและโครงสร้าง
  {
    id: 'enterprise-blueprint',
    groupId: 'standards',
    groupTitle: 'กลุ่มมาตรฐานและโครงสร้าง (Standards & Structure)',
    title: 'คู่มือสถาปัตยกรรมข้อมูลองค์กรเชิงลึก (Enterprise Data Blueprint)',
    iconKey: 'standards',
    tag: 'Chief Architect & DAMA Board Reference Manual',
    imageUrl: '/images/knowledge/data-ecosystem.jpg',
    useCaseImageUrl: '/images/knowledge/sub-dmbok-roles.jpg',
    deepDive: `🏛️ [เอกสารคู่มือสถาปัตยกรรมข้อมูลองค์กรเชิงลึก - Enterprise Data Architecture Guide v4.2.0]
การวางสถาปัตยกรรมข้อมูลระดับองค์กรอ้างอิงกรอบ DAMA-DMBOK และนโยบายบริหารความเสี่ยงธุรกิจประกันภัยและธนาคารพาณิชย์:

ส่วนที่ 1: ภาพรวมสถาปัตยกรรมระบบนิเวศข้อมูลองค์กร (Enterprise Data Ecosystem Architecture)
- ปรัชญา Decoupled Architecture & Real-Time Event Streaming: แยกฝั่ง OLTP (PostgreSQL) และ OLAP (Snowflake) โดยสิ้นเชิงเพื่อ Zero Workload Degradation
- Change Data Capture (CDC) WAL Log Mining: ใช้ Debezium อ่าน Write-Ahead Log ของ PostgreSQL ➔ สตรีมเข้า Apache Kafka ➔ แปลงเป็น Parquet ลง AWS S3 ➔ Snowflake Snowpipe Auto-Ingestion
- Modern ELT Orchestration: Apache Airflow DAGs คุม Workflow ➔ dbt Core ทำ SQL Transformation + Data Lineage + Data Quality Testing

ส่วนที่ 2: พจนานุกรมข้อมูลและแคตตาล็อกเชิงลึก (In-depth Data Dictionary & MDM)
- Golden Record CUST-001: รวมข้อมูลลูกค้าจาก 5 ระบบด้วยกฎ Attribute-level Survivorship (Source Priority + Recency + Completeness)
- Security & Privacy: Vaultless FPE Tokenization (PCI DSS 4.0 Requirement 3.5.1) + Dynamic Data Masking (PDPA/GDPR)
- Data Lifecycle Management (DLM): Hot SSD (0-1 ปี) ➔ AWS S3 Glacier Archive (-80% Cost, 2-9 ปี) ➔ Automated 10-Year Purge Policy

ส่วนที่ 3: มาตรฐานการควบคุมคุณภาพและการกำกับดูแล (Data Quality & Governance)
- DAMA-DMBOK 6 Dimensions: Accuracy, Completeness, Consistency, Timeliness, Validity, Uniqueness พร้อมสูตรวัดผลเชิงเทคนิคและสคริปต์ dbt-expectations
- Roles & Workflow: CDO ➔ Data Owner ➔ Data Steward ➔ Data Custodian
- Security & Lineage: TLS 1.3, AES-256 KMS, RBAC, Monte Carlo Root-Cause Analysis (สืบย้อนรอยสาเหตุข้อมูลผิดใน 2 นาที)

ส่วนที่ 4: บทวิเคราะห์เปรียบเทียบสถาปัตยกรรมขั้นสูง (Architectural Deep Dive)
- Data Warehouse vs Data Lake vs Data Lakehouse Matrix
- Data Mesh (Decentralized Domain Products) vs Data Fabric (AI Active Metadata Layer)`,
    example: 'องค์กรการเงินและประกันภัยขนาดใหญ่ใช้พิมพ์เขียวสถาปัตยกรรมนี้ในการสเกลระบบข้อมูล เชื่อมต่อระบบเคลมและบัตรเครดิตเข้ากับ Snowflake และ AWS S3 ปฏิบัติตามมาตรฐาน PCI DSS 4.0 และ PDPA 100%',
    useCase: '[Use Case: Enterprise Governance & Risk Management Infrastructure]\nการสเกลท่อข้อมูลสตรีมมิ่งผ่าน Confluent Kafka + Flink + Snowflake รองรับธุรกรรมนับล้านรายการต่อนาที ป้องกันภัยทุจริต Real-Time sub-145ms SLA และออกใบรักษากฎหมาย Audit Certificate อัตโนมัติ'
  },
  {
    id: 'data-ecosystem',
    groupId: 'standards',
    groupTitle: 'กลุ่มมาตรฐานและโครงสร้าง (Standards & Structure)',
    title: 'ระบบนิเวศของข้อมูล (Data Ecosystem & Streaming Architecture)',
    iconKey: 'data-ecosystem',
    tag: 'Confluent / Equinix / Microsoft Fabric Standard',
    imageUrl: '/images/knowledge/data-ecosystem.jpg',
    useCaseImageUrl: '/images/knowledge/sub-realtime-fraud.jpg',
    deepDive: `📘 [บทเรียนฉบับเต็มรูปแบบ: สถาปัตยกรรม Streaming อ้างอิง Confluent, Equinix & Microsoft Fabric]
ระบบนิเวศข้อมูลยุคใหม่ไม่ได้อาศัยการประมวลผลแบบ Batch ประจำคืนอีกต่อไป แต่อ้างอิงกรอบสถาปัตยกรรม Event-Driven Streaming ของ Confluent (Apache Kafka) และสถาปัตยกรรมระดับโครงสร้างพื้นฐานข้ามคลาวด์ของ Equinix ร่วมกับ Microsoft Fabric Real-Time Analytics

1. Event Ingestion & Network Interconnection (Equinix & Confluent Cloud):
การดึงข้อมูลจากจุดสัมผัสหลากหลาย (EDC, Mobile App, ATM, IoT) ผ่านโครงสร้างเครือข่ายความล่าช้าต่ำ (Low-latency Interconnection) ของ Equinix เข้าสู่ Apache Kafka Cluster ของ Confluent เพื่อให้มั่นใจว่า Event ทุกธุรกรรมถูกบันทึกลงใน Immutable Event Log แบบการันตีความสม่ำเสมอของลำดับ (Sequential Consistency)

2. Real-Time Stream Processing & Feature Store (Microsoft Fabric & Flink):
ท่อข้อมูลประมวลผล continuous streams ด้วย Apache Flink / Microsoft Fabric Eventstream คำนวณฟีเจอร์พฤติกรรมย้อนหลังในหน่วยมิลลิวินาที (เช่น ยอดโอนสะสมใน 5 นาทีล่าสุด) แล้วส่งเข้า Online Feature Store เพื่อเตรียมเข้าโมเดล AI

3. AI Model Scoring & Dynamic Decisioning (sub-300ms SLA):
โมเดล Machine Learning ประเมินคะแนนความเสี่ยง (Fraud Risk Score) ร่วมกับ Rules Engine หากพบความผิดปกติ ระบบจะระงับธุรกรรมและบล็อกบัญชีสุ่มเสี่ยงได้ทันทีในเวลาไม่เกิน 300 มิลลิวินาที`,
    example: 'ธนาคารพาณิชย์ขนาดใหญ่เชื่อมต่อสตรีมธุรกรรมการรูดบัตรจากเครื่อง EDC ทั่วประเทศเข้ากับ Confluent Kafka บน Equinix Interconnect ประมวลผลผ่าน Microsoft Fabric Eventstream เพื่อระงับบัญชีที่ถูกแฮกแบบ Real-time',
    useCase: '[Use Case: Confluent & Microsoft Fabric Real-Time Fraud Prevention]\nระบบเฝ้าระวังภัยทุจริตการเงินสตรีมข้อมูลผ่าน Confluent Kafka ➔ ตรวจสอบ Data Quality ด้วย Flink ➔ คำนวณฟีเจอร์ลง Microsoft Fabric Eventstream ➔ ประเมินด้วย AI Model ➔ ส่งสัญญาณ Block/Approve ไปยัง Payment Gateway ภายใน 145ms'
  },
  {
    id: 'data-architecture',
    groupId: 'standards',
    groupTitle: 'กลุ่มมาตรฐานและโครงสร้าง (Standards & Structure)',
    title: 'Data Architecture (CDC to Snowflake & AWS S3)',
    iconKey: 'data-architecture',
    tag: 'PostgreSQL / Debezium / Snowflake Standard',
    imageUrl: '/images/knowledge/data-architecture.jpg',
    exampleImageUrl: '/images/knowledge/sub-cdc-architecture.jpg',
    deepDive: `📘 [บทเรียนฉบับเต็มรูปแบบ: สถาปัตยกรรม Change Data Capture (CDC) ไปยัง Snowflake และ AWS S3]
สถาปัตยกรรมข้อมูลระดับ enterprise อ้างอิงมาตรฐานการทำ Change Data Capture (CDC) จากระบบ Production PostgreSQL ไปยัง AWS S3 Data Lake และคลังข้อมูล Snowflake โดยไม่ส่งผลกระทบต่อประสิทธิภาพการทำงานของฐานข้อมูลหลัก (Zero Workload Degradation)

1. Transaction Log Mining (Debezium & PostgreSQL WAL):
แทนที่การรัน SQL Query SELECT * เพื่อดึงข้อมูล ซึ่งสร้างภาระหนักให้ระบบ Production สถาปัตยกรรม CDC อ้างอิงการอ่านไฟล์ Write-Ahead Log (WAL) ของ PostgreSQL โดยตรงผ่าน Debezium Connector เพื่อจับทุกลำดับคำสั่ง INSERT, UPDATE, DELETE เป็น Event JSON

2. Event Buffering & Cloud Staging (Apache Kafka & AWS S3 Parquet):
Debezium ส่งสตรีมการเปลี่ยนแปลงเข้า Apache Kafka จากนั้น Kafka Connect S3 Sink จะแปลงข้อมูลเป็นไฟล์ Parquet format ที่มีการบีบอัดและจัดโครงสร้างแบบ Columnar เก็บไว้ใน AWS S3 Staging Bucket

3. Auto-Ingestion & Table Materialization (Snowflake Snowpipe & Iceberg):
Snowflake Snowpipe คอยเฝ้าระวัง Event Sns Notification จาก AWS S3 เมื่อมีไฟล์ Parquet ใหม่เข้ามา Snowpipe จะทำการ Auto-ingest ข้อมูลเข้าสู่ Snowflake Target Tables แบบ Real-time ทำให้ข้อมูลฝั่ง Analytics อัปเดตตรงกับ Production ตลอดเวลา`,
    example: 'ระบบอีคอมเมิร์ซขนาดใหญ่จับสัญญาณคำสั่งซื้อจาก PostgreSQL ผ่าน Debezium สตรีมไฟล์ Parquet ลง AWS S3 แล้วให้ Snowflake Snowpipe อัปเดตตาราง Analytics โดยอัตโนมัติ',
    useCase: '[Use Case: PostgreSQL to Snowflake Continuous Replication]\nท่อส่งข้อมูล CDC อ่าน WAL Log จาก PostgreSQL ➔ สตรีมผ่าน Debezium เข้า Kafka ➔ บันทึกลง AWS S3 Parquet ➔ Snowflake Snowpipe Auto-Ingest เข้าคลังข้อมูล เพื่อให้ทีม BI เห็นยอดขาย Real-time โดย Production DB ไม่ช้าลง'
  },
  {
    id: 'data-quality',
    groupId: 'standards',
    groupTitle: 'กลุ่มมาตรฐานและโครงสร้าง (Standards & Structure)',
    title: 'Data Quality (6 DAMA-DMBOK Dimensions)',
    iconKey: 'data-quality',
    tag: 'DAMA-DMBOK Standard Framework',
    imageUrl: '/images/knowledge/data-quality.jpg',
    deepDive: `📘 [บทเรียนฉบับเต็มรูปแบบ: การวัดคุณภาพข้อมูล 6 มิติตามมาตรฐาน DAMA-DMBOK]
คัมภีร์ DAMA-DMBOK (Data Management Body of Knowledge) กำหนดเกณฑ์มาตรฐานในการประเมินและวัดผลคุณภาพข้อมูลในระดับวิศวกรรมข้อมูลและสถิติผ่าน 6 มิติหลัก (6 Quality Dimensions) เพื่อให้มั่นใจว่าข้อมูลพร้อมสำหรับการนำไปใช้งานจริง (Fit for Purpose)

1. Accuracy (ความถูกต้อง): ข้อมูลสะท้อนความจริงโดยไม่มีข้อผิดพลาด ประเมินโดยการเปรียบเทียบค่าข้อมูลกับแหล่งอ้างอิงภายนอกที่เชื่อถือได้ (Match Rate = Correct Records / Total Records)
2. Completeness (ความครบถ้วน): ข้อมูลสำคัญและฟิลด์จำเป็นต้องถูกบันทึกครบถ้วน โดยไม่มีค่า Null หรือข้อมูลขาดหายไป (Completeness Rate = Non-Null Fields / Total Fields)
3. Consistency (ความสม่ำเสมอ): ข้อมูลในทุกระบบตรงกัน ไร้ข้อขัดแย้งเมื่อเปรียบเทียบข้ามฐานข้อมูล (Cross-system Synchronization)
4. Timeliness (ความทันเวลา): ความสดใหม่และความพร้อมใช้งานของข้อมูลเมื่อเทียบกับข้อตกลง SLA (Timeliness = Arrival Time - Transaction Time)
5. Validity (ความสมเหตุสมผล): ข้อมูลเป็นไปตามกฎทางธุรกิจ รูปแบบ (Format) และโดเมนที่กำหนด (เช่น เลขประจำตัวประชาชน 13 หลัก)
6. Uniqueness (ความไม่ซ้ำซ้อน): ข้อมูลแต่ละเอนทิตีต้องถูกบันทึกเพียงระเบียนเดียวเท่านั้น โดยขจัดรายการ Duplicate ออกจากระบบ`,
    example: 'โรงพยาบาลตั้งระบบ Data Quality Pipeline ตรวจสอบประวัติแพ้ยาของคนไข้ตาม DAMA-DMBOK ทั้ง 6 มิติ หากพบข้อมูลไม่สมบูรณ์หรือขัดแย้งกัน ระบบจะล็อคการสั่งยาและเตือนแพทย์ทันที',
    useCase: '[Use Case: Healthcare Prescription Quality Auditing]\nการตั้ง Automated DQ Rules ตรวจสอบความถูกต้องและครบถ้วนของประวัติการจ่ายยาคนไข้ เพื่อความปลอดภัยสูงสุดในการรักษาพยาบาล',
    extraDetails: {
      type: 'list',
      items: [
        { title: '1. Accuracy (ความถูกต้อง)', desc: 'ข้อมูลตรงกับความเป็นจริง เช่น ยอดโอนเงินตรงกับใบเสร็จ (Match Rate 100%)' },
        { title: '2. Completeness (ความครบถ้วน)', desc: 'ฟิลด์สำคัญต้องไม่ว่างเปล่า เช่น โปรไฟล์คนไข้มีทั้งชื่อ เลขบัตร และประวัติแพ้ยา' },
        { title: '3. Consistency (ความสม่ำเสมอ)', desc: 'ข้อมูลตรงกันทุกระบบ เช่น วันเกิดในระบบเวชระเบียนกับระบบบัญชีตรงกัน' },
        { title: '4. Timeliness (ความทันเวลา)', desc: 'ข้อมูลสดใหม่ตาม SLA เช่น ยอดขายอัปเดตทุก 5 นาทีสำหรับแคมเปญการตลาด' },
        { title: '5. Validity (ความสมเหตุสมผล)', desc: 'รูปแบบข้อมูลถูกต้องตามกฎ เช่น รหัสไทย 13 หลัก อีเมลมีเครื่องหมาย @' },
        { title: '6. Uniqueness (ความไม่ซ้ำซ้อน)', desc: 'ขจัดระเบียนซ้ำซ้อน ให้มีข้อมูลคนไข้ 1 รายต่อ 1 Master Record เท่านั้น' }
      ]
    }
  },
  {
    id: 'data-catalog',
    groupId: 'standards',
    groupTitle: 'กลุ่มมาตรฐานและโครงสร้าง (Standards & Structure)',
    title: 'Data Catalog & Data Dictionary (Data Lineage)',
    iconKey: 'data-catalog',
    tag: 'Atlan / Monte Carlo / Databricks Standard',
    imageUrl: '/images/knowledge/data-catalog.jpg',
    deepDive: `📘 [บทเรียนฉบับเต็มรูปแบบ: ข้อแตกต่างและการทำ Data Lineage อ้างอิง Atlan, Monte Carlo & Databricks]
การบริหารจัดการเมตาดาต้าอ้างอิงบทความเฉพาะทางจาก Atlan, Monte Carlo และ Databricks Unity Catalog ซึ่งแบ่งแยกบทบาทเทคนิคและบทบาทธุรกิจอย่างชัดเจน:

1. Data Dictionary vs Data Catalog (Atlan & Databricks Unity Catalog):
- Data Dictionary: เน้นอธิบายโครงสร้างทางเทคนิคระดับฐานข้อมูลเดียว (Physical Metadata) เช่น ชื่อตาราง คอลัมน์ Data Type และ Constraints สำหรับ DBA
- Data Catalog: ระบบ Search Engine ค้นหาเมตาดาต้าทั่วทั้งองค์กร (Business & Active Metadata) รวบรวมข้อมูล Owner, Quality Score, PII Sensitivity Tag และคำอธิบายทางธุรกิจให้ทุกคนทำ Self-Service Analytics

2. Automated Data Lineage & Observability (Monte Carlo):
 Data Lineage คือการวาดผังการเดินทางของข้อมูลแบบ end-to-end ตั้งแต่ต้นทาง (Source DB) ➔ ท่อส่ง (ETL/dbt) ➔ คลังข้อมูล (Snowflake/BigQuery) ➔ รายงานปลายทาง (Looker/PowerBI)
- Impact Analysis: ประเมินผลกระทบก่อนแก้ไขคอลัมน์ต้นทาง ว่าจะทำให้แดชบอร์ดใดพังบ้าง
- Root Cause Analysis: เมื่อตัวเลขแดชบอร์ดผิดปกติ Monte Carlo Lineage จะสืบย้อนรอยหาท่อส่งข้อมูลที่พังได้ภายใน 2 นาที`,
    example: 'ทีม Data Analytics ใช้ Atlan Data Catalog ค้นหาชุดข้อมูลยอดขาย พร้อมดูผัง Data Lineage จาก Monte Carlo เพื่อเช็คต้นตอเมื่อรายงานแดชบอร์ดมีตัวเลขคลาดเคลื่อน',
    useCase: '[Use Case: Atlan & Monte Carlo Enterprise Lineage Mapping]\nการเชื่อมต่อ Databricks Unity Catalog เข้ากับ Atlan เพื่อทำ Data Catalog กลาง ให้ผู้ใช้ 500+ คนค้นหาข้อมูลได้เอง และใช้ Monte Carlo สืบย้อนรอยหาสาเหตุข้อมูลผิดพลาดแบบอัตโนมัติ'
  },

  // 2. กลุ่มความปลอดภัยและสิทธิส่วนบุคคล
  {
    id: 'data-security',
    groupId: 'security',
    groupTitle: 'กลุ่มความปลอดภัยและสิทธิส่วนบุคคล (Security & Privacy)',
    title: 'Data Security (PCI DSS 4.0 Standard)',
    iconKey: 'data-security',
    tag: 'PCI DSS 4.0 Standard Manual',
    imageUrl: '/images/knowledge/data-security.jpg',
    deepDive: `📘 [บทเรียนฉบับเต็มรูปแบบ: มาตรฐานความปลอดภัยข้อมูลอ้างอิง PCI DSS 4.0]
การรักษาความปลอดภัยข้อมูลตามข้อกำหนด PCI DSS 4.0 (Payment Card Industry Data Security Standard) มุ่งเน้นการปกป้องข้อมูลหมายเลขบัตรชำระเงิน (PAN) และข้อมูลการเงินสำคัญผ่าน 3 มาตรการหลัก:

1. Role-Based Access Control (RBAC):
การควบคุมสิทธิ์เข้าถึงข้อมูลตามบทบาทหน้าที่ (Requirement 7) กำหนดให้ผู้มีสิทธิ์เท่านั้นที่สามารถมองเห็นข้อมูลจริงได้ โดยใช้หลัก Least Privilege

2. Data Masking (Requirement 3.5.1):
การบดบังหมายเลขบัตรบนหน้าจอแสดงผล โดยแสดงผลเฉพาะ 4 หลักสุดท้าย (เช่น ****-****-****-1234) เพื่อป้องกันการแอบดูหรือรั่วไหลของข้อมูลในการทำงานประจำวัน

3. Vaultless Format-Preserving Encryption (FPE) Tokenization:
การแปลงหมายเลขบัตรจริงเป็นสัญลักษณ์สุ่ม (Token) ที่ไม่มีความสัมพันธ์ทางคณิตศาสตร์กับข้อมูลเดิม การใช้ Tokenization ช่วยลดขอบเขตการประเมินความปลอดภัย (PCI DSS Audit Scope) และปกป้องข้อมูลทั้งขณะจัดเก็บ (At Rest) และส่งผ่านท่อ (In Transit)`,
    example: 'ระบบชำระเงินของบริษัทประกันภัยแปลงเลขบัตรเครดิตลูกค้าเป็น Token ตั้งแต่หน้าเว็บ ชำระเงิน ทำให้พนักงาน Call Center เห็นเฉพาะเลขบดบัง `****-1234` บนหน้าจอ',
    useCase: '[Use Case: Insurance PCI DSS 4.0 Tokenization Architecture]\nการตั้งระบบ Tokenization เพื่อสกัดข้อมูลบัตรเครดิตออกจากคลังข้อมูลวิเคราะห์ ป้องกันการถูกโจรกรรมข้อมูลและผ่านการรับรองมาตรฐาน PCI DSS 4.0'
  },
  {
    id: 'data-privacy',
    groupId: 'security',
    groupTitle: 'กลุ่มความปลอดภัยและสิทธิส่วนบุคคล (Security & Privacy)',
    title: 'Data Privacy & Right to be Forgotten (GDPR / PDPA)',
    iconKey: 'data-privacy',
    tag: 'GDPR Article 17 / PDPA Automated Workflow',
    imageUrl: '/images/knowledge/data-privacy.jpg',
    deepDive: `📘 [บทเรียนฉบับเต็มรูปแบบ: การวางสถาปัตยกรรมลบข้อมูลอัตโนมัติตาม GDPR & PDPA]
การปฏิบัติตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล (GDPR Article 17 และ PDPA ของไทย) กำหนดสิทธิการขอทำลายข้อมูล (Right to be Forgotten) ซึ่งองค์กรต้องมีสถาปัตยกรรมรองรับการลบข้อมูลส่วนบุคคลข้ามทุกระบบภายใน 30 วัน

1. Centralized Privacy Control Plane (MDM & Privacy Service):
เมื่อเจ้าของข้อมูลยื่นคำร้องขอทำลายข้อมูล Privacy Workflow จะใช้ Master Data Management (MDM) สแกนหา Digital Footprint และสืบหาข้อมูลส่วนบุคคล (PII) ของลูกค้ารายนั้นทั่วทั้งองค์กร

2. Multi-System Automated Erasure Execution:
สคริปต์อัตโนมัติจะส่งสัญญาณ API ตามไปลบหรือแปลงข้อมูลให้ไม่สามารถระบุตัวตนได้ (Anonymization) ข้ามทุกระบบย่อย ทั้ง Production DB, Data Lakehouse, Cloud Storage และ Log Files

3. Compliance Audit Trail Generation:
เมื่อการลบเสร็จสิ้น ระบบจะสร้างใบรักษากฎหมาย (Audit Trail Certificate) บันทึกหลักฐานว่ากระบวนการลบสำเร็จเรียบร้อยโดยไม่มีการหลงเหลือของข้อมูล PII`,
    example: 'สายการบินรับคำร้องขอให้ลบข้อมูลจากผู้โดยสาร ระบบ Privacy Workflow จะรันสคริปต์อัตโนมัติตามไปลบประวัติเดินทาง สิทธิสะสมไมล์ และโปรไฟล์ลูกค้าข้าม 10 ฐานข้อมูลย่อยภายใน 30 วัน',
    useCase: '[Use Case: Airline Automated PDPA Right-to-be-Forgotten]\nระบบอัตโนมัติตามสืบค้นและทำลายข้อมูล PII ข้าม 10 ระบบย่อย พร้อมออกใบรักษากฎหมายยืนยันความถูกต้องตาม PDPA/GDPR'
  },

  // 3. กลุ่มการจัดการและการนำไปใช้
  {
    id: 'master-data-management',
    groupId: 'management',
    groupTitle: 'กลุ่มการจัดการและการนำไปใช้ (Management & Integration)',
    title: 'Master Data Management (Profisee & LatentView Standard)',
    iconKey: 'master-data-management',
    tag: 'Profisee & LatentView MDM Standard',
    imageUrl: '/images/knowledge/master-data-management.jpg',
    deepDive: `📘 [บทเรียนฉบับเต็มรูปแบบ: กฎ Survivorship และการสร้าง Golden Record อ้างอิง Profisee & LatentView]
การทำ Master Data Management (MDM) ตามแนวทางของ Profisee และ LatentView มุ่งเน้นการขจัดความขัดแย้งของข้อมูลหลักเพื่อสร้าง "ความจริงเพียงหนึ่งเดียว" (Single Source of Truth / Golden Record)

1. Identity Matching & Fuzzy Deduplication (Profisee Engine):
ระบบดึงข้อมูลลูกค้าจาก CRM, ERP และ POS นำมาผ่าน อัลกอริทึม Matching (เช่น Levenshtein Distance, Jaro-Winkler) เพื่อจับคู่ระเบียนข้อมูลที่ชี้ไปยังบุคคลเดียวกันแม้สะกดชื่อต่างกัน

2. Attribute-Level Survivorship Rules (LatentView Framework):
การตั้งกฎตัดสินว่าคอลัมน์ใดจากระบบใดจะได้รับการคัดเลือกให้รอดชีวิต (Survive) เข้าสู่ Golden Record (CUST-001):
- Source Priority: กำหนดลำดับความน่าเชื่อถือของระบบ (เช่น ระบบภาษียึด Tax ID, ระบบ CRM ยึดเบอร์โทร)
- Recency: เลือกข้อมูลที่มีการอัปเดตล่าสุด
- Completeness: เลือกข้อมูลจากระเบียนที่มีค่า Null น้อยที่สุด

3. Golden Record Publishing:
เมื่อล้างข้อมูลเสร็จสิ้น ระบบ MDM จะส่งออก Golden Record (CUST-001) กลับไปยังระบบย่อยทั้งหมด เพื่อให้ทั้งองค์กรใช้ข้อมูลตรงกัน`,
    example: 'เครือธุรกิจห้างสรรพสินค้าใช้ Profisee MDM รวมข้อมูลสมาชิกจากระบบห้าง โรงแรม และซูเปอร์มาร์เก็ต สร้างเป็น Golden Record ลูกค้าคีย์เดียว (CUST-001)',
    useCase: '[Use Case: Enterprise Conglomerate Single Customer View]\nการเชื่อมต่อระบบ MDM ยุบรวมข้อมูลลูกค้า 3 บริษัทในเครือ ขจัดความซ้ำซ้อน และสร้าง Golden Record สำหรับแคมเปญการตลาดข้ามธุรกิจ'
  },
  {
    id: 'data-integration',
    groupId: 'management',
    groupTitle: 'กลุ่มการจัดการและการนำไปใช้ (Management & Integration)',
    title: 'Data Integration & Modern ELT (Airflow, dbt & BigQuery)',
    iconKey: 'data-integration',
    tag: 'Apache Airflow / dbt / Google BigQuery Standard',
    imageUrl: '/images/knowledge/data-integration.jpg',
    deepDive: `📘 [บทเรียนฉบับเต็มรูปแบบ: สถาปัตยกรรม Modern ELT Pipeline ด้วย Airflow, dbt & BigQuery]
สถาปัตยกรรมประมวลผลข้อมูลยุคใหม่เปลี่ยนจาก ETL เป็น ELT (Extract, Load, Transform) เพื่อดึงพลังการประมวลผลแบบขนานมหาศาลของ Cloud Data Warehouse อย่าง Google BigQuery

1. Extraction & Orchestration (Apache Airflow DAGs):
Airflow ทำหน้าที่เป็นวงดนตรีคุมท่อส่งข้อมูล (Orchestrator) รัน DAGs ดึงข้อมูลจาก APIs และฐานข้อมูล นำไปโหลดเก็บไว้ใน Cloud Storage Raw Zone

2. Warehouse Loading (Google BigQuery Storage):
ดึงข้อมูลดิบจาก Cloud Storage เข้าสู่ BigQuery Staging Tables โดยตรงแบบ Schema-on-Read เพื่อความรวดเร็ว

3. Code-based Transformation & Testing (dbt Core):
ใช้ dbt (Data Build Tool) ในการเขียนคำสั่ง SQL Transformation แปลงข้อมูลดิบให้กลายเป็น Data Marts โดยมีระบบ Version Control (Git), Automated Lineage และ Data Quality Testing ควบคุมทุกขั้นตอนก่อนนำไปใช้งานบน BI Dashboards`,
    example: 'บริษัทขนส่งใช้ Airflow + BigQuery + dbt ดูดตำแหน่ง GPS รถขนส่ง 10,000 คัน นำมาคำนวณเส้นทางและเวลาประเมินถึงปลายทาง (ETA) แบบ Real-time',
    useCase: '[Use Case: Logistics Modern ELT Fleet Tracking Pipeline]\nท่อส่งข้อมูล ELT ประมวลผลข้อมูล GPS รถขนส่งด้วย Airflow Orchestration ➔ โหลดลง BigQuery ➔ แปลงข้อมูลด้วย dbt แสดงผลบนรายงาน Real-time'
  },
  {
    id: 'data-lifecycle',
    groupId: 'management',
    groupTitle: 'กลุ่มการจัดการและการนำไปใช้ (Management & Integration)',
    title: 'Data Lifecycle Management (Snowflake & AWS Glacier Manual)',
    iconKey: 'data-lifecycle',
    tag: 'Snowflake & AWS Storage Manual',
    imageUrl: '/images/knowledge/data-lifecycle.jpg',
    deepDive: `📘 [บทเรียนฉบับเต็มรูปแบบ: การบริหารวงจรชีวิตข้อมูลและการแบ่ง Tiering อ้างอิง Snowflake & AWS Guide]
การบริหารวงจรชีวิตข้อมูล (DLM) ตามคู่มือของ Snowflake และ AWS มุ่งเน้นการลดต้นทุนจัดเก็บและปฏิบัติตามกฎหมายจัดเก็บข้อมูลผ่านนโยบายคลาวด์อัตโนมัติ (Automated Storage Lifecycle Policies):

1. Hot Storage Tier (High Performance SSD):
ข้อมูลธุรกรรมปีปัจจุบันจัดเก็บอยู่ใน SSD Performance สูงสุดบน Snowflake / AWS S3 Standard เพื่อรองรับ Query แดชบอร์ดอย่างรวดเร็ว

2. Cold Storage Tier (Infrequent Access & AWS S3 Glacier):
เมื่อข้อมูลมีอายุพ้น 1 ปี นโยบายอัตโนมัติจะย้ายข้อมูลลง AWS S3 Glacier Flexible Archive ช่วยลดต้นทุนจัดเก็บลงมากกว่า 80%

3. Automated Regulatory Purge (10-Year Expiry):
เมื่อข้อมูลจัดเก็บครบกำหนด 10 ปีตามกฎหมายบัญชีและการเงิน นโยบาย DLM จะรันสคริปต์ลบทำลายทิ้งอัตโนมัติ (Automated Purge) เพื่อลดภาระจัดเก็บและความเสี่ยงทางกฎหมาย`,
    example: 'สถาบันการเงินตั้งนโยบาย DLM บน AWS ย้ายสเตทเม้นท์ธนาคารที่อายุเกิน 1 ปีลง S3 Glacier และตั้งระบบลบทำลายอัตโนมัติเมื่อครบ 10 ปี',
    useCase: '[Use Case: Financial Automated 10-Year Retention & Purge Policy]\nการบริหารจัดการ Tiering ข้อมูลสเตทเม้นท์บน Cloud ลดต้นทุนจัดเก็บ 80% และลบข้อมูลหมดอายุอัตโนมัติถูกต้องตามกฎหมาย'
  },

  // 4. กลุ่มเทคโนโลยีและแนวคิดยุคใหม่
  {
    id: 'warehouse-vs-lake',
    groupId: 'modern',
    groupTitle: 'กลุ่มเทคโนโลยีและแนวคิดยุคใหม่ (Modern Concepts)',
    title: 'Data Warehouse vs. Data Lake',
    iconKey: 'warehouse-vs-lake',
    tag: 'Architecture Comparison Standard',
    imageUrl: '/images/knowledge/warehouse-vs-lake.jpg',
    deepDive: `📘 [บทเรียนฉบับเต็มรูปแบบ: การเปรียบเทียบสถาปัตยกรรม Data Warehouse vs Data Lake]
การเลือกใช้สถาปัตยกรรมจัดเก็บข้อมูลระดับองค์กรขึ้นอยู่กับลักษณะข้อมูลและวัตถุประสงค์การนำไปใช้งาน:

1. Data Warehouse (Structured & Schema-on-Write):
เน้นเก็บข้อมูลที่มีโครงสร้างชัดเจน (SQL Tables) ผ่านการล้างและจัดโมเดลข้อมูลแล้ว เหมาะสำหรับทำ Business Intelligence, Executive Reports และ KPIs

2. Data Lake (All Formats & Schema-on-Read):
เน้นเก็บข้อมูลดิบทุกรูปแบบ (Structured, Semi-structured JSON, Unstructured Images/Logs) เหมาะสำหรับทีม Data Science, Machine Learning และ AI Training`,
    example: 'ห้างสรรพสินค้าใช้ Snowflake (Data Warehouse) ทำรายงานวิเคราะห์ยอดขายประจำเดือน และใช้ AWS S3 (Data Lake) เก็บภาพจากกล้องวงจรปิดหน้าร้านสำหรับฝึก AI วิเคราะห์พฤติกรรมลูกค้า',
    useCase: '[Use Case: Retail Hybrid Warehouse & Lake Architecture]\nการวางสถาปัตยกรรมคู่ขนาน ใช้ Snowflake ทำรายงาน BI และใช้ AWS S3 Data Lake สำหรับพัฒนาโมเดล AI',
    extraDetails: {
      type: 'comparison',
      table: {
        headers: ['คุณลักษณะ (Feature)', 'Data Warehouse', 'Data Lake'],
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
    title: 'Data Mesh vs. Data Fabric (Alation & Gartner Evaluation)',
    iconKey: 'mesh-vs-fabric',
    tag: 'Alation & Gartner Vision Assessment',
    imageUrl: '/images/knowledge/mesh-vs-fabric.jpg',
    deepDive: `📘 [บทเรียนฉบับเต็มรูปแบบ: การวิเคราะห์เปรียบเทียบ Data Mesh vs Data Fabric อ้างอิง Alation & Gartner]
บทวิเคราะห์เปรียบเทียบสถาปัตยกรรมข้อมูลยุคใหม่จาก Alation และรายงานการประเมินวิสัยทัศน์โดยสถาบัน Gartner:

1. Data Mesh (Organizational & Domain Paradigm):
เน้นการปรับโครงสร้างคนและองค์กร (Decentralized Operating Model) กระจายอำนาจให้แต่ละแผนก (Domain) ดูแลข้อมูลของตนเอง และส่งมอบข้อมูลในรูปแบบ "ผลิตภัณฑ์ข้อมูล" (Data as a Product) โดยมีระบบ Federated Computational Governance กำกับดูแลมาตรฐานกลาง

2. Data Fabric (Technology & Active Metadata Layer):
เน้นการใช้ชั้นเทคโนโลยีอัจฉริยะ (Active Metadata & AI-Driven Integration) เชื่อมต่อทุกระบบข้อมูลที่กระจัดกระจายข้าม multi-cloud ให้ทำงานร่วมกันเสมือนผืนผ้าชิ้นเดียว โดยใช้ AI ช่วยทำ Automated Data Discovery และ Access Control`,
    example: 'บริษัทผลิตรถยนต์ใช้ Data Mesh กระจายให้ทีม R&D และทีมโรงงานสร้าง Data Products ของตนเอง และใช้ Data Fabric ทำ Data Cataloging สแกนทั่วองค์กรอัตโนมัติ',
    useCase: '[Use Case: Global Automotive Enterprise Data Paradigm]\nการผสมผสาน Data Mesh ในการจัดการทีมธุรกิจ ควบคู่กับ Data Fabric ในการจัดการเมตาดาต้าข้าม Cloud อัตโนมัติ'
  },
  {
    id: 'data-platform-for-ai',
    groupId: 'modern',
    groupTitle: 'กลุ่มเทคโนโลยีและแนวคิดยุคใหม่ (Modern Concepts)',
    title: 'Data Platform for AI & LLMOps (แพลตฟอร์มข้อมูลสำหรับ AI)',
    iconKey: 'data-platform-for-ai',
    tag: 'Databricks Lakehouse AI / Feast / Pinecone Standard',
    imageUrl: '/images/knowledge/data-platform-for-ai.jpg',
    deepDive: `📘 [บทเรียนฉบับเต็มรูปแบบ: แพลตฟอร์มข้อมูลสำหรับปัญญาประดิษฐ์ (Data Platform for AI & LLMOps)]
สถาปัตยกรรมคลังข้อมูลสำหรับปัญญาประดิษฐ์ยุคใหม่ (AI Data Platform) อ้างอิงกรอบการวางระบบของ Databricks Lakehouse AI, Feast/Tecton Feature Store, Pinecone Vector Database และ MLflow/Arize AI Observability:

1. Real-Time Feature Store (Feast & Tecton):
- Online Feature Store (Redis/DynamoDB): คำนวณฟีเจอร์พฤติกรรมเรียลไทม์ (sub-10ms latency) เพื่อป้อนโมเดล AI Inference หน้าร้าน
- Offline Feature Store (Snowflake/BigQuery): เก็บฟีเจอร์ประวัติศาสตร์ย้อนหลังสำหรับการฝึกโมเดล (Model Training & Fine-Tuning) พร้อมระบบ Time-Travel ป้องกันปัญหา Data Leakage

2. Unstructured Data Pipeline & RAG Retrieval (Pinecone / Milvus & LangChain):
การเตรียมข้อมูลประเภทข้อความและเอกสาร (Unstructured PDF, Logs, Documents) ผ่านกระบวนการ Chunking ➔ Embedding Generation (OpenAI / HuggingFace) ➔ บันทึกลงใน Vector Database (Pinecone / Milvus / Pgvector) เพื่อให้ระบบ RAG (Retrieval-Augmented Generation) ดึงบริบทเฉพาะขององค์กรไปตอบคำถามร่วมกับ LLM ได้อย่างแม่นยำ

3. LLMOps & Model Observability (MLflow & Arize AI):
การกำกับดูแลโมเดล AI ในสายการผลิตด้วย MLflow Model Registry ร่วมกับ Arize AI ในการเฝ้าระวังปัญหา Data Drift, Model Degradation, Hallucination Rate และคำนวณต้นทุน Token Usage แบบเรียลไทม์`,
    example: 'องค์กรการเงินวางสถาปัตยกรรม Data Platform for AI โดยใช้ Feast ทำ Feature Store ป้อนโมเดล AI อนุมัติสินเชื่อแบบ Real-time และใช้ Pinecone Vector Database ร่วมกับ LangChain สร้าง Enterprise GenAI Assistant ช่วยพนักงานค้นหากฎหมายและสัญญาคู่ค้า',
    useCase: '[Use Case: Enterprise GenAI Knowledge Assistant & Real-Time Fraud AI]\nการสร้างท่อข้อมูลสตรีมมิ่งเชื่อมต่อ Vector Database (Pinecone) สำหรับระบบ RAG ควบคู่กับ Feature Store (Feast) เพื่อป้อนฟีเจอร์ให้โมเดล AI ตรวจจับทุจริตเรียลไทม์ โดยมี MLflow & Arize AI คอยติดตาม Model Performance'
  },

  // 5. กรอบ DAMA-DMBOK ทางปฏิบัติ (People, Process, Tech & Risk)
  {
    id: 'dmbok-people-roles',
    groupId: 'dmbok',
    groupTitle: 'กรอบ DAMA-DMBOK ทางปฏิบัติ (People, Process, Tech & Risk)',
    title: '1. โครงสร้างบุคลากรและบทบาทหน้าที่ (DAMA-DMBOK Roles)',
    iconKey: 'dmbok-people-roles',
    tag: 'DAMA-DMBOK Governance Team Standard',
    imageUrl: '/images/knowledge/dmbok-people-roles.jpg',
    deepDiveImageUrl: '/images/knowledge/sub-dmbok-roles.jpg',
    deepDive: `📘 [บทเรียนฉบับเต็มรูปแบบ: นิยามบทบาทบุคลากรหลักตามมาตรฐาน DAMA-DMBOK]
การจัดตั้งทีม Data Governance ตามมาตรฐาน DAMA-DMBOK กำหนดบทบาทและความรับผิดชอบอย่างชัดเจน 4 ระดับ:

1. Chief Data Officer (CDO): ผู้บริหารระดับสูงสุด คุมยุทธศาสตร์ข้อมูลภาพรวม และผลักดันนโยบายธรรมภิบาลข้ามองค์กร
2. Data Owner (เจ้าของข้อมูล): ผู้บริหารระดับสูงแผนกธุรกิจ มีอำนาจตัดสินใจสิทธิ์การเข้าถึงข้อมูลและรับผิดชอบความเสี่ยง
3. Data Steward (ผู้ดูแลปฏิบัติการ): ผู้เชี่ยวชาญธุรกิจ คอยบริหาร Data Dictionary จัดทำ Data Lineage และตรวจ DQ ปฏิบัติการ
4. Data Custodian (ผู้เก็บรักษาข้อมูล): ทีม IT / Data Engineer ดูแลเทคนิค Server, Backup, Network และสิทธิ์การเข้าถึง`,
    example: 'แต่งตั้ง Head of Marketing เป็น Data Owner ตารางลูกค้า และแต่งตั้ง Risk Analyst เป็น Data Steward กำหนด Data Dictionary โดยมี Data Engineer เป็น Data Custodian',
    useCase: '[Use Case: Enterprise Governance Team Org Setup]\nการจัดตั้งโครงสร้างทีมธรรมภิบาลข้อมูลตาม DAMA-DMBOK แบ่งแยกบทบาทชัดเจนระหว่าง CDO, Data Owner, Data Steward และ Data Custodian'
  },
  {
    id: 'dmbok-process-framework',
    groupId: 'dmbok',
    groupTitle: 'กรอบ DAMA-DMBOK ทางปฏิบัติ (People, Process, Tech & Risk)',
    title: '2. กระบวนการประเมินวุฒิภาวะ 5 ระดับ (Data Maturity Assessment)',
    iconKey: 'dmbok-process-framework',
    tag: 'DAMA-DMBOK 5 Maturity Stages',
    imageUrl: '/images/knowledge/dmbok-process-framework.jpg',
    deepDive: `📘 [บทเรียนฉบับเต็มรูปแบบ: การประเมินวุฒิภาวะการจัดการข้อมูล 5 ระดับตาม DAMA-DMBOK]
กรอบการประเมินวุฒิภาวะทางการจัดการข้อมูล (Data Maturity Assessment) 5 ระดับตามมาตรฐาน DAMA-DMBOK:

1. Level 1 - Initial (เริ่มแรก): จัดเก็บข้อมูลใน Excel กระจัดกระจาย ขาดนโยบายและเครื่องมือกลาง
2. Level 2 - Repeatable (ทำซ้ำได้): เริ่มมีกระบวนการย่อยในบางทีม แต่ขาดมาตรฐานร่วมทั่วทั้งองค์กร
3. Level 3 - Defined (กำหนดไว้): มีการกำหนดนโยบาย Data Policy และ Data Dictionary เป็นลายลักษณ์อักษร
4. Level 4 - Monitored (ถูกติดตาม): จัดตั้ง Data Governance Board ติดตามคุณภาพด้วย metrics และแก้ไขปัญหา Single Source of Truth
5. Level 5 - Optimizing (ปรับปรุงต่อเนื่อง): ธรรมภิบาลข้อมูลกลายเป็นวัฒนธรรมองค์กร ปรับปรุงด้วยอัตโนมัติและ AI`,
    example: 'องค์กรประเมินวุฒิภาวะตนเองจากระดับ 1 สู่ระดับ 4 โดยจัดตั้ง Data Governance Board ประชุมแก้ไขปัญหาข้อมูลขัดแย้งทุกเดือน',
    useCase: '[Use Case: Enterprise Data Maturity Transformation]\nการประเมินและยกระดับวุฒิภาวะข้อมูลองค์กรจาก Level 1 (Excel) สู่ Level 4 (Managed) ด้วยกรอบ DAMA-DMBOK'
  },
  {
    id: 'dmbok-tech-stack',
    groupId: 'dmbok',
    groupTitle: 'กรอบ DAMA-DMBOK ทางปฏิบัติ (People, Process, Tech & Risk)',
    title: '3. โครงสร้างพื้นฐานทางเทคโนโลยี (DAMA-DMBOK Tech Stack)',
    iconKey: 'dmbok-tech-stack',
    tag: 'Enterprise Infrastructure Matrix',
    imageUrl: '/images/knowledge/dmbok-tech-stack.jpg',
    deepDive: `📘 [บทเรียนฉบับเต็มรูปแบบ: ชั้นเทคโนโลยี 4 เสาหลักตามมาตรฐาน DAMA-DMBOK]
การเลือกใช้ซอฟต์แวร์ระดับองค์กร 4 ชั้นเพื่อขับเคลื่อนนโยบายข้อมูลตาม DAMA-DMBOK:

1. Governance & Catalog Layer: Collibra, Microsoft Purview, Alation
2. Integration & ETL Layer: dbt, Apache Airflow, Talend, Informatica
3. Modern Storage Layer: Snowflake, Google BigQuery, Amazon Redshift
4. MDM System Layer: Reltio, Informatica MDM, IBM MDM`,
    example: 'การเชื่อมต่อ Collibra + dbt + Snowflake + Reltio MDM เป็นโครงสร้างพื้นฐานเทคโนโลยีกลางขององค์กร',
    useCase: '[Use Case: 4-Pillar Enterprise Tech Architecture]\nการวางสถาปัตยกรรมซอฟต์แวร์ 4 เสาหลักรองรับการสเกลระบบข้อมูลองค์กร'
  },
  {
    id: 'dmbok-risk-quality',
    groupId: 'dmbok',
    groupTitle: 'กรอบ DAMA-DMBOK ทางปฏิบัติ (People, Process, Tech & Risk)',
    title: '4. Risk & Quality Control (dbt-expectations Setup)',
    iconKey: 'dmbok-risk-quality',
    tag: 'dbt-expectations Automated Rules Standard',
    imageUrl: '/images/knowledge/dmbok-risk-quality.jpg',
    deepDive: `📘 [บทเรียนฉบับเต็มรูปแบบ: การควบคุมความเสี่ยงด้วย Automated Quality Checks (dbt-expectations)]
การควบคุมความเสี่ยงคุณภาพข้อมูลอ้างอิงการตั้งค่าสคริปต์อัตโนมัติด้วยเครื่องมือ dbt-expectations ในท่อส่งข้อมูล CI/CD Pipeline:

1. Automated Quality Expectations (dbt-expectations):
- expect_column_values_to_not_be_null: เช็คห้ามมีค่าว่างในคอลัมน์สำคัญ (เช่น เลขภาษี null ไม่เกิน 5%)
- expect_column_values_to_match_regex: เช็คฟอร์แมตข้อมูลตามกฎ (เช่น รูปแบบเบอร์โทรศัพท์ 10 หลัก)
- expect_table_row_count_to_be_between: เช็คจำนวนระเบียนข้อมูลว่าอยู่ในช่วงปกติตามสถิตีย้อนหลัง

2. CI/CD Quality Gate & Alerting:
เมื่อวิศวกรส่งโค้ดใหม่ ท่อส่งข้อมูลจะรัน dbt-expectations หากพบข้อมูลผิดปกติเกินเกณฑ์ ระบบจะบล็อกการ Deploy และส่งสัญญาณเตือนทันที`,
    example: 'สถาบันการเงินตั้งกฎ dbt-expectations เตือนทันทีเมื่อพบเลขประจำตัวผู้เสียภาษีปล่อยว่างเกิน 5% ในรายงานความเสี่ยง',
    useCase: '[Use Case: Financial Automated DQ & CI/CD Quality Gate]\nการตั้งค่า dbt-expectations บล็อกท่อส่งข้อมูลอัตโนมัติเมื่อพบข้อมูลผิดปกติ ป้องกันรายงานความเสี่ยงคลาดเคลื่อน'
  }
];
