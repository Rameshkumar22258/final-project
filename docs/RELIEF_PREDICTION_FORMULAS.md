# 📊 Relief Prediction Formulas & Estimation Methods

## Overview

This document explains the mathematical formulas, estimation methods, and calculation logic used in the SwasthyaSetu Relief Prediction System. The system uses **bounded functions** with **exposure ratios** and **capacity constraints** to prevent overestimation and produce realistic, deployable predictions.

---

## 🎯 Core Principles

### 1. **Exposure Ratio Principle**
Not all affected people need relief. Only a percentage (exposure ratio) actually require aid.

### 2. **Bounded Functions**
Predictions are capped by administrative capacity limits to ensure deployability.

### 3. **Duration-Based Calculation**
Relief needs vary by disruption duration, not fixed periods.

### 4. **Sub-Type Awareness**
Different disaster sub-types (e.g., flash flood vs riverine flood) have different resource needs.

---

## 📐 Formula 1: Exposure Ratio Calculation

### Formula
```
Exposure Ratio = f(Severity)
```

### Values by Severity

| Severity | Exposure Ratio | Range | Rationale |
|----------|---------------|-------|-----------|
| **LOW** | 0.20 (20%) | 15-25% | Minor impact, most people self-sufficient |
| **MEDIUM** | 0.375 (37.5%) | 30-45% | Moderate impact, significant portion needs aid |
| **HIGH** | 0.525 (52.5%) | 45-60% | Major impact, majority needs assistance |
| **CRITICAL** | 0.70 (70%) | 60-80% | Severe impact, most people need immediate aid |

### Calculation
```javascript
const exposureRatios = {
  low: 0.20,
  medium: 0.375,
  high: 0.525,
  critical: 0.70
};

effectiveExposureRatio = exposure_ratio || exposureRatios[severity] || 0.375;
```

### Example
- **Total Affected**: 500,000 people
- **Severity**: HIGH
- **Exposure Ratio**: 0.525 (52.5%)
- **Directly Exposed**: 500,000 × 0.525 = **262,500 people**

---

## 📐 Formula 2: Disruption Duration Calculation

### Formula
```
Duration (days) = f(Severity)
```

### Values by Severity

| Severity | Duration (days) | Range | Rationale |
|----------|----------------|-------|-----------|
| **LOW** | 1.5 | 1-2 days | Quick recovery |
| **MEDIUM** | 3.0 | 2-4 days | Moderate disruption |
| **HIGH** | 4.5 | 3-6 days | Extended relief needed |
| **CRITICAL** | 10.5 | 7-14 days | Long-term relief required |

### Calculation
```javascript
const durationBySeverity = {
  low: 1.5,
  medium: 3.0,
  high: 4.5,
  critical: 10.5
};

duration = disruption_duration || durationBySeverity[severity] || 3.0;
```

---

## 📐 Formula 3: Directly Exposed Population

### Formula
```
Directly Exposed = Total Affected × Exposure Ratio
```

### Calculation
```javascript
directlyExposed = Math.round(totalAffected * effectiveExposureRatio);
```

### Example
- **Total Affected**: 500,000
- **Exposure Ratio**: 0.525
- **Directly Exposed**: 500,000 × 0.525 = **262,500 people**

---

## 📐 Formula 4: Disaster Sub-Type Modifiers (All Disaster Types)

### Formula
```
Sub-Type Modifier = f(Disaster Type, Disaster Sub-Type)
```

### Modifiers by Disaster Type and Sub-Type

#### 🌊 Flood Sub-Types

| Sub-Type | Food | Shelter | Medical | Water | Rationale |
|----------|------|---------|--------|-------|-----------|
| **Urban** | 1.0× | 0.3× | 1.0× | 0.8× | Lower shelter need (buildings available) |
| **Riverine** | 1.2× | 1.0× | 1.0× | 1.2× | Large area, high water need |
| **Flash** | 1.5× | 1.5× | 1.3× | 1.0× | Sudden, intense, high rescue/shelter need |
| **Coastal** | 1.0× | 0.7× | 0.9× | 1.0× | Moderate impact, evacuation common |

#### 🏚️ Earthquake Sub-Types

