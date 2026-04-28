import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import AdminApp from "./admin/AdminApp";
import "./styles/globals.css";

export function Root(): React.ReactElement {
  const [isAdminRoute, setIsAdminRoute] = React.useState(
    window.location.hash.startsWith("#/admin")
  );

  React.useEffect(() => {
    const onHashChange = () => {
      setIsAdminRoute(window.location.hash.startsWith("#/admin"));
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return isAdminRoute ? <AdminApp /> : <App />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
