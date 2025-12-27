git add -A
git commit -m "feat: optimize device polling and fix log output

- Add silent polling mode for device detection (no UI flicker)
- Change log level to reduce noise (debug only in debug mode)
- Persist device list using zustand persist middleware
- Add author name to version display"
