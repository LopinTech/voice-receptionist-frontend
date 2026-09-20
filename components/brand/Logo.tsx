import React from 'react';
import Image from 'next/image';

/**
 * The Ringgy AI lockup.
 *
 * The supplied `logo.png` sets "Ringgy" in near-white, so the artwork as a
 * whole only reads on a dark surface, and at 30px its wordmark turns mushy.
 * Both variants here therefore pair `logo-mark.png` — the blue app icon,
 * cropped out of that same file — with the wordmark set in the app's own
 * type, which stays crisp and lets the light and dark rails match. The mark
 * carries an empty alt because the wordmark beside it is real text.
 */

interface LogoProps {
  /** The surface behind it, not the colour of the logo itself. */
  tone?: 'light' | 'dark';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ tone = 'light', className = '' }) => (
  <span className={`flex items-center gap-2.5 ${className}`}>
    <Image
      src="/assets/images/logo-mark.png"
      alt=""
      width={432}
      height={418}
      priority
      className="h-[30px] w-[30px] rounded-[9px]"
    />
    <span
      className={`text-base font-extrabold tracking-[-0.2px] ${
        tone === 'dark' ? 'text-white' : 'text-[#0E1526]'
      }`}
    >
      Ringgy <span className="text-[#2F6BFF]">AI</span>
    </span>
  </span>
);
