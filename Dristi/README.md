# Drishti

This file contains a short project overview, a readable ASCII/Markdown directory tree, a file summary (sizes & last-modified times) and a short CONTRIBUTING/usage section.

## Quick start (Windows PowerShell)

1. Install dependencies:

```powershell
cd "d:\Machine Learning\Drishtie\Drishti\Dristi"
npm install
```

2. Start development server:

```powershell
npm run dev
```

3. Open the app in your browser (Vite will show the URL, usually http://localhost:5173).

---

## Directory tree 

```
Dristi/
├─ .gitignore                  # Git ignore rules
├─ eslint.config.js            # ESLint config
├─ index.html                  # Vite HTML entry
├─ package.json                # npm scripts & deps
├─ package-lock.json           # lockfile for reproducible installs
├─ README.md                   # (this file)
├─ vite.config.js              # Vite config
├─ public/
│  └─ vite.svg                 # public asset
└─ src/
	├─ .env                     # environment variables
	├─ App.jsx                  # root React component
	├─ App.css
	├─ Chatbot.jsx
	├─ index.js
	├─ main.jsx
	├─ index.css
	├─ assets/
	│  └─ react.svg
	├─ components/
	│  ├─ AttackPathGraph.jsx
	│  ├─ Chatbot.jsx
	│  ├─ CommentsPanel.jsx
	│  ├─ DiffView.jsx
	│  ├─ FindingDrawer.jsx
	│  ├─ Footer.jsx
	│  ├─ Header.jsx
	│  ├─ Heatmap.jsx
	│  ├─ ModelPanel.jsx
	│  ├─ ReportComposer.jsx
	│  ├─ ResultsTable.jsx
	│  ├─ ScanControls.jsx
	│  └─ TimelineSelector.jsx
	├─ context/
	│  └─ AppContext.jsx
	├─ data/
	│  ├─ dummyData.json
	│  ├─ mockResults.js
	│  └─ state.json
	├─ hooks/
	│  ├─ useChatbot.js
	│  └─ useScanner.js
	├─ lib/
	│  ├─ graphPlanner.js
	│  ├─ mockApi.js
	│  ├─ riskRetrieval.js
	│  └─ verifier.js
	├─ pages/
	│  └─ Dashboard.jsx
	├─ styles/
	│  └─ global.css
	└─ utils/
		└─ api.js
```

 

## CONTRIBUTING & usage notes

- To run the app locally: install dependencies and run `npm run dev`.
- Linting: `npm run lint` (requires node_modules installed).
- Build for production: `npm run build` then `npm run preview` to serve the build locally.

If you want to connect a real backend instead of the mock, replace `src/lib/mockApi.js` and update `src/utils/api.js` accordingly. Consider adding unit tests and switching to TypeScript for better maintainability.


