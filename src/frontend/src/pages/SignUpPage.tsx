// 1. Imports
import React, { useState, FormEvent } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/firebase';
import { setUser, setError } from '@/store/authSlice';
import { Button } from '@/components/ui/button';

// 2. Types and interfaces
interface SignUpForm {
  email: string;
  password: string;
  displayName: string;
}

// 3. Component definition
export const SignUpPage: React.FC = () => {
  // 4. Hooks and state
  const [form, setForm] = useState<SignUpForm>({ email: '', password: '', displayName: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setErrorMsg] = useState<string | null>(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // 5. Event handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (!form.email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) return 'Invalid email format.';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      if (form.displayName) {
        await updateProfile(userCredential.user, { displayName: form.displayName });
      }
      const idToken = await userCredential.user.getIdToken();
      dispatch(setUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: form.displayName || userCredential.user.displayName,
        idToken,
      }));
      navigate('/boards');
    } catch (err: any) {
      setErrorMsg(err.message);
      dispatch(setError(err.message));
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Render
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="displayName" className="block text-gray-700 text-sm font-bold mb-2">Display Name (optional)</label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              value={form.displayName}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing up...' : 'Sign Up'}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <span className="text-gray-600 text-sm">Already have an account?</span>{' '}
          <Link to="/login" className="text-blue-500 hover:underline">Login</Link>
        </div>
      </div>
    </div>
  );
};
