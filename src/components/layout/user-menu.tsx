"use client";

import { useRouter } from "next/navigation";
import { LogOut, ChevronDown } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  );
}

/** Användarmeny med utloggning. Hämtar inloggad användare via sessionen. */
export function UserMenu({ subtitle }: { subtitle: string }) {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const name = session?.user.name ?? "—";
  const email = session?.user.email ?? "";
  const initials = initialsOf(name);

  async function logout() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-xl p-1 pr-2 transition-colors hover:bg-slate-100 data-popup-open:bg-slate-100">
        <Avatar initials={initials} size="size-9" />
        <span className="hidden flex-col items-start leading-tight lg:flex">
          <span className="text-sm font-semibold text-ink">{name}</span>
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        </span>
        <ChevronDown className="hidden size-4 text-muted-foreground lg:block" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={6} className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="block text-sm font-semibold text-ink">{name}</span>
            {email ? (
              <span className="block truncate text-xs font-normal text-muted-foreground">
                {email}
              </span>
            ) : null}
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={logout}
            className="gap-2 text-danger focus:bg-danger-soft focus:text-danger"
          >
            <LogOut className="size-4" />
            Logga ut
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
