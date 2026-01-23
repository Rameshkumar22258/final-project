"""
Twitter API v2 Integration for Disaster Data Collection
Requires Twitter API v2 credentials
"""

import tweepy
import pandas as pd
from datetime import datetime, timedelta
import os
import json

class TwitterAPICollector:
    def __init__(self, bearer_token=None):
        """
        Initialize Twitter API v2 client
        
        Args:
            bearer_token: Twitter API v2 Bearer Token
        """
        # Get bearer token from environment or parameter
        self.bearer_token = bearer_token or os.getenv('TWITTER_BEARER_TOKEN')
        
        if not self.bearer_token:
            raise ValueError(
                "Twitter Bearer Token not found. Please set TWITTER_BEARER_TOKEN environment variable "
                "or pass bearer_token parameter. Get it from: https://developer.twitter.com/en/portal/dashboard"
            )
        
        # Initialize Tweepy client
        self.client = tweepy.Client(bearer_token=self.bearer_token)
        
        # Disaster keywords
        self.disaster_keywords = [
            'flood', 'earthquake', 'cyclone', 'hurricane', 'tsunami',
            'wildfire', 'drought', 'landslide', 'tornado', 'storm',
            'disaster relief', 'emergency response', 'rescue operation'
        ]
        
        self.output_dir = '../backend/data/raw'
        os.makedirs(self.output_dir, exist_ok=True)
    
    def search_tweets(self, query, max_results=100, days_back=7):
        """
        Search for tweets using Twitter API v2
        
        Args:
            query: Search query string
            max_results: Maximum number of tweets to retrieve (10-100 per request)
            days_back: Number of days to look back
        
        Returns:
            DataFrame with tweet data
        """
        try:
            # Calculate start time
            start_time = datetime.utcnow() - timedelta(days=days_back)
            
            # Search tweets with expanded fields
            tweets = self.client.search_recent_tweets(
                query=query,
                max_results=max_results,
                start_time=start_time,
                tweet_fields=['created_at', 'author_id', 'public_metrics', 'geo', 'lang'],
                expansions=['author_id', 'geo.place_id'],
                user_fields=['username', 'location', 'verified']
            )
            
            if not tweets.data:
                print(f"No tweets found for query: {query}")
                return pd.DataFrame()
            
            # Extract tweet data
            tweets_list = []
            users_dict = {user.id: user for user in tweets.includes.get('users', [])} if tweets.includes else {}
            
            for tweet in tweets.data:
                user = users_dict.get(tweet.author_id)
                
                tweets_list.append({
                    'id': tweet.id,
                    'created_at': tweet.created_at,
                    'content': tweet.text,
                    'author_id': tweet.author_id,
                    'username': user.username if user else None,
                    'user_location': user.location if user else None,
                    'user_verified': user.verified if user else False,
                    'retweet_count': tweet.public_metrics['retweet_count'],
                    'reply_count': tweet.public_metrics['reply_count'],
                    'like_count': tweet.public_metrics['like_count'],
                    'quote_count': tweet.public_metrics['quote_count'],
                    'language': tweet.lang,
                    'search_keyword': query
                })
            
            df = pd.DataFrame(tweets_list)
            print(f"Retrieved {len(df)} tweets for: {query}")
            
            return df
            
        except tweepy.TweepyException as e:
            print(f"Twitter API Error: {str(e)}")
            return pd.DataFrame()
        except Exception as e:
            print(f"Error searching tweets: {str(e)}")
            return pd.DataFrame()
    
    def collect_disaster_tweets(self, tweets_per_keyword=100):
        """
        Collect tweets for all disaster keywords
        
        Args:
            tweets_per_keyword: Number of tweets per keyword
        
        Returns:
            Combined DataFrame with all tweets
        """
        all_tweets = []
        
        print("="*80)
        print("COLLECTING DISASTER TWEETS FROM TWITTER API v2")
        print("="*80)
        
        for keyword in self.disaster_keywords:
            print(f"\nSearching for: {keyword}")
            
            # Build query with India filter
            query = f"{keyword} (India OR Indian) -is:retweet lang:en"
            
            df = self.search_tweets(query, max_results=min(tweets_per_keyword, 100), days_back=7)
            
            if not df.empty:
                all_tweets.append(df)
        
        # Combine all tweets
        if all_tweets:
            combined_df = pd.concat(all_tweets, ignore_index=True)
            
            # Remove duplicates
            combined_df = combined_df.drop_duplicates(subset=['id'])
            
            # Save to CSV
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'disaster_tweets_api_{timestamp}.csv'
            filepath = os.path.join(self.output_dir, filename)
            
            combined_df.to_csv(filepath, index=False)
            
            print("\n" + "="*80)
            print(f"✓ Collected {len(combined_df)} unique tweets")
            print(f"✓ Saved to: {filepath}")
            print("="*80)
            
            return combined_df
        else:
            print("\n⚠️  No tweets collected")
            return pd.DataFrame()
    
    def collect_location_specific(self, location, disaster_type, max_results=100):
        """
        Collect tweets for specific location and disaster
        
        Args:
            location: Location name (e.g., "Mumbai", "Kerala")
            disaster_type: Type of disaster
            max_results: Maximum tweets to collect
        
        Returns:
            DataFrame with filtered tweets
        """
        query = f"{disaster_type} {location} -is:retweet lang:en"
        
        print(f"\nCollecting tweets for {disaster_type} in {location}...")
        df = self.search_tweets(query, max_results=max_results, days_back=14)
        
        if not df.empty:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'tweets_{location}_{disaster_type}_{timestamp}.csv'
            filepath = os.path.join(self.output_dir, filename)
            
            df.to_csv(filepath, index=False)
            print(f"✓ Saved {len(df)} tweets to: {filepath}")
        
        return df


def main():
    """Test the Twitter API collector"""
    print("\n" + "="*80)
    print("TWITTER API v2 DISASTER DATA COLLECTOR")
    print("="*80)
    
    # Check for bearer token
    bearer_token = os.getenv('TWITTER_BEARER_TOKEN')
    
    if not bearer_token:
        print("\n⚠️  ERROR: Twitter Bearer Token not found!")
        print("\nTo use this collector:")
        print("1. Get API credentials from: https://developer.twitter.com/en/portal/dashboard")
        print("2. Set environment variable:")
        print("   - Windows: set TWITTER_BEARER_TOKEN=your_token_here")
        print("   - Linux/Mac: export TWITTER_BEARER_TOKEN=your_token_here")
        print("\nAlternatively, add to .env file:")
        print("   TWITTER_BEARER_TOKEN=your_token_here")
        return
    
    try:
        collector = TwitterAPICollector(bearer_token)
        tweets_df = collector.collect_disaster_tweets(tweets_per_keyword=50)
        
        if not tweets_df.empty:
            print(f"\n✓ Success! Collected {len(tweets_df)} disaster-related tweets")
            print(f"\nSample tweets:")
            print(tweets_df[['created_at', 'content', 'username']].head())
        
    except ValueError as e:
        print(f"\n❌ Error: {str(e)}")
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")


if __name__ == "__main__":
    main()


