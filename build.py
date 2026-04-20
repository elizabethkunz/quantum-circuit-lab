from pathlib import Path

root = Path(__file__).resolve().parent
template = (root / "quantum_lab-8.template.html").read_text()

keys = ["view-lab", "view-learn", "view-templates", "view-docs"]
out = template
for k in keys:
    frag = (root / "tabs" / f"{k}.html").read_text().rstrip()
    out = out.replace(f"{{{{{k}}}}}", frag)

# GitHub-friendly primary output
index_out = root / "index.html"
index_out.write_text(out + "\n")

# Keep legacy filename for local continuity
legacy_out = root / "quantum_lab-8 copy.html"
legacy_out.write_text(out + "\n")

print(f"Built: {index_out}")
print(f"Built: {legacy_out}")
