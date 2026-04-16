# PaperGraph - Connected Papers Mini Clone

A full-stack application for exploring academic paper relationships through interactive graph visualization, inspired by **Connected Papers**.

## 📋 Project Overview

PaperGraph allows users to:
- Search for academic papers by title, authors, or keywords
- Visualize relationships between papers in an interactive force-directed graph
- Explore paper metadata and related research
- Navigate through connected papers seamlessly

## 🏗️ Architecture

```
PaperGraph/
├── backend/                 # Python FastAPI backend
│   ├── main.py             # Main application entry
│   ├── db.py               # Database models
│   ├── schemas.py          # Pydantic schemas
│   ├── config.py           # Configuration
│   └── README.md           # Backend documentation
├── frontend/               # React.js frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API service layer
│   │   ├── App.js          # Main app component
│   │   └── index.js        # Entry point
│   ├── public/             # Static files
│   ├── package.json        # Dependencies
│   └── README.md           # Frontend documentation
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm 6+

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the server:
```bash
python main.py
```

The backend will start at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm start
```

The frontend will open at `http://localhost:3000`

## 🎯 Features

### Backend
- ✅ RESTful API endpoints for paper search and graph data
- ✅ Database models for papers and relationships
- ✅ Graph traversal for paper connections
- ✅ Search functionality with filtering
- ✅ CORS support for frontend integration

### Frontend
- ✅ Modern React application with hooks
- ✅ Interactive force-directed graph visualization
- ✅ Real-time search with autocomplete support
- ✅ Paper details side panel
- ✅ Responsive design with Material-UI
- ✅ Gradient-based modern UI
- ✅ Error handling and loading states

## 📡 API Documentation

### Key Endpoints

#### Search Papers
```
GET /api/papers?query=<search_query>
```

#### Get Paper Graph
```
GET /api/papers/<id>/graph?depth=<depth>
```

#### Get Paper Details
```
GET /api/papers/<id>
```

#### Get Paper Relationships
```
GET /api/papers/<id>/relationships
```

## 🎨 UI/UX Design

- **Color Scheme**: Purple gradient (#667eea - #764ba2)
- **Framework**: Material-UI v5
- **Graph Library**: D3.js with react-force-graph-2d
- **Responsive**: Mobile-friendly design
- **Accessibility**: Semantic HTML and ARIA labels

## 🔧 Technology Stack

### Backend
- Python 3.8+
- FastAPI
- SQLAlchemy
- Pydantic
- SQLite (development) / PostgreSQL (production)

### Frontend
- React 18
- Material-UI v5
- D3.js
- Axios
- Emotion (styled components)

## 📊 Data Models

### Paper
```python
{
  "id": str,
  "title": str,
  "authors": list,
  "abstract": str,
  "year": int,
  "citations": int,
  "url": str (optional)
}
```

### Relationship
```python
{
  "source_id": str,
  "target_id": str,
  "type": str (e.g., "cites", "cited_by")
}
```

## 🔄 Data Flow

1. User enters search query in SearchBar
2. Frontend calls `/api/papers?query=<search>`
3. Backend searches database and returns results
4. User clicks on a result to select it
5. Frontend calls `/api/papers/<id>/graph?depth=2`
6. Backend builds graph data with relationships
7. Graph component renders interactive visualization
8. User clicks on a node in the graph
9. Frontend calls `/api/papers/<id>` for details
10. PaperDetails panel displays information

## 📦 Environment Variables

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_ENV=development
```

### Backend (.env)
```
DATABASE_URL=sqlite:///./test.db
DEBUG=True
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚀 Deployment

### Frontend
Deploy to Netlify, Vercel, or AWS S3:
```bash
npm run build
```

### Backend
Deploy to Heroku, AWS EC2, or Digital Ocean

See respective README files in `backend/` and `frontend/` for detailed deployment instructions.

## 📝 Development Checklist

- [x] Frontend structure and components
- [x] API service layer integration
- [x] Graph visualization
- [x] Search functionality
- [x] Paper details panel
- [ ] Backend API implementation
- [ ] Database population with sample data
- [ ] User authentication (optional)
- [ ] Advanced search filters
- [ ] Paper bookmarking/favorites
- [ ] Export functionality

## 🐛 Known Issues

- Some vulnerabilities in dependencies (moderate severity) - related to transitive dependencies
- Network requests require a running backend server

## 📞 Support

For issues or questions:
1. Check the backend and frontend README files
2. Review the API documentation
3. Check browser console for errors
4. Verify environment variables are set correctly

## 📄 License

MIT License

## 🙏 Acknowledgments

- Inspired by [Connected Papers](https://www.connectedpapers.com/)
- Uses Material-UI for component design
- D3.js for graph visualization

---

**Happy coding! Explore the world of academic papers! 🚀📚**