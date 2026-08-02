import React from 'react';

export default function RedactedText({ children, active, delay = 0, className = '' }) {
  return (
    <span
      className={`redacted-text ${active ? 'revealed' : ''} ${className}`}
      style={{ '--reveal-delay': `${delay}ms` }}
    >
      <span className="redacted-text-inner">{children}</span>
    </span>
  );
}
