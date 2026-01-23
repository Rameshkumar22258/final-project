# System Architecture - Disaster Relief AI

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                           │
│                    (React Frontend - Port 3000)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │Dashboard │  │Prediction│  │Monitoring│  │Map View  │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER                                   │
│               (Express.js Backend - Port 5000)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │Prediction│  │Disaster  │  │Tweet     │  │Analytics │        │
│  │Endpoints │  │Endpoints │  │Endpoints │  │Endpoints │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│    DATABASE LAYER        │  │   ML PIPELINE LAYER      │
│  (MongoDB - Port 27017)  │  │   (Python Scripts)       │
│  ┌──────────────────┐    │  │  ┌──────────────────┐   │
│  │ Disasters        │    │  │  │ Data Collection  │   │
│  │ Predictions      │    │  │  │ Preprocessing    │   │
│  │ Tweets           │    │  │  │ Feature Eng.     │   │
│  │ Analytics        │    │  │  │ ML Models        │   │
│  └──────────────────┘    │  │  └──────────────────┘   │
└──────────────────────────┘  └──────────────────────────┘
                                        │
                                        │
                                        ▼
                              ┌──────────────────┐
                              │  EXTERNAL APIs   │
                              │  - Twitter       │
                              │  - ReliefWeb     │
                              │  - USGS          │
                              │  - OpenWeather   │
                              └──────────────────┘
```

---

## 📊 Data Flow

### 1. Data Collection Flow

```
External Sources → Data Collectors → Raw Data Storage → Preprocessing → Processed Data
```

**Components:**
- Twitter Scraper (snscrape)
- Historical Data Collector (ReliefWeb API, USGS API)
- Weather Data Collector (OpenWeatherMap API)

**Output:** CSV files in `backend/data/raw/`

### 2. Preprocessing Flow

```
Raw Text → Cleaning → Tokenization → Lemmatization → Feature Extraction → Processed Data
```

**Steps:**
1. Remove URLs, emojis, HTML tags
2. Tokenize text into words
3. Remove stopwords (except disaster keywords)
4. Lemmatize tokens
5. Extract disaster type, location, urgency
6. Save to `backend/data/processed/`

### 3. Feature Engineering Flow

```
Processed Data → Feature Creation → Encoding → Normalization → Training Data
```

**Features Created:**
- Severity numeric encoding
- Disaster type one-hot encoding
- Temporal features (month, season)
- Text features (TF-IDF)
- Weather features
- Social media engagement metrics
- Population features

### 4. ML Training Flow

```
Training Data → Model Training → Validation → Model Saving → API Integration
```

**Models:**
1. **Disaster Classifier**: Random Forest (200 trees)
2. **Resource Predictor**: Multi-output Random Forest

**Outputs:** Saved to `backend/ml_models/`

### 5. Prediction Flow

```
User Input → API Request → Feature Engineering → Model Inference → Results → UI Display
```

---

## 🔧 Component Details

### Frontend Architecture

```
src/
├── App.js                    # Main application component
├── components/
│   └── Navbar.js            # Navigation component
├── pages/
│   ├── Dashboard.js         # Dashboard page
│   ├── PredictionPage.js    # Prediction interface
│   ├── MonitoringPage.js    # Real-time monitoring
│   ├── MapView.js           # Geographic visualization
│   └── AnalyticsPage.js     # Historical analytics
└── services/
    └── api.js               # API client service
