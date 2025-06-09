# GENEHIVE 🧬

**AI-Powered 3D Genetic Risk Simulator**

GENEHIVE is a full-stack web application that simulates and visualizes how hereditary diseases propagate across family generations. It combines intuitive UI design, genetic risk algorithms, and AI-driven explanations to help users understand genetic inheritance patterns.

![GENEHIVE Demo](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=GENEHIVE+Demo)

## 🎯 Features

### 🏗️ Family Tree Builder
- **Interactive Member Management**: Add family members with age, gender, and relationship data
- **Drag & Drop Interface**: Intuitive tree building with visual connections
- **Relationship Mapping**: Automatic parent-child and sibling relationship detection

### 🧬 Disease Marker Interface
- **Multiple Conditions**: Tag family members with various hereditary diseases
- **Disease Categories**: Support for dominant, recessive, X-linked, and multifactorial inheritance
- **Visual Indicators**: Color-coded disease markers and risk levels

### 🔬 Advanced Simulation Logic
- **Genetic Algorithms**: Rules based on Mendelian and complex inheritance patterns
- **Risk Calculation**: Probabilistic risk scores for each family member
- **Inheritance Patterns**: Accurate modeling of different genetic transmission modes

### 🌐 3D Visualization
- **Interactive 3D Tree**: Three.js powered family tree with smooth animations
- **Risk-Based Coloring**: Visual risk indicators (red/orange for high risk)
- **Hover Tooltips**: Detailed information on mouse hover
- **Camera Controls**: Zoom, pan, and rotate for optimal viewing

### 🤖 AI-Powered Explanations
- **LLaMA Integration**: Local AI via Ollama for privacy-focused explanations
- **Personalized Insights**: Context-aware risk explanations
- **Interactive Chat**: Ask questions about genetic risks and inheritance
- **Educational Content**: Learn about genetics in plain language

### 📊 Risk Analysis Dashboard
- **Comprehensive Reports**: Detailed risk breakdowns for each family member
- **Family Overview**: High-risk member identification
- **Trend Analysis**: Risk patterns across generations
- **Export Capabilities**: Save reports as PDF or JSON

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Three.js** with React Three Fiber for 3D visualization
- **Lucide React** for icons
- **Vite** for build tooling

### Backend
- **FastAPI** (Python) for REST API
- **Pydantic** for data validation
- **HTTPX** for async HTTP requests
- **Uvicorn** ASGI server

### AI Integration
- **Ollama** for local LLaMA model hosting
- **LLaMA 3.2** for natural language processing
- **Custom prompting** for genetic counseling context

### Data Storage
- **JSON-based** local storage
- **Browser localStorage** for persistence
- **Export/Import** functionality for data portability

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+
- **Ollama** (for AI features)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/genehive.git
cd genehive
```

### 2. Setup Frontend

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The frontend will be available at `http://localhost:3000`

### 3. Setup Backend

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
python main.py
```

The backend API will be available at `http://localhost:8000`

### 4. Setup Ollama (Optional - for AI features)

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull LLaMA model
ollama pull llama3.2

# Start Ollama service
ollama serve
```

## 📖 Usage Guide

### Building Your Family Tree

1. **Add Family Members**
   - Click "Add Family Member" in the sidebar
   - Fill in name, age, gender, and relationships
   - Select any known hereditary conditions

2. **Visualize in 3D**
   - Navigate to the "Family Tree" tab
   - Use mouse controls to explore the 3D visualization
   - Click on members to select and view details

3. **Run Risk Analysis**
   - Click "Run Simulation" to calculate genetic risks
   - View results in the "Risk Analysis" tab
   - Explore detailed risk breakdowns for each member

4. **Get AI Explanations**
   - Use the "AI Chat" tab or floating chat widget
   - Ask questions about specific risks or inheritance patterns
   - Get personalized explanations for risk calculations

### Sample Data

GENEHIVE includes sample family trees for demonstration:
- **Basic Sample**: Nuclear family with 2-3 generations
- **Extended Sample**: Large family with multiple branches and conditions

Access these via the Settings panel in the header.

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=true

# CORS Settings
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Frontend Configuration

Update `src/services/api.ts` for custom backend URLs:

```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const OLLAMA_URL = process.env.REACT_APP_OLLAMA_URL || 'http://localhost:11434';
```

## 🧪 Development

### Running Tests

```bash
# Frontend tests
npm test

# Backend tests
cd backend
pytest
```

### Code Formatting

```bash
# Frontend (Prettier)
npm run format

# Backend (Black)
cd backend
black .
```

### Building for Production

```bash
# Frontend build
npm run build

# Backend (using Docker)
cd backend
docker build -t genehive-api .
```

## 📊 Genetic Risk Calculation

GENEHIVE implements scientifically-based genetic risk models:

### Inheritance Patterns

1. **Autosomal Dominant**
   - 50% risk if one parent affected
   - 75% risk if both parents affected
   - High penetrance diseases

2. **Autosomal Recessive**
   - 25% risk if both parents carriers
   - Requires two copies for expression
   - Lower population prevalence

3. **X-Linked**
   - Gender-specific risk patterns
   - Males more severely affected
   - Maternal inheritance to sons

4. **Multifactorial**
   - Complex inheritance with environmental factors
   - Age-dependent risk calculations
   - Family loading considerations

### Risk Factors

- **Family History**: Number and relationship of affected relatives
- **Age**: Age-dependent penetrance for certain conditions
- **Gender**: Sex-linked inheritance patterns
- **Penetrance**: Disease-specific expression probability

## 🔒 Privacy & Security

- **Local Processing**: All genetic data stays on your device
- **No Cloud Storage**: Family information never leaves your browser
- **Local AI**: Ollama runs locally for private AI interactions
- **Export Control**: You control when and how data is shared

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Areas for Contribution

- 🧬 Additional genetic algorithms
- 🎨 UI/UX improvements
- 🔬 New disease models
- 📚 Educational content
- 🌐 Internationalization
- 🧪 Test coverage

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Genetic Research Community** for inheritance pattern models
- **Three.js Team** for 3D visualization capabilities
- **Ollama Project** for local AI infrastructure
- **React Community** for frontend framework and ecosystem

## 📞 Support

- 📧 **Email**: support@genehive.dev
- 💬 **Discord**: [Join our community](https://discord.gg/genehive)
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/genehive/issues)
- 📖 **Documentation**: [Full Documentation](https://docs.genehive.dev)

## 🗺️ Roadmap

### Version 1.1 (Q2 2024)
- [ ] Advanced 3D animations
- [ ] PDF report generation
- [ ] Mobile responsive design
- [ ] Additional disease models

### Version 1.2 (Q3 2024)
- [ ] Multi-language support
- [ ] Collaborative family trees
- [ ] Advanced AI explanations
- [ ] Integration with genetic databases

### Version 2.0 (Q4 2024)
- [ ] Real genetic data import
- [ ] Professional genetic counselor tools
- [ ] Research collaboration features
- [ ] Advanced statistical analysis

---

**Built with ❤️ for genetic education and family health awareness**

*GENEHIVE is for educational purposes only and should not replace professional genetic counseling or medical advice.*
