import { LogIn, LogOut, User, Building } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useAuth } from "../hooks/useAuth";

export function UserButton() {
  const { user, workspace, isLoggedIn, logout } = useAuth();

  if (!isLoggedIn) {
    return (
      <Button variant="ghost" size="sm" className="h-8 px-3">
        <a href="/oauth/start" className="flex items-center gap-2">
          <LogIn className="h-4 w-4" />
          <span className="hidden sm:inline">Login</span>
        </a>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto p-2 flex flex-col items-start">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {workspace?.name?.charAt(0)?.toUpperCase() || 'W'}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm">{workspace?.name || 'Workspace'}</span>
          </div>
          <span className="text-xs text-muted-foreground">{user?.email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem disabled>
          <Building className="h-4 w-4 mr-2" />
          {workspace?.name || 'Unknown Workspace'}
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <User className="h-4 w-4 mr-2" />
          {user?.email || 'Unknown User'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}