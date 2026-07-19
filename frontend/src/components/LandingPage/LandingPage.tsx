import React, { useState, useEffect, useRef } from 'react';
import './LandingPage.css';

interface LandingPageProps {
  onLaunchApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchApp }) => {
  const [isVisible, setIsVisible] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

  // Enable body scrolling on landing page (body has overflow:hidden for app mode)
  useEffect(() => {
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    return () => {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
    };
  }, []);

  useEffect(() => {
    setIsVisible(true);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.scroll-animate').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const features = [
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
          <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
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

  const steps = [
    { num: '01', title: 'Paste SQL', desc: 'วาง DDL SQL หรือ import ไฟล์ .sql เข้ามา', color: '#6366f1' },
    { num: '02', title: 'Visualize', desc: 'ได้ ERD diagram, lineage, data dictionary ทันที', color: '#10b981' },
    { num: '03', title: 'Customize & Export', desc: 'ปรับแต่ง สี ตำแหน่ง เพิ่ม description แล้ว export', color: '#f59e0b' },
  ];

  return (
    <div className="landing-page">
      {/* Animated background */}
      <div className="landing-bg">
        <div className="bg-grid" />
        <div className="bg-glow bg-glow-1" />
        <div className="bg-glow bg-glow-2" />
        <div className="bg-glow bg-glow-3" />
      </div>

      {/* Navigation */}
      <nav className={`landing-nav ${isVisible ? 'nav-visible' : ''}`}>
        <div className="nav-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
          <span>DataLens Flow</span>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <button className="nav-cta" onClick={onLaunchApp}>
            Launch App
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8h10M9 4l4 4-4 4"/>
            </svg>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`hero-section ${isVisible ? 'hero-visible' : ''}`}>
        <div className="hero-badge">
          <span className="badge-dot" />
          Open Source — 100% Free — No Backend Required
        </div>
        <h1 className="hero-title">
          <span className="hero-line-1">Visualize Your</span>
          <span className="hero-line-2">
            <span className="gradient-text">Database Schema</span>
          </span>
          <span className="hero-line-3">In Seconds</span>
        </h1>
        <p className="hero-subtitle">
          วาง SQL → ได้ ERD Diagram, Data Lineage, Data Dictionary ทันที
          <br />
          ทำงานในเบราว์เซอร์ ไม่ต้องติดตั้ง ไม่ต้อง Sign up
        </p>
        <div className="hero-actions">
          <button className="btn-primary" onClick={onLaunchApp}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 13 8 5 13"/>
            </svg>
            เริ่มใช้งานเลย
          </button>
        </div>

        {/* Hero visual - mock ERD preview */}
        <div className="hero-preview">
          <div className="preview-window">
            <div className="preview-titlebar">
              <div className="titlebar-dots">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
              </div>
              <span className="titlebar-text">DataLens Flow — Database Diagram</span>
            </div>
            <div className="preview-content">
              {/* Mini ERD visualization */}
              <svg viewBox="0 0 600 280" className="preview-erd">
                {/* Grid background */}
                <defs>
                  <pattern id="miniGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(99,102,241,0.06)" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="600" height="280" fill="url(#miniGrid)"/>

                {/* Connection lines */}
                <path d="M 190 90 C 250 90, 250 60, 310 60" stroke="#0ea5e9" strokeWidth="1.5" fill="none" strokeDasharray="4 3" className="erd-line erd-line-1"/>
                <path d="M 190 110 C 250 110, 250 170, 310 170" stroke="#10b981" strokeWidth="1.5" fill="none" strokeDasharray="4 3" className="erd-line erd-line-2"/>
                <path d="M 490 60 C 530 60, 530 170, 490 170" stroke="#f59e0b" strokeWidth="1.5" fill="none" strokeDasharray="4 3" className="erd-line erd-line-3"/>

                {/* Users table */}
                <g className="erd-table erd-table-1">
                  <rect x="40" y="40" width="150" height="110" rx="6" fill="#0e121e" stroke="#1e293b" strokeWidth="1"/>
                  <rect x="40" y="40" width="150" height="28" rx="6" fill="rgba(99,102,241,0.12)"/>
                  <rect x="40" y="60" width="150" height="8" rx="0" fill="rgba(99,102,241,0.12)"/>
                  <circle cx="54" cy="54" r="4" fill="#6366f1"/>
                  <text x="64" y="57" fill="#f8fafc" fontSize="11" fontWeight="600" fontFamily="sans-serif">users</text>
                  <text x="52" y="82" fill="#fbbf24" fontSize="9" fontFamily="monospace">🔑 id</text>
                  <text x="52" y="98" fill="#94a3b8" fontSize="9" fontFamily="monospace">name</text>
                  <text x="52" y="114" fill="#94a3b8" fontSize="9" fontFamily="monospace">email</text>
                  <text x="52" y="130" fill="#94a3b8" fontSize="9" fontFamily="monospace">created_at</text>
                </g>

                {/* Orders table */}
                <g className="erd-table erd-table-2">
                  <rect x="310" y="20" width="180" height="100" rx="6" fill="#0e121e" stroke="#1e293b" strokeWidth="1"/>
                  <rect x="310" y="20" width="180" height="28" rx="6" fill="rgba(16,185,129,0.12)"/>
                  <rect x="310" y="40" width="180" height="8" rx="0" fill="rgba(16,185,129,0.12)"/>
                  <circle cx="324" cy="34" r="4" fill="#10b981"/>
                  <text x="334" y="37" fill="#f8fafc" fontSize="11" fontWeight="600" fontFamily="sans-serif">orders</text>
                  <text x="322" y="62" fill="#fbbf24" fontSize="9" fontFamily="monospace">🔑 id</text>
                  <text x="322" y="78" fill="#06b6d4" fontSize="9" fontFamily="monospace">🔗 user_id → users</text>
                  <text x="322" y="94" fill="#94a3b8" fontSize="9" fontFamily="monospace">total_amount</text>
                  <text x="322" y="110" fill="#94a3b8" fontSize="9" fontFamily="monospace">status</text>
                </g>

                {/* Products table */}
                <g className="erd-table erd-table-3">
                  <rect x="310" y="140" width="180" height="110" rx="6" fill="#0e121e" stroke="#1e293b" strokeWidth="1"/>
                  <rect x="310" y="140" width="180" height="28" rx="6" fill="rgba(245,158,11,0.12)"/>
                  <rect x="310" y="160" width="180" height="8" rx="0" fill="rgba(245,158,11,0.12)"/>
                  <circle cx="324" cy="154" r="4" fill="#f59e0b"/>
                  <text x="334" y="157" fill="#f8fafc" fontSize="11" fontWeight="600" fontFamily="sans-serif">products</text>
                  <text x="322" y="182" fill="#fbbf24" fontSize="9" fontFamily="monospace">🔑 id</text>
                  <text x="322" y="198" fill="#94a3b8" fontSize="9" fontFamily="monospace">name</text>
                  <text x="322" y="214" fill="#94a3b8" fontSize="9" fontFamily="monospace">price</text>
                  <text x="322" y="230" fill="#94a3b8" fontSize="9" fontFamily="monospace">category_id</text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section" ref={featuresRef}>
        <div className="section-header scroll-animate">
          <span className="section-label">Features</span>
          <h2 className="section-title">ทุกอย่างที่ต้องการ<br/><span className="gradient-text">ในเครื่องมือเดียว</span></h2>
          <p className="section-subtitle">ออกแบบมาสำหรับ Data Engineer, DBA, และ Developer ที่ต้องการเข้าใจ database ได้เร็วขึ้น</p>
        </div>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card scroll-animate" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="steps-section" ref={stepsRef}>
        <div className="section-header scroll-animate">
          <span className="section-label">How it works</span>
          <h2 className="section-title">เริ่มต้นใช้งาน<br/><span className="gradient-text">ง่ายแค่ 3 ขั้นตอน</span></h2>
        </div>
        <div className="steps-container">
          {steps.map((step, i) => (
            <div key={i} className="step-card scroll-animate" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="step-number" style={{ color: step.color }}>{step.num}</div>
              <div className="step-connector" />
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section scroll-animate">
        <div className="cta-card">
          <h2 className="cta-title">พร้อมเริ่มใช้งานแล้ว?</h2>
          <p className="cta-subtitle">ไม่ต้อง Sign up ไม่ต้องติดตั้ง เปิดเบราว์เซอร์แล้วเริ่มได้เลย</p>
          <button className="btn-primary btn-large" onClick={onLaunchApp}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 13 8 5 13"/>
            </svg>
            Launch DataLens Flow
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
            <span>DataLens Flow</span>
          </div>
          <p className="footer-text">Open-source database visualization tool. Built with React, TypeScript, and ❤️</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
