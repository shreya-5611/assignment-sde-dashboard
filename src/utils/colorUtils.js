export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export const rgbToHex = (r, g, b) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

export const adjustColorOpacity = (color, opacity) => {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
};

export const interpolateColor = (color1, color2, factor) => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return color1;
  
  const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor);
  const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor);
  const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor);
  
  return rgbToHex(r, g, b);
};

export const generateColorScale = (startColor, endColor, steps) => {
  const colors = [];
  
  for (let i = 0; i < steps; i++) {
    const factor = i / (steps - 1);
    colors.push(interpolateColor(startColor, endColor, factor));
  }
  
  return colors;
};

export const getContrastColor = (backgroundColor) => {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return '#ffffff';
  
  // Calculate luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

export const darkenColor = (color, factor = 0.2) => {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  return rgbToHex(
    Math.round(rgb.r * (1 - factor)),
    Math.round(rgb.g * (1 - factor)),
    Math.round(rgb.b * (1 - factor))
  );
};

export const lightenColor = (color, factor = 0.2) => {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  return rgbToHex(
    Math.min(255, Math.round(rgb.r + (255 - rgb.r) * factor)),
    Math.min(255, Math.round(rgb.g + (255 - rgb.g) * factor)),
    Math.min(255, Math.round(rgb.b + (255 - rgb.b) * factor))
  );
};

export const generateRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export const getDataVisualizationColors = () => {
  return {
    // Temperature colors (cold to hot)
    temperature: [
      '#1890ff', // Cold blue
      '#13c2c2', // Cool cyan
      '#52c41a', // Moderate green
      '#faad14', // Warm yellow
      '#fa541c', // Hot orange
      '#f5222d'  // Very hot red
    ],
    
    // Humidity colors (dry to humid)
    humidity: [
      '#f5222d', // Very dry red
      '#fa541c', // Dry orange
      '#faad14', // Moderate yellow
      '#52c41a', // Good green
      '#13c2c2', // Humid cyan
      '#1890ff'  // Very humid blue
    ],
    
    // Precipitation colors (none to heavy)
    precipitation: [
      '#d9d9d9', // No precipitation gray
      '#b7eb8f', // Light green
      '#87d068', // Medium green
      '#52c41a', // Good green
      '#1890ff', // Moderate blue
      '#096dd9'  // Heavy blue
    ],
    
    // Wind speed colors (calm to strong)
    windSpeed: [
      '#d9d9d9', // Calm gray
      '#87e8de', // Light cyan
      '#5cdbd3', // Medium cyan
      '#36cfc9', // Strong cyan
      '#13c2c2', // Very strong teal
      '#08979c'  // Extreme teal
    ],
    
    // Generic scale (low to high)
    generic: [
      '#52c41a', // Low green
      '#faad14', // Medium yellow
      '#fa541c', // High orange
      '#f5222d'  // Very high red
    ]
  };
};

export const getColorForDataType = (dataType, value, min, max) => {
  const colors = getDataVisualizationColors();
  const dataColors = colors[dataType] || colors.generic;
  
  if (value === null || value === undefined) {
    return '#666666'; // Gray for no data
  }
  
  // Normalize value to 0-1 range
  const normalizedValue = (value - min) / (max - min);
  const clampedValue = Math.max(0, Math.min(1, normalizedValue));
  
  // Map to color index
  const colorIndex = Math.floor(clampedValue * (dataColors.length - 1));
  const nextColorIndex = Math.min(colorIndex + 1, dataColors.length - 1);
  
  // If exact match, return the color
  if (colorIndex === nextColorIndex) {
    return dataColors[colorIndex];
  }
  
  // Interpolate between two colors
  const factor = (clampedValue * (dataColors.length - 1)) - colorIndex;
  return interpolateColor(dataColors[colorIndex], dataColors[nextColorIndex], factor);
};

export const validateColorRule = (rule) => {
  const errors = [];
  
  if (!rule.color || !rule.color.match(/^#[0-9A-F]{6}$/i)) {
    errors.push('Invalid color format. Use hex format (#RRGGBB)');
  }
  
  if (rule.value === null || rule.value === undefined || isNaN(rule.value)) {
    errors.push('Value must be a valid number');
  }
  
  if (!rule.operator || !['=', '==', '<', '<=', '>', '>='].includes(rule.operator)) {
    errors.push('Invalid operator');
  }
  
  if (rule.operator2 && !['<', '<=', '>', '>='].includes(rule.operator2)) {
    errors.push('Invalid second operator');
  }
  
  if (rule.operator2 && (rule.value2 === null || rule.value2 === undefined || isNaN(rule.value2))) {
    errors.push('Second value must be a valid number when using compound rules');
  }
  
  // Logic validation for compound rules
  if (rule.operator2 && rule.value2 !== undefined) {
    if (rule.operator === '>=' && rule.operator2 === '<' && rule.value >= rule.value2) {
      errors.push('Invalid range: first value must be less than second value');
    }
    if (rule.operator === '>' && rule.operator2 === '<=' && rule.value >= rule.value2) {
      errors.push('Invalid range: first value must be less than second value');
    }
  }
  
  return errors;
};

export default {
  hexToRgb,
  rgbToHex,
  adjustColorOpacity,
  interpolateColor,
  generateColorScale,
  getContrastColor,
  darkenColor,
  lightenColor,
  generateRandomColor,
  getDataVisualizationColors,
  getColorForDataType,
  validateColorRule
};