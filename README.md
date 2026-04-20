# quantum_lab-8 split source

Edit smaller files in `tabs/` instead of one giant HTML file.

## Files
- `tabs/view-lab.html`
- `tabs/view-learn.html`
- `tabs/view-templates.html`
- `tabs/view-docs.html`
- `quantum_lab-8.template.html` (main shell with placeholders)
- `build.py` (rebuild full runnable html)

## Build
Run:

```bash
python3 build.py
```

This regenerates:
- `quantum_lab-8 copy.html` (inside this folder)

If you want it in Downloads root, copy or move that file after build.