| Sub-Type | Food | Shelter | Medical | Water | Rationale |
|----------|------|---------|--------|-------|-----------|
| **Shallow** | 1.2× | 1.3× | 1.4× | 1.1× | <70km depth, more surface damage |
| **Deep** | 0.9× | 0.8× | 0.9× | 0.9× | >70km depth, less surface impact |
| **Tectonic** | 1.1× | 1.2× | 1.2× | 1.0× | Plate boundary, widespread |
| **Volcanic** | 1.3× | 1.4× | 1.5× | 1.3× | Volcanic activity, high medical need |

#### 🌀 Cyclone Sub-Types

| Sub-Type | Food | Shelter | Medical | Water | Rationale |
|----------|------|---------|--------|-------|-----------|
| **Tropical** | 1.1× | 1.2× | 1.1× | 1.1× | Standard, Category 1-3 |
| **Extratropical** | 0.9× | 0.9× | 0.9× | 0.9× | Weaker, cooler system |
| **Super** | 1.5× | 1.6× | 1.4× | 1.3× | Category 4-5, extreme |
| **Depression** | 0.7× | 0.6× | 0.7× | 0.8× | Weak system, minimal impact |

#### ⛰️ Landslide Sub-Types

| Sub-Type | Food | Shelter | Medical | Water | Rationale |
|----------|------|---------|--------|-------|-----------|
| **Rockfall** | 0.8× | 0.7× | 1.2× | 0.8× | Localized, high trauma risk |
| **Mudslide** | 1.3× | 1.4× | 1.1× | 1.2× | Widespread, high shelter need |
| **Debris Flow** | 1.4× | 1.5× | 1.3× | 1.1× | Fast-moving, destructive |
| **Rotational** | 1.1× | 1.2× | 1.0× | 1.0× | Slower, predictable |

#### 🔥 Wildfire Sub-Types

| Sub-Type | Food | Shelter | Medical | Water | Rationale |
|----------|------|---------|--------|-------|-----------|
| **Forest** | 1.2× | 1.3× | 1.1× | 1.4× | Large area, high water need |
| **Grassland** | 0.9× | 0.8× | 0.9× | 1.2× | Smaller impact |
| **Urban** | 1.4× | 1.5× | 1.3× | 1.3× | High density, high shelter need |
| **Interface** | 1.3× | 1.4× | 1.2× | 1.3× | Wildland-urban interface, high risk |

#### ☀️ Drought Sub-Types

| Sub-Type | Food | Shelter | Medical | Water | Rationale |
|----------|------|---------|--------|-------|-----------|
| **Meteorological** | 1.0× | 0.5× | 0.8× | 1.5× | Low rainfall, high water need |
| **Agricultural** | 1.3× | 0.4× | 0.7× | 1.6× | Crop failure, food crisis |
| **Hydrological** | 1.2× | 0.5× | 0.9× | 1.8× | Water shortage, critical |
| **Socioeconomic** | 1.4× | 0.6× | 1.0× | 1.7× | Economic impact, food aid |

#### 🌊 Tsunami Sub-Types

| Sub-Type | Food | Shelter | Medical | Water | Rationale |
|----------|------|---------|--------|-------|-----------|
| **Tectonic** | 1.2× | 1.3× | 1.4× | 1.1× | Earthquake-triggered, widespread |
| **Volcanic** | 1.3× | 1.4× | 1.5× | 1.2× | Volcanic activity, high medical |
| **Landslide-Triggered** | 1.1× | 1.2× | 1.3× | 1.0× | Localized but intense |
| **Meteorite** | 1.0× | 1.0× | 1.0× | 1.0× | Rare, standard response |

#### ❄️ Avalanche Sub-Types

| Sub-Type | Food | Shelter | Medical | Water | Rationale |
|----------|------|---------|--------|-------|-----------|
| **Slab** | 0.9× | 0.8× | 1.3× | 0.7× | Large, high rescue need |
| **Powder** | 0.7× | 0.6× | 1.1× | 0.6× | Fast, localized |
| **Wet** | 1.0× | 0.9× | 1.2× | 0.8× | Heavy, slower |
| **Icefall** | 0.8× | 0.7× | 1.4× | 0.7× | Very localized, high trauma |

