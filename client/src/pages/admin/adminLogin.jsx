import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import FormField from '../../components/FormField';
import { loginAdmin } from '../../features/admin/authSlice';

function AdminLogin() {
  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const errors = {
    email: !form.email
      ? 'Email is required'
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
      ? 'Enter a valid email address'
      : '',
    password: !form.password ? 'Password is required' : '',
  };

  const isValid = !errors.email && !errors.password;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({ email: true, password: true });

    if (!isValid) return;

    try {
      await dispatch(loginAdmin(form)).unwrap();
      navigate('/admin/users');
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f2f3f5] px-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-10 text-center shadow-sm">
        <h2 className="mb-6 text-xl font-extrabold tracking-tight">STEP SELECT</h2>

        <h1 className="mb-2 text-2xl font-bold">
          Admin <span className="text-[#f4511e]">Access</span>
        </h1>
        <p className="mb-8 text-sm text-muted">
          Enter your credentials to manage your store.
        </p>

        <form onSubmit={handleSubmit} noValidate className="text-left">
          <FormField
            label="Email address"
            name="email"
            type="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.email ? errors.email : ''}
          />
          <FormField
            label="Password"
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.password ? errors.password : ''}
          />

          <div className="mb-6 text-right">
            <Link
              to="/admin/forgot-password"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-md bg-[#f4511e] py-3 text-sm font-bold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Admin Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;