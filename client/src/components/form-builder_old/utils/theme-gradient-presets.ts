export interface GradientPreset {
  name: string;
  gradient: string;
  preview: string;
}

export interface ThemeGradientPresets {
  primary: GradientPreset[];
  secondary: GradientPreset[];
  background: GradientPreset[];
}

// Theme-specific gradient presets
export const getThemeGradientPresets = (themeId: string): ThemeGradientPresets => {
  switch (themeId) {
    case 'minimal':
      return {
        primary: [
          { name: 'Subtle Gray', gradient: 'linear-gradient(135deg, #374151 0%, #1F2937 100%)', preview: 'bg-gradient-to-br from-gray-700 to-gray-900' },
          { name: 'Blue Steel', gradient: 'linear-gradient(135deg, #64748B 0%, #334155 100%)', preview: 'bg-gradient-to-br from-slate-500 to-slate-800' },
          { name: 'Charcoal', gradient: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)', preview: 'bg-gradient-to-br from-gray-800 to-gray-900' },
        ],
        secondary: [
          { name: 'Light Gray', gradient: 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)', preview: 'bg-gradient-to-br from-gray-400 to-gray-500' },
          { name: 'Silver', gradient: 'linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%)', preview: 'bg-gradient-to-br from-gray-200 to-gray-300' },
        ],
        background: [
          { name: 'Clean White', gradient: 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)', preview: 'bg-gradient-to-br from-white to-gray-50' },
          { name: 'Soft Gray', gradient: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)', preview: 'bg-gradient-to-br from-gray-50 to-gray-100' },
        ]
      };
    
    case 'modern':
      return {
        primary: [
          { name: 'Purple Dream', gradient: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)', preview: 'bg-gradient-to-br from-purple-500 to-pink-500' },
          { name: 'Blue Violet', gradient: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)', preview: 'bg-gradient-to-br from-blue-500 to-purple-500' },
          { name: 'Sunset', gradient: 'linear-gradient(135deg, #F59E0B 0%, #EC4899 100%)', preview: 'bg-gradient-to-br from-amber-500 to-pink-500' },
        ],
        secondary: [
          { name: 'Cool Gray', gradient: 'linear-gradient(135deg, #6B7280 0%, #374151 100%)', preview: 'bg-gradient-to-br from-gray-500 to-gray-700' },
          { name: 'Blue Gray', gradient: 'linear-gradient(135deg, #64748B 0%, #475569 100%)', preview: 'bg-gradient-to-br from-slate-500 to-slate-600' },
        ],
        background: [
          { name: 'Aurora', gradient: 'linear-gradient(135deg, #F8FAFC 0%, #E0E7FF 50%, #FCE7F3 100%)', preview: 'bg-gradient-to-br from-slate-50 via-indigo-100 to-pink-100' },
          { name: 'Morning Sky', gradient: 'linear-gradient(135deg, #DBEAFE 0%, #FEE2E2 100%)', preview: 'bg-gradient-to-br from-blue-100 to-red-100' },
        ]
      };
    
    case 'neon':
      return {
        primary: [
          { name: 'Cyber Green', gradient: 'linear-gradient(135deg, #00FF88 0%, #00D9FF 100%)', preview: 'bg-gradient-to-br from-green-400 to-cyan-400' },
          { name: 'Electric Blue', gradient: 'linear-gradient(135deg, #00D9FF 0%, #0066FF 100%)', preview: 'bg-gradient-to-br from-cyan-400 to-blue-600' },
          { name: 'Neon Pink', gradient: 'linear-gradient(135deg, #FF006E 0%, #FF4E50 100%)', preview: 'bg-gradient-to-br from-pink-500 to-red-500' },
        ],
        secondary: [
          { name: 'Glow Cyan', gradient: 'linear-gradient(135deg, #00D9FF 0%, #00A8CC 100%)', preview: 'bg-gradient-to-br from-cyan-400 to-cyan-600' },
          { name: 'Electric Purple', gradient: 'linear-gradient(135deg, #B026FF 0%, #7C3AED 100%)', preview: 'bg-gradient-to-br from-purple-500 to-purple-600' },
        ],
        background: [
          { name: 'Dark Matrix', gradient: 'linear-gradient(135deg, #0A0A0A 0%, #001F1F 100%)', preview: 'bg-gradient-to-br from-black to-teal-950' },
          { name: 'Deep Space', gradient: 'linear-gradient(135deg, #000000 0%, #0F0F23 100%)', preview: 'bg-gradient-to-br from-black to-indigo-950' },
        ]
      };
    
    case 'nature':
      return {
        primary: [
          { name: 'Forest', gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)', preview: 'bg-gradient-to-br from-emerald-600 to-emerald-700' },
          { name: 'Meadow', gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', preview: 'bg-gradient-to-br from-emerald-500 to-emerald-600' },
          { name: 'Moss', gradient: 'linear-gradient(135deg, #84CC16 0%, #059669 100%)', preview: 'bg-gradient-to-br from-lime-500 to-emerald-600' },
        ],
        secondary: [
          { name: 'Earth', gradient: 'linear-gradient(135deg, #92400E 0%, #78350F 100%)', preview: 'bg-gradient-to-br from-amber-800 to-amber-900' },
          { name: 'Leaf', gradient: 'linear-gradient(135deg, #047857 0%, #064E3B 100%)', preview: 'bg-gradient-to-br from-emerald-700 to-emerald-900' },
        ],
        background: [
          { name: 'Morning Dew', gradient: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)', preview: 'bg-gradient-to-br from-green-50 to-green-100' },
          { name: 'Misty Forest', gradient: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', preview: 'bg-gradient-to-br from-emerald-50 to-emerald-100' },
        ]
      };
    
    case 'luxury':
      return {
        primary: [
          { name: 'Gold Shimmer', gradient: 'linear-gradient(135deg, #D97706 0%, #F59E0B 50%, #D97706 100%)', preview: 'bg-gradient-to-br from-amber-600 via-amber-500 to-amber-600' },
          { name: 'Rose Gold', gradient: 'linear-gradient(135deg, #B91C1C 0%, #D97706 100%)', preview: 'bg-gradient-to-br from-red-700 to-amber-600' },
          { name: 'Royal Gold', gradient: 'linear-gradient(135deg, #A16207 0%, #FCD34D 50%, #A16207 100%)', preview: 'bg-gradient-to-br from-yellow-700 via-amber-300 to-yellow-700' },
        ],
        secondary: [
          { name: 'Bronze', gradient: 'linear-gradient(135deg, #92400E 0%, #451A03 100%)', preview: 'bg-gradient-to-br from-amber-800 to-amber-950' },
          { name: 'Dark Amber', gradient: 'linear-gradient(135deg, #78350F 0%, #451A03 100%)', preview: 'bg-gradient-to-br from-amber-900 to-amber-950' },
        ],
        background: [
          { name: 'Black Velvet', gradient: 'linear-gradient(135deg, #0F0A02 0%, #000000 100%)', preview: 'bg-gradient-to-br from-amber-950 to-black' },
          { name: 'Midnight', gradient: 'linear-gradient(135deg, #18181B 0%, #09090B 100%)', preview: 'bg-gradient-to-br from-zinc-900 to-zinc-950' },
        ]
      };
    
    case 'cosmic':
      return {
        primary: [
          { name: 'Nebula', gradient: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #8B5CF6 100%)', preview: 'bg-gradient-to-br from-purple-500 via-pink-500 to-purple-500' },
          { name: 'Galaxy', gradient: 'linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)', preview: 'bg-gradient-to-br from-purple-600 to-pink-600' },
          { name: 'Supernova', gradient: 'linear-gradient(135deg, #F59E0B 0%, #EC4899 50%, #8B5CF6 100%)', preview: 'bg-gradient-to-br from-amber-500 via-pink-500 to-purple-500' },
        ],
        secondary: [
          { name: 'Stardust', gradient: 'linear-gradient(135deg, #A855F7 0%, #E879F9 100%)', preview: 'bg-gradient-to-br from-purple-500 to-fuchsia-400' },
          { name: 'Cosmic Ray', gradient: 'linear-gradient(135deg, #C084FC 0%, #F0ABFC 100%)', preview: 'bg-gradient-to-br from-purple-400 to-fuchsia-300' },
        ],
        background: [
          { name: 'Deep Space', gradient: 'linear-gradient(135deg, #0F0F23 0%, #1E1B4B 50%, #0F0F23 100%)', preview: 'bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-950' },
          { name: 'Void', gradient: 'linear-gradient(135deg, #030712 0%, #1E1B4B 100%)', preview: 'bg-gradient-to-br from-gray-950 to-indigo-900' },
        ]
      };
    
    case 'brutalist':
      return {
        primary: [
          { name: 'Pure Black', gradient: 'linear-gradient(135deg, #000000 0%, #000000 100%)', preview: 'bg-black' },
          { name: 'Dark Gray', gradient: 'linear-gradient(135deg, #374151 0%, #000000 100%)', preview: 'bg-gradient-to-br from-gray-700 to-black' },
          { name: 'Concrete', gradient: 'linear-gradient(135deg, #6B7280 0%, #374151 100%)', preview: 'bg-gradient-to-br from-gray-500 to-gray-700' },
        ],
        secondary: [
          { name: 'Steel', gradient: 'linear-gradient(135deg, #4B5563 0%, #374151 100%)', preview: 'bg-gradient-to-br from-gray-600 to-gray-700' },
          { name: 'Iron', gradient: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)', preview: 'bg-gradient-to-br from-gray-500 to-gray-600' },
        ],
        background: [
          { name: 'White', gradient: 'linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 100%)', preview: 'bg-white' },
          { name: 'Light Gray', gradient: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)', preview: 'bg-gradient-to-br from-gray-50 to-gray-100' },
        ]
      };
    
    default:
      // Default gradients for other themes
      return {
        primary: [
          { name: 'Ocean', gradient: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)', preview: 'bg-gradient-to-br from-blue-500 to-blue-800' },
          { name: 'Sunset', gradient: 'linear-gradient(135deg, #F59E0B 0%, #DC2626 100%)', preview: 'bg-gradient-to-br from-amber-500 to-red-600' },
          { name: 'Forest', gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', preview: 'bg-gradient-to-br from-emerald-500 to-emerald-600' },
        ],
        secondary: [
          { name: 'Cool Gray', gradient: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)', preview: 'bg-gradient-to-br from-gray-500 to-gray-600' },
          { name: 'Warm Gray', gradient: 'linear-gradient(135deg, #78716C 0%, #57534E 100%)', preview: 'bg-gradient-to-br from-stone-500 to-stone-600' },
        ],
        background: [
          { name: 'Light', gradient: 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)', preview: 'bg-gradient-to-br from-white to-gray-50' },
          { name: 'Soft', gradient: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)', preview: 'bg-gradient-to-br from-gray-50 to-gray-100' },
        ]
      };
  }
};