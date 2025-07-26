import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CustomColors, FormTheme } from '@/types/form-builder';
import { Palette, RotateCcw, Pipette } from 'lucide-react';
import { getThemeGradientPresets } from '@/utils/theme-gradient-presets';
import { extractThemeColors } from '@/utils/theme-color-utils';
import { cn } from '@/lib/utils';

interface ColorCustomizerProps {
  theme: FormTheme;
  onColorsChange: (colors: CustomColors) => void;
  onResetColors: () => void;
}

export function ColorCustomizer({ theme, onColorsChange, onResetColors }: ColorCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeColorType, setActiveColorType] = useState<'primary' | 'secondary' | 'background'>('primary');
  
  // Get theme defaults as base colors
  const themeDefaults = extractThemeColors(theme);
  
  // Get current colors (either custom or defaults)
  const currentColors = theme.customColors || themeDefaults;
  const [colors, setColors] = useState<CustomColors>(currentColors);

  // Get theme-specific gradient presets
  const gradientPresets = getThemeGradientPresets(theme.id);

  useEffect(() => {
    // Update colors when theme changes
    const newColors = theme.customColors || extractThemeColors(theme);
    setColors(newColors);
  }, [theme]);

  const handleColorChange = (colorType: keyof CustomColors, value: string) => {
    const newColors = { ...colors, [colorType]: value };
    // Clear gradient if setting solid color
    if (colorType === 'primary' || colorType === 'secondary' || colorType === 'background') {
      delete newColors[`${colorType}Gradient` as keyof CustomColors];
    }
    setColors(newColors);
    onColorsChange(newColors);
  };

  const handleGradientSelect = (colorType: 'primary' | 'secondary' | 'background', gradient: string) => {
    const newColors = { 
      ...colors, 
      [`${colorType}Gradient` as keyof CustomColors]: gradient 
    };
    setColors(newColors);
    onColorsChange(newColors);
  };

  const handleReset = () => {
    const defaultColors = extractThemeColors(theme);
    setColors(defaultColors);
    onResetColors();
    setIsOpen(false);
  };

  const solidColors = {
    primary: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'],
    secondary: ['#6B7280', '#64748B', '#374151', '#4B5563', '#71717A', '#525252'],
    background: ['#FFFFFF', '#F9FAFB', '#F3F4F6', '#E5E7EB', '#0F172A', '#18181B']
  };

  // Get active value (gradient or solid color)
  const getActiveValue = (colorType: 'primary' | 'secondary' | 'background') => {
    const gradientKey = `${colorType}Gradient` as keyof CustomColors;
    return colors[gradientKey] || colors[colorType];
  };

  // Create preview styles
  const previewStyles = {
    primary: colors.primaryGradient 
      ? { background: colors.primaryGradient }
      : { backgroundColor: colors.primary },
    secondary: colors.secondaryGradient
      ? { background: colors.secondaryGradient }
      : { backgroundColor: colors.secondary },
    background: colors.backgroundGradient
      ? { background: colors.backgroundGradient }
      : { backgroundColor: colors.background }
  };

  const colorTypeConfig = {
    primary: {
      label: 'Primary',
      description: 'Buttons & interactive elements',
      icon: '🎯'
    },
    secondary: {
      label: 'Secondary', 
      description: 'Labels & text',
      icon: '📝'
    },
    background: {
      label: 'Background',
      description: 'Form background',
      icon: '🎨'
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="default" 
          className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-purple-200 hover:border-purple-300"
        >
          <div className="flex -space-x-1">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-pink-500 to-orange-500" />
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-500 to-teal-500" />
          </div>
          <span className="font-medium">Customize Colors</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl">Customize Colors</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Color Type Selection */}
          <div className="w-64 border-r bg-muted/30 p-4 space-y-2">
            {(Object.keys(colorTypeConfig) as Array<keyof typeof colorTypeConfig>).map((type) => (
              <button
                key={type}
                onClick={() => setActiveColorType(type)}
                className={cn(
                  "w-full text-left p-4 rounded-lg transition-all",
                  "hover:bg-accent/50",
                  activeColorType === type && "bg-accent shadow-sm"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{colorTypeConfig[type].icon}</span>
                  <div>
                    <p className="font-medium">{colorTypeConfig[type].label}</p>
                    <p className="text-xs text-muted-foreground">
                      {colorTypeConfig[type].description}
                    </p>
                  </div>
                </div>
                <div 
                  className="mt-2 h-2 rounded-full w-full"
                  style={type === 'primary' ? previewStyles.primary : 
                         type === 'secondary' ? previewStyles.secondary : 
                         previewStyles.background}
                />
              </button>
            ))}
          </div>

          {/* Right Panel - Color Options */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Custom Color Input */}
            <div className="mb-6">
              <Label className="text-sm font-medium mb-3 block">Custom Color</Label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    value={colors[activeColorType]}
                    onChange={(e) => handleColorChange(activeColorType, e.target.value)}
                    placeholder="#000000"
                    className="pl-10"
                  />
                  <Pipette className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  type="color"
                  value={colors[activeColorType]}
                  onChange={(e) => handleColorChange(activeColorType, e.target.value)}
                  className="w-20 h-10 cursor-pointer p-1"
                />
              </div>
            </div>

            {/* Solid Colors */}
            <div className="mb-6">
              <Label className="text-sm font-medium mb-3 block">Solid Colors</Label>
              <div className="grid grid-cols-4 gap-3">
                {solidColors[activeColorType].map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(activeColorType, color)}
                    className={cn(
                      "h-12 rounded-lg border-2 transition-all",
                      "hover:scale-105 hover:shadow-md",
                      colors[activeColorType] === color && !colors[`${activeColorType}Gradient` as keyof CustomColors]
                        ? "border-primary ring-2 ring-primary/20" 
                        : "border-gray-200"
                    )}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Gradient Presets */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                {theme.name} Gradients
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {gradientPresets[activeColorType].map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handleGradientSelect(activeColorType, preset.gradient)}
                    className={cn(
                      "p-4 rounded-lg border-2 transition-all text-left",
                      "hover:scale-[1.02] hover:shadow-md",
                      colors[`${activeColorType}Gradient` as keyof CustomColors] === preset.gradient
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-gray-200"
                    )}
                  >
                    <div className={`h-12 rounded-md mb-2 ${preset.preview}`} />
                    <p className="text-sm font-medium">{preset.name}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="border-t bg-muted/30 p-6">
          <div className="max-w-md mx-auto">
            <Label className="text-sm font-medium mb-3 block">Preview</Label>
            <div className="p-6 rounded-lg shadow-sm" style={previewStyles.background}>
              <h3 className="text-lg font-semibold mb-4" style={previewStyles.secondary}>
                Sample Form
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={previewStyles.secondary}>
                    Your Name
                  </label>
                  <input 
                    type="text" 
                    placeholder="Enter your name"
                    className="w-full p-2 border rounded-md"
                    style={{ borderColor: colors.primary }}
                  />
                </div>
                <button 
                  className="w-full py-2 px-4 rounded-md text-white font-medium shadow-sm"
                  style={previewStyles.primary}
                >
                  Submit Form
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t">
          <Button
            variant="ghost"
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button onClick={() => setIsOpen(false)}>
            Apply Colors
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}