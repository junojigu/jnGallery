import React from 'react';

interface FooterProps {
  siteName?: string;
}

export const Footer: React.FC<FooterProps> = ({ siteName = 'Photo Moments' }) => {
  return (
    <footer className="bg-[#f9f9f9] border-t border-[#c4c7c7] font-sans text-xs w-full py-8 mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center px-4 md:px-10 max-w-[1280px] mx-auto gap-4">
        <div className="font-serif text-lg font-semibold text-[#000000] opacity-90">
          {siteName || 'Photo Moments'}
        </div>

        <div className="flex gap-6">
          <a href="#" onClick={(e) => e.preventDefault()} className="text-[#444748] hover:text-[#000000] transition-colors">
            Privacy Policy
          </a>
          <a href="#" onClick={(e) => e.preventDefault()} className="text-[#444748] hover:text-[#000000] transition-colors">
            Terms of Service
          </a>
          <a href="#" onClick={(e) => e.preventDefault()} className="text-[#444748] hover:text-[#000000] transition-colors">
            Contact
          </a>
        </div>

        <div className="text-[#5d5f5f]">
          © {new Date().getFullYear()} {siteName || 'Photo Moments'}. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
