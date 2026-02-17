import { useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/appStore';

export function useTerminalLog() {
    const { logEntries, addLog, clearLogs } = useAppStore();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new entries
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logEntries.length]);

    const log = useCallback(
        (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
            addLog(message, type);
        },
        [addLog]
    );

    return { logEntries, log, clearLogs, scrollRef };
}
