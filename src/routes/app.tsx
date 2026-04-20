import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("ns-user");
      if (!raw) throw redirect({ to: "/login" });
    }
  },
  component: () => <Outlet />,
});
