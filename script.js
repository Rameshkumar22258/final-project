// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initNavigation();
    initPredictionForm();
    initMonitoringSystem();
    initHistoricalAnalysis();
    initMobileMenu();
    initSmoothScrolling();
    initAnimations();
    initDashboard();
});

// Navigation functionality
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Get target section
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Mobile menu functionality
function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Close menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
}

// Smooth scrolling for buttons
function initSmoothScrolling() {
    // Add smooth scrolling to hero buttons
    const heroButtons = document.querySelectorAll('.hero-buttons .btn');
    heroButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// AI Disaster Relief Prediction Form
function initPredictionForm() {
    const predictionForm = document.getElementById('predictionForm');
    const predictionResults = document.getElementById('predictionResults');
    const predictionContent = document.getElementById('predictionContent');
    
    if (predictionForm) {
        predictionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = {
                disasterType: document.getElementById('disasterType').value,
                region: document.getElementById('region').value,
                populationDensity: document.getElementById('populationDensity').value,
                severity: document.getElementById('severity').value,
                historicalEvents: parseInt(document.getElementById('historicalEvents').value) || 0
            };
            
            // Generate AI prediction
            const prediction = generateAIPrediction(formData);
            
            // Display results
            displayPredictionResults(prediction);
            
            // Show results section
            predictionResults.style.display = 'block';
            predictionResults.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    }
}

function generateAIPrediction(data) {
    // AI model simulation for disaster relief demand prediction
    const baseDemand = {
        flood: { food: 1000, medical: 500, shelter: 800, water: 20000 },
        cyclone: { food: 800, medical: 700, shelter: 1200, water: 25000 },
        earthquake: { food: 1200, medical: 1000, shelter: 1500, water: 30000 },
        drought: { food: 1500, medical: 300, shelter: 400, water: 50000 },
        wildfire: { food: 600, medical: 400, shelter: 900, water: 15000 },
        landslide: { food: 400, medical: 800, shelter: 600, water: 10000 }
    };

    // Severity multipliers
    const severityMultipliers = {
        low: 0.5,
        medium: 1.0,
        high: 2.0,
        critical: 3.5
    };

    // Population density multipliers
    const densityMultipliers = {
        low: 0.7,
        medium: 1.0,
        high: 1.5
    };

    // Historical events impact
    const historicalImpact = Math.min(data.historicalEvents * 0.1, 0.5);

    const base = baseDemand[data.disasterType] || baseDemand.flood;
    const severityMult = severityMultipliers[data.severity] || 1.0;
    const densityMult = densityMultipliers[data.populationDensity] || 1.0;
    const totalMultiplier = severityMult * densityMult * (1 + historicalImpact);

    return {
        disasterType: data.disasterType,
        region: data.region,
        predictedDemand: {
            food: Math.round(base.food * totalMultiplier),
            medical: Math.round(base.medical * totalMultiplier),
            shelter: Math.round(base.shelter * totalMultiplier),
            water: Math.round(base.water * totalMultiplier)
        },
        confidence: Math.min(85 + (data.historicalEvents * 2), 95),
        urgency: data.severity === 'critical' ? 'IMMEDIATE' : 
                data.severity === 'high' ? 'HIGH' : 
                data.severity === 'medium' ? 'MODERATE' : 'LOW',
        recommendations: generateRecommendations(data),
        estimatedAffected: Math.round(base.food * totalMultiplier / 0.5) // Rough estimate
    };
}

function generateRecommendations(data) {
    const recommendations = [];
    
    // Disaster-specific recommendations
    if (data.disasterType === 'flood') {
        recommendations.push('Deploy water purification units and emergency boats');
        recommendations.push('Set up temporary shelters in elevated areas');
        recommendations.push('Prepare medical supplies for waterborne diseases');
    } else if (data.disasterType === 'cyclone') {
        recommendations.push('Evacuate coastal areas and secure infrastructure');
        recommendations.push('Stock emergency medical supplies for wind-related injuries');
        recommendations.push('Prepare backup power systems and communication equipment');
    } else if (data.disasterType === 'earthquake') {
        recommendations.push('Deploy search and rescue teams with specialized equipment');
        recommendations.push('Set up field hospitals for trauma care');
        recommendations.push('Prepare temporary housing for displaced families');
    }
    
    // Severity-based recommendations
    if (data.severity === 'critical' || data.severity === 'high') {
        recommendations.push('Activate emergency response protocols immediately');
        recommendations.push('Coordinate with military and international aid organizations');
        recommendations.push('Establish command centers for centralized coordination');
    }
    
    // Population density considerations
    if (data.populationDensity === 'high') {
        recommendations.push('Plan for mass evacuation routes and shelter capacity');
        recommendations.push('Increase medical personnel and supplies allocation');
    }
    
    return recommendations;
}

function displayPredictionResults(prediction) {
    const predictionContent = document.getElementById('predictionContent');
    
    let html = `
        <div class="prediction-summary">
            <h4>AI-Generated Relief Demand Forecast</h4>
            <div class="prediction-metadata">
                <div class="metadata-item">
                    <strong>Disaster Type:</strong> ${prediction.disasterType.toUpperCase()}
                </div>
                <div class="metadata-item">
                    <strong>Region:</strong> ${prediction.region}
                </div>
                <div class="metadata-item">
                    <strong>Urgency Level:</strong> 
                    <span class="urgency-level ${prediction.urgency.toLowerCase()}">${prediction.urgency}</span>
                </div>
                <div class="metadata-item">
                    <strong>AI Confidence:</strong> ${prediction.confidence}%
                </div>
                <div class="metadata-item">
                    <strong>Estimated Affected:</strong> ${prediction.estimatedAffected.toLocaleString()} people
            </div>
            </div>
        </div>
        
        <div class="demand-forecast">
            <h5>Predicted Relief Requirements:</h5>
            <div class="demand-grid">
                <div class="demand-item">
                    <i class="fas fa-utensils"></i>
                    <span class="demand-label">Food</span>
                    <span class="demand-value">${prediction.predictedDemand.food.toLocaleString()} tons</span>
                </div>
                <div class="demand-item">
                    <i class="fas fa-ambulance"></i>
                    <span class="demand-label">Medical Aid</span>
                    <span class="demand-value">${prediction.predictedDemand.medical.toLocaleString()} people</span>
                </div>
                <div class="demand-item">
                    <i class="fas fa-home"></i>
                    <span class="demand-label">Shelter</span>
                    <span class="demand-value">${prediction.predictedDemand.shelter.toLocaleString()} families</span>
                </div>
                <div class="demand-item">
                    <i class="fas fa-tint"></i>
                    <span class="demand-label">Water</span>
                    <span class="demand-value">${prediction.predictedDemand.water.toLocaleString()} liters</span>
                </div>
            </div>
        </div>
        
        <div class="ai-recommendations">
            <h5>AI Recommendations:</h5>
            <ul>
                ${prediction.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
        
        <div class="next-steps">
            <p><strong>Next Steps:</strong> Review and validate these predictions with field assessment teams before resource deployment.</p>
        </div>
    `;
    
    predictionContent.innerHTML = html;
}

// Real-time Monitoring System
function initMonitoringSystem() {
    const startMonitoringBtn = document.getElementById('startMonitoring');
    const refreshFeedBtn = document.getElementById('refreshFeed');
    const severityBtns = document.querySelectorAll('.severity-btn');
    
    // Start monitoring functionality
    if (startMonitoringBtn) {
        startMonitoringBtn.addEventListener('click', function() {
            startRealTimeMonitoring();
        });
    }
    
    // Refresh feed functionality
    if (refreshFeedBtn) {
        refreshFeedBtn.addEventListener('click', function() {
            refreshMonitoringFeed();
        });
    }
    
    // Severity filter functionality
    severityBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            severityBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterFeedBySeverity(this.dataset.severity);
        });
    });
}

