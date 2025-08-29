import type { Cell as CellInterface, CellType } from '../../types/notebook';
import { getDefaultView } from '../../utils/availableViews';

export function useCellContent(
  cell: CellInterface, 
  onUpdate: (cell: CellInterface) => void
) {
  const handleContentChange = (content: string) => {
    // Only update if content actually changed
    if (content !== cell.content) {
      onUpdate({ ...cell, content });
    }
  };

  const handleViewDataChange = (viewData: Record<string, any>) => {
    onUpdate({ 
      ...cell, 
      viewData: { ...cell.viewData, ...viewData }
    });
  };

  const handleTypeChange = (type: CellType) => {
    onUpdate({ 
      ...cell, 
      type,
      selectedView: getDefaultView(type)?.id 
    });
  };

  return {
    // Actions
    handleContentChange,
    handleViewDataChange,
    handleTypeChange,

    // State
    content: cell.content,
    viewData: cell.viewData || {},
    type: cell.type
  };
}