### Calculation
```javascript
const subtypeModifiers = {
  flood: { urban: {...}, riverine: {...}, flash: {...}, coastal: {...} },
  earthquake: { shallow: {...}, deep: {...}, tectonic: {...}, volcanic: {...} },
  cyclone: { tropical: {...}, extratropical: {...}, super: {...}, depression: {...} },
  landslide: { rockfall: {...}, mudslide: {...}, debris_flow: {...}, rotational: {...} },
  wildfire: { forest: {...}, grassland: {...}, urban: {...}, interface: {...} },
  drought: { meteorological: {...}, agricultural: {...}, hydrological: {...}, socioeconomic: {...} },
  tsunami: { tectonic: {...}, volcanic: {...}, landslide_triggered: {...}, meteorite: {...} },
  avalanche: { slab: {...}, powder: {...}, wet: {...}, icefall: {...} }
};

const disasterModifiers = subtypeModifiers[disaster_type] || subtypeModifiers.flood;
const subtypeMod = disaster_subtype && disasterModifiers[disaster_subtype]
  ? disasterModifiers[disaster_subtype]
  : disasterModifiers.default;
```

---

## 📐 Formula 5: Base Requirements per Exposed Person

### Formula
```
Base Requirements = f(Disaster Type)
```

### Requirements by Disaster Type

| Disaster Type | Meals/Day | Water (L/Day) | Medical Ratio | Shelter Ratio |
|---------------|-----------|---------------|--------------|---------------|
| **Flood** | 1.75 | 8 | 0.008 (0.8%) | 0.35 (35%) |
| **Earthquake** | 1.75 | 12 | 0.015 (1.5%) | 0.65 (65%) |
| **Cyclone** | 1.75 | 10 | 0.012 (1.2%) | 0.55 (55%) |
| **Landslide** | 1.75 | 8 | 0.020 (2.0%) | 0.45 (45%) |
| **Wildfire** | 1.75 | 6 | 0.010 (1.0%) | 0.30 (30%) |
| **Drought** | 1.75 | 15 | 0.004 (0.4%) | 0.08 (8%) |
| **Tsunami** | 1.75 | 12 | 0.025 (2.5%) | 0.75 (75%) |
| **Avalanche** | 1.75 | 8 | 0.015 (1.5%) | 0.40 (40%) |

### Key Notes
- **Meals per Day**: 1.75 (not 3) - realistic consumption during emergencies
- **Medical Ratio**: Percentage of exposed population needing medical teams
- **Shelter Ratio**: Percentage of exposed population needing temporary shelter

---

## 📐 Formula 6: Raw Demand Calculation

### Food Packets
```
Raw Food Packets = Directly Exposed × Meals/Day × Duration × Sub-Type Modifier
```

### Water (Liters)
```
Raw Water = Directly Exposed × Water (L/Day) × Duration × Sub-Type Modifier
```

### Medical Teams
```
Raw Medical Teams = max(1, Directly Exposed × Medical Ratio × Sub-Type Modifier)
```

### Rescue Personnel
```
Raw Rescue Personnel = max(10, Directly Exposed × 0.015)
```
*Note: 1.5% of exposed population needs rescue*

### Temporary Shelters
```
Raw Shelters = (Directly Exposed × Shelter Ratio × Sub-Type Modifier) / 50
```
*Note: 50 people per shelter*

### Financial Aid
```
Raw Financial Aid = Directly Exposed × ₹20,000
```
*Note: ₹20k per exposed person (not per affected)*

### Example Calculation (Srikakulam Flash Flood)
- **Directly Exposed**: 262,500
- **Duration**: 4.5 days
- **Sub-Type**: Flash flood (food: 1.5×, shelter: 1.5×)
- **Disaster Type**: Flood (meals: 1.75, water: 8L, shelter: 0.35)

**Raw Food Packets**:
```
262,500 × 1.75 × 4.5 × 1.5 = 3,094,219 packets
```

**Raw Water**:
```
262,500 × 8 × 4.5 × 1.0 = 9,450,000 liters
```

**Raw Medical Teams**:
```
262,500 × 0.008 × 1.3 = 2,730 teams
```

**Raw Shelters**:
```
(262,500 × 0.35 × 1.5) / 50 = 2,756 shelters
```

---

## 📐 Formula 7: Capacity Constraints (District-Level Limits)

### Formula
```
Capacity Limit = f(Resource Type)
```

### Default Capacity Limits

| Resource | Daily Capacity | Max Total | Rationale |
|----------|---------------|-----------|-----------|
| **Food Packets** | 40,000/day | 40,000 × Duration | District logistics limit |
| **Water (Liters)** | 1,200,000/day | 1,200,000 × Duration | Water treatment/distribution capacity |
| **Medical Teams** | - | 200 teams | Available medical personnel |
| **Rescue Personnel** | - | 2,000 personnel | Search & rescue capacity |
| **Relief Camps** | - | 400 camps | Available camp sites |

