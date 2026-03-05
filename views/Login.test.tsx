import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Login } from './Login';

const mockLogin = vi.fn();
const mockRegister = vi.fn();

vi.mock('../services/nodeAuthService', () => ({
  login: (...args: unknown[]) => mockLogin(...args),
  register: (...args: unknown[]) => mockRegister(...args),
}));

describe('Login', () => {
  const onDemoLogin = vi.fn();
  const onNodeLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders app title and Real Estate Tracker', () => {
    render(<Login onDemoLogin={onDemoLogin} onNodeLogin={onNodeLogin} />);
    expect(screen.getByRole('heading', { name: /RE Investor Pro/i })).toBeInTheDocument();
    expect(screen.getByText(/Real Estate Tracker/i)).toBeInTheDocument();
  });

  it('renders Log In and Sign Up tabs', () => {
    render(<Login onDemoLogin={onDemoLogin} onNodeLogin={onNodeLogin} />);
    const logInButtons = screen.getAllByRole('button', { name: /Log In/i });
    const signUpButtons = screen.getAllByRole('button', { name: /Sign Up/i });
    expect(logInButtons.length).toBeGreaterThanOrEqual(1);
    expect(signUpButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders email and password inputs', () => {
    render(<Login onDemoLogin={onDemoLogin} onNodeLogin={onNodeLogin} />);
    const emails = screen.getAllByPlaceholderText(/Email/i);
    const passwords = screen.getAllByPlaceholderText(/Password/i);
    expect(emails.length).toBeGreaterThanOrEqual(1);
    expect(passwords.length).toBeGreaterThanOrEqual(1);
  });

  it('renders Demo Mode button', () => {
    render(<Login onDemoLogin={onDemoLogin} onNodeLogin={onNodeLogin} />);
    const demoButtons = screen.getAllByRole('button', { name: /Try Demo Mode|Demo|Enter as Guest/i });
    expect(demoButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('calls onDemoLogin when Demo Mode is clicked', async () => {
    render(<Login onDemoLogin={onDemoLogin} onNodeLogin={onNodeLogin} />);
    const demoButtons = screen.getAllByRole('button', { name: /Try Demo Mode|Enter as Guest|Demo/i });
    fireEvent.click(demoButtons[0]);
    expect(onDemoLogin).toHaveBeenCalledTimes(1);
  });

  it('shows Missing Fields error when submitting with empty email and password', async () => {
    render(<Login onDemoLogin={onDemoLogin} onNodeLogin={onNodeLogin} />);
    const logInButtons = screen.getAllByRole('button', { name: /Log In/i });
    fireEvent.click(logInButtons[logInButtons.length - 1]);
    expect(screen.getByText(/Missing Fields/i)).toBeInTheDocument();
    expect(screen.getByText(/Please enter both email and password/i)).toBeInTheDocument();
  });

  it('calls nodeAuth.login and onNodeLogin when Log In with valid credentials', async () => {
    mockLogin.mockResolvedValue({ user: { id: '1', email: 'test@example.com' }, token: 'jwt-token' });
    render(<Login onDemoLogin={onDemoLogin} onNodeLogin={onNodeLogin} />);
    const [emailInput] = screen.getAllByPlaceholderText(/Email/i);
    const [passwordInput] = screen.getAllByPlaceholderText(/Password/i);
    const [submitButton] = screen.getAllByTestId('auth-submit');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(onNodeLogin).toHaveBeenCalledWith({ id: '1', email: 'test@example.com' }, 'jwt-token');
    });
  });

  it('switches to Sign Up tab and shows Create New Account', () => {
    render(<Login onDemoLogin={onDemoLogin} onNodeLogin={onNodeLogin} />);
    const signUpTabs = screen.getAllByRole('button', { name: /Sign Up/i });
    fireEvent.click(signUpTabs[0]);
    expect(screen.getByText(/Create New Account/i)).toBeInTheDocument();
  });
});
