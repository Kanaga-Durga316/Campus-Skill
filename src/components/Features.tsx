import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Features Section Component
 * Enhanced with How It Works, Features, and CTA sections
 */

// Feature data structure
interface Feature {
  icon: string;
  title: string;
  description: string;
  gradient: string;
}

// How It Works step structure
interface HowItWorksStep {
  step: number;
  icon: string;
  title: string;
  description: string;
}

const Features: React.FC = () => {
  // How It Works data
  const howItWorksSteps: HowItWorksStep[] = [
    {
      step: 1,
      icon: '📝',
      title: 'Create Your Profile',
      description: 'Sign up and list the skills you can teach and want to learn'
    },
    {
      step: 2,
      icon: '🔍',
      title: 'Discover Skills',
      description: 'Browse available skills from students across your campus'
    },
    {
      step: 3,
      icon: '🤝',
      title: 'Connect & Learn',
      description: 'Send exchange requests and start learning from your peers'
    },
    {
      step: 4,
      icon: '🎯',
      title: 'Grow Together',
      description: 'Build skills, make friends, and enhance your campus experience'
    }
  ];

  // Features data
  const features: Feature[] = [
    {
      icon: '🎓',
      title: 'Share Your Expertise',
      description: 'Teach what you know and help fellow students grow while building your teaching skills.',
      gradient: 'from-indigo-500 to-purple-600'
    },
    {
      icon: '📚',
      title: 'Learn Anything',
      description: 'From programming to photography, discover skills taught by students who understand your journey.',
      gradient: 'from-emerald-500 to-teal-600'
    },
    {
      icon: '🤝',
      title: 'Build Connections',
      description: 'Network with peers, collaborate on projects, and form study groups within your campus.',
      gradient: 'from-amber-500 to-orange-600'
    },
    {
      icon: '⭐',
      title: 'Earn Recognition',
      description: 'Build your reputation through ratings and reviews from the student community.',
      gradient: 'from-pink-500 to-rose-600'
    },
    {
      icon: '💰',
      title: 'Free for Students',
      description: 'No fees or subscriptions. All skill exchanges are completely free for campus students.',
      gradient: 'from-blue-500 to-cyan-600'
    },
    {
      icon: '🔒',
      title: 'Safe & Secure',
      description: 'Verified campus emails and community guidelines ensure a safe learning environment.',
      gradient: 'from-violet-500 to-purple-600'
    }
  ];

  return (
    <div id="features" className="bg-gray-50">
      {/* ========================================
          HOW IT WORKS SECTION
          ======================================== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-indigo-100 text-indigo-600 text-sm font-semibold rounded-full mb-4">
              Getting Started
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Getting started with Campus Skill Exchange is easy. 
              Follow these simple steps to begin your learning journey.
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorksSteps.map((step) => (
              <HowItWorksCard key={step.step} step={step} />
            ))}
          </div>

          {/* Connector Line (Desktop only) */}
          <div className="hidden lg:block relative mt-8">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 -translate-y-1/2"></div>
          </div>
        </div>
      </section>

      {/* ========================================
          FEATURES SECTION
          ======================================== */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-purple-100 text-purple-600 text-sm font-semibold rounded-full mb-4">
              Why Join Us
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our platform provides all the tools you need to share knowledge 
              and learn new skills within your campus community.
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={index} feature={feature} />
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          CALL TO ACTION SECTION
          ======================================== */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-white rounded-full filter blur-3xl"></div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-white/30 rounded-full"></div>
        <div className="absolute top-1/3 right-1/3 w-6 h-6 bg-white/20 rounded-full"></div>
        <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-white/40 rounded-full"></div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Join hundreds of students already sharing knowledge and learning new skills. 
            It takes less than a minute to create your free account!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/register"
              className="px-8 py-4 bg-white text-indigo-600 font-bold rounded-xl hover:bg-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-white/20 text-lg"
            >
              🚀 Join Now - It's Free
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 text-lg"
            >
              Sign In
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-white/80">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">✓</span>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">✓</span>
              <span>Campus email verification</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">✓</span>
              <span>100% free for students</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          STATS SECTION
          ======================================== */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <StatCard number="500+" label="Active Students" />
            <StatCard number="100+" label="Skills Available" />
            <StatCard number="1000+" label="Skill Exchanges" />
            <StatCard number="50+" label="Campus Partners" />
          </div>
        </div>
      </section>
    </div>
  );
};

/**
 * HowItWorksCard Component
 * Displays individual step in how it works
 */
const HowItWorksCard: React.FC<{ step: HowItWorksStep }> = ({ step }) => (
  <div className="relative bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 group">
    {/* Step Number */}
    <div className="absolute -top-3 left-6 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
      {step.step}
    </div>

    {/* Icon */}
    <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
      {step.icon}
    </div>

    {/* Title */}
    <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>

    {/* Description */}
    <p className="text-gray-600 text-sm">{step.description}</p>
  </div>
);

/**
 * FeatureCard Component
 * Displays individual feature with gradient icon
 */
const FeatureCard: React.FC<{ feature: Feature }> = ({ feature }) => (
  <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-300 group">
    {/* Icon with Gradient */}
    <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center text-3xl shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
      {feature.icon}
    </div>

    {/* Title */}
    <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>

    {/* Description */}
    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
  </div>
);

/**
 * StatCard Component
 * Displays statistics for the platform
 */
const StatCard: React.FC<{ number: string; label: string }> = ({ number, label }) => (
  <div className="text-center">
    <div className="text-3xl md:text-4xl font-bold text-white mb-2">{number}</div>
    <div className="text-gray-400 text-sm">{label}</div>
  </div>
);

export default Features;
