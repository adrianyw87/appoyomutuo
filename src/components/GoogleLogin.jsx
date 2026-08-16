import { Navigate, useLocation } from "react-router-dom";

/** Si no hay sesión, manda a /login (email o Google). */
export default function GoogleLogin() {
  const location = useLocation();
  const returnTo = location.pathname + location.search;
  return (
    <Navigate
      to={"/login?returnTo=" + encodeURIComponent(returnTo || "/")}
      replace
    />
  );
}
