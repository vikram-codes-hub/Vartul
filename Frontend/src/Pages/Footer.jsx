import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const Footer = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  const footerLinks = [
    'VARTUL',
    'About',
    'Blog',
    'Jobs',
    'Help',
    'API',
    'Privacy',
    'Terms',
    'Locations',
    'Threads',
    'Vartul Articles',
    'Contact Uploading & Non-Users',
    'Vartul Verified'
  ];

  const languages = ['English', 'Español', 'Français', 'Deutsch', '中文', '日本語'];

  return (
    <div className="bg-black text-white   flex ml-50 flex-col">
      
    

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-10">
          
          {/* Footer Links */}
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3 mb-8">
            {footerLinks.map((link, index) => (
              <a
                key={index}
                href="#"
                className="text-gray-400 text-xs font-normal hover:text-white transition-colors duration-300 hover:underline underline-offset-2"
              >
                {link}
              </a>
            ))}
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 pt-6 border-t border-gray-900">
            
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                className="flex items-center gap-2 text-gray-400 text-xs hover:text-white transition-colors duration-300 focus:outline-none"
              >
                {selectedLanguage}
                <ChevronDown 
                  size={12} 
                  className={`transform transition-transform duration-200 ${
                    isLanguageOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              {/* Language Dropdown */}
              {isLanguageOpen && (
                <div className="absolute bottom-full left-0 mb-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg min-w-[120px] z-50">
                  {languages.map((language) => (
                    <button
                      key={language}
                      onClick={() => {
                        setSelectedLanguage(language);
                        setIsLanguageOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:text-white hover:bg-gray-800 first:rounded-t-lg last:rounded-b-lg transition-colors duration-200"
                    >
                      {language}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Copyright */}
            <div className="text-gray-500 text-xs">
              © 2025 VARTUL
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
