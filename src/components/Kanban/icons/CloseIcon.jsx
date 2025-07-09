import React from 'react';
const CloseIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="6" y1="6" x2="14" y2="14" stroke="#d32f2f" strokeWidth="2.2" strokeLinecap="round"/>
    <line x1="14" y1="6" x2="6" y2="14" stroke="#d32f2f" strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
);
export default CloseIcon; 