```

**Key Technologies:**
- React Router for navigation
- Axios for HTTP requests
- Leaflet for maps
- React Icons for UI

### Backend Architecture

```
backend/
├── server.js                 # Express app & routes
├── models/                   # Mongoose models (defined inline)
├── data/
│   ├── raw/                 # Raw collected data
│   └── processed/           # Processed data
└── ml_models/               # Saved ML models
```

**API Structure:**
- RESTful design
- JSON responses
- Error handling middleware
- CORS enabled
- Rate limiting

### ML Pipeline Architecture

```
ml_pipeline/
├── main_pipeline.py         # Orchestrator
├── data_collection/         # Data gathering scripts
├── preprocessing/           # Text processing
├── feature_engineering/     # Feature creation
└── models/                  # ML model definitions
```

**Execution Flow:**
1. Collect data from all sources
2. Preprocess text data
3. Engineer features
4. Train models
5. Evaluate and save

---

## 🔄 State Management

### Frontend State

**Local State (useState):**
- Form inputs
- Loading states
- UI toggles

**API State:**
- Cached in component state
- Refreshed on mount or user action
- Error handling with try-catch

### Backend State

**Stateless API:**
- No session storage
- Database for persistence
- Stateless authentication (JWT ready)

---

## 💾 Database Schema

### Disasters Collection

```javascript
{
  disasterId: String (unique),
  disasterType: String,
  location: String,
  severity: String,
  peopleAffected: Number,
  date: Date,
  predictedDemand: {
    food: Number,
    water: Number,
    medical: Number,
    shelter: Number
  },
  actualDemand: { ... },
  status: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Predictions Collection

```javascript
{
  disasterType: String,
  location: String,
  severity: String,
  populationDensity: String,
  peopleAffected: Number,
  predictedResources: {
    food: Number,
    water: Number,
    medical: Number,
    shelter: Number
  },
  confidence: Number,
  recommendations: [String],
  requestedAt: Date
}
```

### Tweets Collection

```javascript
{
  tweetId: String (unique),
  content: String,
  cleanedText: String,
  location: String,
  disasterType: [String],
  resourceNeeds: [String],
  urgency: String,
  engagementScore: Number,
  processed: Boolean,
  createdAt: Date
}
```

---

## 🚀 Performance Considerations

### Frontend Optimization

- Code splitting with React.lazy
- Memoization with React.memo
- Debounced API calls
- Lazy loading images
- CSS optimization

### Backend Optimization

- Database indexing
- Query optimization
- Response caching
- Connection pooling
- Compression middleware

### ML Optimization

- Feature selection (top N features)
- Model serialization with joblib
- Batch prediction
- Caching preprocessed data

---

## 🔐 Security Architecture

### Frontend Security

- Input validation
- XSS prevention (React escaping)
- HTTPS enforcement
- Environment variable protection

### Backend Security

- Helmet.js headers
- CORS configuration
- Rate limiting
- Input sanitization
- JWT authentication (ready)

### Database Security

- Connection string encryption
- Access control
- Backup strategy
- Audit logging

---

## 📈 Scalability Design

### Horizontal Scaling

- **Frontend:** CDN distribution
- **Backend:** Load balancer + multiple instances
- **Database:** MongoDB replica set

### Vertical Scaling

- Increase server resources
- Database optimization
- Caching layer (Redis)

### Microservices Migration Path

```
Monolith → Service Separation:
- Prediction Service
- Monitoring Service
- Analytics Service
- Data Collection Service
```

---

## 🔄 CI/CD Pipeline

```
Code Commit → GitHub → CI Tests → Build → Deploy
```

**Stages:**
1. **Test:** Run unit tests, linting
2. **Build:** Create production builds
3. **Deploy:** Push to staging/production
4. **Monitor:** Track errors and performance

---

## 📊 Monitoring & Observability

### Application Monitoring

- PM2 for process management
- Application logs
- Error tracking (Sentry ready)
- Performance metrics

### Infrastructure Monitoring

- Server health checks
- Database performance
- API response times
- Resource utilization

---

## 🎯 Future Architecture Enhancements

1. **Microservices:** Break into smaller services
2. **Message Queue:** RabbitMQ/Kafka for async processing
3. **Cache Layer:** Redis for frequently accessed data
4. **CDN:** CloudFront/Cloudflare for static assets
5. **Container Orchestration:** Kubernetes deployment
6. **API Gateway:** Centralized API management
7. **Real-time Updates:** WebSocket integration
8. **GraphQL:** Alternative to REST API

---

**Architecture designed for scalability, maintainability, and performance** 🚀














