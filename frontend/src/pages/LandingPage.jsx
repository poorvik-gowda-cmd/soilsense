import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const dynamicWords = ['Soil', 'Nutrients', 'Crops', 'Yield', 'Intelligence'];

export default function LandingPage() {
  const navigate = useNavigate();
  const mainRef = useRef(null);

  const [currentWord, setCurrentWord] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  // Typing effect
  useEffect(() => {
    const ticker = setTimeout(() => {
      handleTyping();
    }, typingSpeed);
    return () => clearTimeout(ticker);
  }, [currentWord, isDeleting]);

  const handleTyping = () => {
    const i = loopNum % dynamicWords.length;
    const fullText = dynamicWords[i];

    if (isDeleting) {
      setCurrentWord(fullText.substring(0, currentWord.length - 1));
      setTypingSpeed(80);
    } else {
      setCurrentWord(fullText.substring(0, currentWord.length + 1));
      setTypingSpeed(150);
    }

    if (!isDeleting && currentWord === fullText) {
      setTimeout(() => setIsDeleting(true), 1800);
    } else if (isDeleting && currentWord === '') {
      setIsDeleting(false);
      setLoopNum(loopNum + 1);
      setTypingSpeed(150);
    }
  };

  // GSAP Animations + Snap Scroll
  useEffect(() => {
    // Lock body scroll behavior for snap feel
    document.documentElement.style.scrollBehavior = 'auto';

    const ctx = gsap.context(() => {
      // ── Snap scrolling between slides ──
      const sections = gsap.utils.toArray('.landing-slide');
      ScrollTrigger.create({
        snap: {
          snapTo: 1 / (sections.length - 1),
          duration: { min: 0.3, max: 0.8 },
          delay: 0.05,
          ease: 'power2.inOut',
        },
      });

      // Hero text entrance
      gsap.fromTo('.hero-text',
        { opacity: 0, y: 60 },
        { opacity: 1, y: 0, duration: 1.4, ease: 'power4.out', delay: 0.3 }
      );

      gsap.fromTo('.hero-sub',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', delay: 0.8 }
      );

      // Slide 2 card
      gsap.fromTo('.slide2-card',
        { x: -120, opacity: 0, filter: 'blur(8px)' },
        {
          scrollTrigger: { trigger: '#slide2', start: 'top 55%', toggleActions: 'play none none reverse' },
          x: 0, opacity: 1, filter: 'blur(0px)', duration: 1.2, ease: 'power3.out'
        }
      );

      // Slide 3 card
      gsap.fromTo('.slide3-card',
        { x: 120, opacity: 0, filter: 'blur(8px)' },
        {
          scrollTrigger: { trigger: '#slide3', start: 'top 55%', toggleActions: 'play none none reverse' },
          x: 0, opacity: 1, filter: 'blur(0px)', duration: 1.2, ease: 'power3.out'
        }
      );

      // Slide 4 CTA
      gsap.fromTo('.cta-btn',
        { opacity: 0, scale: 0.8 },
        {
          scrollTrigger: { trigger: '#slide4', start: 'top 60%', toggleActions: 'play none none reverse' },
          opacity: 1, scale: 1, duration: 1, ease: 'back.out(1.4)'
        }
      );

      // Parallax backgrounds
      const parallaxBgs = gsap.utils.toArray('.parallax-bg');
      parallaxBgs.forEach((bg) => {
        gsap.to(bg, {
          yPercent: 20,
          ease: 'none',
          scrollTrigger: {
            trigger: bg.closest('section'),
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        });
      });

    }, mainRef);

    return () => {
      ctx.revert();
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  return (
    <div ref={mainRef} style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}>

      {/* ═══════════════ SLIDE 1: VIDEO HERO ═══════════════ */}
      <section id="slide1" className="landing-slide" style={{
        position: 'relative',
        height: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#000'
      }}>
        {/* Full-screen video */}
        <video
          src="/animations/videocropbg.mp4"
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
          }}
        />
        {/* Subtle dark overlay for text readability */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 1,
        }} />

        {/* Text only – no card, no glass */}
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 1.5rem' }}>
          <h1 className="hero-text" style={{
            fontSize: 'clamp(2.5rem, 7vw, 5rem)',
            fontWeight: 800,
            color: '#fff',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            margin: 0,
          }}>
            We analyze...
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #4ade80, #a3e635)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {currentWord}
            </span>
            <span style={{ color: '#4ade80', animation: 'blink 1s step-end infinite' }}>|</span>
          </h1>
          <p className="hero-sub" style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.35rem)',
            color: 'rgba(255,255,255,0.7)',
            marginTop: '1.5rem',
            fontWeight: 400,
            maxWidth: '520px',
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: 1.6,
          }}>
            Unlock the full potential of your land with AI-driven insights.
          </p>
        </div>
      </section>

      {/* ═══════════════ SLIDE 2: LEFT CARD ═══════════════ */}
      <section id="slide2" className="landing-slide" style={{
        position: 'relative',
        height: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
      }}>
        {/* Background image – full cover */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <img
            src="/images/soil_close_up.png"
            alt=""
            className="parallax-bg"
            style={{
              width: '100%',
              height: '120%',
              objectFit: 'cover',
              position: 'absolute',
              top: '-10%',
              left: 0,
            }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(0,0,0,0.75), rgba(0,0,0,0.45))',
          }} />
        </div>

        {/* Card */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
        }}>
          <div className="slide2-card" style={{
            maxWidth: '560px',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '1.25rem',
            padding: 'clamp(2rem, 4vw, 3.5rem)',
          }}>
            <p style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#4ade80',
              marginBottom: '1rem',
            }}>
              — Soil Analysis
            </p>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 700,
              color: '#fff',
              lineHeight: 1.15,
              marginBottom: '1.25rem',
            }}>
              Soil Intelligence
            </h2>
            <p style={{
              fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)',
              color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.7,
            }}>
              Analyze soil parameters like N, P, K, and pH to understand soil health and make precise agricultural decisions.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════ SLIDE 3: RIGHT CARD ═══════════════ */}
      <section id="slide3" className="landing-slide" style={{
        position: 'relative',
        height: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
      }}>
        {/* Background image – full cover */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <img
            src="/images/drone_view.png"
            alt=""
            className="parallax-bg"
            style={{
              width: '100%',
              height: '120%',
              objectFit: 'cover',
              position: 'absolute',
              top: '-10%',
              left: 0,
            }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(225deg, rgba(0,0,0,0.75), rgba(0,0,0,0.45))',
          }} />
        </div>

        {/* Card – right-aligned */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <div className="slide3-card" style={{
            maxWidth: '560px',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '1.25rem',
            padding: 'clamp(2rem, 4vw, 3.5rem)',
          }}>
            <p style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#a3e635',
              marginBottom: '1rem',
            }}>
              — AI Powered
            </p>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 700,
              color: '#fff',
              lineHeight: 1.15,
              marginBottom: '1.25rem',
            }}>
              Smart Recommendations
            </h2>
            <p style={{
              fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)',
              color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.7,
            }}>
              Get AI-powered fertilizer suggestions, crop predictions, and yield insights based on real-time soil and environmental data.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════ SLIDE 4: CTA ═══════════════ */}
      <section id="slide4" className="landing-slide" style={{
        position: 'relative',
        height: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#000',
      }}>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(74,222,128,0.12) 0%, transparent 60%)',
        }} />

        {/* Button only */}
        <button
          className="cta-btn"
          onClick={() => navigate('/auth')}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)';
            e.currentTarget.style.boxShadow = '0 0 60px rgba(74,222,128,0.5), 0 0 120px rgba(74,222,128,0.2)';
            e.currentTarget.style.borderColor = '#4ade80';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(74,222,128,0.2)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
          }}
          style={{
            position: 'relative',
            zIndex: 2,
            padding: '1.25rem 4rem',
            fontSize: '1.25rem',
            fontWeight: 700,
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#fff',
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '999px',
            cursor: 'pointer',
            transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            boxShadow: '0 0 30px rgba(74,222,128,0.2)',
            outline: 'none',
          }}
        >
          Get Started
        </button>
      </section>

      {/* Keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}} />
    </div>
  );
}
