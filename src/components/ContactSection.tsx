'use client';

import { useState } from 'react';
import { useReveal } from './useReveal';

const interests = [
  'Mining Partnership',
  'Exchange Listing',
  'Development Collaboration',
  'Integration / API',
  'Research',
  'Other',
];

export default function ContactSection() {
  const heading = useReveal();
  const form = useReveal();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    interest: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const subject = encodeURIComponent(
      `[Dilithium] ${formData.interest || 'Contact'} — ${formData.name}`
    );
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\nInterest: ${formData.interest}\n\n${formData.message}`
    );

    window.location.href = `mailto:dev@dilithiumcoin.com?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  return (
    <section id="contact" className="relative py-24 sm:py-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={heading.ref}
          className={`text-center mb-16 reveal ${heading.visible ? 'visible' : ''}`}
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-wider mb-4">
            Work <span className="text-gradient-crystal">With Us</span>
          </h2>
          <p className="text-space-600 max-w-2xl mx-auto">
            Interested in mining partnerships, exchange listings, integrations, or building on
            Dilithium? We&apos;d love to hear from you.
          </p>
        </div>

        <div
          ref={form.ref}
          className={`card-space p-8 sm:p-10 reveal ${form.visible ? 'visible' : ''}`}
        >
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-crystal-500/10 border border-crystal-500/30 flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-crystal-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="font-heading text-xl font-bold text-white mb-2 tracking-wide">
                Message Ready
              </h3>
              <p className="text-space-600 text-sm mb-6">
                Your email client should have opened with the message pre-filled. If it
                didn&apos;t, you can reach us directly at{' '}
                <a
                  href="mailto:dev@dilithiumcoin.com"
                  className="text-crystal-400 hover:text-crystal-300 transition-colors"
                >
                  dev@dilithiumcoin.com
                </a>
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', email: '', interest: '', message: '' });
                }}
                className="btn-secondary !py-2 !px-6 !text-xs"
              >
                Send Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-xs font-mono text-space-600 uppercase tracking-widest mb-2"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-lg bg-space-950 border border-space-700 text-white text-sm font-mono placeholder:text-space-700 focus:outline-none focus:border-crystal-500/50 focus:ring-1 focus:ring-crystal-500/20 transition-colors"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-mono text-space-600 uppercase tracking-widest mb-2"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-lg bg-space-950 border border-space-700 text-white text-sm font-mono placeholder:text-space-700 focus:outline-none focus:border-crystal-500/50 focus:ring-1 focus:ring-crystal-500/20 transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="interest"
                  className="block text-xs font-mono text-space-600 uppercase tracking-widest mb-2"
                >
                  I&apos;m interested in
                </label>
                <select
                  id="interest"
                  required
                  value={formData.interest}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, interest: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-lg bg-space-950 border border-space-700 text-white text-sm font-mono focus:outline-none focus:border-crystal-500/50 focus:ring-1 focus:ring-crystal-500/20 transition-colors appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238494a7' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                  }}
                >
                  <option value="" disabled>
                    Select an area
                  </option>
                  {interests.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-xs font-mono text-space-600 uppercase tracking-widest mb-2"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, message: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-lg bg-space-950 border border-space-700 text-white text-sm font-mono placeholder:text-space-700 focus:outline-none focus:border-crystal-500/50 focus:ring-1 focus:ring-crystal-500/20 transition-colors resize-none"
                  placeholder="Tell us about your project or how you'd like to collaborate..."
                />
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-space-700 text-xs font-mono">
                  Opens your email client with the message pre-filled
                </p>
                <button type="submit" className="btn-primary">
                  Send Message
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-space-600 text-sm">
            Or email us directly at{' '}
            <a
              href="mailto:dev@dilithiumcoin.com"
              className="text-crystal-400 hover:text-crystal-300 transition-colors font-mono"
            >
              dev@dilithiumcoin.com
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
