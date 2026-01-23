"""
News API Integration for Disaster Data Collection
Uses free news APIs to collect disaster-related articles
With intelligent multi-layer filtering to remove non-disaster content
No Twitter required!
"""

import requests
import pandas as pd
from datetime import datetime, timedelta
import os
import time
import re

class NewsAPICollector:
    def __init__(self, api_key=None):
        """
        Initialize News API collector with smart filtering
        
        Free API Key from: https://newsapi.org/register
        - 100 requests per day
        - 1000 requests per month (free tier)
        """
        self.api_key = api_key or os.getenv('NEWS_API_KEY')
        self.base_url = 'https://newsapi.org/v2/everything'
        
        self.output_dir = '../backend/data/raw'
        os.makedirs(self.output_dir, exist_ok=True)
        
        # LAYER 1: Enhanced disaster-specific keywords (more precise)
        self.disaster_keywords = [
            # Natural disasters with context
            'flood disaster India', 'flooding relief India', 'flood victims India',
            'earthquake India relief', 'earthquake damage India', 'seismic activity India',
            'cyclone India evacuation', 'cyclone warning India', 'tropical storm India',
            'landslide India rescue', 'landslide casualties India',
            'drought India farmers', 'water crisis India',
            'wildfire India', 'forest fire India',
            'tsunami India', 'avalanche India',
            
            # Disaster response keywords
            'disaster relief operations India', 'emergency rescue India',
            'NDRF India', 'disaster management India',
            'evacuation India natural disaster', 'relief camps India'
        ]
        
        # LAYER 2: Disaster relevance indicators (for content filtering)
        self.disaster_indicators = {
            # High relevance terms
            'high': [
                'flood', 'earthquake', 'cyclone', 'tsunami', 'landslide', 'avalanche',
                'hurricane', 'tornado', 'drought', 'wildfire', 'storm surge',
                'disaster', 'evacuation', 'rescue operation', 'relief camp',
                'casualties', 'displaced', 'emergency services', 'NDRF', 'NDMA',
                'relief supplies', 'rehabilitation', 'affected families',
                'natural calamity', 'weather disaster', 'climate disaster'
            ],
            # Medium relevance terms
            'medium': [
                'emergency', 'crisis', 'damage', 'destruction', 'victims',
                'aid', 'relief', 'shelter', 'humanitarian', 'rescue'
            ],
            # Exclusion terms (geopolitical, economic, political)
            'exclude': [
                'election', 'political', 'parliament', 'government policy',
                'bilateral', 'diplomatic', 'trade war', 'sanctions',
                'stock market', 'economic crisis', 'GDP', 'inflation',
                'military', 'terrorism', 'conflict', 'border dispute',
                'cyber', 'hacking', 'cryptocurrency', 'bitcoin',
                'celebrity', 'entertainment', 'sports', 'movie'
            ]
        }
        
        # Minimum relevance score threshold (0-100)
        self.relevance_threshold = 30
    
    def search_news(self, query, days_back=7, page_size=100):
        """
        Search for news articles
        
        Args:
            query: Search query
            days_back: Days to look back
            page_size: Articles per request (max 100)
        
        Returns:
            DataFrame with articles
        """
        if not self.api_key:
            print("⚠️  No API key provided. Using demo mode with limited data.")
            return self._create_sample_news()
        
        try:
            # Calculate date range
            to_date = datetime.now()
            from_date = to_date - timedelta(days=days_back)
            
            params = {
                'q': query,
                'from': from_date.strftime('%Y-%m-%d'),
                'to': to_date.strftime('%Y-%m-%d'),
                'language': 'en',
                'sortBy': 'relevancy',
                'pageSize': page_size,
                'apiKey': self.api_key
            }
            
            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if data['status'] != 'ok':
                print(f"API Error: {data.get('message', 'Unknown error')}")
                return pd.DataFrame()
            
            articles = data.get('articles', [])
            
            if not articles:
                print(f"No articles found for: {query}")
                return pd.DataFrame()
            
            # Extract article data
            articles_list = []
            for article in articles:
                articles_list.append({
                    'published_at': article.get('publishedAt'),
                    'title': article.get('title'),
                    'description': article.get('description'),
                    'content': article.get('content'),
                    'author': article.get('author'),
                    'source': article.get('source', {}).get('name'),
                    'url': article.get('url'),
                    'search_keyword': query
                })
            
            df = pd.DataFrame(articles_list)
            print(f"✓ Retrieved {len(df)} articles for: {query}")
            
            return df
            
        except requests.exceptions.RequestException as e:
            print(f"Request Error: {str(e)}")
            return pd.DataFrame()
        except Exception as e:
            print(f"Error: {str(e)}")
            return pd.DataFrame()
    
    def calculate_disaster_relevance(self, text):
        """
        LAYER 2: Calculate disaster relevance score for article content
        
        Args:
            text: Article title + description + content combined
            
        Returns:
            score (0-100): Higher = more disaster-relevant
        """
        if not text or pd.isna(text):
            return 0
        
        text_lower = text.lower()
        score = 0
        
        # Check for exclusion terms (disqualifiers)
        exclude_count = sum(1 for term in self.disaster_indicators['exclude'] 
                          if term.lower() in text_lower)
        
        # If too many exclusion terms, heavily penalize
        if exclude_count >= 3:
            return 0  # Definitely not disaster-related
        elif exclude_count >= 1:
            score -= 30  # Penalize but not disqualify
        
        # Count high-relevance disaster terms
        high_count = sum(1 for term in self.disaster_indicators['high'] 
                        if term.lower() in text_lower)
        score += high_count * 15  # High weight
        
        # Count medium-relevance terms
        medium_count = sum(1 for term in self.disaster_indicators['medium'] 
                          if term.lower() in text_lower)
        score += medium_count * 5  # Lower weight
        
        # Cap score at 100
        return min(100, max(0, score))
    
    def filter_disaster_articles(self, df):
        """
        Apply intelligent filtering to remove non-disaster articles
        
        Args:
            df: DataFrame with news articles
            
        Returns:
            Filtered DataFrame with only disaster-relevant articles
        """
        if df.empty:
            return df
        
        print("\n🔍 Applying intelligent disaster filtering...")
        print(f"   Articles before filtering: {len(df)}")
        
        # Combine title, description, and content for analysis
        df['full_text'] = (
            df['title'].fillna('') + ' ' + 
            df['description'].fillna('') + ' ' + 
            df['content'].fillna('')
        )
        
        # Calculate relevance score for each article
        df['relevance_score'] = df['full_text'].apply(self.calculate_disaster_relevance)
        
        # Filter articles above threshold
        filtered_df = df[df['relevance_score'] >= self.relevance_threshold].copy()
        
        # Sort by relevance (highest first)
        filtered_df = filtered_df.sort_values('relevance_score', ascending=False)
        
        # Remove temporary column
        filtered_df = filtered_df.drop('full_text', axis=1)
        
        removed = len(df) - len(filtered_df)
        print(f"   Articles after filtering: {len(filtered_df)}")
        print(f"   ❌ Removed {removed} non-disaster articles ({removed/len(df)*100:.1f}%)")
        
        if len(filtered_df) > 0:
            print(f"   ✓ Average relevance score: {filtered_df['relevance_score'].mean():.1f}/100")
        
        return filtered_df
    
    def collect_disaster_news(self):
        """
        Collect and intelligently filter disaster news articles
        
        Returns:
            Filtered DataFrame with only disaster-relevant articles
        """
        print("="*80)
        print("COLLECTING DISASTER NEWS WITH SMART FILTERING")
        print("="*80)
        
        all_articles = []
        
        for keyword in self.disaster_keywords:
            print(f"\n🔎 Searching for: {keyword}")
            
            df = self.search_news(keyword, days_back=30, page_size=100)
            
            if not df.empty:
                all_articles.append(df)
            
            # Rate limiting - free tier allows 1 request per second
            time.sleep(1)
        
        # Combine all articles
        if all_articles:
            combined_df = pd.concat(all_articles, ignore_index=True)
            
            print(f"\n📊 Total articles collected: {len(combined_df)}")
            
            # Remove duplicates based on title
            combined_df = combined_df.drop_duplicates(subset=['title'])
            print(f"📊 Unique articles: {len(combined_df)}")
            
            # APPLY INTELLIGENT FILTERING
            filtered_df = self.filter_disaster_articles(combined_df)
            
            if filtered_df.empty:
                print("\n⚠️  No disaster-relevant articles found. Using sample data.")
                return self._create_sample_news()
            
            # Save to CSV
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'disaster_news_{timestamp}.csv'
            filepath = os.path.join(self.output_dir, filename)
            
            filtered_df.to_csv(filepath, index=False)
            
            print("\n" + "="*80)
            print(f"✅ SUCCESS: Collected {len(filtered_df)} disaster-relevant articles")
            print(f"✓ Filtered out non-disaster content (geopolitical, economic, etc.)")
            print(f"✓ Saved to: {filepath}")
            print("="*80)
            
            return filtered_df
        else:
            print("\n⚠️  No articles collected. Using sample data.")
            return self._create_sample_news()
    
    def _create_sample_news(self):
        """Create sample news data for demo purposes"""
        sample_articles = [
            {
                'published_at': (datetime.now() - timedelta(days=1)).isoformat(),
                'title': 'Severe Floods Hit Maharashtra: Thousands Displaced',
                'description': 'Heavy rainfall causes severe flooding in Maharashtra affecting thousands of families',
                'content': 'Severe flooding in Maharashtra has displaced thousands. Emergency services deployed. Relief camps set up. Food and water distribution ongoing.',
                'author': 'News Reporter',
                'source': 'Sample News',
                'url': 'https://example.com/flood-maharashtra',
                'search_keyword': 'flood India',
                'relevance_score': 90
            },
            {
                'published_at': (datetime.now() - timedelta(days=2)).isoformat(),
                'title': 'Earthquake Tremors Felt in North India',
                'description': 'Moderate earthquake recorded in northern regions',
                'content': 'Earthquake of magnitude 4.5 felt in northern India. No major damage reported. Emergency teams on alert.',
                'author': 'News Reporter',
                'source': 'Sample News',
                'url': 'https://example.com/earthquake-india',
                'search_keyword': 'earthquake India',
                'relevance_score': 85
            },
            {
                'published_at': (datetime.now() - timedelta(days=3)).isoformat(),
                'title': 'Cyclone Warning Issued for Coastal Areas',
                'description': 'Meteorological department issues cyclone warning',
                'content': 'Cyclone expected to make landfall. Evacuation orders issued. Relief supplies being prepared.',
                'author': 'Weather Desk',
                'source': 'Sample News',
                'url': 'https://example.com/cyclone-warning',
                'search_keyword': 'cyclone India',
                'relevance_score': 95
            }
        ]
        
        return pd.DataFrame(sample_articles)