### Calculation
```javascript
const capacityLimits = {
  food_packets_per_day: 40000,
  water_liters_per_day: 1200000,
  medical_teams_max: 200,
  rescue_personnel_max: 2000,
  relief_camps_max: 400
};
```

---

## 📐 Formula 8: Bounded Function (Final Prediction)

### Formula
```
Final Prediction = min(Raw Demand, Capacity Limit)
```

### Food Packets
```
Food Packets = min(
  Raw Food Packets,
  Food Capacity/Day × Duration
)
```

### Water
```
Water = min(
  Raw Water,
  Water Capacity/Day × Duration
)
```

### Medical Teams
```
Medical Teams = min(
  Raw Medical Teams,
  Max Medical Teams
)
```

### Rescue Personnel
```
Rescue Personnel = min(
  Raw Rescue Personnel,
  Max Rescue Personnel
)
```

### Temporary Shelters
```
Shelters = min(
  Raw Shelters,
  Max Relief Camps
)
```

### Example (Srikakulam - Final Bounded Values)

**Food Packets**:
```
min(3,094,219, 40,000 × 4.5) = min(3,094,219, 180,000) = 180,000 packets
```

**Water**:
```
min(9,450,000, 1,200,000 × 4.5) = min(9,450,000, 5,400,000) = 5,400,000 liters
```

**Medical Teams**:
```
min(2,730, 200) = 200 teams
```

**Shelters**:
```
min(2,756, 400) = 400 shelters
```

---

## 📐 Formula 9: Phased Prediction Breakdown

### Formula
```
Phase Demand = Total Demand × Phase Percentage
```

### Phase Distribution

| Phase | Days | Food | Water | Medical | Rescue | Financial |
|-------|------|------|-------|---------|--------|-----------|
| **Phase 1** | 0-1 | 15% | 20% | 30% | 80% | 0% |
| **Phase 2** | 2-4 | 40% | 45% | 50% | 20% | 0% |
| **Phase 3** | 5-7 | 30% | 25% | 20% | 0% | 0% |
| **Phase 4** | 7+ | 15% | 10% | 0% | 0% | 100% |

### Calculation
```javascript
phases = {
  phase1_days_0_1: {
    food_packets: Math.round(foodPackets * 0.15),
    water_liters: Math.round(waterLiters * 0.20),
    rescue_personnel: Math.round(rescuePersonnel * 0.80),
    medical_teams: Math.round(medicalTeams * 0.30)
  },
  phase2_days_2_4: {
    food_packets: Math.round(foodPackets * 0.40),
    water_liters: Math.round(waterLiters * 0.45),
    medical_teams: Math.round(medicalTeams * 0.50)
  },
  phase3_days_5_7: {
    food_packets: Math.round(foodPackets * 0.30),
    water_liters: Math.round(waterLiters * 0.25),
    medical_teams: Math.round(medicalTeams * 0.20)
  },
  phase4_days_7_plus: {
    food_packets: Math.round(foodPackets * 0.15),
    financial_aid_inr: rawFinancialAid
  }
};
```

### Example (180,000 food packets total)

- **Phase 1 (Day 0-1)**: 180,000 × 0.15 = **27,000 packets**
- **Phase 2 (Day 2-4)**: 180,000 × 0.40 = **72,000 packets**
- **Phase 3 (Day 5-7)**: 180,000 × 0.30 = **54,000 packets**
- **Phase 4 (Day 7+)**: 180,000 × 0.15 = **27,000 packets**

---

## 📊 Complete Calculation Flow

### Step-by-Step Process

1. **Input**: Total Affected Population, Severity, Disaster Type, Sub-Type
2. **Calculate Exposure Ratio**: Based on severity
3. **Calculate Duration**: Based on severity
4. **Calculate Directly Exposed**: Total × Exposure Ratio
5. **Get Base Requirements**: Based on disaster type
6. **Apply Sub-Type Modifiers**: If applicable
7. **Calculate Raw Demand**: For each resource type
8. **Apply Capacity Constraints**: Bound by admin capacity
9. **Generate Phased Breakdown**: Distribute by time phases
10. **Output**: Bounded predictions with metadata

### Example: Complete Calculation (Srikakulam Flash Flood)

**Inputs**:
- Total Affected: 500,000
- Severity: HIGH
- Disaster Type: Flood
- Sub-Type: Flash
- Terrain: Coastal

**Step 1 - Exposure Ratio**:
```
Exposure Ratio = 0.525 (HIGH severity)
```

