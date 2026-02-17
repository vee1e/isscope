import React from 'react';

interface ScrollAreaProps {
    children: React.ReactNode;
    style?: React.CSSProperties;
    maxHeight?: string;
    innerRef?: React.RefObject<HTMLDivElement | null>;
}

export function ScrollArea({ children, style, maxHeight = '100%', innerRef }: ScrollAreaProps) {
    return (
        <div
            ref={innerRef}
            style={{
                overflowY: 'auto',
                overflowX: 'hidden',
                maxHeight,
                scrollBehavior: 'smooth',
                ...style,
            }}
        >
            {children}
        </div>
    );
}
