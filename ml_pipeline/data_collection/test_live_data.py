"""
Test script to demonstrate live data collection
Shows the difference between sample data and real data
"""

import os
import sys

def test_news_api():
    """Test NewsAPI data collection"""
    print("="*80)
    print("TESTING LIVE DATA COLLECTION")
    print("="*80)
    
    api_key = os.getenv('NEWS_API_KEY')
    
    if api_key:
        print("\n✅ API Key Found! Collecting REAL live data...")
        print(f"API Key: {api_key[:10]}...{api_key[-10:]}")
        
        from news_api_collector import NewsAPICollector
        collector = NewsAPICollector(api_key)
        
        # Test with single query
        print("\n🔍 Searching for recent flood disasters in India...")
        df = collector.search_news("flood India disaster", days_back=7, page_size=10)
        
        if not df.empty:
            print(f"\n🎉 SUCCESS! Retrieved {len(df)} REAL news articles!")
            print("\n" + "="*80)
            print("SAMPLE OF REAL DATA:")
            print("="*80)
            
            for idx, row in df.head(3).iterrows():
                print(f"\n📰 Article {idx+1}:")
                print(f"   Title: {row['title']}")
                print(f"   Source: {row['source']}")
                print(f"   Date: {row['published_at']}")
                print(f"   Preview: {row['description'][:100]}...")
            
            print("\n" + "="*80)
            print(f"✅ LIVE DATA IS WORKING!")
            print(f"✅ You can now collect {len(df)} articles per request")
            print(f"✅ 100 requests per day = up to 10,000 articles!")
            print("="*80)
            
            return True
        else:
            print("\n⚠️  No articles found. Try a different query.")
            return False
    else:
        print("\n❌ NO API KEY FOUND")
        print("\n" + "="*80)
        print("TO GET LIVE DATA:")
        print("="*80)
        print("\n1. Get FREE API key from: https://newsapi.org/register")
        print("   (Takes 30 seconds, no credit card needed)")
        print("\n2. Set the API key:")
        print("   setx NEWS_API_KEY \"your_key_here\"")
        print("\n3. Restart terminal and run this script again")
        print("\n" + "="*80)
        print("WHAT YOU'LL GET WITH LIVE DATA:")
        print("="*80)
        print("✅ 100+ real disaster news articles per day")
        print("✅ From major news sources (Times of India, NDTV, etc.)")
        print("✅ Last 30 days of historical data")
        print("✅ Real disaster descriptions for ML training")
        print("✅ Location, severity, impact information")
        print("\n" + "="*80)
        print("DEMO MODE: Showing sample data instead...")
        print("="*80)
        
        # Show sample data structure
        sample_data = {
            'Sample Article 1': {
                'Title': 'Severe Floods Hit Maharashtra',
                'Source': 'The Times of India',
                'Date': '2024-10-18',
                'Content': 'Real disaster news content here...'
            },
            'Sample Article 2': {
                'Title': 'Cyclone Warning for Odisha Coast',
                'Source': 'NDTV',
                'Date': '2024-10-17',
                'Content': 'Real cyclone warning details...'
            }
        }
        
        print("\nWith API key, you'll get REAL data like:")
        for name, article in sample_data.items():
            print(f"\n📰 {name}:")
            for key, value in article.items():
                print(f"   {key}: {value}")
        
        return False

def compare_sample_vs_real():
    """Show comparison between sample and real data"""
    print("\n" + "="*80)
    print("SAMPLE DATA vs REAL DATA COMPARISON")
    print("="*80)
    
    comparison = """
    ┌─────────────────────┬────────────────────┬──────────────────────┐
    │ Feature             │ Sample Data        │ Real Data (NewsAPI)  │
    ├─────────────────────┼────────────────────┼──────────────────────┤
    │ Number of articles  │ 3 (fixed)          │ 100+ per request     │
    │ Content             │ Generic            │ Real news            │
    │ Sources             │ Fake               │ 80,000+ real sources │
    │ Dates               │ Current date       │ Actual publish dates │
    │ Accuracy            │ Demo only          │ Real disasters       │
    │ Updates             │ Never              │ Daily                │
    │ ML Training         │ Limited            │ Production-ready     │
    └─────────────────────┴────────────────────┴──────────────────────┘
    """
    print(comparison)

if __name__ == "__main__":
    print("\n")
    test_news_api()
    compare_sample_vs_real()
    
    print("\n" + "="*80)
    print("NEXT STEPS:")
    print("="*80)
    print("\n1. If you have API key: You're ready to collect live data!")
    print("2. If not: Get it from https://newsapi.org/register (30 seconds)")
    print("3. Once set up: Run news_api_collector.py for full collection")
    print("\n" + "="*80)


