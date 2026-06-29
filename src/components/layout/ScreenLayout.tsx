import React from 'react';

interface ScreenLayoutProps {
  children: React.ReactNode;
  centered?: boolean;
}

export function ScreenLayout({ children, centered = false }: ScreenLayoutProps) {
  return (
    <div
      style={{
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        ...(centered
          ? {
              alignItems: 'safe center',
              justifyContent: 'safe center',
            }
          : {}),
      }}
    >
      {children}
    </div>
  );
}