**Step 2 - Duration**:
```
Duration = 4.5 days (HIGH severity)
```

**Step 3 - Directly Exposed**:
```
Directly Exposed = 500,000 × 0.525 = 262,500
```

**Step 4 - Base Requirements**:
```
Meals/Day = 1.75
Water/Day = 8L
Medical Ratio = 0.008
Shelter Ratio = 0.35
```

**Step 5 - Sub-Type Modifiers**:
```
Food Modifier = 1.5× (flash flood)
Shelter Modifier = 1.5× (flash flood)
Medical Modifier = 1.3× (flash flood)
Water Modifier = 1.0× (flash flood)
```

**Step 6 - Raw Demand**:
```
Raw Food = 262,500 × 1.75 × 4.5 × 1.5 = 3,094,219
Raw Water = 262,500 × 8 × 4.5 × 1.0 = 9,450,000
Raw Medical = 262,500 × 0.008 × 1.3 = 2,730
Raw Shelters = (262,500 × 0.35 × 1.5) / 50 = 2,756
```

**Step 7 - Capacity Constraints**:
```
Food Capacity = 40,000 × 4.5 = 180,000
Water Capacity = 1,200,000 × 4.5 = 5,400,000
Medical Capacity = 200
Shelter Capacity = 400
```

**Step 8 - Bounded Final Values**:
```
Food Packets = min(3,094,219, 180,000) = 180,000
Water = min(9,450,000, 5,400,000) = 5,400,000
Medical Teams = min(2,730, 200) = 200
Shelters = min(2,756, 400) = 400
```

**Step 9 - Phased Breakdown**:
```
Phase 1: 27,000 food, 1,080,000 water, 60 medical, 1,600 rescue
Phase 2: 72,000 food, 2,430,000 water, 100 medical
Phase 3: 54,000 food, 1,350,000 water, 40 medical
Phase 4: 27,000 food, ₹5,250,000,000 financial aid
```

---

## 🔢 Comparison: Old vs New Algorithm

### Old Algorithm (Linear, Overestimated)

**Formula**:
```
Food Packets = Population × 3 meals × 7 days × Severity Multiplier
```

**Example (Srikakulam)**:
```
500,000 × 3 × 7 × 1.2 = 12,600,000 packets ❌ (Unrealistic!)
```

### New Algorithm (Bounded, Realistic)

**Formula**:
```
Food Packets = min(
  Exposed × 1.75 × Duration × Modifier,
  Capacity × Duration
)
```

**Example (Srikakulam)**:
```
min(3,094,219, 180,000) = 180,000 packets ✅ (Realistic & Deployable!)
```

**Reduction**: 98.6% reduction in overestimation!

---

## 📋 Key Parameters Reference

### Exposure Ratios
- LOW: 20%
- MEDIUM: 37.5%
- HIGH: 52.5%
- CRITICAL: 70%

### Duration (Days)
- LOW: 1.5
- MEDIUM: 3.0
- HIGH: 4.5
- CRITICAL: 10.5

### Capacity Limits (District)
- Food: 40,000 packets/day
- Water: 1,200,000 liters/day
- Medical Teams: 200 max
- Rescue Personnel: 2,000 max
- Relief Camps: 400 max

### Base Requirements
- Meals per Day: 1.75 (not 3)
- People per Shelter: 50
- Rescue Ratio: 1.5% of exposed
- Financial Aid: ₹20,000 per exposed person

---

## 🎯 Accuracy Improvements

### Before (Old Algorithm)
- ❌ Assumed 100% of affected need everything
- ❌ Fixed 7-day duration
- ❌ No capacity constraints
- ❌ Linear multipliers
- ❌ Overestimated by 10-50x

### After (New Algorithm)
- ✅ Only exposed population counted (20-70%)
- ✅ Severity-based duration (1.5-10.5 days)
- ✅ Capacity constraints applied
- ✅ Sub-type aware modifiers
- ✅ Realistic, deployable predictions

---

## 📚 References

- NDMA (National Disaster Management Authority) Guidelines
- EM-DAT (Emergency Events Database) Historical Data
- Real-world disaster response capacity studies
- Government PDNA (Post-Disaster Needs Assessment) Reports

---

## 🔄 Version History

- **v2.0** (Current): Bounded functions with exposure ratios and capacity constraints
- **v1.0**: Linear algorithm with fixed multipliers (deprecated)

---

*Last Updated: January 2025*
