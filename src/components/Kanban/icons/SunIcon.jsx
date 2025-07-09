import React from 'react';
const SunIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="4" fill="#FFD600"/>
    <g stroke="#FFD600" strokeWidth="1.5">
      <line x1="10" y1="1.5" x2="10" y2="4"/>
      <line x1="10" y1="16" x2="10" y2="18.5"/>
      <line x1="1.5" y1="10" x2="4" y2="10"/>
      <line x1="16" y1="10" x2="18.5" y2="10"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="14.36" y1="14.36" x2="15.78" y2="15.78"/>
      <line x1="4.22" y1="15.78" x2="5.64" y2="14.36"/>
      <line x1="14.36" y1="5.64" x2="15.78" y2="4.22"/>
    </g>
  </svg>
);
export default SunIcon; 