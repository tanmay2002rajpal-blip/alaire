'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface OrderDetailClientProps {
  children: React.ReactNode;
}

export default function OrderDetailClient({ children }: OrderDetailClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const cards = containerRef.current.querySelectorAll('.order-card');

    // Initial state
    gsap.set(cards, {
      opacity: 0,
      y: 30,
    });

    // Animate cards in sequence
    gsap.to(cards, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power3.out',
    });
  }, []);

  return (
    <div ref={containerRef} className="container mx-auto p-6">
      {children}
    </div>
  );
}
