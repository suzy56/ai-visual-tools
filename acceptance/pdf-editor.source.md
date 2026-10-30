---
name: pdf-editor
category: document-processing
description: This skill should be used when users need to manipulate PDF documents including rotation, merging, text extraction, compression, and form filling. It provides deterministic Python scripts for reliable PDF operations.
---

# PDF Editor Skill

## Overview
This skill enables Claude to perform various PDF manipulation tasks using bundled Python scripts that ensure consistent, reliable results.

## Quick Start
To use this skill, identify the PDF operation needed and execute the appropriate script:

1. **Rotation**: Use `scripts/rotate_pdf.py` with angle parameter
2. **Merging**: Use `scripts/merge_pdfs.py` with file list
3. **Text Extraction**: Use `scripts/extract_text.py` for OCR and text output
4. **Compression**: Use `scripts/compress_pdf.py` with quality settings

## Script Reference

### rotate_pdf.py
```python
import PyPDF2
import sys

def rotate_pdf(input_path, output_path, angle):
    """Rotate PDF pages by specified angle (90, 180, 270)."""
    with open(input_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        writer = PyPDF2.PdfWriter()
        
        for page in reader.pages:
            page.rotate(angle)
            writer.add_page(page)
        
        with open(output_path, 'wb') as output_file:
            writer.write(output_file)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: rotate_pdf.py <input.pdf> <output.pdf> <angle>")
        sys.exit(1)
    
    rotate_pdf(sys.argv[1], sys.argv[2], int(sys.argv[3]))
