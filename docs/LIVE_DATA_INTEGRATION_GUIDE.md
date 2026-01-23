# 🌐 LIVE DATA INTEGRATION GUIDE

## ⚠️ **Current Twitter Situation**

**snscrape is BLOCKED** by Twitter/X since 2023. The old scraping method no longer works.

## ✅ **Working Solutions**

You have **3 options** for live disaster data:

---

## **Option 1: Twitter Official API v2** 🐦

### **Pros:**
- ✅ Official and reliable
- ✅ Real-time tweets
- ✅ Good for disaster monitoring

### **Cons:**
- ❌ Costs money ($100-$5000/month)
- ⚠️ Free tier very limited (500k tweets/month for research)

### **Setup:**

1. **Get Twitter API Credentials:**
   - Go to: https://developer.twitter.com/en/portal/dashboard
   - Apply for Essential/Elevated access
   - Get your Bearer Token

2. **Set Environment Variable:**
   ```powershell
   # Windows
   setx TWITTER_BEARER_TOKEN "your_bearer_token_here"
   
   # Or add to .env file in project root:
   TWITTER_BEARER_TOKEN=your_bearer_token_here
   ```

3. **Install Required Package:**
   ```bash
   pip install tweepy
   ```

4. **Test Collection:**
   ```bash
   python ml_pipeline/data_collection/twitter_api_v2.py
   ```

### **Usage in Your Code:**
```python
from ml_pipeline.data_collection.twitter_api_v2 import TwitterAPICollector

# Initialize
collector = TwitterAPICollector()

# Collect disaster tweets
tweets_df = collector.collect_disaster_tweets(tweets_per_keyword=100)

# Location-specific collection
mumbai_floods = collector.collect_location_specific('Mumbai', 'flood', max_results=50)
```

### **Pricing:**
- Free: 500,000 tweets/month (Academic Research access)
- Basic: $100/month (10,000 tweets/month)
- Pro: $5,000/month (1 million tweets/month)

---

## **Option 2: News APIs** 📰 (RECOMMENDED - FREE!)

### **Pros:**
- ✅ Completely FREE
- ✅ Good disaster coverage
- ✅ Reliable and official sources
- ✅ No rate limit issues

### **Cons:**
- ⚠️ Not as real-time as Twitter
- ⚠️ Less volume of data

### **Setup:**

#### **A. NewsAPI (Best Option)**

1. **Get FREE API Key:**
   - Go to: https://newsapi.org/register
   - Sign up (takes 30 seconds)
   - Get API key (100 requests/day FREE)

2. **Set Environment Variable:**
   ```powershell
   # Windows
   setx NEWS_API_KEY "your_api_key_here"
   
   # Or add to .env file:
   NEWS_API_KEY=your_api_key_here
   ```

3. **Test Collection:**
   ```bash
   python ml_pipeline/data_collection/news_api_collector.py
   ```

#### **B. GNews API (Also Free)**
- 100 requests per day
- No API key needed for basic usage
- Get API key from: https://gnews.io/

### **Usage:**
```python
from ml_pipeline.data_collection.news_api_collector import NewsAPICollector

# Initialize
collector = NewsAPICollector()

# Collect disaster news
news_df = collector.collect_disaster_news()
```

---

## **Option 3: Government/Official Sources** 🏛️ (FREE + OFFICIAL)

### **Available APIs:**

1. **India Meteorological Department (IMD)**
   - Cyclone warnings
   - Weather alerts
   - No API key needed

2. **National Disaster Management Authority (NDMA)**
   - Official disaster alerts
   - Government response data

3. **Emergency Alert APIs**
   - Real-time alerts
   - Official notifications

*(Implementation can be added if needed)*

---

## **📊 Complete Integration Example**

Here's how to integrate live data into your ML pipeline:

### **Step 1: Collect Live Data**

```bash
# Using News API (FREE)
python ml_pipeline/data_collection/news_api_collector.py

# This creates: backend/data/raw/disaster_news_YYYYMMDD_HHMMSS.csv
```

### **Step 2: Modify main_pipeline.py**

Create a new file to use live data:

