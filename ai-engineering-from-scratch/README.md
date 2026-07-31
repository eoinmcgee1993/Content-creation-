# ai-engineering-from-scratch

Generates the LEXIS OS quarterly emagazine as a PDF.

## Usage

```
# Clone/navigate to your repo
cd ai-engineering-from-scratch

# Install dependencies
npm install

# Generate the PDF
npm run generate

# Output: ./dist/LEXIS_OS_Emagazine_Q3_2026.pdf
```

## What it does

`src/generate.js` uses [pdfkit](https://pdfkit.org/) to lay out a 7-page
emagazine: a cover, a table of contents, four articles, and a closing page.
Content and styling live in that one file — edit the `articles` array to
change copy, or the `COLORS` object to change the palette.
