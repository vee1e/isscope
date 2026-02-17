import React, { useState, useCallback, useRef, useEffect } from 'react';

interface SplitPaneProps {
    left: React.ReactNode;
    right: React.ReactNode;
    defaultSplit?: number; // percentage for left pane
    minLeft?: number;
    minRight?: number;
}

export function SplitPane({
    left,
    right,
    defaultSplit = 40,
    minLeft = 250,
    minRight = 300,
}: SplitPaneProps) {
    const [splitPercent, setSplitPercent] = useState(defaultSplit);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging.current || !containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percent = (x / rect.width) * 100;

            const minLeftPercent = (minLeft / rect.width) * 100;
            const maxLeftPercent = 100 - (minRight / rect.width) * 100;

            setSplitPercent(Math.max(minLeftPercent, Math.min(maxLeftPercent, percent)));
        };

        const handleMouseUp = () => {
            isDragging.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [minLeft, minRight]);

    return (
        <div
            ref={containerRef}
            style={{
                display: 'flex',
                height: '100%',
                overflow: 'hidden',
            }}
        >
            {/* Left pane */}
            <div
                style={{
                    width: `${splitPercent}%`,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {left}
            </div>

            {/* Divider */}
            <div
                onMouseDown={handleMouseDown}
                style={{
                    width: '1px',
                    background: 'var(--border)',
                    cursor: 'col-resize',
                    position: 'relative',
                    flexShrink: 0,
                }}
            >
                {/* Wider hit target */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: '-3px',
                        width: '7px',
                        cursor: 'col-resize',
                    }}
                />
            </div>

            {/* Right pane */}
            <div
                style={{
                    flex: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {right}
            </div>
        </div>
    );
}
