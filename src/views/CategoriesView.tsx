import React, { useState, useMemo } from 'react';
import { Category, Tag, Photo } from '../types';
import { SideNav } from '../components/SideNav';

interface CategoriesViewProps {
  categories: Category[];
  tags: Tag[];
  photos?: Photo[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  onAddCategory: (name: string, icon?: string) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
  onReorderCategories?: (categories: Category[]) => void;
  onAddTag: (name: string) => void;
  onEditTag: (tag: Tag) => void;
  onDeleteTag: (tag: Tag) => void;
  onReorderTags?: (tags: Tag[]) => void;
  onViewAllTags: () => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  tags,
  photos = [],
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onReorderCategories,
  onAddTag,
  onEditTag,
  onDeleteTag,
  onReorderTags,
  onViewAllTags,
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [newTagName, setNewTagName] = useState('');

  // Calculate tag counts from photos
  const tagCounts = useMemo(() => {
    const map: Record<string, number> = {};
    photos.forEach((p) => {
      (p.tags || []).forEach((t) => {
        const norm = t.toLowerCase();
        map[norm] = (map[norm] || 0) + 1;
      });
    });
    return map;
  }, [photos]);

  // Drag & drop state for categories
  const [draggedCategoryIndex, setDraggedCategoryIndex] = useState<number | null>(null);
  const [dragOverCategoryIndex, setDragOverCategoryIndex] = useState<number | null>(null);

  // Drag & drop state for tags
  const [draggedTagIndex, setDraggedTagIndex] = useState<number | null>(null);
  const [dragOverTagIndex, setDragOverTagIndex] = useState<number | null>(null);

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatName.trim()) {
      onAddCategory(newCatName.trim(), 'folder');
      setNewCatName('');
    }
  };

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagName.trim()) {
      const formatted = newTagName.startsWith('#') ? newTagName.trim() : `#${newTagName.trim()}`;
      onAddTag(formatted);
      setNewTagName('');
    }
  };

  // Category Drag Handlers
  const handleDragStartCategory = (e: React.DragEvent, index: number) => {
    setDraggedCategoryIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOverCategory = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCategoryIndex !== index) {
      setDragOverCategoryIndex(index);
    }
  };

  const handleDropCategory = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedCategoryIndex === null || draggedCategoryIndex === index) {
      setDraggedCategoryIndex(null);
      setDragOverCategoryIndex(null);
      return;
    }
    const updated = [...categories];
    const [removed] = updated.splice(draggedCategoryIndex, 1);
    updated.splice(index, 0, removed);
    onReorderCategories?.(updated);
    setDraggedCategoryIndex(null);
    setDragOverCategoryIndex(null);
  };

  const handleDragEndCategory = () => {
    setDraggedCategoryIndex(null);
    setDragOverCategoryIndex(null);
  };

  const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    const updated = [...categories];
    const [removed] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, removed);
    onReorderCategories?.(updated);
  };

  // Tag Drag Handlers
  const handleDragStartTag = (e: React.DragEvent, index: number) => {
    setDraggedTagIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOverTag = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTagIndex !== index) {
      setDragOverTagIndex(index);
    }
  };

  const handleDropTag = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedTagIndex === null || draggedTagIndex === index) {
      setDraggedTagIndex(null);
      setDragOverTagIndex(null);
      return;
    }
    const updated = [...tags];
    const [removed] = updated.splice(draggedTagIndex, 1);
    updated.splice(index, 0, removed);
    onReorderTags?.(updated);
    setDraggedTagIndex(null);
    setDragOverTagIndex(null);
  };

  const handleDragEndTag = () => {
    setDraggedTagIndex(null);
    setDragOverTagIndex(null);
  };

  const handleMoveTag = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tags.length) return;
    const updated = [...tags];
    const [removed] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, removed);
    onReorderTags?.(updated);
  };

  return (
    <div className="flex-grow flex w-full max-w-[1280px] mx-auto relative min-h-screen">
      {/* SideNav */}
      <SideNav
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={onSelectCategory}
        onViewAllTags={onViewAllTags}
        isCategoriesView={true}
      />

      {/* Main Content Area */}
      <main className="flex-grow md:ml-64 px-4 md:px-10 py-8 flex flex-col gap-10 w-full bg-[#f9f9f9]">
        {/* Page Header */}
        <div>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-[#000000] mb-2">
            Manage Organization
          </h1>
          <p className="font-sans text-sm md:text-base text-[#444748]">
            Configure your taxonomy by adding, editing, reordering, or removing categories and tags to keep your gallery pristine.
          </p>
        </div>

        {/* Manage Categories Section */}
        <section className="bg-white rounded-xl ambient-shadow p-6 md:p-8 border border-[#c4c7c7]/30">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-sans text-lg font-semibold text-[#000000]">Categories</h2>
                <span className="text-[11px] text-[#747878] bg-[#f0f0f0] px-2 py-0.5 rounded-md font-medium">
                  드래그로 순서 변경 가능
                </span>
              </div>
              <p className="font-sans text-xs text-[#444748] mt-1">
                Primary groupings for your collections. Drag items or use arrows to rearrange.
              </p>
            </div>

            <form onSubmit={handleCreateCategory} className="flex items-center gap-3 w-full md:w-auto">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="New Category Name"
                className="flex-grow md:w-56 bg-transparent border-b border-[#c4c7c7] focus:border-[#000000] focus:ring-0 px-2 py-1 text-sm font-sans text-[#000000] transition-colors focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newCatName.trim()}
                className="bg-[#000000] text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-opacity-90 disabled:opacity-40 transition-opacity flex items-center gap-1.5 whitespace-nowrap shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Add
              </button>
            </form>
          </div>

          <div className="flex flex-col gap-2">
            {categories.map((category, index) => {
              const isDragging = draggedCategoryIndex === index;
              const isDragOver = dragOverCategoryIndex === index && draggedCategoryIndex !== index;

              return (
                <div
                  key={category.id}
                  draggable
                  onDragStart={(e) => handleDragStartCategory(e, index)}
                  onDragOver={(e) => handleDragOverCategory(e, index)}
                  onDrop={(e) => handleDropCategory(e, index)}
                  onDragEnd={handleDragEndCategory}
                  className={`flex justify-between items-center py-3.5 border-b border-[#e2e2e2] group hover:bg-[#f3f3f4] transition-all px-3 -mx-3 rounded-lg ${
                    isDragging ? 'opacity-40 bg-neutral-100 border-dashed border-[#000000]' : ''
                  } ${
                    isDragOver ? 'border-t-2 border-t-[#000000] bg-neutral-50 scale-[1.01]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Drag handle */}
                    <div
                      title="드래그하여 순서 변경"
                      className="p-1 rounded text-[#8e9191] hover:text-[#000000] hover:bg-[#e8e8e8] cursor-grab active:cursor-grabbing transition-colors flex items-center justify-center select-none"
                    >
                      <span className="material-symbols-outlined text-[20px]">drag_indicator</span>
                    </div>

                    <div className="w-9 h-9 rounded-full bg-[#eeeeee] flex items-center justify-center text-[#444748] shrink-0">
                      <span className="material-symbols-outlined text-[20px]">{category.icon || 'palette'}</span>
                    </div>
                    <span className="font-sans text-base text-[#000000] font-medium">
                      {category.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Up / Down arrows for quick mobile/accessibility reordering */}
                    <div className="flex items-center gap-0.5 mr-2 bg-[#f0f0f0] p-0.5 rounded-md">
                      <button
                        onClick={() => handleMoveCategory(index, 'up')}
                        disabled={index === 0}
                        title="위로 이동"
                        className="p-1 text-[#444748] hover:text-[#000000] disabled:opacity-20 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                      </button>
                      <button
                        onClick={() => handleMoveCategory(index, 'down')}
                        disabled={index === categories.length - 1}
                        title="아래로 이동"
                        className="p-1 text-[#444748] hover:text-[#000000] disabled:opacity-20 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                      </button>
                    </div>

                    <button
                      onClick={() => onEditCategory(category)}
                      aria-label={`Edit ${category.name}`}
                      title="Edit"
                      className="p-2 text-[#444748] hover:text-[#000000] transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button
                      onClick={() => onDeleteCategory(category)}
                      aria-label={`Delete ${category.name}`}
                      title="Delete"
                      className="p-2 text-[#444748] hover:text-[#ba1a1a] transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Manage Tags Section */}
        <section id="tags-section" className="bg-white rounded-xl ambient-shadow p-6 md:p-8 border border-[#c4c7c7]/30">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-sans text-lg font-semibold text-[#000000]">Tags</h2>
                <span className="text-[11px] text-[#747878] bg-[#f0f0f0] px-2 py-0.5 rounded-md font-medium">
                  드래그로 순서 변경 가능
                </span>
              </div>
              <p className="font-sans text-xs text-[#444748] mt-1">
                Granular keywords for precise searching. Drag items or use arrows to rearrange.
              </p>
            </div>

            <form onSubmit={handleCreateTag} className="flex items-center gap-3 w-full md:w-auto">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="New Tag Name"
                className="flex-grow md:w-56 bg-transparent border-b border-[#c4c7c7] focus:border-[#000000] focus:ring-0 px-2 py-1 text-sm font-sans text-[#000000] transition-colors focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newTagName.trim()}
                className="bg-[#000000] text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-opacity-90 disabled:opacity-40 transition-opacity flex items-center gap-1.5 whitespace-nowrap shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Add
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            {tags.map((tag, index) => {
              const isDragging = draggedTagIndex === index;
              const isDragOver = dragOverTagIndex === index && draggedTagIndex !== index;

              return (
                <div
                  key={tag.id}
                  draggable
                  onDragStart={(e) => handleDragStartTag(e, index)}
                  onDragOver={(e) => handleDragOverTag(e, index)}
                  onDrop={(e) => handleDropTag(e, index)}
                  onDragEnd={handleDragEndTag}
                  className={`flex justify-between items-center py-2.5 border-b border-[#e2e2e2] group hover:bg-[#f3f3f4] transition-all px-3 -mx-3 rounded-lg ${
                    isDragging ? 'opacity-40 bg-neutral-100 border-dashed border-[#000000]' : ''
                  } ${
                    isDragOver ? 'border-t-2 border-t-[#000000] bg-neutral-50 scale-[1.01]' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {/* Drag handle */}
                    <div
                      title="드래그하여 순서 변경"
                      className="p-1 rounded text-[#8e9191] hover:text-[#000000] hover:bg-[#e8e8e8] cursor-grab active:cursor-grabbing transition-colors flex items-center justify-center select-none"
                    >
                      <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
                    </div>

                    <span className="font-sans text-sm text-[#000000] inline-flex items-center gap-2 font-medium">
                      <span className="w-2 h-2 rounded-full bg-[#5d5f5f]"></span>
                      {tag.name}
                      <span className="text-[11px] font-normal text-[#747878] bg-[#f0f0f0] px-1.5 py-0.2 rounded-md">
                        {tagCounts[tag.name.toLowerCase()] || 0}작품
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Up / Down arrows */}
                    <div className="flex items-center gap-0.5 mr-1 bg-[#f0f0f0] p-0.5 rounded-md">
                      <button
                        onClick={() => handleMoveTag(index, 'up')}
                        disabled={index === 0}
                        title="위로 이동"
                        className="p-1 text-[#444748] hover:text-[#000000] disabled:opacity-20 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                      </button>
                      <button
                        onClick={() => handleMoveTag(index, 'down')}
                        disabled={index === tags.length - 1}
                        title="아래로 이동"
                        className="p-1 text-[#444748] hover:text-[#000000] disabled:opacity-20 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                      </button>
                    </div>

                    <button
                      onClick={() => onEditTag(tag)}
                      aria-label={`Edit ${tag.name}`}
                      title="Edit"
                      className="p-1.5 text-[#444748] hover:text-[#000000] transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => onDeleteTag(tag)}
                      aria-label={`Delete ${tag.name}`}
                      title="Delete"
                      className="p-1.5 text-[#444748] hover:text-[#ba1a1a] transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

