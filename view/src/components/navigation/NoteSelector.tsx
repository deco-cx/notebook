import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { FileText, Search, Plus, Calendar, Clock, Hash } from 'lucide-react';
import { useListNotebooks, useGetOrCreateDailyNote } from '../../hooks/useNotebookServer';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';

interface NoteSelectorProps {
  currentNotebook?: { id: string; title: string } | null;
  onSelectNotebook: (notebookId: string) => void;
  onCreateNote: () => void;
}

export function NoteSelector({ currentNotebook, onSelectNotebook, onCreateNote }: NoteSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { isLoggedIn } = useAuth();
  
  // Get notebooks from server
  const { data: notebooksData } = useListNotebooks({ 
    search: search || undefined,
    limit: 50 
  });
  
  // Get daily note
  const { data: dailyNoteData } = useGetOrCreateDailyNote();
  
  // Cmd+N keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        onCreateNote();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCreateNote]);

  const notebooks = notebooksData?.notebooks || [];
  
  // Group notebooks
  const dailyNotes = notebooks.filter(n => n.tags.includes('daily'));
  const templates = notebooks.filter(n => n.isTemplate);
  const regularNotes = notebooks.filter(n => !n.tags.includes('daily') && !n.isTemplate);

  const handleSelectNotebook = (notebookId: string) => {
    onSelectNotebook(notebookId);
    setIsOpen(false);
    setSearch('');
  };

  const handleCreateNote = () => {
    onCreateNote();
    setIsOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="h-8 px-3 max-w-[200px]">
            <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">
              {currentNotebook?.title || 'Select Note'}
            </span>
            <Search className="h-3 w-3 ml-2 opacity-50 flex-shrink-0" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {/* Daily Note Section */}
            {isLoggedIn && dailyNoteData?.notebook && (
              <>
                <div className="p-2">
                  <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Today
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-8 px-2 text-sm"
                    onClick={() => handleSelectNotebook(dailyNoteData.notebook.id)}
                  >
                    <Clock className="h-3 w-3 mr-2 text-blue-500" />
                    <span className="truncate">{dailyNoteData.notebook.title}</span>
                    {dailyNoteData.created && (
                      <Badge variant="secondary" className="ml-auto text-xs">New</Badge>
                    )}
                  </Button>
                </div>
                <Separator />
              </>
            )}

            {/* Recent Notes */}
            {regularNotes.length > 0 && (
              <div className="p-2">
                <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  Recent Notes
                </div>
                <div className="space-y-1">
                  {regularNotes.slice(0, 10).map((notebook) => (
                    <Button
                      key={notebook.id}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start h-8 px-2 text-sm",
                        currentNotebook?.id === notebook.id && "bg-accent"
                      )}
                      onClick={() => handleSelectNotebook(notebook.id)}
                    >
                      <FileText className="h-3 w-3 mr-2" />
                      <span className="truncate flex-1 text-left">{notebook.title}</span>
                      <div className="flex items-center gap-1">
                        {notebook.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            <Hash className="h-2 w-2 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                        <span className="text-xs text-muted-foreground">
                          {notebook.cellCount}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Templates */}
            {templates.length > 0 && (
              <>
                <Separator />
                <div className="p-2">
                  <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    Templates
                  </div>
                  <div className="space-y-1">
                    {templates.map((notebook) => (
                      <Button
                        key={notebook.id}
                        variant="ghost"
                        className="w-full justify-start h-8 px-2 text-sm"
                        onClick={() => handleSelectNotebook(notebook.id)}
                      >
                        <FileText className="h-3 w-3 mr-2 text-purple-500" />
                        <span className="truncate">{notebook.title}</span>
                        <Badge variant="secondary" className="ml-auto text-xs">Template</Badge>
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Create New Note */}
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-start h-8 px-2 text-sm text-blue-600"
                onClick={handleCreateNote}
              >
                <Plus className="h-3 w-3 mr-2" />
                Create New Note
                <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">⌘N</kbd>
              </Button>
            </div>

            {/* Empty State */}
            {notebooks.length === 0 && !search && (
              <div className="p-6 text-center text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notes found</p>
                <p className="text-xs">Create your first note to get started</p>
              </div>
            )}

            {/* Search Empty State */}
            {notebooks.length === 0 && search && (
              <div className="p-6 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notes match "{search}"</p>
                <p className="text-xs">Try a different search term</p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8"
        onClick={onCreateNote}
        title="Create New Note (⌘N)"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
