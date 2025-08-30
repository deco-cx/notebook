import type { Notebook as NotebookType, Cell as CellInterface, CellType } from '../../types/notebook';
import { genId } from '../../lib/utils';
import { getDefaultView } from '../../utils/availableViews';

export function useNotebookCells(
  notebook: NotebookType, 
  onNotebookChange: (notebook: NotebookType) => void
) {
  const addCell = (type: CellType = 'markdown', content: string = '') => {
    const newCell: CellInterface = {
      id: genId(6),
      type,
      content,
      status: 'idle',
      selectedView: getDefaultView(type)?.id,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    const updatedNotebook = {
      ...notebook,
      cells: [...notebook.cells, newCell],
      updatedAt: new Date().toISOString()
    };

    onNotebookChange(updatedNotebook);
  };

  const updateCell = (cellIndex: number, updates: Partial<CellInterface>) => {
    const updatedCells = notebook.cells.map((cell, index) => 
      index === cellIndex ? { ...cell, ...updates } : cell
    );

    onNotebookChange({
      ...notebook,
      cells: updatedCells,
      updatedAt: new Date().toISOString()
    });
  };

  const deleteCell = (cellIndex: number) => {
    console.log('[DELETE_CELL] Deleting cell', cellIndex, 'from', notebook.cells.length, 'cells');
    console.log('[DELETE_CELL] Cell being deleted:', notebook.cells[cellIndex]?.id);
    
    // Allow deleting all cells - the notebook can have 0 cells
    const updatedCells = notebook.cells.filter((_, index) => index !== cellIndex);
    
    console.log('[DELETE_CELL] After deletion:', updatedCells.length, 'cells remaining');
    console.log('[DELETE_CELL] Calling onNotebookChange with updated notebook');
    
    onNotebookChange({
      ...notebook,
      cells: updatedCells,
      updatedAt: new Date().toISOString()
    });
  };

  const updateCellWithMetadata = (cellIndex: number, updatedCell: CellInterface) => {
    // Check if this update is for a cell that still exists
    if (cellIndex >= notebook.cells.length) {
      // Ignoring update for non-existent cell
      return;
    }
    
    // Check if the cell ID matches
    if (notebook.cells[cellIndex].id !== updatedCell.id) {
      // Cell ID mismatch - ignoring update
      return;
    }
    

    
    const updatedCells = notebook.cells.map((c, i) => 
      i === cellIndex ? { 
        ...updatedCell, 
        metadata: { 
          createdAt: updatedCell.metadata?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          executionTime: updatedCell.metadata?.executionTime
        } 
      } : c
    );
    onNotebookChange({
      ...notebook,
      cells: updatedCells,
      updatedAt: new Date().toISOString()
    });
  };

  return {
    // Actions
    addCell,
    updateCell,
    deleteCell,
    updateCellWithMetadata,

    // Derived state
    cellCount: notebook.cells.length,
    hasMultipleCells: notebook.cells.length > 1
  };
}
