"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface AppleSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | number;
    className?: string;
    color?: string;
}

/**
 * A reusable Apple-style (iOS/macOS) spinner component.
 * Mimics the classic "blades" loading indicator with smooth opacity-fade animations.
 */
export const AppleSpinner = ({ size = 'md', className, color = 'currentColor' }: AppleSpinnerProps) => {
    const sizeMap = {
        sm: 16,
        md: 24,
        lg: 36,
    };

    const finalSize = typeof size === 'number' ? size : sizeMap[size];

    return (
        <div
            className={cn("relative flex items-center justify-center", className)}
            style={{
                width: finalSize,
                height: finalSize,
                color: color
            }}
            role="status"
            aria-label="Loading"
        >
            {[...Array(12)].map((_, i) => (
                <div
                    key={i}
                    className="absolute rounded-full animate-apple-spinner"
                    style={{
                        width: '8%',
                        height: '28%',
                        backgroundColor: 'currentColor',
                        left: '50%',
                        top: '50%',
                        transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-120%)`,
                        animationDelay: `${-1.2 + i * 0.1}s`,
                        opacity: 0.1,
                    }}
                />
            ))}
            <style jsx global>{`
        @keyframes apple-spinner {
          0% { opacity: 1; }
          100% { opacity: 0.1; }
        }
        .animate-apple-spinner {
          animation: apple-spinner 1.2s linear infinite;
        }
      `}</style>
        </div>
    );
};
