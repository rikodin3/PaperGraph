# PaperGraph Frontend

A modern, interactive web application for exploring academic paper relationships, inspired by **Connected Papers**.

## 🎯 Features

- **Interactive Graph Visualization**: Visualize paper relationships in a force-directed graph
- **Search Papers**: Search for papers by title, authors, or keywords
- **Paper Details Panel**: View comprehensive information about selected papers
- **Responsive Design**: Beautiful UI with gradient styling and smooth interactions
- **Real-time Updates**: Dynamic data loading and graph updates

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## 🚀 Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update the API URL in `.env` to match your backend server:
```
REACT_APP_API_URL=http://localhost:8000/api
```

## 🛠️ Development

Start the development server:
```bash
npm start
```

The application will open automatically in your browser at `http://localhost:3000`.

## 📦 Build for Production

Create an optimized production build:
```bash
npm run build
```

The build files will be generated in the `build/` directory.

## 🏗️ Project Structure

```
frontend/
├── public/
│   └── index.html              # Main HTML file
├── src/
│   ├── components/
│   │   ├── Header.js           # App header with title
│   │   ├── SearchBar.js        # Search input component
│   │   ├── Graph.js            # Force-graph visualization
│   │   └── PaperDetails.js     # Side panel for paper info
│   ├── services/
│   │   └── api.js              # API service layer
│   ├── App.js                  # Main app component
│   ├── index.js                # React entry point
│   └── index.html              # Root HTML
├── .env                        # Environment variables
├── .env.example                # Example environment file
├── package.json                # Dependencies and scripts
└── README.md                   # This file
```

## 🔌 API Endpoints Expected

The frontend expects the backend to provide the following endpoints:

### Search Papers
```
GET /api/papers?query=<search_query>
```
Response:
```json
[
  {
    "id": "paper_id",
    "title": "Paper Title",
    "authors": ["Author 1", "Author 2"],
    "abstract": "Abstract text",
    "year": 2023,
    "citations": 10
  }
]
```

### Get Paper Graph
```
GET /api/papers/<id>/graph?depth=<depth>
```
Response:
```json
{
  "nodes": [
    {"id": "paper_id", "title": "Paper Title", "citations": 10}
  ],
  "links": [
    {"source": "paper_id_1", "target": "paper_id_2"}
  ]
}
```

### Get Paper Details
```
GET /api/papers/<id>
```
Response: Same as search result

### Get Relationships
```
GET /api/papers/<id>/relationships
```
Response:
```json
{
  "cited_by": [...],
  "cites": [...]
}
```

## 🎨 UI Components

### Header
- Application title and branding
- Gradient background styling

### SearchBar
- Input field with placeholder text
- Search button with loading state
- Enter key support
- Real-time search feedback

### Graph
- Force-directed graph visualization using D3.js
- Interactive node dragging
- Pan and zoom controls
- Click to select papers
- Node coloring based on importance
- Responsive sizing

### PaperDetails
- Drawer panel that slides in from the right
- Paper metadata display (title, authors, abstract, year, citations)
- Related papers list
- External link to paper source
- Close button

## 🎨 Styling

- **Color Scheme**: Purple gradient (Main: #667eea, Secondary: #764ba2)
- **Framework**: Material-UI (MUI)
- **Styling**: Material-UI styled components
- **Responsive**: Adapts to all screen sizes

## 📚 Technologies Used

- **React 18**: UI framework
- **Material-UI v5**: Component library
- **Axios**: HTTP client
- **D3.js + react-force-graph-2d**: Graph visualization
- **@emotion/react & @emotion/styled**: CSS-in-JS styling

## 🔄 State Management

The application uses React hooks (useState, useEffect) for state management:
- `selectedPaper`: Currently selected paper
- `graphData`: Graph nodes and links
- `isSearching`: Search loading state
- `isDrawerOpen`: Paper details drawer visibility
- `error`: Error messages
- `isLoadingDetails`: Loading state for paper details

## 🌐 Environment Variables

- `REACT_APP_API_URL`: Base URL for the backend API (default: http://localhost:8000/api)
- `REACT_APP_ENV`: Environment mode (development/production)

## 🧪 Testing

Run tests with:
```bash
npm test
```

## 📝 Available Scripts

- `npm start`: Start development server
- `npm build`: Create production build
- `npm test`: Run tests
- `npm eject`: Eject from Create React App (irreversible)

## 🐛 Troubleshooting

### Port 3000 already in use
Kill the process using port 3000:
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### API connection errors
Ensure the backend server is running and the `REACT_APP_API_URL` in `.env` matches your backend URL.

### Module not found errors
Run `npm install` to ensure all dependencies are installed.

## 📄 License

MIT License

## 👥 Contributing

Feel free to submit issues and enhancement requests!

## 🚀 Next Steps

1. Set up and run the backend API server
2. Configure the API URL in `.env`
3. Start the frontend development server
4. Test the search and graph visualization features
5. Deploy to production when ready

Enjoy exploring academic papers! 📊
