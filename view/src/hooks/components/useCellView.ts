import { useState } from 'react';
import type { Cell as CellInterface, CellType } from '../../types/notebook';
import { getCompatibleViews, getDefaultView } from '../../utils/availableViews';

export function useCellView(
  cell: CellInterface, 
  onUpdate: (cell: CellInterface) => void
) {
  const [selectedViewId, setSelectedViewId] = useState(
    cell.selectedView || getDefaultView(cell.type)?.id
  );
  const [renderMode, setRenderMode] = useState<'edit' | 'preview' | 'output'>('edit');

  const compatibleViews = getCompatibleViews(cell.type);
  const selectedView = compatibleViews.find(v => v.id === selectedViewId);

  const handleViewChange = (viewId: string) => {
    setSelectedViewId(viewId);
    onUpdate({ 
      ...cell, 
      selectedView: viewId 
    });
  };

  const handleViewDataChange = (viewData: Record<string, any>) => {
    onUpdate({ 
      ...cell, 
      viewData: { ...cell.viewData, ...viewData }
    });
  };

  return {
    // State
    selectedViewId,
    renderMode,
    compatibleViews,
    selectedView,

    // Actions
    handleViewChange,
    setRenderMode,
    handleViewDataChange,

    // Derived
    canPreview: cell.type === 'markdown',
    hasOutputs: cell.outputs && cell.outputs.length > 0
  };
}