// Historical Analysis System
function initHistoricalAnalysis() {
    // Initialize chart placeholders
    initializeCharts();
}

function generateAnalysis() {
    const timePeriod = document.getElementById('timePeriod').value;
    const disasterType = document.getElementById('analysisDisasterType').value;
    const region = document.getElementById('analysisRegion').value;
    
    // Simulate AI analysis generation
    const analysis = generateHistoricalAnalysis(timePeriod, disasterType, region);
    displayAnalysisResults(analysis);
}

// Monitoring System Functions
function startRealTimeMonitoring() {
    const startBtn = document.getElementById('startMonitoring');
    startBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Monitoring';
    startBtn.onclick = stopRealTimeMonitoring;
    
    // Simulate real-time feed updates
    window.monitoringInterval = setInterval(() => {
        addNewFeedItem();
    }, 5000);
    
    showNotification('Real-time monitoring started', 'success');
}

function stopRealTimeMonitoring() {
    const startBtn = document.getElementById('startMonitoring');
    startBtn.innerHTML = '<i class="fas fa-play"></i> Start Monitoring';
    startBtn.onclick = startRealTimeMonitoring;
    
    clearInterval(window.monitoringInterval);
    showNotification('Real-time monitoring stopped', 'info');
}

function addNewFeedItem() {
    const feed = document.getElementById('monitoringFeed');
    const feedItems = [
        {
            icon: 'fas fa-twitter',
            content: 'Social Media Alert: Reports of heavy rainfall in Chennai suburbs. #ChennaiRains trending.',
            time: 'Just now'
        },
        {
            icon: 'fas fa-cloud-rain',
            content: 'Weather Update: IMD issues orange alert for heavy rainfall in Tamil Nadu.',
            time: '1 minute ago'
        },
        {
            icon: 'fas fa-newspaper',
            content: 'News Alert: Rescue operations underway in flood-affected areas of Mumbai.',
            time: '3 minutes ago'
        },
        {
            icon: 'fas fa-map-marker-alt',
            content: 'Geographic Alert: Water levels rising in major rivers across North India.',
            time: '5 minutes ago'
        }
    ];
    
    const randomItem = feedItems[Math.floor(Math.random() * feedItems.length)];
    
    const feedItem = document.createElement('div');
    feedItem.className = 'feed-item';
    feedItem.innerHTML = `
        <div class="feed-icon"><i class="${randomItem.icon}"></i></div>
        <div class="feed-content">
            <p><strong>${randomItem.content.split(':')[0]}:</strong> ${randomItem.content.split(':').slice(1).join(':').trim()}</p>
            <span class="feed-time">${randomItem.time}</span>
        </div>
    `;
    
    feed.insertBefore(feedItem, feed.firstChild);
    
    // Remove old items if more than 10
    while (feed.children.length > 10) {
        feed.removeChild(feed.lastChild);
    }
}

