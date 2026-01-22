import { env } from "@ocrbase/env/web";
import { OCRBaseProvider } from "@ocrbase/sdk/react";
// import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
// import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60,
    },
  },
});

const RootDocument = ({ children }: { children: React.ReactNode }) => (
  <html lang="en">
    <head>
      <HeadContent />
    </head>
    <body>
      <QueryClientProvider client={queryClient}>
        <OCRBaseProvider
          config={{ baseUrl: env.VITE_SERVER_URL, credentials: "include" }}
        >
          {children}
          <Toaster richColors closeButton position="bottom-right" />
        </OCRBaseProvider>
      </QueryClientProvider>
      {/* <TanStackDevtools
        config={{
          position: "bottom-right",
        }}
        plugins={[
          {
            name: "Tanstack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      /> */}
      <Scripts />
    </body>
  </html>
);

const RootComponent = () => <Outlet />;

export const Route = createRootRoute({
  component: RootComponent,
  head: () => ({
    links: [
      {
        href: appCss,
        rel: "stylesheet",
      },
      {
        href: "https://fonts.googleapis.com",
        rel: "preconnect",
      },
      {
        crossOrigin: "anonymous",
        href: "https://fonts.gstatic.com",
        rel: "preconnect",
      },
      {
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
        rel: "stylesheet",
      },
    ],
    meta: [
      {
        charSet: "utf8",
      },
      {
        content: "width=device-width, initial-scale=1",
        name: "viewport",
      },
      {
        title: "OCRBase - Document Processing",
      },
      {
        content:
          "Transform documents into structured data with AI-powered OCR and extraction",
        name: "description",
      },
    ],
  }),
  shellComponent: RootDocument,
});
