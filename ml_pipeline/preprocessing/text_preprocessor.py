"""
Text Preprocessing Pipeline for NLP
Cleans and preprocesses disaster-related text data from tweets and other sources
"""

import re
import string
import pandas as pd
import numpy as np
from datetime import datetime
import os

# NLP libraries
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer, PorterStemmer
from nltk import pos_tag

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet')

try:
    nltk.data.find('taggers/averaged_perceptron_tagger')
except LookupError:
    nltk.download('averaged_perceptron_tagger')

class TextPreprocessor:
    def __init__(self):
        self.lemmatizer = WordNetLemmatizer()
        self.stemmer = PorterStemmer()
        self.stop_words = set(stopwords.words('english'))
        
        # Disaster-related keywords to keep (don't remove as stopwords)
        self.disaster_keywords = {
            'flood', 'earthquake', 'cyclone', 'hurricane', 'tsunami',
            'disaster', 'emergency', 'urgent', 'help', 'rescue',
            'relief', 'aid', 'shelter', 'food', 'water', 'medical',
            'fire', 'drought', 'storm', 'tornado', 'landslide'
        }
        
        # Remove disaster keywords from stopwords
        self.stop_words = self.stop_words - self.disaster_keywords
        
        # Location indicators
        self.location_indicators = [
            'in', 'at', 'near', 'from', 'area', 'region', 'city',
            'state', 'district', 'village', 'town'
        ]
        
        # Resource need keywords
        self.resource_keywords = {
            'food': ['food', 'meal', 'ration', 'grain', 'bread', 'rice'],
            'water': ['water', 'drinking water', 'potable', 'aqua'],
            'shelter': ['shelter', 'home', 'house', 'tent', 'accommodation'],
            'medical': ['medical', 'medicine', 'doctor', 'hospital', 'first aid', 'ambulance', 'health'],
            'rescue': ['rescue', 'save', 'evacuate', 'help', 'sos']
        }
    
    def remove_urls(self, text):
        """Remove URLs from text"""
        url_pattern = re.compile(r'https?://\S+|www\.\S+')
        return url_pattern.sub('', text)
    
    def remove_html(self, text):
        """Remove HTML tags"""
        html_pattern = re.compile(r'<.*?>')
        return html_pattern.sub('', text)
    
    def remove_emojis(self, text):
        """Remove emojis from text"""
        emoji_pattern = re.compile(
            "["
            u"\U0001F600-\U0001F64F"  # emoticons
            u"\U0001F300-\U0001F5FF"  # symbols & pictographs
            u"\U0001F680-\U0001F6FF"  # transport & map symbols
            u"\U0001F1E0-\U0001F1FF"  # flags
            u"\U00002702-\U000027B0"
            u"\U000024C2-\U0001F251"
            "]+", flags=re.UNICODE
        )
        return emoji_pattern.sub('', text)
    
    def remove_mentions_hashtags(self, text):
        """Remove Twitter mentions and hashtags but keep the text"""
        # Remove @ mentions
        text = re.sub(r'@\w+', '', text)
        # Remove # from hashtags but keep the word
        text = re.sub(r'#(\w+)', r'\1', text)
        return text
    
    def remove_special_chars(self, text):
        """Remove special characters and punctuation"""
        # Keep only alphanumeric and spaces
        text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
        return text
    
    def remove_extra_whitespace(self, text):
        """Remove extra whitespace"""
        return ' '.join(text.split())
    
    def to_lowercase(self, text):
        """Convert text to lowercase"""
        return text.lower()
    
    def tokenize(self, text):
        """Tokenize text into words"""
        return word_tokenize(text)
    
    def remove_stopwords(self, tokens):
        """Remove stopwords from tokens"""
        return [token for token in tokens if token not in self.stop_words]
    
    def lemmatize_tokens(self, tokens):
        """Lemmatize tokens"""
        return [self.lemmatizer.lemmatize(token) for token in tokens]
    
    def stem_tokens(self, tokens):
        """Stem tokens"""
        return [self.stemmer.stem(token) for token in tokens]
    
    def clean_text(self, text, remove_stopwords=True, lemmatize=True):
        """
        Complete text cleaning pipeline
        
        Args:
            text: Input text string
            remove_stopwords: Whether to remove stopwords
            lemmatize: Whether to lemmatize (True) or stem (False)
        
        Returns:
            Cleaned text string
        """
        if pd.isna(text) or not isinstance(text, str):
            return ""
        
        # Apply cleaning steps
        text = self.remove_urls(text)
        text = self.remove_html(text)
        text = self.remove_emojis(text)
        text = self.remove_mentions_hashtags(text)
        text = self.to_lowercase(text)
        text = self.remove_special_chars(text)
        text = self.remove_extra_whitespace(text)
        
        # Tokenize
        tokens = self.tokenize(text)
        
        # Remove stopwords
        if remove_stopwords:
            tokens = self.remove_stopwords(tokens)
        
        # Lemmatize or stem
        if lemmatize:
            tokens = self.lemmatize_tokens(tokens)
        else:
            tokens = self.stem_tokens(tokens)
        
        # Join tokens back to string
        cleaned_text = ' '.join(tokens)
        
        return cleaned_text
    
    def extract_disaster_type(self, text):
        """Extract disaster type from text"""
        text_lower = text.lower()
        
        disaster_types = {
            'flood': ['flood', 'flooding', 'flooded', 'inundation', 'deluge'],
            'earthquake': ['earthquake', 'quake', 'tremor', 'seismic'],
            'cyclone': ['cyclone', 'hurricane', 'typhoon', 'storm'],
            'fire': ['fire', 'wildfire', 'blaze', 'burn'],
            'drought': ['drought', 'dry', 'water scarcity'],
            'landslide': ['landslide', 'mudslide', 'landslip'],
            'tsunami': ['tsunami', 'tidal wave'],
            'tornado': ['tornado', 'twister']
        }
        
        detected_types = []
        for disaster, keywords in disaster_types.items():
            if any(keyword in text_lower for keyword in keywords):
                detected_types.append(disaster)
        
        return detected_types if detected_types else ['unknown']
    
    def extract_location(self, text):
        """
        Extract location information from text
        Simple rule-based extraction
        """
        # Look for common location patterns
        location_pattern = r'\b(?:in|at|near|from)\s+([A-Z][a-zA-Z\s]+?)(?:\s|,|\.|\b)'
        matches = re.findall(location_pattern, text)
        
        if matches:
            return [m.strip() for m in matches]
        
        return []
    
    def extract_resource_needs(self, text):
        """Extract resource needs mentioned in text"""
        text_lower = text.lower()
        
        needs = []
        for resource, keywords in self.resource_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                needs.append(resource)
        
        return needs if needs else ['unknown']
    
    def detect_urgency(self, text):
        """Detect urgency level from text"""
        text_lower = text.lower()
        
        critical_keywords = ['urgent', 'emergency', 'critical', 'immediate', 'sos', 'help']
        high_keywords = ['severe', 'serious', 'major', 'significant']
        
        critical_count = sum(1 for keyword in critical_keywords if keyword in text_lower)
        high_count = sum(1 for keyword in high_keywords if keyword in text_lower)
        
        if critical_count >= 2:
            return 'critical'
        elif critical_count >= 1:
            return 'high'
        elif high_count >= 1:
            return 'medium'
        else:
            return 'low'
    
    def process_dataframe(self, df, text_column='content', output_dir='../backend/data/processed'):
        """
        Process a DataFrame with text data
        
        Args:
            df: Input DataFrame
            text_column: Name of the column containing text
            output_dir: Directory to save processed data
        
        Returns:
            Processed DataFrame
        """
        print(f"Processing {len(df)} text records...")
        
        os.makedirs(output_dir, exist_ok=True)
        
        # Clean text
        print("Cleaning text...")
        df['cleaned_text'] = df[text_column].apply(lambda x: self.clean_text(x))
        
        # Extract features
        print("Extracting disaster types...")
        df['disaster_types'] = df[text_column].apply(self.extract_disaster_type)
        
        print("Extracting locations...")
        df['extracted_locations'] = df[text_column].apply(self.extract_location)
        
        print("Extracting resource needs...")
        df['resource_needs'] = df['cleaned_text'].apply(self.extract_resource_needs)
        
        print("Detecting urgency...")
        df['urgency'] = df[text_column].apply(self.detect_urgency)
        
        # Add processing timestamp
        df['processed_at'] = datetime.now()
        
        # Save processed data
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'processed_text_{timestamp}.csv'
        filepath = os.path.join(output_dir, filename)
        
        df.to_csv(filepath, index=False)
        print(f"\nSaved processed data to {filepath}")
        
        return df

