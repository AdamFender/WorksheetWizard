# Worksheet Generator (Frontend)

A lightweight, browser-first worksheet generator for teachers & students. No server required — open `index.html` and start creating.

## Features
- Multiple worksheet templates: Math, Multiple Choice, Vocabulary, Reading Comprehension, Matching, Fill-in-the-Blanks
- Live preview with inline edit (contenteditable) — teachers can tweak questions directly
- Multiple creative themes (Chalkboard, Pastel, Minimal)
- PDF export (via html2pdf), Print-friendly layout
- Save/Load worksheet as JSON (keeps edits)
- Responsive and print-optimized

## How to use
1. Clone or download the repo.
2. Open `index.html` in a modern browser (Chrome/Edge/Firefox).
3. Choose a template, number of questions, difficulty, and theme.
4. Click **Generate**. Edit questions directly in the preview.
5. Export to PDF or Print.
6. Save JSON to keep a copy of edits.

## Customize
- Edit `app.js` to add new templates or customize question-generation logic.
- Modify `styles.css` to change visual styles, fonts, or print margins.
- Add more complex generators (crossword/word search) or integrate with a small backend to fetch teacher-provided content.

## Licensing
MIT License — adapt however you like.