```python
# ml_pipeline/main_pipeline_live.py

from main_pipeline import DisasterReliefMLPipeline
from data_collection.news_api_collector import NewsAPICollector
import pandas as pd

class LiveDataPipeline(DisasterReliefMLPipeline):
    def step1_collect_data(self):
        """Step 1: Collect LIVE data from News API"""
        print("\n" + "="*80)
        print("STEP 1: LIVE DATA COLLECTION")
        print("="*80)
        
        # Collect live news
        print("\n[1/2] Collecting live disaster news...")
        news_collector = NewsAPICollector()
        news_df = news_collector.collect_disaster_news()
        
        # Convert news to disaster format
        disaster_df = self.convert_news_to_disasters(news_df)
        
        # Also collect historical data for comparison
        print("\n[2/2] Collecting historical disaster data...")
        historical_df = self.historical_collector.create_sample_disaster_dataset()
        
        # Combine live and historical
        combined_df = pd.concat([disaster_df, historical_df], ignore_index=True)
        
        print(f"\n✓ Total data: {len(combined_df)} records")
        print(f"  - Live news: {len(disaster_df)}")
        print(f"  - Historical: {len(historical_df)}")
        
        return combined_df, None
    
    def convert_news_to_disasters(self, news_df):
        """Convert news articles to disaster format"""
        # Extract disaster info from news
        disasters = []
        for idx, row in news_df.iterrows():
            # Classify disaster type from title/content
            disaster_type = self.detect_disaster_type(row['title'] + ' ' + str(row['description']))
            
            if disaster_type:
                disasters.append({
                    'disaster_id': f"NEWS_{idx}_{disaster_type}",
                    'disaster_type': disaster_type,
                    'content': f"{row['title']}. {row['description']}",
                    'location': 'India',  # Could extract from content
                    'severity': 'medium',  # Could classify from content
                    'people_affected': 10000,  # Estimate or extract
                    'year': 2024
                })
        
        return pd.DataFrame(disasters)
    
    def detect_disaster_type(self, text):
        """Detect disaster type from text"""
        text_lower = text.lower()
        if 'flood' in text_lower:
            return 'flood'
        elif 'cyclone' in text_lower or 'hurricane' in text_lower:
            return 'cyclone'
        elif 'earthquake' in text_lower:
            return 'earthquake'
        elif 'landslide' in text_lower:
            return 'landslide'
        return None

# Run the live pipeline
if __name__ == "__main__":
    pipeline = LiveDataPipeline()
    summary = pipeline.run_complete_pipeline()
```

### **Step 3: Run Live Pipeline**

```bash
python ml_pipeline/main_pipeline_live.py
```

---

## **🎯 Quick Start (Choose One)**

### **For Free & Easy: Use News API**

1. Get API key: https://newsapi.org/register (30 seconds)
2. Set environment variable:
   ```powershell
   setx NEWS_API_KEY "your_key_here"
   ```
3. Run collector:
   ```bash
   python ml_pipeline/data_collection/news_api_collector.py
   ```

### **For Real Twitter Data: Use Twitter API v2**

1. Apply for access: https://developer.twitter.com/en/portal/dashboard
2. Get Bearer Token
3. Install tweepy: `pip install tweepy`
4. Set token:
   ```powershell
   setx TWITTER_BEARER_TOKEN "your_token_here"
   ```
5. Run collector:
   ```bash
   python ml_pipeline/data_collection/twitter_api_v2.py
   ```

---

## **📈 Data Volume Comparison**

| Source | Free Tier | Data Quality | Real-time |
|--------|-----------|--------------|-----------|
| Twitter API v2 | 500k tweets/month (research) | ⭐⭐⭐⭐⭐ | ✅ Yes |
| NewsAPI | 100 requests/day | ⭐⭐⭐⭐ | ⚠️ 15min delay |
| GNews | 100 requests/day | ⭐⭐⭐ | ⚠️ 1hr delay |
| snscrape (old) | Unlimited | ❌ BLOCKED | ❌ No |

---

## **💡 Recommendation**

**For Your Project:**

1. **Start with NewsAPI** (Free, easy, works immediately)
2. **Add Twitter API later** if you get budget/research access
3. **Combine multiple sources** for best results

**Best Practice:**
- Use News APIs for official disaster information
- Use Twitter API for real-time public sentiment
- Use Government APIs for official alerts
- Combine all sources for comprehensive coverage

---

## **🔧 Troubleshooting**

### **"No API key found"**
```powershell
# Set environment variable
setx NEWS_API_KEY "your_key"
# Restart terminal after setting
```

### **"Rate limit exceeded"**
- NewsAPI free: 100 requests/day
- Wait 24 hours or upgrade to paid plan

### **"Tweepy not found"**
```bash
pip install tweepy
```

---

## **✅ What Works RIGHT NOW**

Without any API keys, you can:
1. ✅ Run ML pipeline with sample data
2. ✅ Test all models
3. ✅ Use demo mode in news collectors

With free API keys (5 minutes setup):
1. ✅ Collect real disaster news (NewsAPI)
2. ✅ Train models on live data
3. ✅ Get 100+ articles per day

---

**Ready to integrate live data?** Choose your option and follow the steps above! 🚀


