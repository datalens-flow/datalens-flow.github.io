export interface KnowledgeTopic {
  id: string;
  groupId: string;
  groupTitle: string;
  title: string;
  icon: string;
  tag: string;
  deepDive: string;
  example: string;
  useCase: string;
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
  { id: 'modern', title: '4. กลุ่มเทคโนโลยีและแนวคิดยุคใหม่ (Modern Concepts)', icon: '🚀' },
  { id: 'dmbok', title: '5. กรอบ DAMA-DMBOK ทางปฏิบัติ (People, Process, Tech & Risk)', icon: '🏛️' }
];

export const KNOWLEDGE_TOPICS: KnowledgeTopic[] = [
  // 1. กลุ่มมาตรฐานและโครงสร้าง
  {
    id: 'data-ecosystem',
    groupId: 'standards',
    groupTitle: 'กลุ่มมาตรฐานและโครงสร้าง (Standards & Structure)',
    title: 'ระบบนิเวศของข้อมูล (Data Ecosystem)',
    icon: '🌐',
    tag: 'Overview & Harmony',
    deepDive: 'ระบบนิเวศของข้อมูล (Data Ecosystem) คือโครงสร้างพื้นฐาน เทคโนโลยี บุคลากร และกระบวนการทั้งหมดที่ปฏิสัมพันธ์กันอย่างสอดคล้องภายในองค์กร เพื่อเปลี่ยนข้อมูลดิบ (Raw Data) จากหลายแหล่งให้กลายเป็นคุณค่าทางธุรกิจ (Business Value) อย่างมีเสถียรภาพ มีความปลอดภัย และมีธรรมาภิบาล',
    example: 'ธนาคารพาณิชย์เชื่อมต่อระบบ Mobile Banking, ตู้ ATM, ระบบอนุมัติสินเชื่อ และระบบบัตรเครดิต เข้ากับ Data Lakehouse กลาง เพื่อให้ทุกฝ่ายทำงานบนฐานข้อมูลเดียวกันโดยไร้รอยต่อ',
    useCase: '🏢 [Use Case: Banking Real-time Fraud Detection]\nธนาคารพาณิชย์ใช้ Data Ecosystem ในการเฝ้าระวังภัยทุจริตทางการเงินแบบ Real-time ข้อมูลการรูดบัตรจากเครื่อง EDC และแอปพลิเคชันจะไหลผ่าน Data Pipeline ➔ ตรวจสอบ Data Quality ➔ กรองสิทธิ์ความปลอดภัย ➔ ผ่านโมเดล AI ใน Data Lakehouse เพื่อบล็อกรายการสุ่มเสี่ยงได้ภายใน 0.3 วินาที'
  },
  {
    id: 'data-architecture',
    groupId: 'standards',
    groupTitle: 'กลุ่มมาตรฐานและโครงสร้าง (Standards & Structure)',
    title: 'Data Architecture (สถาปัตยกรรมข้อมูล)',
    icon: '🏗️',
    tag: 'Foundation',
    deepDive: 'การออกแบบ "พิมพ์เขียว" (Blueprint) ของระบบข้อมูลทั้งหมดในองค์กร กำหนดว่าองค์กรมีข้อมูลอะไรบ้าง ข้อมูลเหล่านั้นจะถูกเก็บไว้ที่ไหน (On-premise หรือ Cloud) ไหลผ่านระบบใดบ้าง และเชื่อมต่อกันอย่างไรเพื่อรองรับทั้งการใช้งานประจำวัน (Operational) และการวิเคราะห์ขั้นสูง (Analytics)',
    example: 'การวาดแผนผังว่าข้อมูลลูกค้าเมื่อสมัครผ่านแอปพลิเคชัน Mobile Banking จะต้องวิ่งไปเก็บที่ Transaction DB (PostgreSQL) หลังบ้าน จากนั้น CDC (Change Data Capture) จะคัดลอกข้อมูลไปยัง Data Lake บน AWS S3 สำหรับให้ทีม Data Analytics ดึงไปใช้วิเคราะห์ต่อโดยไม่กระทบความเร็วของแอปหลัก',
    useCase: '🛒 [Use Case: E-Commerce Multi-Cloud Streaming]\nธุรกิจอีคอมเมิร์ซออกแบบ Data Architecture ด้วย Kafka + Snowflake โดยดึงข้อมูลสั่งซื้อจากคำสั่งซื้อนับล้านรายการต่อนาทีบน Cloud เข้าสู่ Snowflake Data Warehouse แบบ Real-time ทำให้ทีมการตลาดเห็นยอดขายใน Flash Sale ได้ทันทีโดยระบบหน้าร้านไม่ล่ม'
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
    useCase: '🏥 [Use Case: Healthcare Patient Prescription Validation]\nโรงพยาบาลตั้งกฎ Data Quality Validation บนระบบจ่ายยา โดยเช็คความครบถ้วน (Completeness) และความถูกต้อง (Accuracy) ของประวัติแพ้ยาของคนไข้ หากพบข้อมูลขัดแย้งกัน ระบบจะระงับการสั่งยาและแจ้งเตือนแพทย์ผู้รักษาทันที เพื่อความปลอดภัยสูงสุดของคนไข้',
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
    example: 'พนักงานฝ่ายการตลาดต้องการทำแคมเปญวันเกิด สามารถเข้า Data Catalog ค้นหาคำว่า "Customer Birthdate" ระบบจะแสดงทันทีว่าชุดข้อมูลนี้อยู่ที่ตาราง `dim_customers` บน Snowflake อัปเดตทุกเที่ยงคืน โดยมีหัวหน้าฝ่าย CRM เป็นเจ้าของอนุมัติสิทธิ์',
    useCase: '🏪 [Use Case: Retail Chain 500+ Branches Self-Service BI]\nห้างสรรพสินค้าที่มีกว่า 500 สาขา ใช้ Data Catalog ในการทำ Self-Service Analytics ให้ผู้จัดการสาขาสามารถค้นหาชุดข้อมูลยอดขายรายสินค้า (SKU) และทราบความหมายของคอลัมน์ได้เอง โดยไม่ต้องคอยส่งตั๋วคำร้องขอข้อมูลจากทีม IT'
  },
  {
    id: 'data-stewardship',
    groupId: 'standards',
    groupTitle: 'กลุ่มมาตรฐานและโครงสร้าง (Standards & Structure)',
    title: 'Data Stewardship & Governance',
    icon: '👤',
    tag: 'Governance',
    deepDive: 'Data Governance คือการกำหนดนโยบายและกรอบกติกาบริหารจัดการข้อมูล ส่วน Data Steward คือ "ผู้ปฏิบัติงานจริง" ซึ่งเป็นตัวแทนจากฝ่ายธุรกิจและฝ่ายไอที คอยกำกับดูแล คุณภาพ ความถูกต้อง และการอนุมัติเข้าถึงข้อมูลในขอบเขตรับผิดชอบของตน',
    example: 'ฝ่ายทรัพยากรบุคคล (HR) มี Data Steward ทำหน้าที่ตรวจสอบสิทธิ์ว่าพนักงานคนใดสามารถดูข้อมูลเงินเดือนได้บ้าง และคอยตรวจสอบความถูกต้องของข้อมูลตำแหน่งพนักงานก่อนส่งให้ฝ่ายบัญชีจ่ายเงินเดือน',
    useCase: '📱 [Use Case: Telecom Subscriber Ownership & Access Control]\nค่ายมือถือแต่งตั้ง Data Steward ประจำฝ่ายการตลาดเพื่ออนุมัติสิทธิ์การเข้าถึงประวัติการเติมเงินของลูกค้า โดย Data Steward จะคอยรีวิวตั๋วขอใช้ข้อมูลจากทีม Analytics และตรวจสอบว่าตรงตามนโยบาย PDPA ก่อนอนุมัติสิทธิ์เสมอ'
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
    example: 'การบดบังหมายเลขบัตรเครดิตและเลขบัตรประชาชนในหน้าจอของพนักงาน Call Center ให้เห็นเฉพาะ 4 หลักสุดท้าย (`****-****-****-1234`) เพื่อป้องกันการรั่วไหลของข้อมูลการเงิน',
    useCase: '💳 [Use Case: Insurance PCI-DSS Tokenization]\nบริษัทประกันภัยใช้ระบบ Tokenization เข้ารหัสข้อมูลบัตรเครดิตของลูกค้าตั้งแต่หน้าเว็บชำระเงิน และแปลงเป็นสัญลักษณ์สุ่ม (Token) บันทึกลงใน Data Warehouse ทำให้แม้นักวิเคราะห์ข้อมูลจะรัน SQL ก็จะไม่เห็นเลขบัตรจริง ตรงตามมาตรฐาน PCI-DSS'
  },
  {
    id: 'data-privacy',
    groupId: 'security',
    groupTitle: 'กลุ่มความปลอดภัยและสิทธิส่วนบุคคล (Security & Privacy)',
    title: 'Data Privacy (ความเป็นส่วนตัว & กฎหมาย PDPA/GDPR)',
    icon: '⚖️',
    tag: 'Compliance',
    deepDive: 'มุ่งเน้นการปฏิบัติตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล (เช่น PDPA ของไทย หรือ GDPR ของยุโรป) กำหนดให้องค์กรต้องจัดเก็บข้อมูลเฉพาะเท่าที่จำเป็น แจ้งวัตถุประสงค์ (Purpose) ขอความยินยอม (Consent) และรองรับสิทธิของเจ้าของข้อมูล เช่น สิทธิการขอทำลายข้อมูล (Right to be Forgotten)',
    example: 'เมื่อลูกค้ายกเลิกสมาชิกและใช้สิทธิ "ขอให้ลบข้อมูลส่วนบุคคล" ระบบสถาปัตยกรรมข้อมูลต้องสามารถตามไปลบระเบียนชื่อ-ที่อยู่-เบอร์โทร ของลูกค้าในทุกฐานข้อมูล ทั้ง Production DB, Data Lake และ Backup File ได้อย่างหมดจดภายใน 30 วัน',
    useCase: '✈️ [Use Case: Airline Automated Right-to-be-Forgotten]\nสายการบินระดับโลกสร้างระบบ Automated Privacy Workflow เมื่อผู้โดยสารยื่นคำร้องลบข้อมูลผ่านแอป ระบบจะรัน Script ตามไปลบโปรไฟล์ สิทธิประโยชน์สะสมไมล์ และประวัติเดินทางในทุกฐานข้อมูลย่อย พร้อมออกใบรักษากฎหมาย GDPR ให้อัตโนมัติ'
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
    example: 'ฝ่ายขายระบุชื่อลูกค้าว่า "นายสมชาย" ฝ่ายบริการลูกค้าระบุว่า "Somchai" ฝ่ายบัญชีระบุว่า "คุณสมชาย ใจดี" ระบบ MDM จะทำ Matching Rule ยืนยันด้วยเลขบัตรประชาชน แล้วยุบรวมเป็น Golden Record ลูกค้ารหัส `CUST-001` รายเดียวกัน',
    useCase: '🏢 [Use Case: Enterprise Conglomerate Single Customer View]\nเครือธุรกิจขนาดใหญ่ที่มีทั้งธุรกิจห้างสรรพสินค้า โรงแรม และซูเปอร์มาร์เก็ต ใช้ MDM เชื่อมโปรไฟล์ลูกค้าจาก 3 บริษัทในเครือเข้าด้วยกันเป็น Golden ID ทำให้สามารถทำคะแนนสะสมร่วมและมอบสิทธิประโยชน์ข้ามธุรกิจได้อย่างแม่นยำ'
  },
  {
    id: 'data-integration',
    groupId: 'management',
    groupTitle: 'กลุ่มการจัดการและการนำไปใช้ (Management & Integration)',
    title: 'Data Integration & ETL / ELT',
    icon: '🔄',
    tag: 'Pipeline & Integration',
    deepDive: 'กระบวนการเชื่อมโยงและดึงข้อมูลจากแหล่งที่มากระจัดกระจาย (Database, API, Cloud SaaS) เข้าสู่คลังข้อมูลกลาง ผ่านท่อส่งข้อมูล ETL (Extract -> Transform -> Load) หรือ ELT (Extract -> Load -> Transform บน Cloud Data Warehouse)',
    example: 'ท่อส่งข้อมูลดึงยอดขายจากเครื่อง POS ตามหน้าร้าน (Extract) นำมาแปลงสกุลเงินเป็นบาทและปรับฟอร์แมตวันที่เป็น ค.ศ. (Transform) แล้วนำไปบันทึกลง Google BigQuery ทุกๆ 15 นาที (Load)',
    useCase: '🚚 [Use Case: Logistics Real-Time Fleet Tracking & Analytics]\nบริษัทขนส่งใช้ Airflow + BigQuery ทำ ELT Pipeline ดึงตำแหน่ง GPS รถขนส่ง 10,000 คันทุก 5 วินาทีเข้า BigQuery เพื่อคำนวณเส้นทางประหยัดน้ำมันและประมาณเวลาส่งสินค้า (ETA) ให้ลูกค้าได้แบบ Real-time'
  },
  {
    id: 'data-lifecycle',
    groupId: 'management',
    groupTitle: 'กลุ่มการจัดการและการนำไปใช้ (Management & Integration)',
    title: 'Data Lifecycle Management (DLM - วงจรชีวิตข้อมูล)',
    icon: '⏳',
    tag: 'Lifecycle & Archiving',
    deepDive: 'การบริหารวงจรชีวิตของข้อมูลตั้งแต่เริ่มสร้าง ใช้งาน จัดเก็บสำรอง (Archive) จนถึงทำลายทิ้งตามกฎหมาย เพื่อบริหารต้นทุน Storage และลดความเสี่ยงทางกฎหมายจากการเก็บข้อมูลที่หมดอายุ',
    example: 'ข้อมูลการโอนเงินปีปัจจุบันเก็บไว้ใน SSD ความเร็วสูง (Hot Storage) ข้อมูลอายุ 2-5 ปี ย้ายไปเก็บใน Cloud Cold Storage ที่ราคาถูกลง และข้อมูลธุรกรรมที่อายุครบ 10 ปีจะถูกลบทำลายทิ้งตามกฎหมายบัญชีโดยอัตโนมัติ',
    useCase: '🏦 [Use Case: Financial 10-Year Auto-Archiving & Purge Policy]\nสถาบันการเงินตั้งนโยบาย DLM บน Cloud โดยข้อมูลสเตทเม้นท์ปีปัจจุบันอยู่บน SSD Performance ➔ พ้น 1 ปี ย้ายลง Glacier Flexible Archive (ลดค่าใช้จ่าย 80%) ➔ พ้น 10 ปี ระบบรัน Script ลบทำลายทิ้งตามกฎหมายการเงินอัตโนมัติ'
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
    useCase: '🏬 [Use Case: Supermarket Retail Personalization Engine]\nซูเปอร์มาร์เก็ตใช้ Snowflake (Data Warehouse) ทำรายงานวิเคราะห์ยอดขายและกำไรรายสาขาให้ผู้บริหาร และใช้ AWS S3 Data Lake เก็บภาพจากกล้องวงจรปิดหน้าร้านเพื่อวิเคราะห์พฤติกรรมการเดินเลือกซื้อของลูกค้าด้วย AI Camera',
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
    useCase: '🚗 [Use Case: Global Automotive Decentralized Domain Products]\nบริษัทผลิตรถยนต์ระดับโลกใช้ Data Mesh กระจายให้ทีม R&D, ทีมโรงงานผลิต และทีมฝ่ายขาย สร้างผลิตภัณฑ์ข้อมูลของตนเอง (Data Products) แล้วเปิด API ให้กัน และใช้ Data Fabric ในการจัดการความปลอดภัยและเมตาดาต้ากลางโดยอัตโนมัติ',
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
  },

  // 5. กรอบ DAMA-DMBOK ทางปฏิบัติ (People, Process, Tech & Risk)
  {
    id: 'dmbok-people-roles',
    groupId: 'dmbok',
    groupTitle: 'กรอบ DAMA-DMBOK ทางปฏิบัติ (People, Process, Tech & Risk)',
    title: '1. โครงสร้างบุคลากรและบทบาทหน้าที่ (People & Roles)',
    icon: '👥',
    tag: 'DAMA-DMBOK Pillar 1',
    deepDive: 'ตามมาตรฐาน DAMA-DMBOK การจัดการข้อมูลไม่ใช่หน้าที่ของฝ่าย IT เพียงฝ่ายเดียว แต่เป็นความรับผิดชอบร่วมกันทั้งองค์กร ต้องมีการแต่งตั้งบทบาทที่ชัดเจนระหว่างระดับนโยบาย (CDO), ระดับตัดสินใจธุรกิจ (Data Owner), ระดับปฏิบัติการดูแลนิยาม (Data Steward) และระดับเทคนิค (Data Custodian)',
    example: 'แต่งตั้ง Head of Marketing เป็น Data Owner ของตารางลูกค้า และแต่งตั้งทีม Risk Analyst เป็น Data Steward คอยเช็คว่าพนักงานกรอกข้อมูลกรมธรรม์ถูกต้องหรือไม่ โดยมีทีม Data Engineer เป็น Data Custodian คอยทำ Backup สิทธิ์',
    useCase: '🏢 [Use Case: Enterprise Data Governance Org Structure]\nองค์กรการเงินขนาดใหญ่จัดตั้งโครงสร้างตาม DAMA-DMBOK โดยแต่งตั้ง CDO คุมยุทธศาสตร์ภาพรวม ➔ ให้ผู้อำนวยการฝ่ายพันธมิตรเป็น Data Owner อนุมัติสิทธิ์เข้าถึงตารางพาร์ทเนอร์ ➔ ให้สถาปนิกความเสี่ยงเป็น Data Steward กำหนด Data Dictionary ➔ ให้ทีม Data Infrastructure เป็น Data Custodian คอยดูเซิร์ฟเวอร์',
    extraDetails: {
      type: 'list',
      items: [
        { title: '1. Chief Data Officer (CDO)', desc: 'แม่ทัพใหญ่กำหนดกลยุทธ์ข้อมูลองค์กรให้สอดคล้องทิศทางธุรกิจ' },
        { title: '2. Data Owner (เจ้าของข้อมูล)', desc: 'ผู้บริหารระดับสูงแผนก (เช่น Head of Marketing) มีอำนาจตัดสินใจสิทธิ์เข้าถึงและรับผิดชอบความเสียหาย' },
        { title: '3. Data Steward (ผู้ดูแลปฏิบัติการ)', desc: 'ผู้เชี่ยวชาญธุรกิจคอยตรวจสอบคุณภาพข้อมูล กำหนด Data Dictionary และกำกับการกรอกข้อมูล' },
        { title: '4. Data Custodian (ผู้เก็บรักษาข้อมูล)', desc: 'ทีม IT / Data Engineer ดูแลเทคนิค Backup, Server, Network และสิทธิ์การเข้าถึงตาม Data Owner สั่ง' }
      ]
    }
  },
  {
    id: 'dmbok-process-framework',
    groupId: 'dmbok',
    groupTitle: 'กรอบ DAMA-DMBOK ทางปฏิบัติ (People, Process, Tech & Risk)',
    title: '2. กระบวนการและมาตรฐานการทำงาน (Process & Framework)',
    icon: '⚙️',
    tag: 'DAMA-DMBOK Pillar 2',
    deepDive: 'กระบวนการขับเคลื่อนธรรมภิบาลข้อมูลตามมาตรฐาน DAMA-DMBOK เริ่มจากการประเมินวุฒิภาวะ (Maturity Assessment) การตั้งคณะกรรมการกำกับดูแล (Governance Board) และกระบวนการแก้ไขปัญหาข้อผิดพลาดข้อมูล (Issue Resolution Process) เพื่อสร้าง Single Source of Truth',
    example: 'เมื่อพบรายชื่อพาร์ทเนอร์ซ้ำซ้อนกันใน 5 ระบบ คณะกรรมการ Data Governance Board จะเรียกประชุมและใช้ Issue Resolution Workflow กำหนดให้ระบบ CRM เป็นระบบหลักในการยึดความถูกต้อง',
    useCase: '🏛️ [Use Case: Multi-Subsidiary Issue Resolution Workflow]\nกลุ่มบริษัทร่วมทุน 5 บริษัทใช้ DAMA-DMBOK Process ในการประเมิน Data Maturity จากระดับ 1 (Excel) สู่ระดับ 4 (Managed) และจัดประชุม Governance Board ทุกเดือนเพื่อแก้ไขปัญหารายชื่อพาร์ทเนอร์ซ้ำซ้อนให้รวมเป็น Single Source of Truth',
    extraDetails: {
      type: 'list',
      items: [
        { title: '1. Data Maturity Assessment', desc: 'การประเมินวุฒิภาวะข้อมูลเพื่อรู้จุดยืนปัจจุบันและวาง Roadmap การพัฒนา' },
        { title: '2. Data Governance Board', desc: 'คณะกรรมการตัวแทนทุกฝ่ายร่วมประชุมกำหนดนโยบายความปลอดภัยและเกณฑ์ข้อมูลความลับ' },
        { title: '3. Issue Resolution Process', desc: 'กระบวนการแจ้ง ตรวจสอบ และแก้ไขข้อมูลผิดพลาดข้ามระบบให้เป็น Single Source of Truth' }
      ]
    }
  },
  {
    id: 'dmbok-tech-stack',
    groupId: 'dmbok',
    groupTitle: 'กรอบ DAMA-DMBOK ทางปฏิบัติ (People, Process, Tech & Risk)',
    title: '3. โครงสร้างพื้นฐานทางเทคโนโลยี (Technology Stack)',
    icon: '🛠️',
    tag: 'DAMA-DMBOK Pillar 3',
    deepDive: 'เทคโนโลยีระดับองค์กรตามมาตรฐาน DAMA-DMBOK คือเครื่องมืออัตโนมัติที่เชื่อม People และ Process เข้าด้วยกัน ประกอบด้วย 4 ชั้นหลัก: สารบบข้อมูล (Catalog Tools), ท่อส่งข้อมูล (Integration/ETL Tools), คลังข้อมูลคลาวด์ (Modern Storage) และระบบล้างข้อมูลหลัก (MDM System)',
    example: 'การใช้ Microsoft Purview ทำ Data Catalog ร่วมกับ dbt ทำ ETL Pipeline บน Snowflake และใช้ Reltio ทำ Master Data Management ล้างข้อมูลลูกค้า Real-time',
    useCase: '🏭 [Use Case: Manufacturing Modern Data Platform Integration]\nโรงงานอุตสาหกรรมสเกลใหญ่ใช้ Collibra ทำ Data Catalog + Informatica/dbt ทำ ETL ดูดข้อมูลเครื่องจักร ➔ บันทึกลง Google BigQuery Cloud Warehouse ➔ เชื่อม MDM System ล้างข้อมูลซัพพลายเออร์อัตโนมัติ',
    extraDetails: {
      type: 'comparison',
      table: {
        headers: ['ชั้นเทคโนโลยี (Tech Layer)', 'ตัวอย่างซอฟต์แวร์ระดับองค์กร', 'หน้าที่หลักตาม DAMA-DMBOK'],
        rows: [
          ['Data Governance & Catalog', 'Collibra, Microsoft Purview, Alation', 'จัดการสารบบข้อมูล ค้นหา Owner และตรวจสอบ Lineage'],
          ['Data Integration & ETL', 'dbt, Talend, Informatica, Airflow', 'ดูด แปลง และโหลดข้อมูลจากหลายแหล่งมารวมกัน'],
          ['Modern Data Storage', 'Snowflake, Google BigQuery, Amazon Redshift', 'จัดเก็บและประมวลผลข้อมูลประสิทธิภาพสูงบน Cloud'],
          ['MDM System', 'Reltio, Informatica MDM, IBM MDM', 'รวบรวมและล้างข้อมูลหลักให้เป็น Golden Record Real-time']
        ]
      }
    }
  },
  {
    id: 'dmbok-risk-quality',
    groupId: 'dmbok',
    groupTitle: 'กรอบ DAMA-DMBOK ทางปฏิบัติ (People, Process, Tech & Risk)',
    title: '4. การจัดการความเสี่ยงและคุณภาพ (Risk & Quality Control)',
    icon: '🛡️',
    tag: 'DAMA-DMBOK Pillar 4',
    deepDive: 'การควบคุมความเสี่ยงและคุณภาพข้อมูลตามมาตรฐาน DAMA-DMBOK เน้น 2 เสาหลัก: การสืบย้อนรอยเส้นทางข้อมูล (Data Lineage Tracking) เพื่อหาต้นตอเมื่อปลายทางผิดพลาด และการรันสคริปต์ตรวจคุณภาพอัตโนมัติ (Automated Quality Checks) พร้อมตั้งระบบการเตือนเมื่อค่าผิดปกติ',
    example: 'เขียนสคริปต์ตรวจ DQ อัตโนมัติ หากพบฟิลด์ "เลขประจำตัวผู้เสียภาษี" ในตารางประเมินความเสี่ยงถูกปล่อยว่างเกิน 5% ระบบจะส่งการแจ้งเตือนและระงับ Pipeline ทันที',
    useCase: '📊 [Use Case: Financial Automated DQ & Lineage Root Cause Analysis]\nสถาบันการเงินใช้ Data Lineage สืบย้อนรอยจากรายงานแดชบอร์ดความเสี่ยงปลายทางที่ตัวเลขผิดพลาด กลับไปยังฟอร์มอนุมัติสินเชื่อต้นทางได้ภายใน 2 นาที พร้อมใช้ Automated Quality Checks แจ้งเตือนทันทีเมื่อพบค่า Null เกิน 5%',
    extraDetails: {
      type: 'list',
      items: [
        { title: '1. Data Lineage Tracking', desc: 'การวาดแผนผังย้อนรอยเส้นทางไหลของข้อมูลจากหน้าฟอร์ม ➔ DB ➔ Dashboard หาต้นตอทันทีเมื่อตัวเลขผิด' },
        { title: '2. Automated Quality Checks', desc: 'การเขียนสคริปต์ตรวจ DQ อัตโนมัติ (เช่น เตือนทันทีเมื่อเลขภาษีปล่อยว่างเกิน 5%)' }
      ]
    }
  }
];
