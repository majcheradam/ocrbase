import type { JobResponse } from "@ocrbase/sdk";

import { useJobs } from "@ocrbase/sdk/react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Github, Loader2, LogOut, Plus } from "lucide-react";
import { type default as React, useCallback } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

const HistoryContent = ({ jobs }: { jobs: JobResponse[] }): React.ReactNode =>
  jobs.map((job) => (
    <SidebarMenuItem key={job.id}>
      <SidebarMenuButton
        render={<Link to="/job/$jobId" params={{ jobId: job.id }} />}
      >
        <span className="truncate">{job.fileName}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  ));

const getUserInitials = (name: string | undefined): string => {
  if (!name) {
    return "?";
  }
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

interface UserSession {
  user: {
    name: string | null;
    image?: string | null | undefined;
  };
}

const FooterContent = ({
  isLoading,
  session,
  onSignIn,
  onSignOut,
}: {
  isLoading: boolean;
  session: UserSession | null;
  onSignIn: () => void;
  onSignOut: () => void;
}): React.ReactNode => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (session?.user) {
    const { user } = session;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="w-full outline-none">
          <SidebarMenuButton className="h-auto py-2 w-full">
            <Avatar className="size-8">
              {user.image && (
                <AvatarImage src={user.image} alt={user.name ?? ""} />
              )}
              <AvatarFallback className="text-xs">
                {getUserInitials(user.name ?? undefined)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col items-start gap-0.5">
              <span className="text-sm font-medium">{user.name}</span>
              <span className="text-xs text-muted-foreground">Free</span>
            </div>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" sideOffset={8}>
          <DropdownMenuItem onClick={onSignOut}>
            <LogOut className="size-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      variant="outline"
      className="w-full justify-start gap-2"
      onClick={onSignIn}
    >
      <Github className="size-4" />
      Sign in with GitHub
    </Button>
  );
};

export const AppSidebar = (): React.ReactNode => {
  const { data: session, isPending: isSessionLoading } =
    authClient.useSession();
  const { data: jobsData } = useJobs({
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const jobs = jobsData?.data ?? [];

  const handleSignIn = useCallback(() => {
    authClient.signIn.social({
      callbackURL: window.location.href,
      provider: "github",
    });
  }, []);

  const handleSignOut = useCallback(async () => {
    await authClient.signOut();
    window.location.replace("/");
  }, []);

  return (
    <Sidebar>
      <SidebarHeader>
        <Link to="/" className="px-2 py-1">
          <span className="text-lg font-medium">ocrbase</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        <SidebarGroup className="p-2 pb-0">
          <SidebarMenu className="gap-0">
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link to="/" />}>
                <Plus className="size-4" />
                <span>New</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup className="px-2 pt-4">
            <CollapsibleTrigger className="group/history flex w-full items-center gap-1 pl-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <span>History</span>
              <ChevronDown className="size-3.5 opacity-0 group-hover/history:opacity-100 transition-all group-data-open/collapsible:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenu className="gap-0 mt-1">
                <HistoryContent jobs={jobs} />
              </SidebarMenu>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <FooterContent
              isLoading={isSessionLoading}
              session={session}
              onSignIn={handleSignIn}
              onSignOut={handleSignOut}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
