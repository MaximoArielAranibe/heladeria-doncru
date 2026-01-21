import { useAuth } from "../../../hooks/useAuth";

const HideForAdmin = ({ children }) => {
  const { role, loading } = useAuth();

  if (loading) return null;
  if (role === "admin") return null;

  return children;
};

export default HideForAdmin;