function refreshMonitoringFeed() {
    const feed = document.getElementById('monitoringFeed');
    feed.innerHTML = '';
    
    // Add initial feed items
    const initialItems = [
        {
            icon: 'fas fa-twitter',
            content: 'Social Media Alert: Reports of flooding in Mumbai suburbs. #MumbaiFloods trending.',
            time: '2 minutes ago'
        },
        {
            icon: 'fas fa-cloud-rain',
            content: 'Weather Update: Heavy rainfall warning issued for Gujarat coast. Wind speed: 65 km/h.',
            time: '5 minutes ago'
        },
        {
            icon: 'fas fa-newspaper',
            content: 'News Alert: Cyclone Biparjoy intensifying, expected to make landfall in 24 hours.',
            time: '8 minutes ago'
        },
        {
            icon: 'fas fa-map-marker-alt',
            content: 'Geographic Alert: Population evacuation recommended in coastal areas of Gujarat.',
            time: '12 minutes ago'
        }
    ];
    
    initialItems.forEach(item => {
        const feedItem = document.createElement('div');
        feedItem.className = 'feed-item';
        feedItem.innerHTML = `
            <div class="feed-icon"><i class="${item.icon}"></i></div>
            <div class="feed-content">
                <p><strong>${item.content.split(':')[0]}:</strong> ${item.content.split(':').slice(1).join(':').trim()}</p>
                <span class="feed-time">${item.time}</span>
            </div>
        `;
        feed.appendChild(feedItem);
    });
    
    showNotification('Monitoring feed refreshed', 'success');
}

function filterFeedBySeverity(severity) {
    // Implementation for filtering feed by severity
    console.log(`Filtering feed by severity: ${severity}`);
}

// Historical Analysis Functions
function generateHistoricalAnalysis(timePeriod, disasterType, region) {
    return {
        timePeriod,
        disasterType,
        region,
        totalDisasters: Math.floor(Math.random() * 100) + 50,
        totalAffected: Math.floor(Math.random() * 1000000) + 500000,
        avgResponseTime: Math.floor(Math.random() * 48) + 12,
        trends: {
            increasing: ['flood', 'cyclone'],
            decreasing: ['earthquake'],
            stable: ['drought']
        }
    };
}

function displayAnalysisResults(analysis) {
    // Display analysis results
    console.log('Analysis Results:', analysis);
    showNotification('Historical analysis generated successfully', 'success');
}

