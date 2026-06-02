import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Tenant } from "@/lib/tenants";

interface TenantLogoProps {
  tenant: Pick<Tenant, "name" | "initials" | "logo">;
  size?: "sm" | "md";
  className?: string;
}

const boxSize = {
  sm: "h-8 w-20",
  md: "h-10 w-28",
};

/**
 * Visar företagets logotyp fritt (utan ram eller bakgrundsruta), vänsterställd.
 * Saknas logotyp visas ett monogram med initialerna som reserv.
 */
export function TenantLogo({ tenant, size = "md", className }: TenantLogoProps) {
  if (tenant.logo) {
    return (
      <span className={cn("relative block shrink-0", boxSize[size], className)}>
        <Image
          src={tenant.logo}
          alt={tenant.name}
          fill
          sizes={size === "sm" ? "80px" : "112px"}
          className="object-contain object-left"
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md bg-ink font-bold text-white",
        size === "sm" ? "h-8 w-9 text-xs" : "h-10 w-11 text-sm",
        className,
      )}
    >
      {tenant.initials}
    </span>
  );
}
