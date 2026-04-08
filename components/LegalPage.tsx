import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

export const LegalPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'about' | 'contact'>('privacy');

  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/terms') {
      setActiveTab('terms');
    } else if (path === '/about') {
      setActiveTab('about');
    } else if (path === '/contact') {
      setActiveTab('contact');
    } else {
      setActiveTab('privacy');
    }
  }, []);

  const switchTab = (tab: 'privacy' | 'terms' | 'about' | 'contact') => {
    setActiveTab(tab);
    window.history.pushState({}, '', `/${tab}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-[#edeae2] font-sans selection:bg-amber-500/30">
      <Header showActions={false} />

      {/* HERO */}
      <div className="bg-[#141418] border-b border-[#2a2a34] px-6 md:px-12 py-16 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-96 h-96 bg-[radial-gradient(circle,rgba(201,168,76,0.12)_0%,transparent_65%)] pointer-events-none"></div>
        {activeTab === 'about' ? (
          <>
            <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#C9A84C] mb-4">// Company Overview</p>
            <h1 className="font-display text-4xl md:text-5xl font-normal leading-tight text-[#edeae2] max-w-2xl">
              About <em className="italic text-[#C9A84C]">C4 Infinity</em>
            </h1>
            <p className="text-[#8a8796] text-sm mt-4 max-w-xl">
              Building intelligent systems at the intersection of AI, private capital, and business acquisition.
            </p>
          </>
        ) : activeTab === 'contact' ? (
          <>
            <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#C9A84C] mb-4">// Get in Touch</p>
            <h1 className="font-display text-4xl md:text-5xl font-normal leading-tight text-[#edeae2] max-w-2xl">
              Contact <em className="italic text-[#C9A84C]">C4 Infinity</em>
            </h1>
            <p className="text-[#8a8796] text-sm mt-4 max-w-xl">
              Ready to explore a deal, discuss a project, or connect with our team? We respond within one business day.
            </p>
          </>
        ) : (
          <>
            <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#C9A84C] mb-4">// Legal & Compliance</p>
            <h1 className="font-display text-4xl md:text-5xl font-normal leading-tight text-[#edeae2] max-w-2xl">
              Transparency<br/><em className="italic text-[#C9A84C]">by design.</em>
            </h1>
            <p className="text-[#8a8796] text-sm mt-4 max-w-xl">
              DealScout AI is operated by C4 Infinity LLC. These documents govern your use of our platform and describe how we handle your data.
            </p>
            <div className="inline-flex items-center gap-2 bg-[rgba(201,168,76,0.12)] border border-[rgba(201,168,76,0.25)] px-3.5 py-1.5 font-mono text-[10px] tracking-[0.1em] text-[#C9A84C] mt-6">
              ⬡ Effective Date: April 7, 2025 &nbsp;|&nbsp; Version 1.0
            </div>
          </>
        )}
      </div>

      {/* TABS */}
      <div className="flex flex-wrap border-b border-[#2a2a34] bg-[#141418] px-6 md:px-12 sticky top-0 z-40">
        <button 
          className={`bg-transparent border-none font-sans text-[13px] font-medium tracking-[0.04em] px-6 py-4 cursor-pointer relative transition-colors uppercase ${activeTab === 'privacy' ? 'text-[#C9A84C]' : 'text-[#8a8796]'}`}
          onClick={() => switchTab('privacy')}
        >
          Privacy Policy
          {activeTab === 'privacy' && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#C9A84C]"></div>}
        </button>
        <button 
          className={`bg-transparent border-none font-sans text-[13px] font-medium tracking-[0.04em] px-6 py-4 cursor-pointer relative transition-colors uppercase ${activeTab === 'terms' ? 'text-[#C9A84C]' : 'text-[#8a8796]'}`}
          onClick={() => switchTab('terms')}
        >
          Terms of Service
          {activeTab === 'terms' && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#C9A84C]"></div>}
        </button>
        <button 
          className={`bg-transparent border-none font-sans text-[13px] font-medium tracking-[0.04em] px-6 py-4 cursor-pointer relative transition-colors uppercase ${activeTab === 'about' ? 'text-[#C9A84C]' : 'text-[#8a8796]'}`}
          onClick={() => switchTab('about')}
        >
          About Us
          {activeTab === 'about' && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#C9A84C]"></div>}
        </button>
        <button 
          className={`bg-transparent border-none font-sans text-[13px] font-medium tracking-[0.04em] px-6 py-4 cursor-pointer relative transition-colors uppercase ${activeTab === 'contact' ? 'text-[#C9A84C]' : 'text-[#8a8796]'}`}
          onClick={() => switchTab('contact')}
        >
          Contact
          {activeTab === 'contact' && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#C9A84C]"></div>}
        </button>
      </div>

      {/* BODY */}
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-0 max-w-6xl mx-auto px-6 md:px-12">

        {/* SIDEBAR */}
        <aside className="hidden md:block py-12 pr-8 sticky top-24 h-fit">
          <p className="font-mono text-[9px] tracking-[0.15em] uppercase text-[#4a4858] mb-4">Contents</p>
          <ul className="list-none flex flex-col gap-1">
            {activeTab === 'privacy' ? (
              <>
                <li><a href="#p1" className="block text-xs text-[#8a8796] no-underline py-1 px-2.5 border-l-2 border-[#2a2a34] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-colors leading-relaxed">Information We Collect</a></li>
                <li><a href="#p2" className="block text-xs text-[#8a8796] no-underline py-1 px-2.5 border-l-2 border-[#2a2a34] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-colors leading-relaxed">How We Use Information</a></li>
                <li><a href="#p3" className="block text-xs text-[#8a8796] no-underline py-1 px-2.5 border-l-2 border-[#2a2a34] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-colors leading-relaxed">Data Sharing</a></li>
                <li><a href="#p4" className="block text-xs text-[#8a8796] no-underline py-1 px-2.5 border-l-2 border-[#2a2a34] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-colors leading-relaxed">Cookies & Tracking</a></li>
                <li><a href="#p5" className="block text-xs text-[#8a8796] no-underline py-1 px-2.5 border-l-2 border-[#2a2a34] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-colors leading-relaxed">Data Retention</a></li>
                <li><a href="#p6" className="block text-xs text-[#8a8796] no-underline py-1 px-2.5 border-l-2 border-[#2a2a34] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-colors leading-relaxed">Your Rights</a></li>
                <li><a href="#p7" className="block text-xs text-[#8a8796] no-underline py-1 px-2.5 border-l-2 border-[#2a2a34] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-colors leading-relaxed">Data Security</a></li>
                <li><a href="#p8" className="block text-xs text-[#8a8796] no-underline py-1 px-2.5 border-l-2 border-[#2a2a34] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-colors leading-relaxed">Third-Party Services</a></li>
                <li><a href="#p9" className="block text-xs text-[#8a8796] no-underline py-1 px-2.5 border-l-2 border-[#2a2a34] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-colors leading-relaxed">Children's Privacy</a></li>
                <li><a href="#p10" className="block text-xs text-[#8a8796] no-underline py-1 px-2.5 border-l-2 border-[#2a2a34] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-colors leading-relaxed">Policy Updates</a></li>
                <li><a href="#p11" className="block text-xs text-[#8a8796] no-underline py-1 px-2.5 border-l-2 border-[#2a2a34] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-colors leading-relaxed">Contact</a></li>
              </>
            ) : activeTab === 'terms' ? (
              <>
                <li><a href="#t1" className="block text-xs text-[#8a8796] no-underline py-1 px-2.5 border-l-2 border-[#2a2a34] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-colors leading-relaxed">Acceptance of Terms</a></li>
                <li><a href="#t2" className="block text-xs text-[#8a8796] no-underline py-1 px-2.5 border-l-2 border-[#2a2a34] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-colors leading-relaxed">Description of Service</a></li>
                <li><a href="#t3" className="block text-xs text-[#8a8796] no-underline py-1 px-2.5 border-l-2 border-[#2a2a34] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-colors leading-relaxed">Eligibility</a></li>
                <li><a href="#t4" className="block text-xs text-[#8a8796] no-underline py-1 px-2.5 border-l-2 border-[#2a2a34] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-colors leading-relaxed">Account Registration</a></li>
                <li><a href="#t5" className="block text-xs text-[#8a8796] no-underline py-1 px-2.5 border-l-2 border-[#2a2a34] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-colors leading-relaxed">Subscription & Billing</a></li>
                <li><a href="#t6" className="block text-xs text-[#8a8796] no-underline py-1 px-2.5 border-l-2 border-[#2a2a34] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-colors leading-relaxed">Acceptable Use</a></li>
                <li><a href="#t7" className="block text-xs text-[#8a8796] no-underline py-1 px-2.5 border-l-2 border-[#2a2a34] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-colors leading-relaxed">Intellectual Property</a></li>
                <li><a href="#t8" className="block text-xs text-[#8a8796] no-underline py-1 px-2.5 border-l-2 border-[#2a2a34] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-colors leading-relaxed">Disclaimer</a></li>
                <li><a href="#t9" className="block text-xs text-[#8a8796] no-underline py-1 px-2.5 border-l-2 border-[#2a2a34] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-colors leading-relaxed">Limitation of Liability</a></li>
                <li><a href="#t10" className="block text-xs text-[#8a8796] no-underline py-1 px-2.5 border-l-2 border-[#2a2a34] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-colors leading-relaxed">Indemnification</a></li>
                <li><a href="#t11" className="block text-xs text-[#8a8796] no-underline py-1 px-2.5 border-l-2 border-[#2a2a34] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-colors leading-relaxed">Termination</a></li>
                <li><a href="#t12" className="block text-xs text-[#8a8796] no-underline py-1 px-2.5 border-l-2 border-[#2a2a34] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-colors leading-relaxed">Governing Law</a></li>
                <li><a href="#t13" className="block text-xs text-[#8a8796] no-underline py-1 px-2.5 border-l-2 border-[#2a2a34] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-colors leading-relaxed">Changes to Terms</a></li>
                <li><a href="#t14" className="block text-xs text-[#8a8796] no-underline py-1 px-2.5 border-l-2 border-[#2a2a34] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-colors leading-relaxed">Contact</a></li>
              </>
            ) : activeTab === 'about' ? (
              <>
                <li><a href="#a1" className="block text-xs text-[#8a8796] no-underline py-1 px-2.5 border-l-2 border-[#2a2a34] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-colors leading-relaxed">Our Story</a></li>
                <li><a href="#a2" className="block text-xs text-[#8a8796] no-underline py-1 px-2.5 border-l-2 border-[#2a2a34] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-colors leading-relaxed">What We Do</a></li>
                <li><a href="#a3" className="block text-xs text-[#8a8796] no-underline py-1 px-2.5 border-l-2 border-[#2a2a34] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-colors leading-relaxed">Managing Member</a></li>
                <li><a href="#a4" className="block text-xs text-[#8a8796] no-underline py-1 px-2.5 border-l-2 border-[#2a2a34] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-colors leading-relaxed">Active Projects</a></li>
                <li><a href="#a5" className="block text-xs text-[#8a8796] no-underline py-1 px-2.5 border-l-2 border-[#2a2a34] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-colors leading-relaxed">Our Team</a></li>
              </>
            ) : null}
          </ul>
        </aside>

        {/* CONTENT */}
        <div className="py-12 md:pl-10 md:border-l border-[#2a2a34]">
          
          {activeTab === 'about' && (
            <div>
              <div className="mb-14 pb-12 border-b border-[#2a2a34]" id="a1">
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#C9A84C] mb-2">// 01</p>
                <h2 className="font-display text-[22px] font-normal text-[#edeae2] mb-5 leading-snug">Our Story</h2>
                <p className="text-[#8a8796] mb-3.5 text-sm">C4 Infinity LLC is a Florida-based business consulting and acquisition firm founded on a simple premise: that the right intelligence, applied at the right moment, can unlock extraordinary value in even overlooked deals. We specialize in AI-powered tools for small business operators, deal buyers, and private lenders who need an analytical edge in competitive markets.</p>
                <p className="text-[#8a8796] mb-3.5 text-sm">From our base in Pembroke Pines, Florida, we operate at the crossroads of technology consulting, e-commerce optimization, and business acquisition advisory — partnering with venture capital groups focused on M&A and real estate to help clients identify, evaluate, and close deals with confidence.</p>
              </div>

              <div className="mb-14 pb-12 border-b border-[#2a2a34]" id="a2">
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#C9A84C] mb-2">// 02</p>
                <h2 className="font-display text-[22px] font-normal text-[#edeae2] mb-5 leading-snug">What We Do</h2>
                <p className="text-[#8a8796] mb-3.5 text-sm">C4 Infinity delivers value across three core practice areas:</p>
                <ul className="my-3 pl-0 list-none">
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight"><strong className="text-[#edeae2] font-semibold">AI Micro-SaaS Development:</strong> We design and build targeted AI-powered software tools for small businesses — from deal analyzers and CRM pipelines to velocity banking dashboards and e-commerce optimization engines.</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight"><strong className="text-[#edeae2] font-semibold">Business Acquisition Advisory:</strong> Through our Acquisition Edge platform, we support private lenders and acquisition entrepreneurs with AI-driven deal analysis, contrarian scoring, and private capital positioning.</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight"><strong className="text-[#edeae2] font-semibold">E-Commerce Optimization:</strong> We help direct-to-consumer operators reduce friction, improve conversion, and scale sustainably through data-driven strategy and automation.</li>
                </ul>
                <div className="bg-[#1a1a20] border border-[#2a2a34] border-l-4 border-l-[#C9A84C] p-5 my-5 text-[13px] text-[#8a8796] leading-relaxed">
                  <strong className="text-[#edeae2] font-semibold">Our Philosophy:</strong> We don't build generic software. Every tool we create is purpose-built for a specific operator's workflow — ruthlessly focused, relentlessly practical, and designed to surface insight rather than add noise.
                </div>
              </div>

              <div className="mb-14 pb-12 border-b border-[#2a2a34]" id="a3">
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#C9A84C] mb-2">// 03</p>
                <h2 className="font-display text-[22px] font-normal text-[#edeae2] mb-5 leading-snug">Managing Member</h2>
                <div className="grid grid-cols-[auto_1fr] gap-8 items-start mt-2">
                  <div className="w-[140px] h-[160px] overflow-hidden border-2 border-[#2a2a34] shrink-0">
                    <img src="/christopher-carwise.png" alt="Christopher Carwise" className="w-full h-full object-cover object-top" />
                  </div>
                  <div>
                    <h3 className="font-display text-[20px] font-normal text-[#edeae2] mb-1">Christopher Carwise</h3>
                    <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#C9A84C] mb-4">Managing Member · C4 Infinity LLC</p>
                    <p className="text-[#8a8796] mb-3.5 text-sm">Christopher is the founder and Managing Member of C4 Infinity LLC, bringing a systems-thinking mindset to business consulting, software development, and deal acquisition. With a background spanning AI product development, financial strategy, and private capital advisory, he leads the firm's portfolio of micro-SaaS platforms and acquisition intelligence tools.</p>
                    <p className="text-[#8a8796] mb-3.5 text-sm">Christopher is the architect behind DealScout AI and the Acquisition Edge brand — platforms designed to give deal buyers and private lenders a decisive analytical advantage. He is a practitioner of velocity banking techniques and has deep fluency in acquisition terminology including SDE, CIM, LOI, POF, NDA workflows, and due diligence structuring.</p>
                    <p className="text-[#8a8796] mb-3.5 text-sm">He is supported by his wife and business partner, <strong className="text-[#edeae2] font-semibold">Chantal P. Carwise</strong>, who serves as Member and Secretary of C4 Infinity LLC.</p>
                    <div className="mt-4 flex gap-3 flex-wrap">
                      <a href="https://www.linkedin.com/in/christopher-carwise-a6635b9/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1a1a20] border border-[#2a2a34] font-mono text-[10px] tracking-[0.08em] uppercase text-[#C9A84C] no-underline transition-colors hover:border-[#C9A84C]">⬡ LinkedIn Profile</a>
                      <a href="https://www.c4infinity.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1a1a20] border border-[#2a2a34] font-mono text-[10px] tracking-[0.08em] uppercase text-[#8a8796] no-underline transition-colors hover:border-[#8a8796]">⬡ C4 Infinity</a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-14 pb-12 border-b border-[#2a2a34]" id="a4">
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#C9A84C] mb-2">// 04</p>
                <h2 className="font-display text-[22px] font-normal text-[#edeae2] mb-5 leading-snug">Active Projects</h2>

                <div className="bg-[#1a1a20] border border-[#2a2a34] border-l-4 border-l-[#C9A84C] p-5 mb-5 text-[13px] text-[#8a8796] leading-relaxed">
                  <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#C9A84C] mb-2.5">▸ Acquisition Edge · Private Capital Platform</p>
                  <strong className="text-[#edeae2] font-semibold">Acquisition Edge</strong> is C4 Infinity's flagship brand targeting private lenders and acquisition entrepreneurs. The platform positions an AI-powered deal analysis engine as the core differentiator for capital deployment decisions — providing contrarian scoring, red-flag detection, and deal pipeline management under a dark executive aesthetic built for serious operators.
                </div>

                <div className="bg-[#1a1a20] border border-[#2a2a34] border-l-4 border-l-[#C9A84C] p-5 mb-5 text-[13px] text-[#8a8796] leading-relaxed">
                  <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#C9A84C] mb-2.5">▸ DealScout AI · dealscout.it.com</p>
                  <strong className="text-[#edeae2] font-semibold">DealScout AI</strong> is an AI-powered contrarian deal analyzer for business acquisition leads, hosted on Google Cloud Run. The platform includes a Chrome Extension for auto-filling NDA requests and scraping deal metrics from listing sites like BizBuySell, a color-coded CRM pipeline, batch deal queuing, and AI-generated scoring with red-flag analysis. A five-video tutorial series supports onboarding and platform education.
                </div>

                <div className="bg-[#1a1a20] border border-[#2a2a34] border-l-4 border-l-[#C9A84C] p-5 mb-5 text-[13px] text-[#8a8796] leading-relaxed">
                  <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#C9A84C] mb-2.5">▸ VelocityFlow · Debt Management SaaS</p>
                  <strong className="text-[#edeae2] font-semibold">VelocityFlow</strong> is a debt management SaaS concept built around velocity banking techniques. The platform features CSV-based transaction import and analysis, Credit Card Gap calculation (measuring credit card dependency), and AI-generated personalized velocity banking attack plans — supported by a proprietary credit card benefits database.
                </div>

                <div className="bg-[#1a1a20] border border-[#2a2a34] border-l-4 border-l-[#C9A84C] p-5 text-[13px] text-[#8a8796] leading-relaxed">
                  <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#C9A84C] mb-2.5">▸ E-Commerce & Advisory Consulting</p>
                  C4 Infinity provides hands-on consulting for e-commerce operators seeking conversion optimization, automation strategy, and direct-to-consumer growth. The firm also supports M&A and real estate ventures through a venture capital group partnership, providing acquisition analysis and advisory services across a range of asset classes.
                </div>
              </div>

              <div className="mb-14 pb-12 border-none" id="a5">
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#C9A84C] mb-2">// 05</p>
                <h2 className="font-display text-[22px] font-normal text-[#edeae2] mb-5 leading-snug">Our Team</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                  <div className="bg-[#1a1a20] border border-[#2a2a34] p-6">
                    <p className="font-display text-[17px] text-[#edeae2] mb-1">Christopher Carwise</p>
                    <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#C9A84C] mb-3">Managing Member</p>
                    <p className="text-[13px] text-[#8a8796]">Strategy, Product Development, AI Platform Architecture, Acquisition Advisory, Private Capital Positioning</p>
                  </div>
                  <div className="bg-[#1a1a20] border border-[#2a2a34] p-6">
                    <p className="font-display text-[17px] text-[#edeae2] mb-1">Chantal P. Carwise</p>
                    <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#C9A84C] mb-3">Member &amp; Secretary</p>
                    <p className="text-[13px] text-[#8a8796]">Operations, Compliance, Business Administration, Legal Documentation, Organizational Management</p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'privacy' && (
            <div>
              <div className="mb-14 pb-12 border-b border-[#2a2a34]" id="p1">
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#C9A84C] mb-2">// 01</p>
                <h2 className="font-display text-[22px] font-normal text-[#edeae2] mb-5 leading-snug">Information We Collect</h2>
                <p className="text-[#8a8796] mb-3.5 text-sm">We collect information you provide directly and information generated through your use of DealScout AI. This includes:</p>
                <ul className="my-3 pl-0 list-none">
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight"><strong className="text-[#edeae2] font-semibold">Account Information:</strong> Name, email address, business name, phone number, and billing information when you register or subscribe.</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight"><strong className="text-[#edeae2] font-semibold">Deal & Analysis Data:</strong> Business listings, financial metrics, notes, CIM data, and deal pipeline information you input into the platform.</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight"><strong className="text-[#edeae2] font-semibold">Usage Data:</strong> Pages visited, features used, search queries, and interaction logs within the application.</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight"><strong className="text-[#edeae2] font-semibold">Device & Technical Data:</strong> IP address, browser type and version, operating system, referring URLs, and device identifiers.</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight"><strong className="text-[#edeae2] font-semibold">Communications:</strong> Messages you send to our support team or through in-app feedback tools.</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight"><strong className="text-[#edeae2] font-semibold">Extension Data:</strong> If you use the DealScout Chrome Extension, data scraped from third-party listing sites (e.g., BizBuySell) at your direction, including business names, asking prices, SDE, revenue, and listing URLs.</li>
                </ul>
              </div>

              <div className="mb-14 pb-12 border-b border-[#2a2a34]" id="p2">
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#C9A84C] mb-2">// 02</p>
                <h2 className="font-display text-[22px] font-normal text-[#edeae2] mb-5 leading-snug">How We Use Your Information</h2>
                <p className="text-[#8a8796] mb-3.5 text-sm">We use collected information to operate, improve, and personalize DealScout AI:</p>
                <ul className="my-3 pl-0 list-none">
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Provide and maintain the DealScout AI platform and Chrome Extension</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Process transactions and send billing confirmations</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Generate AI-powered deal analysis, scoring, and contrarian insights</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Populate and manage your CRM pipeline within the platform</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Send product updates, security notices, and support responses</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Monitor and analyze usage patterns to improve platform performance</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Detect and prevent fraudulent or unauthorized activity</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Comply with legal obligations</li>
                </ul>
                <div className="bg-[#1a1a20] border border-[#2a2a34] border-l-4 border-l-[#C9A84C] p-5 my-5 text-[13px] text-[#8a8796] leading-relaxed">
                  <strong className="text-[#edeae2] font-semibold">AI Processing Notice:</strong> Deal data you submit is processed by our AI models to generate analysis and recommendations. This data may be sent to third-party AI providers (such as Google Cloud AI) under confidentiality agreements. We do not use your deal data to train external AI models without explicit consent.
                </div>
              </div>

              <div className="mb-14 pb-12 border-b border-[#2a2a34]" id="p3">
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#C9A84C] mb-2">// 03</p>
                <h2 className="font-display text-[22px] font-normal text-[#edeae2] mb-5 leading-snug">Data Sharing &amp; Disclosure</h2>
                <p className="text-[#8a8796] mb-3.5 text-sm">We do not sell your personal information. We may share data with:</p>
                <ul className="my-3 pl-0 list-none">
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight"><strong className="text-[#edeae2] font-semibold">Service Providers:</strong> Cloud hosting (Google Cloud Run), payment processors, email service providers, and analytics tools — bound by data processing agreements.</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight"><strong className="text-[#edeae2] font-semibold">AI Infrastructure:</strong> Third-party AI APIs used to power deal analysis features, under strict confidentiality terms.</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight"><strong className="text-[#edeae2] font-semibold">Legal Compliance:</strong> When required by law, court order, or government authority, or to protect the rights and safety of C4 Infinity LLC and its users.</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight"><strong className="text-[#edeae2] font-semibold">Business Transfers:</strong> In connection with a merger, acquisition, or asset sale, with advance notice to users.</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight"><strong className="text-[#edeae2] font-semibold">With Your Consent:</strong> For any other purpose, only with your explicit approval.</li>
                </ul>
              </div>

              <div className="mb-14 pb-12 border-b border-[#2a2a34]" id="p4">
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#C9A84C] mb-2">// 04</p>
                <h2 className="font-display text-[22px] font-normal text-[#edeae2] mb-5 leading-snug">Cookies &amp; Tracking Technologies</h2>
                <p className="text-[#8a8796] mb-3.5 text-sm">DealScout AI uses cookies and similar technologies to:</p>
                <ul className="my-3 pl-0 list-none">
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Maintain your session and authentication state</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Remember preferences and settings</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Analyze traffic and usage patterns via analytics tools</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Support security features and fraud prevention</li>
                </ul>
                <p className="text-[#8a8796] mb-3.5 text-sm">You can control cookies through your browser settings. Disabling certain cookies may affect platform functionality. We honor "Do Not Track" signals where technically feasible.</p>
              </div>

              <div className="mb-14 pb-12 border-b border-[#2a2a34]" id="p5">
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#C9A84C] mb-2">// 05</p>
                <h2 className="font-display text-[22px] font-normal text-[#edeae2] mb-5 leading-snug">Data Retention</h2>
                <p className="text-[#8a8796] mb-3.5 text-sm">We retain your personal data for as long as your account is active or as needed to provide services. Upon account termination:</p>
                <ul className="my-3 pl-0 list-none">
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Account data is deleted within <strong className="text-[#edeae2] font-semibold">90 days</strong></li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Deal pipeline and CRM data is deleted within <strong className="text-[#edeae2] font-semibold">30 days</strong></li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Billing records are retained for <strong className="text-[#edeae2] font-semibold">7 years</strong> as required by law</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Anonymized, aggregated usage analytics may be retained indefinitely</li>
                </ul>
                <p className="text-[#8a8796] mb-3.5 text-sm">You may request earlier deletion at any time by contacting us at <a href="mailto:sales@c4infinity.com" className="text-[#C9A84C] hover:underline">sales@c4infinity.com</a>.</p>
              </div>

              <div className="mb-14 pb-12 border-b border-[#2a2a34]" id="p6">
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#C9A84C] mb-2">// 06</p>
                <h2 className="font-display text-[22px] font-normal text-[#edeae2] mb-5 leading-snug">Your Rights &amp; Choices</h2>
                <p className="text-[#8a8796] mb-3.5 text-sm">Depending on your jurisdiction, you may have the right to:</p>
                <ul className="my-3 pl-0 list-none">
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight"><strong className="text-[#edeae2] font-semibold">Access:</strong> Request a copy of the personal data we hold about you</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight"><strong className="text-[#edeae2] font-semibold">Correction:</strong> Request correction of inaccurate or incomplete data</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight"><strong className="text-[#edeae2] font-semibold">Deletion:</strong> Request erasure of your personal data ("right to be forgotten")</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight"><strong className="text-[#edeae2] font-semibold">Portability:</strong> Receive your data in a structured, machine-readable format</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight"><strong className="text-[#edeae2] font-semibold">Objection:</strong> Object to certain processing activities, including profiling</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight"><strong className="text-[#edeae2] font-semibold">Restriction:</strong> Request that we limit processing of your data in certain circumstances</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight"><strong className="text-[#edeae2] font-semibold">Opt-Out:</strong> Unsubscribe from marketing emails at any time via the unsubscribe link</li>
                </ul>
                <p className="text-[#8a8796] mb-3.5 text-sm">To exercise any of these rights, contact <a href="mailto:sales@c4infinity.com" className="text-[#C9A84C] hover:underline">sales@c4infinity.com</a>. We will respond within 30 days.</p>
              </div>

              <div className="mb-14 pb-12 border-b border-[#2a2a34]" id="p7">
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#C9A84C] mb-2">// 07</p>
                <h2 className="font-display text-[22px] font-normal text-[#edeae2] mb-5 leading-snug">Data Security</h2>
                <p className="text-[#8a8796] mb-3.5 text-sm">We implement industry-standard security measures including:</p>
                <ul className="my-3 pl-0 list-none">
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">TLS/HTTPS encryption for all data in transit</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Encryption at rest for sensitive stored data</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Access controls and role-based permissions</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Regular security reviews of infrastructure hosted on Google Cloud Run</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Incident response procedures for data breach scenarios</li>
                </ul>
                <p className="text-[#8a8796] mb-3.5 text-sm">No method of transmission or storage is 100% secure. In the event of a data breach affecting your rights, we will notify you as required by applicable law.</p>
              </div>

              <div className="mb-14 pb-12 border-b border-[#2a2a34]" id="p8">
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#C9A84C] mb-2">// 08</p>
                <h2 className="font-display text-[22px] font-normal text-[#edeae2] mb-5 leading-snug">Third-Party Services</h2>
                <p className="text-[#8a8796] mb-3.5 text-sm">Our platform may link to or integrate with third-party services including business listing platforms (e.g., BizBuySell), payment processors, and analytics providers. This Privacy Policy does not apply to those services. We encourage you to review their privacy policies before sharing information with them.</p>
              </div>

              <div className="mb-14 pb-12 border-b border-[#2a2a34]" id="p9">
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#C9A84C] mb-2">// 09</p>
                <h2 className="font-display text-[22px] font-normal text-[#edeae2] mb-5 leading-snug">Children's Privacy</h2>
                <p className="text-[#8a8796] mb-3.5 text-sm">DealScout AI is a professional B2B SaaS platform intended for users 18 years of age and older. We do not knowingly collect personal data from individuals under 18. If we learn that a minor has provided us data, we will promptly delete it. Contact us immediately if you believe a minor has registered.</p>
              </div>

              <div className="mb-14 pb-12 border-b border-[#2a2a34]" id="p10">
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#C9A84C] mb-2">// 10</p>
                <h2 className="font-display text-[22px] font-normal text-[#edeae2] mb-5 leading-snug">Policy Updates</h2>
                <p className="text-[#8a8796] mb-3.5 text-sm">We may update this Privacy Policy periodically to reflect changes in our practices or applicable law. We will notify you of material changes via email or an in-app notice at least <strong className="text-[#edeae2] font-semibold">14 days</strong> before they take effect. Continued use of the platform after the effective date constitutes your acceptance of the revised policy.</p>
              </div>

              <div className="mb-14 pb-12 border-none" id="p11">
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#C9A84C] mb-2">// 11</p>
                <h2 className="font-display text-[22px] font-normal text-[#edeae2] mb-5 leading-snug">Contact &amp; Data Controller</h2>
                <p className="text-[#8a8796] mb-3.5 text-sm">For privacy inquiries, data requests, or concerns, please contact:</p>
                <div className="bg-[#1a1a20] border border-[#2a2a34] p-7 mt-5">
                  <p className="font-mono text-[9px] tracking-[0.15em] uppercase text-[#4a4858] mb-3">// Data Controller</p>
                  <p className="text-[#8a8796] mb-1.5 text-sm"><strong className="text-[#edeae2] font-semibold">C4 Infinity LLC</strong></p>
                  <p className="text-[#8a8796] mb-1.5 text-sm">Managing Member: Christopher Carwise</p>
                  <p className="text-[#8a8796] mb-1.5 text-sm">Email: <a href="mailto:sales@c4infinity.com" className="text-[#C9A84C] hover:underline">sales@c4infinity.com</a></p>
                  <p className="text-[#8a8796] mb-1.5 text-sm">Phone: <a href="tel:7542299225" className="text-[#C9A84C] hover:underline">754-229-9225</a></p>
                  <p className="text-[#8a8796] mb-1.5 text-sm">Website: <a href="https://www.c4infinity.com" target="_blank" rel="noreferrer" className="text-[#C9A84C] hover:underline">www.c4infinity.com</a></p>
                  <p className="text-[#8a8796] mb-1.5 text-sm">Platform: <a href="https://dealscout.it.com" target="_blank" rel="noreferrer" className="text-[#C9A84C] hover:underline">dealscout.it.com</a></p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'terms' && (
            <div>
              <div className="mb-14 pb-12 border-b border-[#2a2a34]" id="t1">
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#C9A84C] mb-2">// 01</p>
                <h2 className="font-display text-[22px] font-normal text-[#edeae2] mb-5 leading-snug">Acceptance of Terms</h2>
                <p className="text-[#8a8796] mb-3.5 text-sm">By accessing or using DealScout AI at <a href="https://dealscout.it.com" className="text-[#C9A84C] hover:underline">dealscout.it.com</a>, its associated Chrome Extension, or any related services (collectively, the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service.</p>
                <p className="text-[#8a8796] mb-3.5 text-sm">These Terms constitute a legally binding agreement between you and <strong className="text-[#edeae2] font-semibold">C4 Infinity LLC</strong> ("Company," "we," "us," or "our"), a Florida limited liability company.</p>
              </div>

              <div className="mb-14 pb-12 border-b border-[#2a2a34]" id="t2">
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#C9A84C] mb-2">// 02</p>
                <h2 className="font-display text-[22px] font-normal text-[#edeae2] mb-5 leading-snug">Description of Service</h2>
                <p className="text-[#8a8796] mb-3.5 text-sm">DealScout AI is an AI-powered business acquisition analysis platform that provides deal evaluation, contrarian scoring, CRM pipeline management, and deal sourcing tools for business buyers, brokers, investors, and acquisition professionals. The Service includes:</p>
                <ul className="my-3 pl-0 list-none">
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Web-based AI deal analysis application at dealscout.it.com</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Chrome Extension for deal scraping and auto-fill on listing platforms</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">NDA request automation tools</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Deal pipeline CRM with color-coded status tracking</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">AI-generated deal scoring, red-flag detection, and contrarian analysis</li>
                </ul>
                <div className="bg-[#1a1a20] border border-[#2a2a34] border-l-4 border-l-[#C9A84C] p-5 my-5 text-[13px] text-[#8a8796] leading-relaxed">
                  <strong className="text-[#edeae2] font-semibold">Not Financial or Legal Advice:</strong> DealScout AI provides informational analysis tools only. Nothing in the Service constitutes financial, investment, legal, or professional advice. All deal decisions are solely your responsibility. Always consult qualified professionals before executing any business acquisition.
                </div>
              </div>

              <div className="mb-14 pb-12 border-b border-[#2a2a34]" id="t3">
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#C9A84C] mb-2">// 03</p>
                <h2 className="font-display text-[22px] font-normal text-[#edeae2] mb-5 leading-snug">Eligibility</h2>
                <p className="text-[#8a8796] mb-3.5 text-sm">To use DealScout AI, you must:</p>
                <ul className="my-3 pl-0 list-none">
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Be at least 18 years of age</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Have the legal capacity to enter into binding contracts</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Not be prohibited from using the Service under applicable law</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Use the Service for lawful business purposes only</li>
                </ul>
                <p className="text-[#8a8796] mb-3.5 text-sm">By using the Service, you represent and warrant that you meet all eligibility requirements.</p>
              </div>

              <div className="mb-14 pb-12 border-b border-[#2a2a34]" id="t4">
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#C9A84C] mb-2">// 04</p>
                <h2 className="font-display text-[22px] font-normal text-[#edeae2] mb-5 leading-snug">Account Registration &amp; Security</h2>
                <p className="text-[#8a8796] mb-3.5 text-sm">To access certain features, you must create an account. You agree to:</p>
                <ul className="my-3 pl-0 list-none">
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Provide accurate, complete, and current registration information</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Maintain the confidentiality of your login credentials</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Be solely responsible for all activity under your account</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Notify us immediately of any unauthorized account access at <a href="mailto:sales@c4infinity.com" className="text-[#C9A84C] hover:underline">sales@c4infinity.com</a></li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Not share, sell, or transfer your account to any third party</li>
                </ul>
                <p className="text-[#8a8796] mb-3.5 text-sm">We reserve the right to terminate accounts that violate these Terms or that are suspected of unauthorized use.</p>
              </div>

              <div className="mb-14 pb-12 border-b border-[#2a2a34]" id="t5">
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#C9A84C] mb-2">// 05</p>
                <h2 className="font-display text-[22px] font-normal text-[#edeae2] mb-5 leading-snug">Subscription, Fees &amp; Billing</h2>
                <p className="text-[#8a8796] mb-3.5 text-sm">Certain features of DealScout AI require a paid subscription. By subscribing, you agree to:</p>
                <ul className="my-3 pl-0 list-none">
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Pay all applicable fees at the rates displayed at the time of purchase</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Authorize recurring charges to your payment method for subscription renewals</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Our refund policy: subscriptions are non-refundable except as required by law or as offered in a specific promotion</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Price changes becoming effective at the next billing cycle following 30-day advance notice</li>
                </ul>
                <p className="text-[#8a8796] mb-3.5 text-sm">Failure to pay may result in suspension or termination of your account. You are responsible for all applicable taxes.</p>
              </div>

              <div className="mb-14 pb-12 border-b border-[#2a2a34]" id="t6">
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#C9A84C] mb-2">// 06</p>
                <h2 className="font-display text-[22px] font-normal text-[#edeae2] mb-5 leading-snug">Acceptable Use Policy</h2>
                <p className="text-[#8a8796] mb-3.5 text-sm">You agree to use DealScout AI only for lawful purposes. You may <strong className="text-[#edeae2] font-semibold">not</strong>:</p>
                <ul className="my-3 pl-0 list-none">
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Violate any applicable local, state, federal, or international law or regulation</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Scrape, copy, or redistribute data from the Service without authorization</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Attempt to gain unauthorized access to any portion of the Service or its infrastructure</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Reverse engineer, decompile, or disassemble any part of the Service</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Use the Service to transmit spam, malware, or harmful code</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Misrepresent your identity or affiliation when using the Service</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Use the Chrome Extension to scrape third-party sites in violation of their terms of service</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Interfere with or disrupt the integrity or performance of the Service</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Use the Service to facilitate fraudulent business acquisition activities</li>
                </ul>
                <p className="text-[#8a8796] mb-3.5 text-sm">We reserve the right to investigate violations and take appropriate action, including account termination and legal action.</p>
              </div>

              <div className="mb-14 pb-12 border-b border-[#2a2a34]" id="t7">
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#C9A84C] mb-2">// 07</p>
                <h2 className="font-display text-[22px] font-normal text-[#edeae2] mb-5 leading-snug">Intellectual Property</h2>
                <p className="text-[#8a8796] mb-3.5 text-sm">All content, features, functionality, code, design, trademarks, and trade dress of DealScout AI — including the "DealScout AI" name, logo, AI models, scoring algorithms, and CRM design — are the exclusive property of <strong className="text-[#edeae2] font-semibold">C4 Infinity LLC</strong> and protected by applicable intellectual property laws.</p>
                <p className="text-[#8a8796] mb-3.5 text-sm">You are granted a limited, non-exclusive, non-transferable, revocable license to use the Service for its intended purpose during the term of your subscription. Nothing in these Terms transfers ownership of any intellectual property to you.</p>
                <p className="text-[#8a8796] mb-3.5 text-sm">You retain ownership of the data and content you input into the Service. By submitting content, you grant C4 Infinity LLC a non-exclusive license to process and display that content for the purpose of delivering the Service.</p>
              </div>

              <div className="mb-14 pb-12 border-b border-[#2a2a34]" id="t8">
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#C9A84C] mb-2">// 08</p>
                <h2 className="font-display text-[22px] font-normal text-[#edeae2] mb-5 leading-snug">Disclaimer of Warranties</h2>
                <p className="text-[#8a8796] mb-3.5 text-sm">THE SERVICE IS PROVIDED ON AN <strong className="text-[#edeae2] font-semibold">"AS IS"</strong> AND <strong className="text-[#edeae2] font-semibold">"AS AVAILABLE"</strong> BASIS WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR ACCURACY OF AI-GENERATED ANALYSIS.</p>
                <p className="text-[#8a8796] mb-3.5 text-sm">We do not warrant that the Service will be uninterrupted, error-free, or free of harmful components. AI-generated deal analysis, scores, and recommendations are probabilistic in nature and may contain errors or omissions. You assume all risk associated with reliance on such outputs.</p>
              </div>

              <div className="mb-14 pb-12 border-b border-[#2a2a34]" id="t9">
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#C9A84C] mb-2">// 09</p>
                <h2 className="font-display text-[22px] font-normal text-[#edeae2] mb-5 leading-snug">Limitation of Liability</h2>
                <p className="text-[#8a8796] mb-3.5 text-sm">TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, C4 INFINITY LLC, ITS MEMBERS, OFFICERS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES — INCLUDING LOST PROFITS, LOST DATA, LOST DEALS, OR BUSINESS INTERRUPTION — ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE.</p>
                <p className="text-[#8a8796] mb-3.5 text-sm">IN NO EVENT SHALL OUR TOTAL CUMULATIVE LIABILITY EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM OR (B) ONE HUNDRED DOLLARS ($100).</p>
                <p className="text-[#8a8796] mb-3.5 text-sm">SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF CERTAIN WARRANTIES OR LIMITATION OF LIABILITY, SO SOME OF THE ABOVE MAY NOT APPLY TO YOU.</p>
              </div>

              <div className="mb-14 pb-12 border-b border-[#2a2a34]" id="t10">
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#C9A84C] mb-2">// 10</p>
                <h2 className="font-display text-[22px] font-normal text-[#edeae2] mb-5 leading-snug">Indemnification</h2>
                <p className="text-[#8a8796] mb-3.5 text-sm">You agree to indemnify, defend, and hold harmless C4 Infinity LLC and its members, officers, employees, agents, and contractors from any claims, damages, losses, liabilities, costs, or expenses (including reasonable attorneys' fees) arising from:</p>
                <ul className="my-3 pl-0 list-none">
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Your use of or access to the Service</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Your violation of these Terms</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Your violation of any third-party rights, including intellectual property or privacy rights</li>
                  <li className="relative pl-5 text-sm text-[#8a8796] mb-2 before:content-['›'] before:absolute before:left-0 before:text-[#C9A84C] before:text-base before:leading-tight">Any content or data you submit to or through the Service</li>
                </ul>
              </div>

              <div className="mb-14 pb-12 border-b border-[#2a2a34]" id="t11">
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#C9A84C] mb-2">// 11</p>
                <h2 className="font-display text-[22px] font-normal text-[#edeae2] mb-5 leading-snug">Termination</h2>
                <p className="text-[#8a8796] mb-3.5 text-sm">We may suspend or terminate your access to the Service at any time, with or without cause, with or without notice, effective immediately. Reasons may include violation of these Terms, fraudulent activity, extended non-payment, or cessation of the Service.</p>
                <p className="text-[#8a8796] mb-3.5 text-sm">You may terminate your account at any time by contacting <a href="mailto:sales@c4infinity.com" className="text-[#C9A84C] hover:underline">sales@c4infinity.com</a>. Upon termination, your right to use the Service ceases immediately. Provisions that by their nature should survive termination — including intellectual property, disclaimer, limitation of liability, and indemnification — shall survive.</p>
              </div>

              <div className="mb-14 pb-12 border-b border-[#2a2a34]" id="t12">
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#C9A84C] mb-2">// 12</p>
                <h2 className="font-display text-[22px] font-normal text-[#edeae2] mb-5 leading-snug">Governing Law &amp; Dispute Resolution</h2>
                <p className="text-[#8a8796] mb-3.5 text-sm">These Terms shall be governed by and construed in accordance with the laws of the <strong className="text-[#edeae2] font-semibold">State of Florida</strong>, without regard to conflict of law principles.</p>
                <p className="text-[#8a8796] mb-3.5 text-sm">Any dispute arising from these Terms or the Service shall first be attempted to be resolved through good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to binding arbitration under the American Arbitration Association Commercial Arbitration Rules, with proceedings conducted in <strong className="text-[#edeae2] font-semibold">Broward County, Florida</strong>.</p>
                <p className="text-[#8a8796] mb-3.5 text-sm">You waive any right to a jury trial or to participate in a class action lawsuit in connection with the Service.</p>
              </div>

              <div className="mb-14 pb-12 border-b border-[#2a2a34]" id="t13">
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#C9A84C] mb-2">// 13</p>
                <h2 className="font-display text-[22px] font-normal text-[#edeae2] mb-5 leading-snug">Changes to Terms</h2>
                <p className="text-[#8a8796] mb-3.5 text-sm">We reserve the right to modify these Terms at any time. We will notify you of material changes via email or an in-app notice at least <strong className="text-[#edeae2] font-semibold">14 days</strong> before the new Terms take effect. Your continued use of the Service after the effective date constitutes acceptance of the revised Terms. If you do not agree to the changes, you must stop using the Service and cancel your subscription before the effective date.</p>
              </div>

              <div className="mb-14 pb-12 border-none" id="t14">
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#C9A84C] mb-2">// 14</p>
                <h2 className="font-display text-[22px] font-normal text-[#edeae2] mb-5 leading-snug">Contact Information</h2>
                <p className="text-[#8a8796] mb-3.5 text-sm">For questions about these Terms, please contact:</p>
                <div className="bg-[#1a1a20] border border-[#2a2a34] p-7 mt-5">
                  <p className="font-mono text-[9px] tracking-[0.15em] uppercase text-[#4a4858] mb-3">// Legal Inquiries</p>
                  <p className="text-[#8a8796] mb-1.5 text-sm"><strong className="text-[#edeae2] font-semibold">C4 Infinity LLC</strong></p>
                  <p className="text-[#8a8796] mb-1.5 text-sm">Managing Member: Christopher Carwise</p>
                  <p className="text-[#8a8796] mb-1.5 text-sm">Email: <a href="mailto:sales@c4infinity.com" className="text-[#C9A84C] hover:underline">sales@c4infinity.com</a></p>
                  <p className="text-[#8a8796] mb-1.5 text-sm">Phone: <a href="tel:7542299225" className="text-[#C9A84C] hover:underline">754-229-9225</a></p>
                  <p className="text-[#8a8796] mb-1.5 text-sm">Website: <a href="https://www.c4infinity.com" target="_blank" rel="noreferrer" className="text-[#C9A84C] hover:underline">www.c4infinity.com</a></p>
                  <p className="text-[#8a8796] mb-1.5 text-sm">Platform: <a href="https://dealscout.it.com" target="_blank" rel="noreferrer" className="text-[#C9A84C] hover:underline">dealscout.it.com</a></p>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'contact' && (
            <div>
              <div className="mb-14 pb-12 border-none">
                <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-10 items-start mb-14">
                  <div>
                    <div className="w-full aspect-[3/4] overflow-hidden border border-[#2a2a34] relative">
                      <img src="/christopher-carwise.png" alt="Christopher Carwise — Managing Member, C4 Infinity LLC" className="w-full h-full object-cover object-top" />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[rgba(13,13,15,0.92)] to-transparent px-4 pt-5 pb-3.5">
                        <p className="font-display text-[15px] text-[#edeae2]">Christopher Carwise</p>
                        <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#C9A84C]">Managing Member</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="font-mono text-[9px] tracking-[0.15em] uppercase text-[#4a4858] mb-6">// Primary Contact</p>

                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-4 px-5 py-4 bg-[#1a1a20] border border-[#2a2a34]">
                        <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#C9A84C] min-w-[60px]">Phone</span>
                        <a href="tel:7542299225" className="text-[18px] font-display text-[#edeae2] no-underline hover:text-[#C9A84C] transition-colors">754-229-9225</a>
                      </div>
                      <div className="flex items-center gap-4 px-5 py-4 bg-[#1a1a20] border border-[#2a2a34]">
                        <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#C9A84C] min-w-[60px]">Email</span>
                        <a href="mailto:sales@c4infinity.com" className="text-[15px] text-[#edeae2] no-underline hover:text-[#C9A84C] transition-colors">sales@c4infinity.com</a>
                      </div>
                      <div className="flex items-center gap-4 px-5 py-4 bg-[#1a1a20] border border-[#2a2a34]">
                        <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#C9A84C] min-w-[60px]">Web</span>
                        <a href="https://www.c4infinity.com" target="_blank" rel="noreferrer" className="text-[15px] text-[#edeae2] no-underline hover:text-[#C9A84C] transition-colors">www.c4infinity.com</a>
                      </div>
                      <div className="flex items-center gap-4 px-5 py-4 bg-[#1a1a20] border border-[#2a2a34]">
                        <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#C9A84C] min-w-[60px]">Platform</span>
                        <a href="https://dealscout.it.com" target="_blank" rel="noreferrer" className="text-[15px] text-[#edeae2] no-underline hover:text-[#C9A84C] transition-colors">dealscout.it.com</a>
                      </div>
                      <div className="flex items-center gap-4 px-5 py-4 bg-[#1a1a20] border border-[#2a2a34]">
                        <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#C9A84C] min-w-[60px]">LinkedIn</span>
                        <a href="https://www.linkedin.com/in/christopher-carwise-a6635b9/" target="_blank" rel="noreferrer" className="text-[14px] text-[#edeae2] no-underline hover:text-[#C9A84C] transition-colors">christopher-carwise-a6635b9</a>
                      </div>
                    </div>

                    <div className="mt-6 bg-[#1a1a20] border border-[#2a2a34] border-l-4 border-l-[#C9A84C] px-6 py-5">
                      <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#8a8796] mb-2">// Physical Address</p>
                      <p className="font-display text-[16px] text-[#edeae2] mb-1">C4 Infinity LLC</p>
                      <p className="text-[13px] text-[#8a8796]">8403 Pines Blvd, Suite 1018</p>
                      <p className="text-[13px] text-[#8a8796]">Pembroke Pines, FL 33023</p>
                      <p className="text-[12px] text-[#4a4858] mt-2 font-mono">Florida Limited Liability Company · EIN on file</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="font-mono text-[9px] tracking-[0.15em] uppercase text-[#4a4858] mb-4">// Location · Pembroke Pines, Florida</p>
                  <div className="border border-[#2a2a34] overflow-hidden relative">
                    <img src="/map.png" alt="C4 Infinity LLC — 8403 Pines Blvd, Suite 1018, Pembroke Pines FL 33023" className="w-full block max-h-[380px] object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[rgba(13,13,15,0.95)] to-transparent px-6 pt-6 pb-5">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <p className="font-display text-[16px] text-[#edeae2]">C4 Infinity LLC</p>
                          <p className="text-[12px] text-[#8a8796] mt-0.5">8403 Pines Blvd, Suite 1018 · Pembroke Pines, FL 33023</p>
                          <p className="text-[11px] text-[#4a4858] mt-0.5 font-mono">Near I-820 &amp; Pines Blvd · Between 86th Ave &amp; SW 84th Ave</p>
                        </div>
                        <a href="https://maps.google.com/?q=8403+Pines+Blvd+Suite+1018+Pembroke+Pines+FL+33023" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#C9A84C] text-[#0d0d0f] font-mono text-[10px] tracking-[0.08em] uppercase font-bold no-underline whitespace-nowrap hover:bg-[#a8873a] transition-colors">⬡ Get Directions</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};
