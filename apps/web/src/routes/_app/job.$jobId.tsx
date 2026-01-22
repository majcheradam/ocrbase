import { createFileRoute } from "@tanstack/react-router";

const RouteComponent = () => <div>Hello _app/job/$jobId!</div>;

export const Route = createFileRoute("/_app/job/$jobId")({
  component: RouteComponent,
});
