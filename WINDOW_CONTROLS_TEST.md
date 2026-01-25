# Window Controls Testing Guide

## Manual Testing Steps

### 1. Minimize Button Test
1. Launch the app with `npm run tauri:dev`
2. Open browser DevTools (F12)
3. Click the minimize button (−)
4. **Expected**: Window minimizes to taskbar
5. **Check Console**: Should see:
   ```
   [TitleBar] Minimize button clicked
   [TitleBar] Window object obtained: [object]
   [TitleBar] Window minimized successfully
   ```

### 2. Maximize/Restore Button Test
1. With app running, click the maximize button (□)
2. **Expected**: Window maximizes to full screen
3. Click the maximize button again
4. **Expected**: Window restores to previous size
5. **Check Console**: Should see:
   ```
   [TitleBar] Maximize button clicked
   [TitleBar] Window object obtained: [object]
   [TitleBar] Window toggle maximize successfully
   ```

### 3. Close Button Test
1. With app running, click the close button (✕)
2. **Expected**: Window closes and app exits
3. **Check Console**: Should see:
   ```
   [TitleBar] Close button clicked
   [TitleBar] Window object obtained: [object]
   [TitleBar] Window closed successfully
   ```

### 4. Dragging Test
1. Click and drag on the title area (where "◄ AutoMIDI v2.0 ►" is displayed)
2. **Expected**: Window moves with cursor
3. **Verify**: Buttons remain clickable (not affected by drag region)

## Automated Testing

Run the test suite:
```powershell
npm test -- TitleBar.test.tsx
```

### Test Coverage
- ✅ Renders all window controls
- ✅ Minimize functionality
- ✅ Maximize/restore functionality
- ✅ Close functionality
- ✅ Error handling for missing Tauri API
- ✅ Error handling for failed operations
- ✅ Event propagation prevention

## Troubleshooting

### If buttons don't work:

1. **Check Tauri API availability**:
   ```javascript
   console.log('Tauri:', window.__TAURI__);
   console.log('Window API:', window.__TAURI__?.window);
   ```

2. **Verify button clicks are registering**:
   - Open DevTools Console
   - Click buttons
   - Look for `[TitleBar] ... button clicked` messages

3. **Check for CSS issues**:
   - Buttons should have `-webkit-app-region: no-drag`
   - Title area should have `-webkit-app-region: drag`

4. **Verify Tauri configuration**:
   - Check `tauri.conf.json`: `decorations: false`
   - Window must not have native decorations

### Common Issues

**Issue**: Buttons don't respond to clicks
- **Cause**: Drag region covers buttons
- **Fix**: Ensure buttons have `app-region: no-drag` CSS

**Issue**: "Tauri API not available" warning
- **Cause**: Running in browser instead of Tauri
- **Fix**: Use `npm run tauri:dev` not `npm run dev`

**Issue**: Error: "getCurrentWindow is not a function"
- **Cause**: Wrong API method name
- **Fix**: Use `getCurrentWindow()` not `getCurrent()`

**Issue**: Window minimizes but buttons stop working
- **Cause**: Event listeners lost on minimize
- **Fix**: Already handled in current implementation

## Performance Metrics

Expected response times:
- **Minimize**: < 50ms
- **Maximize**: < 50ms  
- **Close**: < 100ms

Monitor with:
```javascript
console.time('minimize');
// click minimize
console.timeEnd('minimize');
```
