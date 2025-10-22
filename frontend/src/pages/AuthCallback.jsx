import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { completeMagicLink } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function AuthCallback() {
  const query = useQuery();
  const token = query.get('token');
  const email = query.get('email');
  const reminder = query.get('reminder');
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasHandled = useRef(false);

  useEffect(() => {
    if (hasHandled.current) {
      return;
    }
    hasHandled.current = true;

    async function completeLogin() {
      if (!token || !email) {
        toast.error('Invalid login link');
        navigate('/login');
        return;
      }
      try {
        const { data } = await completeMagicLink({ token, email });
        localStorage.setItem('kris-kringle-token', data.token);
        setUser({
          id: data.employee.id,
          name: data.employee.name,
          email: data.employee.email,
          isAdmin: data.employee.isAdmin,
          isSuperAdmin: data.employee.isSuperAdmin
        });
        
        if (reminder === 'wishlist') {
          toast.success('Please complete your wishlist below');
          navigate('/portal?showWishlist=true');
        } else {
          toast.success('Welcome back!');
          navigate('/portal');
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Unable to sign in');
        navigate('/login');
      }
    }
    completeLogin();
  }, [token, email, reminder, navigate, setUser]);

  return (
    <div className="flex items-center justify-center">
      <LoadingSpinner label="Signing you in…" />
    </div>
  );
}
