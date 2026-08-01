import React from 'react';
import { Category } from '../types';

interface SideNavProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  onViewAllTags?: () => void;
  isCategoriesView?: boolean;
  isAdmin?: boolean;
}

export const SideNav: React.FC<SideNavProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onViewAllTags,
  isCategoriesView = false,
  isAdmin = false
}) => {
  return (
    <aside className="hidden md:flex bg-[#f3f3f4] h-full w-64 fixed left-0 top-0 pt-24 pb-8 flex-col px-4 gap-2 border-r border-[#c4c7c7] z-30 overflow-y-auto">
      <div className="mb-6 px-4">
        <h2 className="font-serif text-2xl font-semibold text-[#000000]">Categories</h2>
        <p className="text-xs text-[#444748] mt-1 font-sans">Explore styles</p>
      </div>

      <div className="space-y-1">
        {!isCategoriesView && (
          <button
            onClick={() => onSelectCategory(null)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-sans rounded-lg transition-all text-left cursor-pointer ${
              selectedCategoryId === null
                ? 'bg-[#dcdddd] text-[#1a1c1c] font-semibold'
                : 'text-[#444748] hover:bg-[#e2e2e2]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">grid_view</span>
            <span>All Collections</span>
          </button>
        )}

        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-sans rounded-lg transition-all text-left cursor-pointer ${
                isSelected
                  ? 'bg-[#dcdddd] text-[#1a1c1c] font-semibold'
                  : 'text-[#444748] hover:bg-[#e2e2e2]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{cat.icon || 'folder'}</span>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {isAdmin && onViewAllTags && (
        <div className="mt-auto px-2 pt-8">
          <button
            onClick={onViewAllTags}
            className="w-full text-center py-2.5 border border-[#747878] rounded-lg text-[#000000] text-xs font-medium hover:bg-[#e2e2e2] transition-colors cursor-pointer flex items-center justify-center gap-2 group"
          >
            <span>View All Tags</span>
            <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>
        </div>
      )}
    </aside>
  );
};
