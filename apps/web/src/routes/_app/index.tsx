import { createFileRoute } from "@tanstack/react-router";

const RouteComponent = () => <div>Hello app!</div>;

export const Route = createFileRoute("/_app/")({
  component: RouteComponent,
});
