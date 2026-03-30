import { Navigate } from "react-router-dom";
import { authStore } from "../store/authStore";

export default function ProtectedRoute({ children }) {
  const token = authStore.getToken();
  const user = authStore.getUser();

  if (!token) return <Navigate to="/" replace />;
  
  if (user?.role === 'admin' && window.location.pathname !== '/admin') {
    return <Navigate to="/admin" replace />;
  }
  
  return children;
}