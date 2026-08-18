import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import GoogleIcon from "@/components/GoogleIcon";
import UserAvatar from "@/components/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { User as UserIcon, LogOut, Shield } from "lucide-react";
import { isAdminUser } from "@/lib/moderation";

export default function UserMenu() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <button
        onClick={() => {
          navigate(
            "/login?returnTo=" + encodeURIComponent(window.location.pathname + window.location.search)
          );
        }}
        className="ui-cta inline-flex items-center gap-2 bg-accent text-accent-foreground px-3 py-2 rounded-md text-sm font-medium"
      >
        <GoogleIcon className="w-4 h-4" />
        <span className="hidden sm:inline">Entrar</span>
      </button>
    );
  }

  const displayName = user?.full_name || user?.email || "Usuario";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center gap-2 rounded-full pl-1 pr-2 py-1 bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors">
          <UserAvatar profile={{ full_name: displayName }} name={displayName} size="sm" />
          <span className="hidden sm:block max-w-[120px] truncate text-sm font-medium text-primary-foreground">
            {displayName}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/perfil")} className="cursor-pointer">
          <UserIcon className="w-4 h-4 mr-2" />
          Mi perfil
        </DropdownMenuItem>
        {isAdminUser(user) && (
          <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer">
            <Shield className="w-4 h-4 mr-2" />
            Administración
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}