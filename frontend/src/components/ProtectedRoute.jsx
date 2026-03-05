import { Navigate } from "react-router-dom";
import { authStore } from "../store/authStore";

export default function ProtectedRoute({ children }) {
  const token = authStore.getToken();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}