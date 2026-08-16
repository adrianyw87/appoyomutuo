import React from "react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

const SIZES = {
  xs: "w-7 h-7 text-[0.7rem]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-16 h-16 text-xl",
  xl: "w-24 h-24 text-3xl",
};

export default function UserAvatar({ profile, name, size = "md", className }) {
  const label = (profile?.full_name || name || "?").trim() || "?";
  const initial = label.charAt(0).toUpperCase();
  if (profile?.avatar_url) {
    return (
      <Image
        src={profile.avatar_url}
        fittingType="fill"
        className={cn("rounded-full object-cover", SIZES[size], className)}
      />
    );
  }
  return (
    <span
      className={cn(
        "grid place-items-center rounded-full bg-accent text-accent-foreground font-semibold shrink-0",
        SIZES[size],
        className
      )}
    >
      {initial}
    </span>
  );
}