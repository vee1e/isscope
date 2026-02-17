import { useCallback, useEffect, useState } from 'react';

export function useKeyboardNavigation(
    itemCount: number,
    onSelect: (index: number) => void
) {
    const [lastKeyPress, setLastKeyPress] = useState<{ key: string; time: number } | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (itemCount === 0) return;

            // Ignore if user is typing in an input
            // Ignore if user is typing in an input, UNLESS it's our nav trap
            const target = document.activeElement as HTMLElement;
            if (
                (target?.tagName === 'INPUT' ||
                    target?.tagName === 'TEXTAREA' ||
                    target?.isContentEditable) &&
                target?.getAttribute('data-nav-trap') !== 'true'
            ) {
                return;
            }

            // Vim "gg" logic
            if (e.key === 'g') {
                const now = Date.now();
                if (lastKeyPress && lastKeyPress.key === 'g' && now - lastKeyPress.time < 500) {
                    // Double 'g' detected -> Go to top
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    setSelectedIndex(0);
                    onSelect(0);
                    setLastKeyPress(null);
                    return;
                }
                setLastKeyPress({ key: 'g', time: now });
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return;
            }

            switch (e.key) {
                case 'ArrowDown':
                case 'j':
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    setSelectedIndex((prev) => {
                        const next = Math.min(prev + 1, itemCount - 1);
                        onSelect(next);
                        return next;
                    });
                    break;
                case 'ArrowUp':
                case 'k':
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    setSelectedIndex((prev) => {
                        const next = Math.max(prev - 1, 0);
                        onSelect(next);
                        return next;
                    });
                    break;
                case 'Enter':
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    onSelect(selectedIndex);
                    break;
                case 'Home':
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    setSelectedIndex(0);
                    onSelect(0);
                    break;
                case 'End':
                case 'G': // Vim "G" -> Go to bottom
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    setSelectedIndex(itemCount - 1);
                    onSelect(itemCount - 1);
                    break;
            }
        },
        [itemCount, onSelect, selectedIndex, lastKeyPress]
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown, { capture: true });
        return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
    }, [handleKeyDown]);

    return { selectedIndex, setSelectedIndex };
}
