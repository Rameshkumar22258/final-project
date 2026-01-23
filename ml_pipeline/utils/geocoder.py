"""
Simple geocoder for Indian cities
Returns latitude/longitude coordinates
"""

import sys
import json

# Database of Indian city coordinates
CITY_COORDINATES = {
    # Major Cities
    'Mumbai': (19.0760, 72.8777),
    'Delhi': (28.7041, 77.1025),
    'Bangalore': (12.9716, 77.5946),
    'Hyderabad': (17.3850, 78.4867),
    'Chennai': (13.0827, 80.2707),
    'Kolkata': (22.5726, 88.3639),
    'Pune': (18.5204, 73.8567),
    'Ahmedabad': (23.0225, 72.5714),
    'Surat': (21.1702, 72.8311),
    'Jaipur': (26.9124, 75.7873),
    'Lucknow': (26.8467, 80.9462),
    'Kanpur': (26.4499, 80.3319),
    'Nagpur': (21.1458, 79.0882),
    'Indore': (22.7196, 75.8577),
    'Bhopal': (23.2599, 77.4126),
    'Visakhapatnam': (17.6868, 83.2185),
    'Patna': (25.5941, 85.1376),
    'Vadodara': (22.3072, 73.1812),
    'Ludhiana': (30.9010, 75.8573),
    'Agra': (27.1767, 78.0081),
    'Varanasi': (25.3176, 82.9739),
    'Srinagar': (34.0837, 74.7973),
    'Amritsar': (31.6340, 74.8723),
    'Ranchi': (23.3441, 85.3096),
    'Coimbatore': (11.0168, 76.9558),
    'Guwahati': (26.1445, 91.7362),
    'Chandigarh': (30.7333, 76.7794),
    'Mysore': (12.2958, 76.6394),
    'Bhubaneswar': (20.2961, 85.8245),
    'Thiruvananthapuram': (8.5241, 76.9366),
    'Kochi': (9.9312, 76.2673),
    
    # Hill Stations & Disaster-Prone
    'Shimla': (31.1048, 77.1734),
    'Manali': (32.2396, 77.1887),
    'Darjeeling': (27.0410, 88.2663),
    'Nainital': (29.3803, 79.4636),
    'Mussoorie': (30.4598, 78.0644),
    'Ooty': (11.4102, 76.6950),
    'Gangtok': (27.3389, 88.6065),
    'Shillong': (25.5788, 91.8933),
    'Chamoli': (30.4067, 79.3308),
    'Kedarnath': (30.7346, 79.0669),
    'Kullu': (31.9578, 77.1101),
    'Uttarkashi': (30.7268, 78.4354),
    'Pithoragarh': (29.5831, 80.2146),
    'Leh': (34.1526, 77.5771),
    'Rishikesh': (30.0869, 78.2676),
    'Haridwar': (29.9457, 78.1642),
    
    # Coastal Cities
    'Goa': (15.2993, 74.1240),
    'Puducherry': (11.9416, 79.8083),
    'Mangalore': (12.9141, 74.8560),
    'Kozhikode': (11.2588, 75.7804),
    'Puri': (19.8135, 85.8312),
    'Digha': (21.6285, 87.5088),
}

# State center coordinates
STATE_COORDINATES = {
    'Maharashtra': (19.7515, 75.7139),
    'Delhi': (28.7041, 77.1025),
    'Karnataka': (15.3173, 75.7139),
    'Tamil Nadu': (11.1271, 78.6569),
    'Telangana': (18.1124, 79.0193),
    'West Bengal': (22.9868, 87.8550),
    'Gujarat': (22.2587, 71.1924),
    'Rajasthan': (27.0238, 74.2179),
    'Uttar Pradesh': (26.8467, 80.9462),
    'Madhya Pradesh': (22.9734, 78.6569),
    'Bihar': (25.0961, 85.3131),
    'Punjab': (31.1471, 75.3412),
    'Haryana': (29.0588, 76.0856),
    'Kerala': (10.8505, 76.2711),
    'Odisha': (20.9517, 85.0985),
    'Jharkhand': (23.6102, 85.2799),
    'Assam': (26.2006, 92.9376),
    'Chhattisgarh': (21.2787, 81.8661),
    'Uttarakhand': (30.0668, 79.0193),
    'Himachal Pradesh': (31.1048, 77.1734),
    'Jammu and Kashmir': (33.7782, 76.5762),
}

def get_coordinates(city, state=''):
    """Get coordinates for city"""
    # Normalize city name
    city_normalized = city.strip().title()
    
    # Try exact match
    if city_normalized in CITY_COORDINATES:
        lat, lng = CITY_COORDINATES[city_normalized]
        return {'latitude': lat, 'longitude': lng, 'source': 'database'}
    
    # Try state
    state_normalized = state.strip().title()
    if state_normalized in STATE_COORDINATES:
        lat, lng = STATE_COORDINATES[state_normalized]
        return {'latitude': lat, 'longitude': lng, 'source': 'state_center'}
    
    # Default: India center
    return {'latitude': 20.5937, 'longitude': 78.9629, 'source': 'country_center'}

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'City name required'}))
        sys.exit(1)
    
    city = sys.argv[1]
    state = sys.argv[2] if len(sys.argv) > 2 else ''
    
    result = get_coordinates(city, state)
    print(json.dumps(result))

if __name__ == '__main__':
    main()












