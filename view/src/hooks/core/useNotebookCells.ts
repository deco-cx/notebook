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
    console.log('DELETE_CELL_CALLED:', cellIndex, 'Total cells:', notebook.cells.length);
    
    if (notebook.cells.length <= 1) {
      // Don't delete the last cell, just clear its content
      console.log('CLEARING_LAST_CELL_CONTENT');
      updateCell(cellIndex, { content: '', outputs: [], status: 'idle' });
      return;
    }

    console.log('DELETING_CELL_AT_INDEX:', cellIndex);
    const updatedCells = notebook.cells.filter((_, index) => index !== cellIndex);
    console.log('NEW_CELLS_COUNT:', updatedCells.length);
    
    onNotebookChange({
      ...notebook,
      cells: updatedCells,
      updatedAt: new Date().toISOString()
    });
  };

  const updateCellWithMetadata = (cellIndex: number, updatedCell: CellInterface) => {
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
