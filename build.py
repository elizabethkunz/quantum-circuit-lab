from pathlib import Path

root = Path(__file__).resolve().parent
template = (root / "quantum_lab-8.template.html").read_text()

keys = ["view-lab", "view-learn", "view-templates", "view-docs"]
out = template
for k in keys:
    frag = (root / "tabs" / f"{k}.html").read_text().rstrip()
    out = out.replace(f"{{{{{k}}}}}", frag)

output = root / "quantum_lab-8 copy.html"
output.write_text(out + "\n")
print(f"Built: {output}")
