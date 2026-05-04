# 🌱 SoilSense AI

Production-ready Soil Health Analysis & Crop Recommendation System powered by 4 ML models.

## 📂 Project Structure

```text
soil-health-ai/
├── data/               # Training and sample CSV data
├── notebooks/          # Exploratory Data Analysis (EDA)
├── src/                # Core ML logic (preprocessing, prediction, training)
├── models/             # Trained ML pipeline artifacts (.pkl)
├── api/                # FastAPI backend implementation
├── frontend/           # React dashboard (Production Interface)
├── requirements.txt    # Python dependencies
└── README.md
```

## 🚀 Getting Started

### 1. Backend Setup
```bash
# Install dependencies
pip install -r requirements.txt

# (Optional) Retrain models
python src/train_model.py

# Start the API
python api/app.py
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🧠 ML Models
1. **Crop Recommendation**: XGBoost Classifier (98%+ Accuracy)
2. **Yield Forecasting**: RandomForest Regressor
3. **Soil Health Index (SHI)**: RandomForest Regressor
4. **Fertilizer Prescription**: XGBoost Classifier
