export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iP(hone|od|ad)/.test(navigator.platform);
}

export function modifierKey(): string {
  return isMac() ? '⌘' : 'Ctrl';
}

export function modifierLabel(): string {
  return isMac() ? 'Cmd' : 'Ctrl';
}
