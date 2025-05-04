import React from 'react';
import Image from 'next/image';
import { ThemeToggleButton } from './ui/themeToggleButton';

const Header: React.FC = () => {
  return (
    <header className="flex items-center border-b border-border bg-[hsl(var(--header-background))] py-2 px-5 transition-colors">
      <div className="flex w-[var(--content-max-width-xl)] items-center justify-between mx-auto">
        <div className="flex items-center">
          <Image
            src="/inventra-logo.png"
            alt="Inventra Logo"
            width={40}
            height={40}
            priority
            style={{ height: 'auto', width: 'auto' }}
          />
          <h1 className="ml-2 text-lg font-bold text-[hsl(28_95%_53%)] dark:text-[hsl(28_95%_53%)]">
            Inventra
          </h1>
        </div>
        <ThemeToggleButton />
      </div>
    </header>
  );
};

export default Header;
