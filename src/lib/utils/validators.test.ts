import { describe, it, expect } from 'vitest';
import { validateRepoInput, parseRepoInput } from './validators';

describe('validators utilities', () => {
  describe('validateRepoInput', () => {
    it('returns invalid for empty or whitespace-only inputs', () => {
      expect(validateRepoInput('')).toEqual({
        valid: false,
        error: 'Repository path is required',
      });
      expect(validateRepoInput('   ')).toEqual({
        valid: false,
        error: 'Repository path is required',
      });
    });

    it('returns invalid for non-matching formats', () => {
      expect(validateRepoInput('justowner')).toEqual({
        valid: false,
        error: 'Use format: owner/repo',
      });
      expect(validateRepoInput('owner/repo/extra')).toEqual({
        valid: false,
        error: 'Use format: owner/repo',
      });
    });

    it('returns valid for clean owner/repo paths', () => {
      expect(validateRepoInput('facebook/react')).toEqual({ valid: true });
      expect(validateRepoInput('sveltejs/svelte')).toEqual({ valid: true });
    });

    it('returns valid for full GitHub URLs', () => {
      expect(validateRepoInput('https://github.com/facebook/react')).toEqual({ valid: true });
      expect(validateRepoInput('http://github.com/sveltejs/svelte')).toEqual({ valid: true });
      expect(validateRepoInput('github.com/vuejs/core')).toEqual({ valid: true });
    });

    it('returns valid for full GitHub URLs with .git suffix', () => {
      expect(validateRepoInput('https://github.com/facebook/react.git')).toEqual({ valid: true });
    });

    it('handles whitespace trimming correctly', () => {
      expect(validateRepoInput('  facebook/react  ')).toEqual({ valid: true });
    });
  });

  describe('parseRepoInput', () => {
    it('parses standard owner/repo format', () => {
      expect(parseRepoInput('facebook/react')).toEqual({
        owner: 'facebook',
        repo: 'react',
      });
    });

    it('parses standard owner/repo format with trimming', () => {
      expect(parseRepoInput('  sveltejs/svelte  ')).toEqual({
        owner: 'sveltejs',
        repo: 'svelte',
      });
    });

    it('parses full GitHub URLs', () => {
      expect(parseRepoInput('https://github.com/vuejs/core')).toEqual({
        owner: 'vuejs',
        repo: 'core',
      });
      expect(parseRepoInput('github.com/facebook/react')).toEqual({
        owner: 'facebook',
        repo: 'react',
      });
    });

    it('parses full GitHub URLs with .git extension', () => {
      expect(parseRepoInput('https://github.com/facebook/react.git')).toEqual({
        owner: 'facebook',
        repo: 'react',
      });
    });
  });
});
