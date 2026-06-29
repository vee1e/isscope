import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { InputScreen } from './InputScreen';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAppStore } from '../store/appStore';
import React from 'react';
import { historyService } from '../lib/history/historyService';
import { testLocalConnection } from '../lib/api/local';

vi.mock('../hooks/useTheme', () => ({
  useTheme: () => ({
    theme: 'dark',
    toggleTheme: vi.fn(),
  }),
}));

vi.mock('../lib/history/historyService', () => ({
  historyService: {
    getHistoryEntry: vi.fn(),
    getAllHistory: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../lib/api/local', async () => {
  const actual = await vi.importActual<typeof import('../lib/api/local')>('../lib/api/local');
  return {
    ...actual,
    testLocalConnection: vi.fn(),
  };
});

describe('InputScreen', () => {
  beforeEach(() => {
    useAppStore.getState().reset();
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders input screen and allows typing', () => {
    render(<InputScreen />);

    const input = screen.getByPlaceholderText('owner/repo [Cmd+K]');
    expect(input).toBeInTheDocument();

    act(() => {
      fireEvent.change(input, { target: { value: 'facebook/react' } });
    });

    expect(input).toHaveValue('facebook/react');
  });

  it('validates repository format before submission', () => {
    render(<InputScreen />);

    const input = screen.getByPlaceholderText('owner/repo [Cmd+K]');
    const submitBtn = screen.getByRole('button', { name: /Start Analysis/i });

    expect(submitBtn).toBeDisabled();

    act(() => {
      fireEvent.change(input, { target: { value: 'invalid-repo' } });
    });

    expect(submitBtn).toBeDisabled();

    act(() => {
      fireEvent.change(input, { target: { value: 'valid/repo' } });
    });

    expect(submitBtn).not.toBeDisabled();
  });

  it('submits valid repository and changes screen', () => {
    render(<InputScreen />);

    const input = screen.getByPlaceholderText('owner/repo [Cmd+K]');
    const submitBtn = screen.getByRole('button', { name: /Start Analysis/i });

    act(() => {
      fireEvent.change(input, { target: { value: 'valid/repo' } });
    });

    act(() => {
      fireEvent.click(submitBtn);
    });

    expect(useAppStore.getState().currentScreen).toBe('fetching');
    expect(useAppStore.getState().repoInput).toBe('valid/repo');
  });

  it('toggles API configuration panel', () => {
    render(<InputScreen />);

    const configBtn = screen.getByRole('button', { name: /Configure API Keys/i });

    act(() => {
      fireEvent.click(configBtn);
    });

    expect(screen.getByText('Hide API Configuration')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ghp_...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('sk-or-...')).toBeInTheDocument();
  });

  it('navigates to history screen', () => {
    render(<InputScreen />);

    const historyBtn = screen.getByRole('button', { name: /View History/i });
    act(() => {
      fireEvent.click(historyBtn);
    });

    expect(useAppStore.getState().currentScreen).toBe('history');
  });

  it('loads recent history correctly', async () => {
    const mockHistory = [
      {
        key: 'test/recent',
        fetchedAt: Date.now(),
        metadata: { issueCount: 5 },
      },
    ];

    vi.mocked(historyService.getAllHistory).mockResolvedValue(mockHistory as any);
    useAppStore.setState({
      history: mockHistory as any,
      loadHistory: vi.fn(),
    });

    render(<InputScreen />);

    const recentItem = screen.getByRole('button', { name: /test\/recent/i });
    expect(recentItem).toBeInTheDocument();

    // Setup history load mock
    const historyMock = vi.mocked(historyService.getHistoryEntry).mockResolvedValue({
      valid: true,
      data: { issues: [{ id: 1 }], analyses: [] },
    } as any);

    act(() => {
      fireEvent.click(recentItem);
    });

    await waitFor(() => {
      expect(historyMock).toHaveBeenCalledWith('test', 'recent');
      expect(useAppStore.getState().currentScreen).toBe('report');
    });
  });

  describe('Local provider UI', () => {
    function openConfigAndSelectLocal() {
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /Configure API Keys/i }));
      });
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /Local \(Ollama \/ LMStudio\)/i }));
      });
    }

    it('hides the local fields until the provider is set to Local', () => {
      render(<InputScreen />);
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /Configure API Keys/i }));
      });

      expect(screen.queryByText('Local Endpoint')).not.toBeInTheDocument();
      expect(screen.queryByText('Local Model Name')).not.toBeInTheDocument();
    });

    it('renders the local fields and a Test button once Local is selected', () => {
      render(<InputScreen />);
      openConfigAndSelectLocal();

      expect(screen.getByText('Local Endpoint')).toBeInTheDocument();
      expect(screen.getByText('Local Model Name')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Test$/ })).toBeInTheDocument();
      // The hint should make the /v1 path obvious — verify the suggested
      // endpoint <code> elements for both servers are present.
      expect(screen.getByText('http://localhost:11434/v1')).toBeInTheDocument();
      expect(screen.getByText('http://localhost:1234/v1')).toBeInTheDocument();
    });

    it('shows a success message with model names when the test connection succeeds', async () => {
      vi.mocked(testLocalConnection).mockResolvedValue({
        ok: true,
        models: ['llama3.2', 'qwen2.5-coder:7b'],
      });

      render(<InputScreen />);
      openConfigAndSelectLocal();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /^Test$/ }));
      });

      await waitFor(() => {
        expect(screen.getByText(/2 models available/)).toBeInTheDocument();
      });
      expect(screen.getByText(/llama3\.2/)).toBeInTheDocument();
      expect(screen.getByText(/qwen2\.5-coder:7b/)).toBeInTheDocument();
    });

    it('shows a CORS-aware error message when the test connection fails', async () => {
      vi.mocked(testLocalConnection).mockResolvedValue({
        ok: false,
        error:
          'Could not reach the local LLM server at http://127.0.0.1:1234/v1. ' +
          'In LMStudio, open the "Local Server" tab, click the ⚙ settings icon, and enable "CORS". ' +
          '(Original error: NetworkError when attempting to fetch resource.)',
      });

      render(<InputScreen />);
      openConfigAndSelectLocal();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /^Test$/ }));
      });

      await waitFor(() => {
        expect(screen.getByText(/Could not reach the local LLM server/)).toBeInTheDocument();
      });
      // The error message itself contains "LMStudio" and "CORS".
      const errorText = screen.getByText(/Could not reach the local LLM server/);
      expect(errorText.textContent).toMatch(/LMStudio/);
      expect(errorText.textContent).toMatch(/CORS/);
    });
  });
});