function initializeCharts() {
    // Initialize chart placeholders with sample data
    const charts = [
        { id: 'frequencyCanvas', type: 'bar' },
        { id: 'trendsCanvas', type: 'line' },
        { id: 'vulnerabilityCanvas', type: 'doughnut' },
        { id: 'seasonalCanvas', type: 'line' }
    ];
    
    charts.forEach(chart => {
        const canvas = document.getElementById(chart.id);
        if (canvas) {
            drawSampleChart(canvas, chart.type);
        }
    });
}

function drawSampleChart(canvas, type) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw sample chart based on type
    if (type === 'bar') {
        drawBarChart(ctx, width, height);
    } else if (type === 'line') {
        drawLineChart(ctx, width, height);
    } else if (type === 'doughnut') {
        drawDoughnutChart(ctx, width, height);
    }
}

function drawBarChart(ctx, width, height) {
    const data = [45, 32, 28, 15, 12, 8];
    const labels = ['Floods', 'Cyclones', 'Earthquakes', 'Droughts', 'Wildfires', 'Landslides'];
    const barWidth = width / data.length - 10;
    const maxValue = Math.max(...data);
    
    ctx.fillStyle = '#667eea';
    data.forEach((value, index) => {
        const barHeight = (value / maxValue) * (height - 40);
        const x = index * (barWidth + 10) + 5;
        const y = height - barHeight - 20;
        
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Draw label
        ctx.fillStyle = '#333';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(labels[index], x + barWidth/2, height - 5);
        ctx.fillStyle = '#667eea';
    });
}