def main():
    """Test the preprocessor"""
    preprocessor = TextPreprocessor()
    
    # Sample tweets
    sample_texts = [
        "URGENT! Major flooding in Mumbai. Need food and water supplies immediately. #MumbaiFloods",
        "Earthquake reported in Gujarat region. Medical assistance required. Many injured.",
        "Cyclone Biparjoy approaching Gujarat coast. Evacuation in progress. Shelter needed for 10000 families.",
        "https://t.co/example Fire outbreak in forest area near Uttarakhand. @rescue please help!",
        "Heavy rains causing landslides in Kerala hills. Emergency rescue operations ongoing 🚨🆘"
    ]
    
    print("Text Preprocessing Examples:\n" + "="*60)
    
    for i, text in enumerate(sample_texts, 1):
        print(f"\nOriginal {i}: {text}")
        cleaned = preprocessor.clean_text(text)
        print(f"Cleaned {i}: {cleaned}")
        print(f"Disaster Type: {preprocessor.extract_disaster_type(text)}")
        print(f"Locations: {preprocessor.extract_location(text)}")
        print(f"Resources: {preprocessor.extract_resource_needs(text)}")
        print(f"Urgency: {preprocessor.detect_urgency(text)}")
        print("-" * 60)
    
    # Test with DataFrame
    df = pd.DataFrame({'content': sample_texts})
    processed_df = preprocessor.process_dataframe(df)
    print(f"\nProcessed DataFrame:\n{processed_df[['cleaned_text', 'disaster_types', 'urgency']].head()}")

if __name__ == "__main__":
    main()














