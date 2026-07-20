// @ts-nocheck

import React, { useState, useEffect, useRef } from 'react';
import './LandingPage.css';
import { features, steps } from './LandingPageConstants';

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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12C2 12 7 4 12 4C17 4 22 12 22 12C22 12 17 20 12 20C7 20 2 12 2 12Z" stroke="#0ea5e9" />
            <circle cx="12" cy="12" r="3" fill="#0ea5e9" stroke="none" />
            <path d="M4 12 Q 12 24 20 12" stroke="#10b981" strokeWidth="2" />
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12C2 12 7 4 12 4C17 4 22 12 22 12C22 12 17 20 12 20C7 20 2 12 2 12Z" stroke="#0ea5e9" />
              <circle cx="12" cy="12" r="3" fill="#0ea5e9" stroke="none" />
              <path d="M4 12 Q 12 24 20 12" stroke="#10b981" strokeWidth="2" />
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