function drawLineChart(ctx, width, height) {
    const data = [20, 35, 45, 30, 55, 40, 60];
    const maxValue = Math.max(...data);
    
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    data.forEach((value, index) => {
        const x = (index / (data.length - 1)) * (width - 40) + 20;
        const y = height - 20 - ((value / maxValue) * (height - 40));
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
}

function drawDoughnutChart(ctx, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    
    const data = [30, 25, 20, 15, 10];
    const colors = ['#667eea', '#48bb78', '#ed8936', '#f56565', '#9f7aea'];
    
    let currentAngle = 0;
    
    data.forEach((value, index) => {
        const sliceAngle = (value / 100) * 2 * Math.PI;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.lineTo(centerX, centerY);
        ctx.fillStyle = colors[index];
        ctx.fill();
        
        currentAngle += sliceAngle;
    });
}

// Dashboard Functions
function initDashboard() {
    // Initialize dashboard with real-time updates
    updateDashboardMetrics();
    setInterval(updateDashboardMetrics, 30000); // Update every 30 seconds
}

function updateDashboardMetrics() {
    // Update dashboard metrics with simulated real-time data
    const metrics = generateDashboardMetrics();
    updateMetricDisplay(metrics);
}

function generateDashboardMetrics() {
    return {
        activeDisasters: Math.floor(Math.random() * 5) + 8,
        predictionAccuracy: Math.floor(Math.random() * 10) + 80,
        dataSources: Math.floor(Math.random() * 100) + 2400,
        systemUptime: Math.floor(Math.random() * 2) + 97
    };
}

function updateMetricDisplay(metrics) {
    // Update metric displays (this would be implemented based on the dashboard structure)
    console.log('Updated metrics:', metrics);
}

function showBookingConfirmation(data) {
    const doctorName = document.querySelector(`#doctor option[value="${data.doctor}"]`).textContent;
    const confirmationMessage = `
        <div class="booking-confirmation">
            <h3>Appointment Booked Successfully!</h3>
            <div class="confirmation-details">
                <p><strong>Doctor:</strong> ${doctorName}</p>
                <p><strong>Date:</strong> ${new Date(data.date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${data.time}</p>
                <p><strong>Contact:</strong> ${data.contact}</p>
                <p><strong>Reason:</strong> ${data.reason || 'Not specified'}</p>
            </div>
            <p class="confirmation-note">You will receive a confirmation SMS shortly. Please arrive 15 minutes before your appointment.</p>
        </div>
    `;
    
    showModal('Booking Confirmation', confirmationMessage);
    
    // Reset form
    document.getElementById('bookingForm').reset();
}

// Chatbot functionality
function initChatbot() {
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendMessage');
    const chatMessages = document.getElementById('chatbotMessages');
    
    if (chatInput && sendButton && chatMessages) {
        // Send message on button click
        sendButton.addEventListener('click', sendMessage);
        
        // Send message on Enter key
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
}

function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatbotMessages');
    const message = chatInput.value.trim();
    
    if (message) {
        // Add user message
        addMessage(message, 'user');
        chatInput.value = '';
        
        // Simulate bot response
        setTimeout(() => {
            const botResponse = generateBotResponse(message);
            addMessage(botResponse, 'bot');
        }, 1000);
    }
}

function addMessage(message, sender) {
    const chatMessages = document.getElementById('chatbotMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.innerHTML = `<p>${message}</p>`;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function generateBotResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    // Simple keyword-based responses
    if (message.includes('fever') || message.includes('temperature')) {
        return "Fever is usually a sign of infection. Common symptoms include high temperature, chills, and body aches. If your temperature is above 101°F (38.3°C) or persists for more than 3 days, please consult a healthcare professional.";
    } else if (message.includes('headache')) {
        return "Headaches can have various causes including stress, dehydration, or tension. Try drinking water, resting in a dark room, or applying a cold compress. If headaches are severe or frequent, please see a doctor.";
    } else if (message.includes('stress') || message.includes('anxiety')) {
        return "Managing stress is important for overall health. Try deep breathing exercises, regular physical activity, adequate sleep, and mindfulness practices. If stress is overwhelming, consider speaking with a mental health professional.";
    } else if (message.includes('diet') || message.includes('nutrition')) {
        return "A balanced diet includes fruits, vegetables, whole grains, lean proteins, and healthy fats. Stay hydrated, limit processed foods, and consider consulting a nutritionist for personalized advice.";
    } else if (message.includes('exercise') || message.includes('workout')) {
        return "Regular exercise is beneficial for physical and mental health. Aim for at least 150 minutes of moderate-intensity exercise per week. Start slowly if you're new to exercise and consult a doctor if you have health concerns.";
    } else if (message.includes('pain')) {
        return "Pain can indicate various conditions. For mild pain, rest, ice, compression, and elevation (RICE) may help. For persistent or severe pain, please consult a healthcare professional for proper evaluation.";
    } else {
        return "I understand you're asking about health-related topics. While I can provide general information, I recommend consulting with a healthcare professional for personalized medical advice. Is there a specific health concern you'd like to discuss?";
    }
}

function askQuestion(question) {
    const chatInput = document.getElementById('chatInput');
    chatInput.value = question;
    sendMessage();
}

// Utility functions
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ff6b6b' : '#48bb78'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
    
    // Close button functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
}

function showModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-content">
                ${content}
            </div>
        </div>
    `;
    
    // Add modal styles
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    
    const modalElement = modal.querySelector('.modal');
    modalElement.style.cssText = `
        background: white;
        border-radius: 20px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        animation: slideUp 0.3s ease;
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Animation on scroll
function initAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.feature-card, .resource-card, .stat-card');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes slideUp {
        from {
            transform: translateY(50px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #e2e8f0;
    }
    
    .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #718096;
    }
    
    .modal-content {
        padding: 1.5rem;
    }
    
    .booking-confirmation {
        text-align: center;
    }
    
    .confirmation-details {
        background: #f7fafc;
        padding: 1rem;
        border-radius: 10px;
        margin: 1rem 0;
        text-align: left;
    }
    
    .confirmation-details p {
        margin-bottom: 0.5rem;
    }
    
    .confirmation-note {
        font-style: italic;
        color: #718096;
        margin-top: 1rem;
    }
    
    .health-status {
        padding: 0.25rem 0.75rem;
        border-radius: 15px;
        font-weight: 600;
    }
    
    .health-status.excellent {
        background: #c6f6d5;
        color: #22543d;
    }
    
    .health-status.good {
        background: #bee3f8;
        color: #2a4365;
    }
    
    .health-status.moderate {
        background: #faf089;
        color: #744210;
    }
    
    .assessment-summary {
        margin-bottom: 1.5rem;
    }
    
    .bmi-result, .overall-health {
        margin-bottom: 1rem;
        padding: 0.5rem;
        background: white;
        border-radius: 8px;
    }
    
    .recommendations ul, .risk-factors ul {
        margin-left: 1rem;
    }
    
    .recommendations li, .risk-factors li {
        margin-bottom: 0.5rem;
    }
    
    .next-steps {
        margin-top: 1.5rem;
        padding: 1rem;
        background: #e6fffa;
        border-radius: 8px;
        border-left: 4px solid #38b2ac;
    }
`;
document.head.appendChild(style);

