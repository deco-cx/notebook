import { Notebook } from '../components/Notebook/Notebook';
import { NotebookSelector } from '../components/NotebookSelector/NotebookSelector';

type HomeInsetProps = {
  currentNotebook: any;
  availableNotebooks: any[];
  onNotebookChange: (notebook: any) => void;
  onNewNotebook: () => void;
  onOpenNotebook: () => void;
  isNotebookSelectorOpen: boolean;
  onCloseNotebookSelector: () => void;
  onSelectNotebook: (id: string) => void;
  onDeleteNotebook: (id: string) => void;
};

export function HomeInset(props: HomeInsetProps) {
  const {
    currentNotebook,
    availableNotebooks,
    onNotebookChange,
    onNewNotebook,
    onOpenNotebook,
    isNotebookSelectorOpen,
    onCloseNotebookSelector,
    onSelectNotebook,
    onDeleteNotebook,
  } = props;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <Notebook
        notebook={currentNotebook}
        onNotebookChange={onNotebookChange}
        onNewNotebook={onNewNotebook}
        onOpenNotebook={onOpenNotebook}
      />

      <NotebookSelector
        isOpen={isNotebookSelectorOpen}
        onClose={onCloseNotebookSelector}
        notebooks={availableNotebooks}
        currentNotebookId={currentNotebook.id}
        onSelectNotebook={onSelectNotebook}
        onDeleteNotebook={onDeleteNotebook}
      />
    </div>
  );
}

export default HomeInset;


