import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Login } from './Login';

const mockSignIn = vi.fn();
const mockSignUp = vi.fn();

vi.mock('../services/supabaseConfig', () => ({
  supabase: {
    supabaseUrl: 'https://real-project.supabase.co',
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignIn(...args),
      signUp: (...args: unknown[]) => mockSignUp(...args),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

describe('Login', () => {
  const onDemoLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders app title and Real Estate Tracker', () => {
    render(<Login onDemoLogin={onDemoLogin} />);
    expect(screen.getByRole('heading', { name: /RE Investor Pro/i })).toBeInTheDocument();
    expect(screen.getByText(/Real Estate Tracker/i)).toBeInTheDocument();
  });

  it('renders Log In and Sign Up tabs', () => {
    render(<Login onDemoLogin={onDemoLogin} />);
    const logInButtons = screen.getAllByRole('button', { name: /Log In/i });
    expect(logInButtons.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument();
  });

  it('renders email and password inputs', () => {
    render(<Login onDemoLogin={onDemoLogin} />);
    expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
  });

  it('renders Demo Mode button', () => {
    render(<Login onDemoLogin={onDemoLogin} />);
    expect(screen.getByRole('button', { name: /Try Demo Mode/i })).toBeInTheDocument();
  });

  it('calls onDemoLogin when Demo Mode is clicked', async () => {
    render(<Login onDemoLogin={onDemoLogin} />);
    fireEvent.click(screen.getByRole('button', { name: /Try Demo Mode/i }));
    expect(onDemoLogin).toHaveBeenCalledTimes(1);
  });

  it('shows Missing Fields error when submitting with empty email and password', async () => {
    render(<Login onDemoLogin={onDemoLogin} />);
    const logInButtons = screen.getAllByRole('button', { name: /Log In/i });
    fireEvent.click(logInButtons[logInButtons.length - 1]); // submit button
    expect(screen.getByText(/Missing Fields/i)).toBeInTheDocument();
    expect(screen.getByText(/Please enter both email and password/i)).toBeInTheDocument();
  });

  it('calls signInWithPassword when Log In with valid email and password', async () => {
    mockSignIn.mockResolvedValue({ error: null });
    render(<Login onDemoLogin={onDemoLogin} />);
    fireEvent.change(screen.getByPlaceholderText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'password123' } });
    const logInButtons = screen.getAllByRole('button', { name: /Log In/i });
    fireEvent.click(logInButtons[logInButtons.length - 1]); // submit button
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('switches to Sign Up tab and shows Create New Account', () => {
    render(<Login onDemoLogin={onDemoLogin} />);
    const signUpTabs = screen.getAllByRole('button', { name: /Sign Up/i });
    fireEvent.click(signUpTabs[0]); // tab, not submit
    expect(screen.getByText(/Create New Account/i)).toBeInTheDocument();
  });
});
