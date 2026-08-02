import React, { useRef, useEffect, useState } from 'react';

export default function HoloCard({ children, className = '' }) {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 }); // percentages

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      // Calculate mouse position as percentage (0 to 100) inside the card
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePos({ x, y });
    };

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => {
      setIsHovered(false);
      // Reset to center
      setMousePos({ x: 50, y: 50 });
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Calculate tilt limits (reduced for a much smoother, subtle effect, max ~4 degrees)
  const tiltX = (50 - mousePos.y) * 0.08;
  const tiltY = (mousePos.x - 50) * 0.08;

  // The glare follows the mouse to create a holographic reflection
  const glareStyle = {
    background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255,255,255,0.08), transparent 50%)`,
    opacity: isHovered ? 1 : 0,
    transition: isHovered ? 'none' : 'opacity 0.6s ease',
  };

  const cardStyle = {
    transform: isHovered 
      ? `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.01, 1.01, 1.01)` 
      : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
    transition: isHovered ? 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)' : 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
    transformStyle: 'preserve-3d',
    position: 'relative',
    overflow: 'hidden',
    willChange: 'transform',
  };

  return (
    <div ref={cardRef} className={`holo-card ${className}`} style={cardStyle}>
      <div className="holo-glare" style={glareStyle} />
      <div className="holo-content" style={{ position: 'relative', zIndex: 1, transform: isHovered ? 'translateZ(20px)' : 'translateZ(0)', transition: 'transform 0.3s' }}>
        {children}
      </div>
    </div>
  );
}
