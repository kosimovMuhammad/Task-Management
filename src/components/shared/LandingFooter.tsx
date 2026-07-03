import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sun, Moon, Activity } from 'lucide-react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { toggleTheme } from '@/features/ui/uiSlice';
import { Logo } from '@/components/shared/Logo';

const GithubIcon = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.03c3.15-.38 6.5-1.4 6.5-7.17a5.5 5.5 0 0 0-1.5-3.83 5.3 5.3 0 0 0-.15-3.8s-1.2-.38-3.9 1.45a13.3 13.3 0 0 0-7 0c-2.7-1.83-3.9-1.45-3.9-1.45a5.3 5.3 0 0 0-.15 3.8 5.5 5.5 0 0 0-1.5 3.83c0 5.75 3.35 6.77 6.5 7.15a4.8 4.8 0 0 0-1 3.03V22"></path><path d="M9 20c-5 1.5-5-2.5-7-3"></path></svg>
);

const TwitterIcon = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
);

const LinkedinIcon = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
);

export const LandingFooter = () => {
  const [time, setTime] = useState(new Date());
  
  // Use global theme state to keep the whole app in sync
  const theme = useAppSelector((state) => state.ui.theme);
  const dispatch = useAppDispatch();
  const isDark = theme === 'dark';

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <footer className={`w-full py-16 px-6 md:px-8 border-t transition-colors duration-300 relative z-10 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
      
      <div className="max-w-7xl mx-auto text-slate-600 dark:text-slate-400">
        
        {/* Top Section */}
        <div className="flex flex-col lg:flex-row gap-12 justify-between">
          
          <div className="max-w-xs">
            <div className="flex items-center gap-3 mb-4">
              <Logo size={32} />
            </div>
            <p className="text-sm mb-8">
              Designed for the future of work. Built for innovators.
            </p>
            
            {/* Unusual elements */}
            <div className="flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 text-xs font-medium py-1.5 px-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full w-fit border border-blue-500/20">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                All systems operational
              </div>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <Activity size={14} />
                {time.toLocaleTimeString('en-US', { hour12: false })} — Online
              </div>
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-1 lg:max-w-4xl">
            <div className="flex flex-col">
              <h4 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">Product</h4>
              <Link to="/" className="block text-sm mb-3 transition-all duration-200 hover:text-blue-500 hover:translate-x-1">Features</Link>
              <Link to="/" className="block text-sm mb-3 transition-all duration-200 hover:text-blue-500 hover:translate-x-1">Integrations</Link>
              <Link to="/" className="block text-sm mb-3 transition-all duration-200 hover:text-blue-500 hover:translate-x-1">Pricing</Link>
              <Link to="/" className="block text-sm mb-3 transition-all duration-200 hover:text-blue-500 hover:translate-x-1">Changelog</Link>
            </div>
            
            <div className="flex flex-col">
              <h4 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">Resources</h4>
              <Link to="/" className="block text-sm mb-3 transition-all duration-200 hover:text-blue-500 hover:translate-x-1">Documentation</Link>
              <Link to="/" className="block text-sm mb-3 transition-all duration-200 hover:text-blue-500 hover:translate-x-1">API Reference</Link>
              <Link to="/" className="block text-sm mb-3 transition-all duration-200 hover:text-blue-500 hover:translate-x-1">Community</Link>
            </div>
            
            <div className="flex flex-col">
              <h4 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">Company</h4>
              <Link to="/" className="block text-sm mb-3 transition-all duration-200 hover:text-blue-500 hover:translate-x-1">About</Link>
              <Link to="/" className="block text-sm mb-3 transition-all duration-200 hover:text-blue-500 hover:translate-x-1">Careers</Link>
              <Link to="/" className="block text-sm mb-3 transition-all duration-200 hover:text-blue-500 hover:translate-x-1">Contact</Link>
            </div>

            {/* Newsletter */}
            <div className="flex flex-col col-span-2 md:col-span-1">
              <h4 className="text-base font-semibold mb-2 text-slate-900 dark:text-slate-100">Stay Updated</h4>
              <p className="text-sm mb-4">Subscribe to our newsletter for the latest updates.</p>
              <form className="relative flex w-full" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="email" 
                  placeholder="hello@company.com" 
                  required 
                  className="w-full py-2.5 pl-4 pr-10 rounded-lg border outline-none transition-colors duration-200 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 focus:border-blue-500 dark:focus:border-blue-500 text-slate-900 dark:text-white"
                />
                <button 
                  type="submit" 
                  aria-label="Subscribe"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
                >
                  <ArrowRight size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Separator */}
        <hr className="border-0 h-px bg-slate-200 dark:bg-white/10 my-12" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm">&copy; {new Date().getFullYear()} Nexora Inc. All rights reserved.</p>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={() => dispatch(toggleTheme())}
              aria-label="Toggle Theme"
              className="text-slate-500 hover:text-blue-500 transition-colors"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            <div className="flex gap-5">
              <a href="#" aria-label="Twitter" className="text-slate-500 hover:text-blue-500 transition-colors"><TwitterIcon size={20} /></a>
              <a href="#" aria-label="Github" className="text-slate-500 hover:text-blue-500 transition-colors"><GithubIcon size={20} /></a>
              <a href="#" aria-label="Linkedin" className="text-slate-500 hover:text-blue-500 transition-colors"><LinkedinIcon size={20} /></a>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};
