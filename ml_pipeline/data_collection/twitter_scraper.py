"""
Twitter Scraper for Disaster-Related Tweets
Uses snscrape to collect disaster-related tweets without API limits
"""

import snscrape.modules.twitter as sntwitter
import pandas as pd
from datetime import datetime, timedelta
import json
import os

class DisasterTweetScraper:
    def __init__(self, output_dir='../backend/data/raw'):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        
        # Disaster-related keywords
        self.disaster_keywords = [
            'flood', 'earthquake', 'cyclone', 'hurricane', 'tsunami',
            'wildfire', 'drought', 'landslide', 'tornado', 'storm',
            'disaster relief', 'emergency response', 'rescue operation',
            'evacuation', 'natural disaster'
        ]
        
        # Resource-related keywords
        self.resource_keywords = [
            'food', 'water', 'shelter', 'medical', 'medicine',
            'rescue', 'help needed', 'urgent', 'emergency'
        ]
    
    def scrape_disaster_tweets(self, query, max_tweets=1000, days_back=7):
        """
        Scrape tweets based on disaster-related queries
        
        Args:
            query: Search query string
            max_tweets: Maximum number of tweets to collect
            days_back: Number of days to look back
        
        Returns:
            DataFrame with tweet data
        """
        tweets_list = []
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        # Build search query with date filter
        search_query = f"{query} since:{start_date.strftime('%Y-%m-%d')} until:{end_date.strftime('%Y-%m-%d')}"
        
        print(f"Scraping tweets for: {search_query}")
        
        # Scrape tweets
        for i, tweet in enumerate(sntwitter.TwitterSearchScraper(search_query).get_items()):
            if i >= max_tweets:
                break
            
            tweets_list.append({
                'id': tweet.id,
                'date': tweet.date,
                'content': tweet.rawContent,
                'user': tweet.user.username,
                'retweet_count': tweet.retweetCount,
                'reply_count': tweet.replyCount,
                'like_count': tweet.likeCount,
                'quote_count': tweet.quoteCount,
                'location': tweet.user.location if hasattr(tweet.user, 'location') else None,
                'verified': tweet.user.verified,
                'hashtags': tweet.hashtags if hasattr(tweet, 'hashtags') else [],
                'language': tweet.lang
            })
            
            if (i + 1) % 100 == 0:
                print(f"Scraped {i + 1} tweets...")
        
        df = pd.DataFrame(tweets_list)
        print(f"Total tweets scraped: {len(df)}")
        
        return df
    
    def scrape_all_disasters(self, tweets_per_keyword=500):
        """Scrape tweets for all disaster keywords"""
        all_tweets = []
        
        for keyword in self.disaster_keywords:
            print(f"\n{'='*60}")
            print(f"Scraping for keyword: {keyword}")
            print(f"{'='*60}")
            
            try:
                df = self.scrape_disaster_tweets(
                    query=keyword,
                    max_tweets=tweets_per_keyword,
                    days_back=30
                )
                
                df['search_keyword'] = keyword
                all_tweets.append(df)
                
            except Exception as e:
                print(f"Error scraping {keyword}: {str(e)}")
                continue
        
        # Combine all tweets
        if all_tweets:
            combined_df = pd.concat(all_tweets, ignore_index=True)
            
            # Remove duplicates
            combined_df = combined_df.drop_duplicates(subset=['id'])
            
            # Save to CSV
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'disaster_tweets_{timestamp}.csv'
            filepath = os.path.join(self.output_dir, filename)
            
            combined_df.to_csv(filepath, index=False)
            print(f"\n{'='*60}")
            print(f"Saved {len(combined_df)} unique tweets to {filepath}")
            print(f"{'='*60}")
            
            return combined_df
        
        return None
    
    def scrape_location_specific(self, location, disaster_type, max_tweets=500):
        """Scrape tweets for specific location and disaster type"""
        query = f"{disaster_type} {location} OR near:{location}"
        
        df = self.scrape_disaster_tweets(
            query=query,
            max_tweets=max_tweets,
            days_back=14
        )
        
        if df is not None and not df.empty:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'tweets_{location}_{disaster_type}_{timestamp}.csv'
            filepath = os.path.join(self.output_dir, filename)
            
            df.to_csv(filepath, index=False)
            print(f"Saved {len(df)} tweets to {filepath}")
        
        return df

def main():
    """Main execution function"""
    scraper = DisasterTweetScraper()
    
    # Scrape tweets for all disaster types
    print("Starting disaster tweet collection...")
    tweets_df = scraper.scrape_all_disasters(tweets_per_keyword=500)
    
    if tweets_df is not None:
        print(f"\nTotal unique tweets collected: {len(tweets_df)}")
        print(f"\nSample tweets:")
        print(tweets_df.head())
        print(f"\nColumns: {tweets_df.columns.tolist()}")

if __name__ == "__main__":
    main()














