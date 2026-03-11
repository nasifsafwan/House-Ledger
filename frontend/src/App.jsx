import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SelectMess from "./pages/SelectMess";
import CreateOrJoin from "./pages/CreateOrJoin";
import ManagerDashboard from "./pages/ManagerDashboard";
import MemberDashboard from "./pages/MemberDashboard";
import PersonalDashboard from "./pages/PersonalDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <SelectMess />
          </ProtectedRoute>
        }
      />
      <Route
        path="/choose"
        element={
          <ProtectedRoute>
            <CreateOrJoin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/:messId"
        element={
          <ProtectedRoute>
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/member/:messId"
        element={
          <ProtectedRoute>
            <MemberDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/personal"
        element={
          <ProtectedRoute>
            <PersonalDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
