# Devils of Esseg - Character Viewer

A web application for viewing character files in an interactive flipbook format.

## Project Structure

```
ve-cs/
├── index.html          # Main HTML file
├── css/
│   └── style.css      # Stylesheet
├── js/
│   └── script.js      # JavaScript functionality
├── README.md          # Project documentation
└── .gitignore         # Git ignore file
```

## Features

- Character card grid display
- Interactive flipbook viewer using Turn.js
- Modal-based character file viewing
- Keyboard navigation (Arrow keys, Escape)
- Responsive design

## Setup

1. Open `index.html` in a web browser
2. Click on any character card to view their file
3. Use arrow keys or navigation buttons to flip through pages
4. Press Escape or click outside the modal to close

## Dependencies

- jQuery 3.6.0 (via CDN)
- Turn.js 3 (via CDN)

## Character Data

Character data is loaded from JSON files. Update the `characters` array in `js/script.js` to add or modify characters.
