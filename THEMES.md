# AutoMIDI Themes

The application now includes 5 distinct visual themes to suit different preferences and environments.

## Available Themes

### 1. Original (Retro)
The classic retro computer aesthetic with vibrant colors.
- **Foreground**: Bright green (#00ff00)
- **Background**: Deep blue gradient (#000080 → #000040)
- **Accents**: Cyan borders, yellow highlights
- **Style**: Classic 80s terminal vibe with VT323 monospace font

### 2. OLED Dark
Perfect for OLED displays with pure black backgrounds to save power and reduce eye strain.
- **Foreground**: Light gray (#e0e0e0)
- **Background**: Pure black (#000000)
- **Accents**: Dark gray borders, white highlights
- **Style**: Minimal, modern, power-efficient

### 3. Outrun
Inspired by synthwave and retrowave aesthetics.
- **Foreground**: Hot magenta (#ff00ff)
- **Background**: Deep purple gradient (#1a0033 → #0d0015)
- **Accents**: Magenta borders, cyan secondary, yellow highlights
- **Style**: Neon 80s Miami nights

### 4. Matrix
Digital rain aesthetic from the Matrix films.
- **Foreground**: Matrix green (#00ff41)
- **Background**: Black with subtle green tint (#000000 → #001100)
- **Accents**: Bright green, darker green secondary
- **Style**: Hacker terminal aesthetic

### 5. Lightsaber
Inspired by Star Wars with blue tones.
- **Foreground**: Light blue (#4da6ff)
- **Background**: Very dark blue (#0a0a1a → #000005)
- **Accents**: Blue borders and highlights
- **Style**: Sci-fi futuristic

## How to Change Themes

1. Click the **Settings** button (gear icon)
2. Scroll to the **THEME** dropdown
3. Select your preferred theme
4. Click **SAVE** to apply

Your theme preference is automatically saved and will persist across sessions.

## UI Improvements

Along with the theme system, the UI has been enhanced with:

- **Better spacing**: Increased margins (20px) and padding (20-25px) for clearer layouts
- **Larger fonts**: Base font size increased to 18px for better readability
- **Improved contrast**: All themes use color combinations tested for readability
- **Enhanced buttons**: Larger (16px font, 10px padding), with hover effects and transitions
- **Better inputs**: Larger (16px font), 2px borders, improved focus states
- **Rounded corners**: 4px border radius on panels and controls for modern look
- **Improved shadows**: Text shadows for better readability, box shadows for depth
- **Consistent styling**: All elements now use theme variables for seamless theme switching

## Technical Details

Themes are implemented using CSS custom properties (CSS variables) that dynamically change based on the selected theme:

- `--fg`: Primary foreground color
- `--fg-secondary`: Secondary text color
- `--bg-start`: Background gradient start
- `--bg-end`: Background gradient end
- `--panel-bg`: Panel background
- `--panel-border`: Border colors
- `--highlight`: Accent/highlight color
- `--button-bg`: Button background
- `--button-hover`: Button hover state
- `--input-bg`: Input field background
- `--input-border`: Input field borders

All colors maintain the retro aesthetic while ensuring good contrast and readability.
