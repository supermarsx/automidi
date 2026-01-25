# Tauri Window Controls Permission Test

## Prerequisites
This test verifies that the Tauri app has proper permissions for window controls.

## Required Permissions

The following permissions must be in `src-tauri/capabilities/default.json`:

```json
{
  "permissions": [
    "window:allow-minimize",
    "window:allow-maximize",
    "window:allow-toggle-maximize",
    "window:allow-unmaximize",
    "window:allow-close",
    "window:allow-get-current-window"
  ]
}
```

## Verification Steps

### 1. Check Capabilities File

```bash
cat src-tauri/capabilities/default.json
```

Expected output should include all window permissions listed above.

### 2. Run Unit Tests

```bash
npm test -- TitleBar.test.tsx
```

All 9 tests should pass.

### 3. Run Integration Tests

```bash
npm test -- TitleBar.integration.test.tsx
```

Tests will check:
- ✅ Component rendering
- ✅ Button presence and styling
- ✅ Event handlers
- ✅ Error handling
- ✅ Tauri API availability
- ✅ Permission checks (in Tauri environment)
- ✅ Console logging

### 4. Manual Testing in Tauri App

1. Start the app:
   ```bash
   npm run tauri:dev
   ```

2. Open browser DevTools (F12)

3. Click each button and verify console output:

   **Minimize (−):**
   ```
   [TitleBar] Minimize button clicked
   [TitleBar] Tauri API imported
   [TitleBar] Window object obtained
   [TitleBar] Window minimized successfully
   ```

   **Maximize (□):**
   ```
   [TitleBar] Maximize button clicked
   [TitleBar] Tauri API imported
   [TitleBar] Window object obtained
   [TitleBar] Window toggle maximize successfully
   ```

   **Close (✕):**
   ```
   [TitleBar] Close button clicked
   [TitleBar] Tauri API imported
   [TitleBar] Window object obtained
   [TitleBar] Window closed successfully
   ```

### 5. Test Permission Errors

If permissions are missing, you'll see errors like:

```
Error: Permission denied: window:allow-minimize
```

Or:

```
Error: Command not allowed: minimize
```

## Common Issues

### Issue 1: "Cannot find module '@tauri-apps/api/window'"

**Solution:**
```bash
npm install --save-dev @tauri-apps/api
```

### Issue 2: Permission errors

**Solution:** Add missing permissions to `src-tauri/capabilities/default.json`

### Issue 3: Buttons don't respond

**Checklist:**
- [ ] `@tauri-apps/api` installed
- [ ] All window permissions in capabilities file
- [ ] App running in Tauri (not browser)
- [ ] `decorations: false` in tauri.conf.json
- [ ] CSS drag regions configured properly

### Issue 4: Window doesn't respond but no errors

**Possible causes:**
- Button has `-webkit-app-region: drag` (should be `no-drag`)
- Event propagation not stopped
- Button inside draggable area

**Solution:** Check TitleBar.css:
```css
.titlebar-button {
  -webkit-app-region: no-drag;
}
```

## Build and Deploy Testing

### Development Build
```bash
npm run build
npm run tauri:dev
```

### Production Build
```bash
npm run tauri:build
```

Then test the compiled app in `src-tauri/target/release/`.

## CI/CD Considerations

For automated testing:
1. Unit tests run without Tauri environment
2. Integration tests detect Tauri availability
3. Manual verification required for actual window operations

## Debugging Commands

### Check Tauri version
```bash
npm run tauri:info
```

### Check capabilities schema
```bash
cat src-tauri/gen/schemas/desktop-schema.json | grep window
```

### Rebuild Tauri app
```bash
cd src-tauri
cargo clean
cargo build
```

## Expected Results

- **All unit tests pass**: Confirms component logic
- **All integration tests pass**: Confirms API integration
- **Manual test succeeds**: Confirms permissions and runtime behavior
- **No console errors**: Confirms proper error handling

## Reporting Issues

If tests fail, provide:
1. Test output
2. Console errors
3. `tauri.conf.json` contents
4. `capabilities/default.json` contents
5. Tauri version (`npm run tauri:info`)
