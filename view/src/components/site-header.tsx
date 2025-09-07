import { MessageCircle, Play } from "lucide-react";
import { Button } from "./ui/button";
import { UserButton } from "./user-button";
import { NoteSelector } from "./navigation/NoteSelector";

interface SiteHeaderProps {
  currentNotebook?: { id: string; title: string } | null;
  onNotebookChange: (notebookId: string) => void;
  onCreateNote: () => void;
}

export function SiteHeader({ currentNotebook, onNotebookChange, onCreateNote }: SiteHeaderProps) {
  return (
    <header className="border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center">
        {/* Logo */}
        <div className="mr-4 hidden md:flex">
          <a href="/" className="mr-6 flex items-center space-x-2">
            <div className="h-6 w-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded" />
            <span className="hidden font-bold sm:inline-block">Notebook</span>
          </a>
        </div>

        {/* Left side: User/Workspace + Note Navigation */}
        <div className="flex items-center gap-4">
          <UserButton /> {/* Shows workspace name + email when logged in */}
          
          <NoteSelector
            currentNotebook={currentNotebook}
            onSelectNotebook={onNotebookChange}
            onCreateNote={onCreateNote}
          />
        </div>

        {/* Right side: Chat + Run */}
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <MessageCircle className="h-[18px] w-[18px]" />
          </Button>
          
          <Button size="sm" className="gap-2">
            <Play className="h-4 w-4" />
            Run
          </Button>
        </div>
      </div>
    </header>
  );
}
