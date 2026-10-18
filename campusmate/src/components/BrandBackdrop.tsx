import React from 'react';
import logoIcon from '../assets/logo-icon.png';

export const BrandBackdrop: React.FC = () => {
  return (
    <div className="fixed-backdrop" aria-hidden="true">
      <div className="glow-orb glow-top-left" />
      <div className="glow-orb glow-bottom-right" />
      <div className="backdrop-aura" />
      <img src={logoIcon} alt="" className="backdrop-logo-mark" />
    </div>
  );
};
