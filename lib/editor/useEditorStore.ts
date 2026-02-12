'use client';

import { useState, useCallback, useRef } from 'react';
import type { EditorState, PageConfig, EditorSection, EditorElement, HistoryEntry, DevicePreview, AnimationConfig } from './types';
import { deepClone, generateId } from './animations';

const MAX_HISTORY = 50;

export function useEditorStore(initialPages: Record<string, PageConfig>) {
  const [state, setState] = useState<EditorState>({
    activePage: Object.keys(initialPages)[0] || 'index',
    pages: initialPages,
    selectedSectionId: null,
    selectedElementId: null,
    devicePreview: 'desktop',
    isPreviewMode: false,
    isDragging: false,
    showSectionLibrary: false,
    zoom: 100,
    hasUnsavedChanges: false,
    animPreviewKey: 0,
  });

  const historyRef = useRef<HistoryEntry[]>([{ pages: deepClone(initialPages), timestamp: Date.now(), description: 'Initial' }]);
  const historyIndexRef = useRef(0);

  // Push state to history stack
  const pushHistory = useCallback((description: string) => {
    const newEntry: HistoryEntry = {
      pages: deepClone(state.pages),
      timestamp: Date.now(),
      description,
    };
    // Trim future entries if we're not at the end
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(newEntry);
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift();
    } else {
      historyIndexRef.current++;
    }
  }, [state.pages]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const entry = historyRef.current[historyIndexRef.current];
      setState(prev => ({ ...prev, pages: deepClone(entry.pages), hasUnsavedChanges: true }));
    }
  }, []);

  // Redo
  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const entry = historyRef.current[historyIndexRef.current];
      setState(prev => ({ ...prev, pages: deepClone(entry.pages), hasUnsavedChanges: true }));
    }
  }, []);

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  // Get active page
  const activePage = state.pages[state.activePage];

  // Set active page
  const setActivePage = useCallback((pageId: string) => {
    setState(prev => ({ ...prev, activePage: pageId, selectedSectionId: null, selectedElementId: null }));
  }, []);

  // Select section
  const selectSection = useCallback((sectionId: string | null) => {
    setState(prev => ({ ...prev, selectedSectionId: sectionId, selectedElementId: null }));
  }, []);

  // Select element
  const selectElement = useCallback((elementId: string | null) => {
    setState(prev => ({ ...prev, selectedElementId: elementId }));
  }, []);

  // Set device preview
  const setDevicePreview = useCallback((device: DevicePreview) => {
    setState(prev => ({ ...prev, devicePreview: device }));
  }, []);

  // Toggle preview mode
  const togglePreviewMode = useCallback(() => {
    setState(prev => ({ ...prev, isPreviewMode: !prev.isPreviewMode, selectedSectionId: null, selectedElementId: null }));
  }, []);

  // Toggle section library
  const toggleSectionLibrary = useCallback(() => {
    setState(prev => ({ ...prev, showSectionLibrary: !prev.showSectionLibrary }));
  }, []);

  // Set zoom
  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({ ...prev, zoom: Math.max(50, Math.min(150, zoom)) }));
  }, []);

  // Update section
  const updateSection = useCallback((sectionId: string, updates: Partial<EditorSection>) => {
    setState(prev => {
      const page = prev.pages[prev.activePage];
      if (!page) return prev;
      const newSections = page.sections.map(s =>
        s.id === sectionId ? { ...s, ...updates } : s
      );
      return {
        ...prev,
        hasUnsavedChanges: true,
        pages: {
          ...prev.pages,
          [prev.activePage]: { ...page, sections: newSections }
        }
      };
    });
  }, []);

  // Update element
  const updateElement = useCallback((sectionId: string, elementId: string, updates: Partial<EditorElement>) => {
    setState(prev => {
      const page = prev.pages[prev.activePage];
      if (!page) return prev;
      const newSections = page.sections.map(s => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          elements: s.elements.map(e =>
            e.id === elementId ? { ...e, ...updates } : e
          )
        };
      });
      return {
        ...prev,
        hasUnsavedChanges: true,
        pages: {
          ...prev.pages,
          [prev.activePage]: { ...page, sections: newSections }
        }
      };
    });
  }, []);

  // Update element content (inline edit)
  const updateElementContent = useCallback((sectionId: string, elementId: string, content: string) => {
    updateElement(sectionId, elementId, { content });
  }, [updateElement]);

  // Update element props
  const updateElementProps = useCallback((sectionId: string, elementId: string, props: Partial<EditorElement['props']>) => {
    setState(prev => {
      const page = prev.pages[prev.activePage];
      if (!page) return prev;
      const newSections = page.sections.map(s => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          elements: s.elements.map(e =>
            e.id === elementId ? { ...e, props: { ...e.props, ...props } } : e
          )
        };
      });
      return {
        ...prev,
        hasUnsavedChanges: true,
        pages: {
          ...prev.pages,
          [prev.activePage]: { ...page, sections: newSections }
        }
      };
    });
  }, []);

  // Update element animation
  const updateElementAnimation = useCallback((sectionId: string, elementId: string, animation: Partial<AnimationConfig>) => {
    setState(prev => {
      const page = prev.pages[prev.activePage];
      if (!page) return prev;
      const newSections = page.sections.map(s => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          elements: s.elements.map(e =>
            e.id === elementId ? { ...e, animation: { ...e.animation, ...animation } } : e
          )
        };
      });
      return {
        ...prev,
        hasUnsavedChanges: true,
        pages: {
          ...prev.pages,
          [prev.activePage]: { ...page, sections: newSections }
        }
      };
    });
  }, []);

  // Add section
  const addSection = useCallback((section: Omit<EditorSection, 'id'>, afterSectionId?: string) => {
    const newSection: EditorSection = { ...section, id: generateId() };
    // Also regenerate element IDs
    newSection.elements = newSection.elements.map(el => ({ ...el, id: generateId() }));
    
    setState(prev => {
      const page = prev.pages[prev.activePage];
      if (!page) return prev;
      let newSections: EditorSection[];
      if (afterSectionId) {
        const idx = page.sections.findIndex(s => s.id === afterSectionId);
        newSections = [...page.sections];
        newSections.splice(idx + 1, 0, newSection);
      } else {
        newSections = [...page.sections, newSection];
      }
      pushHistory(`Add section: ${newSection.label}`);
      return {
        ...prev,
        hasUnsavedChanges: true,
        showSectionLibrary: false,
        selectedSectionId: newSection.id,
        pages: {
          ...prev.pages,
          [prev.activePage]: { ...page, sections: newSections }
        }
      };
    });
  }, [pushHistory]);

  // Remove section
  const removeSection = useCallback((sectionId: string) => {
    setState(prev => {
      const page = prev.pages[prev.activePage];
      if (!page) return prev;
      pushHistory(`Remove section`);
      return {
        ...prev,
        hasUnsavedChanges: true,
        selectedSectionId: null,
        selectedElementId: null,
        pages: {
          ...prev.pages,
          [prev.activePage]: { ...page, sections: page.sections.filter(s => s.id !== sectionId) }
        }
      };
    });
  }, [pushHistory]);

  // Duplicate section
  const duplicateSection = useCallback((sectionId: string) => {
    setState(prev => {
      const page = prev.pages[prev.activePage];
      if (!page) return prev;
      const sourceSection = page.sections.find(s => s.id === sectionId);
      if (!sourceSection) return prev;
      const duplicate = deepClone(sourceSection);
      duplicate.id = generateId();
      duplicate.label = `${duplicate.label} (copia)`;
      duplicate.elements = duplicate.elements.map((el: EditorElement) => ({ ...el, id: generateId() }));
      const idx = page.sections.findIndex(s => s.id === sectionId);
      const newSections = [...page.sections];
      newSections.splice(idx + 1, 0, duplicate);
      pushHistory(`Duplicate section: ${sourceSection.label}`);
      return {
        ...prev,
        hasUnsavedChanges: true,
        selectedSectionId: duplicate.id,
        pages: {
          ...prev.pages,
          [prev.activePage]: { ...page, sections: newSections }
        }
      };
    });
  }, [pushHistory]);

  // Move section
  const moveSection = useCallback((sectionId: string, direction: 'up' | 'down') => {
    setState(prev => {
      const page = prev.pages[prev.activePage];
      if (!page) return prev;
      const idx = page.sections.findIndex(s => s.id === sectionId);
      if (idx === -1) return prev;
      if (direction === 'up' && idx === 0) return prev;
      if (direction === 'down' && idx === page.sections.length - 1) return prev;
      const newSections = [...page.sections];
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      [newSections[idx], newSections[swapIdx]] = [newSections[swapIdx], newSections[idx]];
      pushHistory(`Move section ${direction}`);
      return {
        ...prev,
        hasUnsavedChanges: true,
        pages: {
          ...prev.pages,
          [prev.activePage]: { ...page, sections: newSections }
        }
      };
    });
  }, [pushHistory]);

  // Add element to section
  const addElement = useCallback((sectionId: string, element: Omit<EditorElement, 'id'>) => {
    const newElement: EditorElement = { ...element, id: generateId() };
    setState(prev => {
      const page = prev.pages[prev.activePage];
      if (!page) return prev;
      const newSections = page.sections.map(s => {
        if (s.id !== sectionId) return s;
        return { ...s, elements: [...s.elements, newElement] };
      });
      pushHistory(`Add element`);
      return {
        ...prev,
        hasUnsavedChanges: true,
        selectedElementId: newElement.id,
        pages: {
          ...prev.pages,
          [prev.activePage]: { ...page, sections: newSections }
        }
      };
    });
  }, [pushHistory]);

  // Remove element
  const removeElement = useCallback((sectionId: string, elementId: string) => {
    setState(prev => {
      const page = prev.pages[prev.activePage];
      if (!page) return prev;
      const newSections = page.sections.map(s => {
        if (s.id !== sectionId) return s;
        return { ...s, elements: s.elements.filter(e => e.id !== elementId) };
      });
      pushHistory(`Remove element`);
      return {
        ...prev,
        hasUnsavedChanges: true,
        selectedElementId: null,
        pages: {
          ...prev.pages,
          [prev.activePage]: { ...page, sections: newSections }
        }
      };
    });
  }, [pushHistory]);

  // Update section data (for slide-specific, form-specific, etc.)
  const updateSectionData = useCallback((sectionId: string, data: Record<string, unknown>) => {
    setState(prev => {
      const page = prev.pages[prev.activePage];
      if (!page) return prev;
      const newSections = page.sections.map(s =>
        s.id === sectionId ? { ...s, data: { ...(s.data || {}), ...data } } : s
      );
      return {
        ...prev,
        hasUnsavedChanges: true,
        pages: {
          ...prev.pages,
          [prev.activePage]: { ...page, sections: newSections }
        }
      };
    });
  }, []);

  // Mark as saved
  const markSaved = useCallback(() => {
    setState(prev => ({ ...prev, hasUnsavedChanges: false }));
    pushHistory('Saved');
  }, [pushHistory]);

  // Update pages (full replace, for loading from DB)
  const setPages = useCallback((pages: Record<string, PageConfig>) => {
    setState(prev => ({ ...prev, pages, hasUnsavedChanges: false }));
    historyRef.current = [{ pages: deepClone(pages), timestamp: Date.now(), description: 'Loaded' }];
    historyIndexRef.current = 0;
  }, []);

  // Record snapshot before a drag/interaction starts
  const recordSnapshot = useCallback((description: string) => {
    pushHistory(description);
  }, [pushHistory]);

  // Trigger animation preview replay
  const triggerAnimPreview = useCallback(() => {
    setState(prev => ({ ...prev, animPreviewKey: prev.animPreviewKey + 1 }));
  }, []);

  return {
    state,
    activePage,
    setActivePage,
    selectSection,
    selectElement,
    setDevicePreview,
    togglePreviewMode,
    toggleSectionLibrary,
    setZoom,
    updateSection,
    updateElement,
    updateElementContent,
    updateElementProps,
    updateElementAnimation,
    addSection,
    removeSection,
    duplicateSection,
    moveSection,
    addElement,
    removeElement,
    updateSectionData,
    markSaved,
    setPages,
    recordSnapshot,
    triggerAnimPreview,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}

export type EditorStore = ReturnType<typeof useEditorStore>;