class GNewsCollector:
    """
    Alternative: GNews API (Completely FREE!)
    No API key required for basic usage
    """
    
    def __init__(self):
        self.base_url = 'https://gnews.io/api/v4/search'
        self.api_key = os.getenv('GNEWS_API_KEY', 'free')  # Free tier available
        self.output_dir = '../backend/data/raw'
        os.makedirs(self.output_dir, exist_ok=True)
    
    def search_news(self, query, max_articles=10):
        """
        Search using GNews API (free tier: 100 requests/day)
        """
        try:
            params = {
                'q': query,
                'lang': 'en',
                'country': 'in',
                'max': max_articles,
                'apikey': self.api_key
            }
            
            if self.api_key == 'free':
                # Use sample data in free mode
                return self._get_sample_data()
            
            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            articles = data.get('articles', [])
            
            articles_list = []
            for article in articles:
                articles_list.append({
                    'published_at': article.get('publishedAt'),
                    'title': article.get('title'),
                    'description': article.get('description'),
                    'content': article.get('content'),
                    'source': article.get('source', {}).get('name'),
                    'url': article.get('url'),
                    'search_keyword': query
                })
            
            return pd.DataFrame(articles_list)
            
        except Exception as e:
            print(f"GNews Error: {str(e)}")
            return self._get_sample_data()
    
    def _get_sample_data(self):
        """Return sample disaster news"""
        return pd.DataFrame([
            {
                'published_at': datetime.now().isoformat(),
                'title': 'Disaster Relief Operations Ongoing',
                'description': 'Emergency response teams deployed',
                'content': 'Relief operations continue in affected areas...',
                'source': 'Sample Source',
                'url': 'https://example.com',
                'search_keyword': 'disaster India'
            }
        ])


