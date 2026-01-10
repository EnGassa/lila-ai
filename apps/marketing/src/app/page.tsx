"use client";
import React, { useState, useEffect } from 'react';
import Script from 'next/script';
import Image from "next/image";
import {
  ScanFace,
  Microscope,
  FlaskConical,
  Instagram,
  Twitter,
} from 'lucide-react';
import HeroAnimation from "@/components/HeroAnimation";

const HOW_IT_WORKS_STEPS = [
  {
    id: 'analyze',
    title: 'Analyze',
    subtitle: 'Get a detailed analysis of your skin',
    description: "Capture a digital map of your skin using advanced computer vision and facial markers.",
    img: "/app_analyze.png"
  },
  {
    id: 'understand',
    title: 'Understand',
    subtitle: 'Get personalized recommendations',
    description: "We strip away the marketing hype to identify the exact ingredients to build your routine.",
    img: "/app_understand.png"
  },
  {
    id: 'transform',
    title: 'Transform',
    subtitle: 'Track your progress',
    description: "See your skin change through data-driven tracking, with a routine that shifts alongside your lifestyle, seasons, and progress.",
    img: "/app_track.png"
  }
];

export default function LilaSkinLanding() {
  // --- State ---
  const [scrolled, setScrolled] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // --- Effects ---

  // 1. Navbar Scroll Effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  // --- Auto-play Logic ---
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % HOW_IT_WORKS_STEPS.length);
    }, 8000); // Change every 8 seconds

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div className="font-sans antialiased overflow-x-hidden bg-[#F0F4F8] text-[#2C2E2D] selection:bg-[#D4A392] selection:text-white min-h-screen">

      {/* --- Global Styles for Fonts & Animations --- */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Koho:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;1,200;1,300;1,400;1,500;1,600;1,700&family=Playfair+Display:wght@400;600;700;800&family=La+Belle+Aurore&display=swap');
        
        html { scroll-behavior: smooth; }
        .font-hand { font-family: 'La Belle Aurore', cursive; }
        .font-serif { font-family: 'Playfair Display', serif; }
        .font-sans { font-family: 'Koho', sans-serif; }

        /* Custom Scrollbar Hiding */
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        /* Animations */
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.3; }
        }
        .animate-pulse-slow { animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }

        @keyframes scan {
          0%, 100% { top: 0%; }
          50% { top: 100%; }
        }
        .animate-scan { animation: scan 3s ease-in-out infinite; }

        @keyframes scroll-x {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-x { animation: scroll-x 150s linear infinite; }
        .group:hover .animate-scroll-x { animation-play-state: paused; }



        /* Mix Blend Mode Utility */
        .mix-blend-multiply { mix-blend-mode: multiply; }

        /* Phone & Radar Styles */
        .phone-frame {
          box-shadow: 
            0 0 0 2px #586a84ff, /* Lighter inner bezel */
            0 0 0 6px #94A3B8, /* Lighter outer bezel */
            20px 30px 60px -10px rgba(58, 66, 61, 0.2);
        }

        .radar-chart {
          background: 
            radial-gradient(circle at center, transparent 0%, transparent 19%, #DECEBF 20%, transparent 21%),
            radial-gradient(circle at center, transparent 0%, transparent 39%, #DECEBF 40%, transparent 41%),
            radial-gradient(circle at center, transparent 0%, transparent 59%, #DECEBF 60%, transparent 61%);
        }
        .radar-shape {
          clip-path: polygon(50% 10%, 80% 30%, 80% 70%, 50% 90%, 20% 70%, 20% 30%);
        }
      `}</style>

      {/* --- Navbar --- */}
      <nav
        className={`fixed w-full z-50 transition-all duration-300 bg-white/80 backdrop-blur-md border-b border-[#EBE9E4] ${scrolled ? "shadow-sm" : ""}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">

            {/* Logo */}
            <a href="#" className="flex items-center relative group">
              <Image src="/lila_logo.png" alt="Lila Logo" width={240} height={80} className="w-48 md:w-48 h-auto" />
            </a>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-10">
              {['How it works', 'Our Approach', 'Get Started'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s/g, "-")}`}
                  className="text-[#1E293B] hover:text-[#9E6A57] transition-colors font-medium"
                >
                  {item}
                </a>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <a
                href="#get-started"
                className="bg-[#374D62] text-white px-5 py-2.5 md:px-6 md:py-3 text-sm md:text-base rounded-full hover:bg-[#2E4052] transition-all duration-300 font-medium shadow-md shadow-[#374D62]/20"
              >
                Get a Free Analysis
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section className="relative pt-36 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">

        {/* Background Blobs */}
        <div className="absolute top-0 right-0 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-20 right-[-10%] w-[600px] h-[600px] bg-[#F2EBE4] rounded-full blur-[80px] opacity-40 mix-blend-multiply animate-float"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#94A3B8] rounded-full blur-[100px] opacity-40 mix-blend-multiply animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Hero Content */}
            <div className="max-w-xl">

              <h1 className="text-5xl lg:text-6xl font-serif font-bold leading-[1.05] mb-6 text-[#020617] tracking-tight">
                <span className="text-[#374D62]">Decode your skin.</span>
              </h1>

              <p className="text-lg text-[#121921] mb-10 leading-relaxed max-w-lg">
                Lila transforms your phone into a skin consultant. We will map your face and curate a sensible science backed routine that actually works for you. No more guessing.
              </p>

              {/* Hero Form */}
              <div className="flex flex-col sm:flex-row gap-3 max-w-md relative">
                <a
                  href="#get-started"
                  className="px-8 py-4 rounded-full font-medium text-lg transition-all duration-300 shadow-lg shadow-[#374D62]/30 flex items-center justify-center gap-2 w-full sm:w-auto bg-[#374D62] text-white hover:bg-[#2E4052]"
                >
                  Get a Free Analysis
                </a>
              </div>
            </div>

            {/* Hero Visual / Phone Mockup */}
            {/* Hero Visual / Hero Animation */}
            <div className="relative flex justify-center lg:justify-end z-0">
              <div className="relative w-full max-w-[500px]">
                {/* Shape 1: Sky Aura */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[600px] bg-[#CBD5E1] rounded-full blur-[80px] opacity-50 animate-pulse-slow -z-10"></div>
                {/* Shape 2: Terracotta Accent */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/3 -translate-y-1/3 w-[500px] h-[500px] bg-[#D4BFAD] rounded-full blur-[100px] opacity-30 mix-blend-multiply animate-float -z-10" style={{ animationDelay: '2s' }}></div>

                <HeroAnimation />
              </div>
            </div>
          </div>
        </div>
      </section >

      {/* --- Social Proof --- */}
      {/* --- Interactive How It Works --- */}
      <section id="how-it-works" className="py-24 bg-white border-y border-[#EBE9E4]">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">

          {/* --- Mobile Layout (Horizontal Scroll) --- */}
          <div className="md:hidden">
            <div className="mb-8 text-center">
              <span className="text-[#9E6A57] font-serif italic text-xl mb-2 block">Your Personal Skincare Specialist</span>
              <h2 className="text-3xl font-serif font-bold text-[#374D62] mb-4">How it works</h2>
            </div>

            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-8 -mx-6 px-6 no-scrollbar">
              {HOW_IT_WORKS_STEPS.map((step, idx) => (
                <div key={idx} className="flex-none w-[85vw] snap-center bg-[#F0F4F8] rounded-[2rem] p-6 border border-[#EBE9E4] flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-white/80 px-3 py-1 rounded-full text-xs font-bold text-[#374D62] uppercase tracking-wider">
                      Step {idx + 1}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-[#020617] mb-2 font-serif">{step.title}</h3>
                  <p className="text-[#475569] leading-relaxed mb-6 h-20 text-sm">{step.description}</p>

                  {/* Phone Screen Preview */}
                  <div className="relative w-full aspect-[9/16] bg-white rounded-[1.5rem] border-4 border-[#A6ADB8] shadow-lg overflow-hidden mt-auto mx-auto max-w-[280px]">
                    <div className="w-full h-full overflow-y-auto no-scrollbar">
                      <Image
                        src={step.img || "/app_analyze.png"}
                        alt={`${step.title} screen`}
                        width={280}
                        height={500}
                        className="w-full h-auto min-h-full object-cover object-top"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden md:grid md:grid-cols-2 gap-16 items-center">

            {/* Left: Dynamic Phone Screen */}
            <div className="relative flex justify-center">
              {/* Phone Frame */}
              <div
                className="phone-frame bg-[#BFC6D1] rounded-[2.5rem] h-[600px] w-[300px] overflow-hidden relative border-[4px] border-[#BFC6D1] z-10 shadow-2xl"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                <div className="bg-[#FBFBF9] h-full w-full relative overflow-hidden flex flex-col font-sans">

                  {/* App Header */}
                  <div className="pt-10 pb-4 px-6 bg-white border-b border-[#EBE9E4] flex justify-between items-center transition-opacity duration-300">
                    <span className="font-sans font-medium text-xl text-[#9E6A57]">
                      {activeStep === 0 && "Analysis"}
                      {activeStep === 1 && "Recommendation"}
                      {activeStep === 2 && "Tracking"}
                    </span>
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 flex flex-col items-center justify-center relative w-full h-full ">

                    {/* Step 1: Analyze (Image) */}
                    {activeStep === 0 && (
                      <div className="w-full h-full p-2 bg-white">
                        <div className="w-full h-full overflow-y-auto no-scrollbar relative group rounded-[1.5rem]">
                          <Image
                            src="/app_analyze.png"
                            alt="Lila Analyze Screen"
                            width={300}
                            height={600}
                            className="w-full h-auto min-h-full object-cover"
                          />
                          {/* Overlay to ensure it feels like a screen if image is loading or transparent */}
                          <div className="absolute inset-0 bg-gray-100 -z-10 animate-pulse" />
                        </div>
                      </div>
                    )}

                    {/* Step 2: Understand */}
                    {activeStep === 1 && (
                      <div className="w-full h-full p-2 bg-white">
                        <div className="w-full h-full overflow-y-auto no-scrollbar relative group rounded-[1.5rem]">
                          <Image
                            src="/app_understand.png"
                            alt="Lila Understand Screen"
                            width={300}
                            height={600}
                            className="w-full h-auto min-h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gray-100 -z-10 animate-pulse" />
                        </div>
                      </div>
                    )}

                    {/* Step 3: Transform */}
                    {activeStep === 2 && (
                      <div className="w-full h-full p-2 bg-white">
                        <div className="w-full h-full overflow-y-auto no-scrollbar relative group rounded-[1.5rem]">
                          <Image
                            src="/app_track.png"
                            alt="Lila Track Screen"
                            width={300}
                            height={600}
                            className="w-full h-auto min-h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gray-100 -z-10 animate-pulse" />
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Decorative Blobs */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[#94A3B8] rounded-full blur-[90px] opacity-30 -z-10"></div>
            </div>

            {/* Right: Steps List */}
            <div>
              <div className="mb-12">
                <span className="text-[#9E6A57] font-serif italic text-xl mb-2 block">Your Personal Skincare Specialist</span>
                <h2 className="text-3xl md:text-5xl font-serif font-bold text-[#374D62] mb-4">How it works.</h2>
              </div>

              <div
                className="space-y-6"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                {HOW_IT_WORKS_STEPS.map((step, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveStep(idx)}
                    className={`relative w-full text-left p-6 rounded-2xl transition-all duration-300 border ${activeStep === idx
                      ? 'bg-[#F0F4F8] border-transparent shadow-sm'
                      : 'bg-transparent border-transparent hover:bg-[#F9FCFF]'
                      }`}
                  >
                    {activeStep === idx && (
                      <div className="absolute inset-0 rounded-2xl border-2 border-[#374D62] animate-pulse pointer-events-none"></div>
                    )}
                    <div className="relative z-10 flex items-start gap-4">
                      <div className={`text-lg font-bold transition-colors ${activeStep === idx ? 'text-[#374D62]' : 'text-[#94A3B8]'}`}>
                        0{idx + 1}
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold mb-1 transition-colors ${activeStep === idx ? 'text-[#020617]' : 'text-[#64748B]'}`}>
                          {step.title}
                        </h3>
                        <p className={`text-base font-medium mb-2 ${activeStep === idx ? 'text-[#374D62]' : 'text-[#94A3B8]'}`}>
                          {step.subtitle}
                        </p>
                        {/* Expanded content description only for active step? Or always show? 
                                    Wireframe shows subtitles. Let's keep it clean. 
                                    Maybe show description if active? */}
                        <div className={`grid transition-[grid-template-rows] duration-300 ${activeStep === idx ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                          <p className="overflow-hidden text-[#475569] leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- How it Works --- */}
      <section id="our-approach" className="py-24 bg-[#F0F4F8] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[#9E6A57] font-serif italic text-xl mb-2 block">Our Approach</span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6 text-[#374D62]">Science-backed, persoanlly curated.</h2>
            <p className="text-[#1E293B] text-lg">Lila is a skincare consultant which combines advanced computer vision and applied clinical rigour to your skin specific data points. The result is a medical-grade insight minus the medical-grade jargon </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <ScanFace className="w-6 h-6 text-[#64748B]" />,
                bg: 'bg-[#F0F4F8]',
                title: '1. The Scan',
                desc: 'Our AI performs an exhaustive analysis of your skin, scrutinizing over 120 distinct variables. From barrier health to texture, we go beyond the surface to understand exactly what your skin is asking for.'
              },
              {
                icon: <Microscope className="w-6 h-6 text-[#9E6A57]" />,
                bg: 'bg-[#DECEBF]',
                title: '2. The Ingredient Logic',
                desc: 'Our AI breaks down why a specific ingredient works for your skin. Whether it’s Retinol or Peptides, every recommendation is grounded in skin science.'
              },
              {
                icon: <FlaskConical className="w-6 h-6 text-[#1E293B]" />,
                bg: 'bg-[#475569]/20',
                title: '3. The Routine',
                desc: 'Finally, it all comes together with a simple and economically sensible skincare routine that works for you. Because wellness should be easy.'
              }
            ].map((step, idx) => (
              <div key={idx} className="group p-8 rounded-3xl bg-white border border-[#EBE9E4] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <div className={'w-14 h-14 ${step.bg} rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform'}>
                  {step.icon}
                </div>
                <h3 className="text-lg font-bold mb-3 text-[#0F172A]">{step.title}</h3>
                <p className="text-sm text-[#1E293B] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* --- Testimonials --- */}
      <section className="py-20 bg-white border-t border-[#EBE9E4] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-10">
          <h2 className="text-3xl font-serif font-medium text-[#020617]">Loved by Our Early Users</h2>
        </div>

        <div className="relative w-full flex overflow-hidden mask-linear-fade group">
          {/* Mask for fade effect at edges */}
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

          <div className="flex animate-scroll-x whitespace-nowrap py-8 px-4 group-hover:paused">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-6 pr-6">
                {[
                  { text: "Lila changed my routine completely. Finally I understand my skin!", user: "Sanna J." },
                  { text: "The analysis was spot on. Highly recommend trying it out.", user: "Misha T." },
                  { text: "Simple, effective, and science-backed. Love it.", user: "Ayesha R." },
                  { text: "I stopped wasting money on products that don't work.", user: "Jyothi L." },
                  { text: "Best skincare companion app I've used so far.", user: "Dhruv K." }
                ].map((t, idx) => (
                  <div key={idx} className="w-80 md:w-96 bg-[#F0F4F8] p-6 rounded-2xl border border-[#EBE9E4] shadow-sm whitespace-normal flex flex-col justify-between transition-transform duration-300 hover:scale-[1.02] hover:shadow-md cursor-default">
                    <p className="text-[#1E293B] italic mb-4 leading-relaxed">&quot;{t.text}&quot;</p>
                    <span className="font-bold text-[#9E6A57] block text-sm">- {t.user}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Waitlist / Footer CTA --- */}
      <section id="get-started" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#94A3B8]/30 -z-10"></div>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="text-[#9E6A57] font-serif italic text-xl mb-2 block">Get Started with Lila</span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-[#374D62]">Start your skincare journey.</h2>
          <p className="text-xl text-[#1E293B] mb-10">Sign up to Get a Free Analysis. Your information is secure and we will only reach out to share your analysis & recommendations. No spam, marketing emails or third party affiliations.</p>

          <div className="w-full max-w-lg mx-auto">
            <iframe
              data-tally-src="https://tally.so/embed/81zdGl?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
              loading="lazy"
              width="100%"
              height="234"
              frameBorder="0"
              marginHeight={0}
              marginWidth={0}
              title="Lila Analysis"
              className="w-full"
            ></iframe>
            <Script
              id="tally-js"
              src="https://tally.so/widgets/embed.js"
              onLoad={() => {
                // @ts-expect-error Tally is injected script
                if (typeof Tally !== 'undefined') {
                  // @ts-expect-error Tally is injected script
                  Tally.loadEmbeds();
                }
              }}
            />
          </div>

          <p className="mt-8 text-xs text-[#475569] uppercase tracking-widest font-medium">No Spam • Unsubscribe Anytime</p>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="bg-[#F0F4F8] border-t border-[#EBE9E4] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Image src="/lila_logo.png" alt="Lila Logo" width={180} height={60} className="w-32 md:w-36 h-auto opacity-80" />
          </div>
          <div className="text-[#334155] text-sm">
            &copy; 2026 Lila AI Technologies.
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-[#334155] hover:text-[#B57B66]"><Instagram className="w-5 h-5" /></a>
            <a href="#" className="text-[#334155] hover:text-[#B57B66]"><Twitter className="w-5 h-5" /></a>
          </div>
        </div>
      </footer>
    </div >
  );
}
