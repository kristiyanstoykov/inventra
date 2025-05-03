import React from 'react';
import Image from 'next/image';
import { ThemeToggleButton } from './ui/themeToggleButton';

const Header: React.FC = () => {
  return (
    <header className="flex items-center py-2 px-5 bg-background border-b border-border transition-colors">
      <div className="flex items-center justify-between w-[var(--content-max-width-xl)] mx-auto">
        <div className="flex items-center">
          <Image
            src="/inventra-logo.png"
            alt="Inventra Logo"
            width={40}
            height={40}
            priority
            style={{ height: 'auto', width: 'auto' }}
          />
          <h1 className="ml-2 text-lg font-bold" style={{ color: '#E67B28' }}>
            Inventra
          </h1>
        </div>
        <ThemeToggleButton />
      </div>
    </header>
  );
};

export default Header;
