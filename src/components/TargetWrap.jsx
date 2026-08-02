import React from 'react';
import { playSound } from '../utils/audio';

export default function TargetWrap({
  children,
  className = '',
  as: Tag = 'div',
  onMouseEnter,
  ...props
}) {
  const handleMouseEnter = (e) => {
    playSound('hover');
    onMouseEnter?.(e);
  };

  return (
    <Tag
      className={`target-wrap ${className}`}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      <span className="target-bracket target-bracket-tl" aria-hidden />
      <span className="target-bracket target-bracket-tr" aria-hidden />
      <span className="target-bracket target-bracket-bl" aria-hidden />
      <span className="target-bracket target-bracket-br" aria-hidden />
      {children}
    </Tag>
  );
}
