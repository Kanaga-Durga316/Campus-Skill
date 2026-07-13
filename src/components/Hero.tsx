import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Hero Section Component
 * A modern, eye-catching hero section using Tailwind CSS
 * 
 * Key Tailwind Concepts:
 * - min-h-screen: full viewport height
 * - flex items-center: center vertically
 * - justify-center: center horizontally
 * - bg-gradient-to-r: horizontal gradient
 * - from-indigo-600 to-purple-600: gradient colors
 */
const Hero: React.FC = () => {
  const scrollToFeatures = () => {
    const el = document.getElementById('features');
    if (el) {
      // account for fixed navbar height (~80px)
      const offset = 80;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 relative overflow-hidden pt-16">
      {/* Bubble background */}
      <div className="bubbles">
        {Array.from({ length: 14 }).map((_, i) => {
          const size = Math.floor(Math.random() * 80) + 20; // 20-100px
          const left = Math.floor(Math.random() * 100); // 0-100%
          const duration = (Math.random() * 18 + 8).toFixed(2); // 8-26s
          const delay = (Math.random() * -20).toFixed(2); // negative delays for staggered start
          const opacity = (Math.random() * 0.6 + 0.2).toFixed(2);
          return (
            <span
              key={i}
              className="bubble"
              style={{
                left: `${left}%`,
                width: `${size}px`,
                height: `${size}px`,
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
                opacity: opacity
              }}
            />
          );
        })}
      </div>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
      </div>

      {/* Animated Shapes */}
      <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-white/30 rounded-full animate-pulse"></div>
      <div className="absolute top-1/3 right-1/3 w-6 h-6 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-8">
          <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
          <span className="text-white/90 text-sm font-medium">500+ Students Already Joined</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
          Learn Skills from Your
          <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-orange-300">
            Campus Community
          </span>
        </h1>

        {/* Description */}
        <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed">
          Connect with fellow students to share knowledge, learn new skills, 
          and grow together. Whether you want to teach what you know or 
          learn something new, Skill Exchange makes it easy!
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/register"
            className="px-8 py-4 bg-white text-indigo-600 font-bold rounded-xl hover:bg-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-white/20 text-lg"
          >
            Get Started Free
          </Link>
          <Link
            to="/search"
            className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 text-lg"
          >
            Explore Skills
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
          <StatItem number="50+" label="Skills" />
          <StatItem number="200+" label="Students" />
          <StatItem number="100+" label="Exchanges" />
        </div>
      </div>

      {/* Scroll Indicator */}
      <button
        type="button"
        onClick={scrollToFeatures}
        aria-label="Scroll to features"
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>
    </section>
  );
};

/**
 * StatItem Component
 * Displays a single statistic
 */
const StatItem: React.FC<{ number: string; label: string }> = ({ number, label }) => (
  <div className="text-center">
    <div className="text-2xl sm:text-3xl font-bold text-white">{number}</div>
    <div className="text-white/70 text-sm">{label}</div>
  </div>
);

export default Hero;