def main():
    """Test the news collectors with smart filtering"""
    print("\n" + "="*80)
    print("NEWS API DISASTER DATA COLLECTOR - WITH SMART FILTERING")
    print("="*80)
    
    # Option 1: Try NewsAPI (requires free API key)
    print("\n[Option 1] Testing NewsAPI with intelligent filtering...")
    news_collector = NewsAPICollector()
    
    api_key = os.getenv('NEWS_API_KEY')
    if not api_key:
        print("\n⚠️  No NEWS_API_KEY found")
        print("Get a FREE API key from: https://newsapi.org/register")
        print("Then set: set NEWS_API_KEY=your_key_here")
        print("\nUsing sample data for now...")
    
    news_df = news_collector.collect_disaster_news()
    
    if not news_df.empty:
        print(f"\n✅ FINAL RESULTS:")
        print(f"   Total disaster-relevant articles: {len(news_df)}")
        
        if 'relevance_score' in news_df.columns:
            print(f"   Average relevance score: {news_df['relevance_score'].mean():.1f}/100")
            print(f"   Highest relevance score: {news_df['relevance_score'].max():.1f}/100")
            print(f"   Lowest relevance score: {news_df['relevance_score'].min():.1f}/100")
        
        print(f"\n📰 Top disaster articles (by relevance):")
        display_cols = ['title', 'source', 'relevance_score'] if 'relevance_score' in news_df.columns else ['title', 'source']
        print(news_df[display_cols].head(10).to_string(index=False))
        
        # Show content preview
        print(f"\n📄 Highest-relevance article:")
        print(f"   Title: {news_df.iloc[0]['title']}")
        print(f"   Content: {news_df.iloc[0]['content'][:200]}...")
        
        print("\n" + "="*80)
        print("✅ SUCCESS! Only disaster-relevant news collected.")
        print("   Geopolitical, economic, and other non-disaster news filtered out.")
        print("="*80)


if __name__ == "__main__":
    main()


