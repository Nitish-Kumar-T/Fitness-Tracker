let dailyData = [];
let weeklyData = [];
let monthlyData = [];
let goals = {
    steps: 10000,
    calories: 500,
    water: 8,
    sleep: 8,
    activeMinutes: 30
};
let rewards = [];
let weatherData = {};
let friends = [];
let challenges = [];
let predictionModel = null;
let userProfile = {};
let wearableDevice = null;
let coachingTips = [];
let achievementSystem = new AchievementSystem();

async function loadData() {
    try {
        const storedDailyData = localStorage.getItem('dailyData');
        if (storedDailyData) {
            dailyData = JSON.parse(storedDailyData);
            dailyData.forEach(entry => entry.date = new Date(entry.date));
        }

        goals = JSON.parse(localStorage.getItem('goals')) || goals;
        rewards = JSON.parse(localStorage.getItem('rewards')) || [];
        friends = JSON.parse(localStorage.getItem('friends')) || [];
        challenges = JSON.parse(localStorage.getItem('challenges')) || [];
        userProfile = JSON.parse(localStorage.getItem('userProfile')) || {};

        await connectWearableDevice();
        await fetchExternalData();
        updateWeeklyData();
        updateMonthlyData();
        updateDashboard();
        updateRewards();
        updateSocialFeatures();
        await initializePredictionModel();
        initializeCoachingSystem();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

function saveData() {
    try {
        localStorage.setItem('dailyData', JSON.stringify(dailyData));
        localStorage.setItem('goals', JSON.stringify(goals));
        localStorage.setItem('rewards', JSON.stringify(rewards));
        localStorage.setItem('friends', JSON.stringify(friends));
        localStorage.setItem('challenges', JSON.stringify(challenges));
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

async function trackDaily() {
    let dailyEntry;
    if (wearableDevice) {
        dailyEntry = await getDataFromWearable();
    } else {
        dailyEntry = getManualEntryData();
    }

    if (!dailyEntry) {
        showNotification('Error getting daily data. Please try again.', 'error');
        return;
    }

    dailyEntry.date = new Date();
    await enrichDailyData(dailyEntry);
    dailyData.push(dailyEntry);

    updateWeeklyData();
    updateMonthlyData();

    const message = generateDailySummary(dailyEntry);
    showNotification(message, 'success');

    updateDashboard();
    updateRewards();
    updateSocialFeatures();
    makePredictions();
    generateCoachingTips();
    checkAchievements(dailyEntry);
    saveData();
}

async function getDataFromWearable() {
    try {
        const data = await wearableDevice.getDailyData();
        return {
            steps: data.steps,
            calories: data.caloriesBurned,
            activeMinutes: data.activeMinutes,
            sleep: data.sleepHours,
            heartRate: data.averageHeartRate
        };
    } catch (error) {
        console.error('Error getting data from wearable:', error);
        return null;
    }
}

function getManualEntryData() {
    const steps = parseInt(document.getElementById('steps').value);
    const calories = parseInt(document.getElementById('calories').value);
    const water = parseInt(document.getElementById('water').value);
    const sleep = parseInt(document.getElementById('sleep').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const mood = parseInt(document.getElementById('mood').value);
    const activities = document.getElementById('activities').value.split(',').map(a => a.trim());
    const activeMinutes = parseInt(document.getElementById('activeMinutes').value);

    if ([steps, calories, water, sleep, weight, mood, activeMinutes].some(isNaN)) {
        showNotification('Please enter valid numbers for all fields.', 'error');
        return null;
    }

    return { steps, calories, water, sleep, weight, mood, activities, activeMinutes };
}

async function enrichDailyData(dailyEntry) {
    dailyEntry.weather = await fetchWeatherData();
    dailyEntry.stress = await estimateStressLevel(dailyEntry);
}

async function estimateStressLevel(dailyEntry) {
    const stressFactors = {
        sleep: dailyEntry.sleep < 7 ? (7 - dailyEntry.sleep) * 10 : 0,
        activity: dailyEntry.activeMinutes < 30 ? (30 - dailyEntry.activeMinutes) * 2 : 0,
        weather: dailyEntry.weather.main === 'Rain' || dailyEntry.weather.main === 'Snow' ? 10 : 0
    };

    return Math.min(100, Object.values(stressFactors).reduce((a, b) => a + b, 0));
}

function generateDailySummary(dailyEntry) {
    return `Great job today! You've taken ${dailyEntry.steps} steps, burned ${dailyEntry.calories} calories, ` +
           `had ${dailyEntry.activeMinutes} active minutes, slept for ${dailyEntry.sleep} hours, ` +
           `and your mood is ${dailyEntry.mood}/10. Keep up the good work!`;
}

function updateDashboard() {
    updateCharts();
    updateSummary();
    updateStreak();
    updateGoalProgress();
    updateRecommendations();
    updateStressInsights();
    updateAchievements();
}

function updateSummary() {
    const summary = calculateSummary(dailyData.slice(-30));
    const summaryElement = document.getElementById('summary');
    summaryElement.innerHTML = formatSummary(summary);
}

function updateStreak() {
    const streaks = calculateStreaks();
    const streakElement = document.getElementById('streak');
    streakElement.textContent = `Current Streak: ${streaks.currentStreak} days | Longest Streak: ${streaks.longestStreak} days`;
}

function updateGoalProgress() {
    const today = dailyData[dailyData.length - 1];
    const goalProgressElement = document.getElementById('goal-progress');
    goalProgressElement.innerHTML = '';

    for (const [metric, goal] of Object.entries(goals)) {
        const progress = (today[metric] / goal) * 100;
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.innerHTML = `
            <div class="progress" style="width: ${progress}%"></div>
            <span>${metric}: ${today[metric]} / ${goal} (${progress.toFixed(1)}%)</span>
        `;
        goalProgressElement.appendChild(progressBar);
    }
}

function updateRecommendations() {
    const recommendations = generateRecommendations();
    const recommendationsElement = document.getElementById('recommendations');
    recommendationsElement.innerHTML = '<h3>Recommendations</h3>';
    recommendations.forEach(recommendation => {
        const recommendationElement = document.createElement('p');
        recommendationElement.textContent = recommendation;
        recommendationsElement.appendChild(recommendationElement);
    });
}

function updateStressInsights() {
    const stressInsightsElement = document.getElementById('stress-insights');
    const latestEntry = dailyData[dailyData.length - 1];
    
    let stressLevel = 'low';
    if (latestEntry.stress > 60) stressLevel = 'high';
    else if (latestEntry.stress > 30) stressLevel = 'moderate';

    stressInsightsElement.innerHTML = `
        <h3>Stress Insights</h3>
        <p>Your estimated stress level today is ${stressLevel} (${latestEntry.stress}/100).</p>
        <p>Consider these stress-reduction techniques:</p>
        <ul>
            <li>Practice deep breathing exercises</li>
            <li>Take a short walk in nature</li>
            <li>Try a quick meditation session</li>
        </ul>
    `;
}

function updateAchievements() {
    const achievementsElement = document.getElementById('achievements');
    achievementsElement.innerHTML = '<h3>Recent Achievements</h3>';
    
    const recentAchievements = achievementSystem.getRecentAchievements();
    recentAchievements.forEach(achievement => {
        const achievementElement = document.createElement('div');
        achievementElement.className = 'achievement';
        achievementElement.innerHTML = `
            <img src="${achievement.icon}" alt="${achievement.title}">
            <div>
                <h4>${achievement.title}</h4>
                <p>${achievement.description}</p>
            </div>
        `;
        achievementsElement.appendChild(achievementElement);
    });
}

function updateCharts() {
    createLineChart('steps-chart', 'Steps', dailyData.slice(-30).map(d => d.steps));
    createLineChart('calories-chart', 'Calories Burned', dailyData.slice(-30).map(d => d.calories));
    createLineChart('water-chart', 'Water Intake', dailyData.slice(-30).map(d => d.water));
    createLineChart('sleep-chart', 'Sleep Hours', dailyData.slice(-30).map(d => d.sleep));
    createLineChart('weight-chart', 'Weight', dailyData.slice(-30).map(d => d.weight));
    createLineChart('mood-chart', 'Mood', dailyData.slice(-30).map(d => d.mood));
    createStressChart();
    createCorrelationChart();
}

function createLineChart(canvasId, label, data) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dailyData.slice(-30).map(d => d.date.toLocaleDateString()),
            datasets: [{
                label: label,
                data: data,
                borderColor: getRandomColor(),
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createStressChart() {
    const ctx = document.getElementById('stress-chart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dailyData.slice(-30).map(d => d.date.toLocaleDateString()),
            datasets: [{
                label: 'Stress Level',
                data: dailyData.slice(-30).map(d => d.stress),
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function updateSocialFeatures() {
    displayFriendLeaderboard();
    displayChallenges();
}

function displayFriendLeaderboard() {
    const leaderboard = document.getElementById('friend-leaderboard');
    leaderboard.innerHTML = '<h3>Friend Leaderboard</h3>';

    friends.forEach(friend => {
        const friendEntry = document.createElement('div');
        friendEntry.textContent = `${friend.name}: ${friend.steps} steps`;
        leaderboard.appendChild(friendEntry);
    });
}

function displayChallenges() {
    const challengesElement = document.getElementById('challenges');
    challengesElement.innerHTML = '<h3>Active Challenges</h3>';

    challenges.forEach(challenge => {
        const challengeEntry = document.createElement('div');
        challengeEntry.textContent = `${challenge.name}: ${challenge.description}`;
        challengesElement.appendChild(challengeEntry);
    });
}

function updateRewards() {
    const rewardsElement = document.getElementById('rewards');
    rewardsElement.innerHTML = '<h3>Available Rewards</h3>';

    rewards.forEach(reward => {
        const rewardEntry = document.createElement('div');
        rewardEntry.textContent = `${reward.name}: ${reward.description}`;
        rewardsElement.appendChild(rewardEntry);
    });
}

function initializeCoachingSystem() {
    coachingTips = [
        { condition: (data) => data.steps < goals.steps, message: "Try to increase your daily steps. A short walk after each meal can help." },
        { condition: (data) => data.sleep < goals.sleep, message: "Aim for more sleep. Consider setting a consistent bedtime routine." },
        { condition: (data) => data.water < goals.water, message: "Stay hydrated! Set reminders to drink water throughout the day." },
        { condition: (data) => data.activeMinutes < goals.activeMinutes, message: "Increase your active minutes. Try a quick HIIT workout or dance session." },
        { condition: (data) => data.stress > 50, message: "Your stress levels seem high. Practice some relaxation techniques or meditation." }
    ];
}

function generateCoachingTips() {
    const latestData = dailyData[dailyData.length - 1];
    const applicableTips = coachingTips.filter(tip => tip.condition(latestData));
    
    const coachingElement = document.getElementById('coaching-tips');
    coachingElement.innerHTML = '<h3>Coaching Tips</h3>';
    applicableTips.forEach(tip => {
        const tipElement = document.createElement('p');
        tipElement.textContent = tip.message;
        coachingElement.appendChild(tipElement);
    });
}

class AchievementSystem {
    constructor() {
        this.achievements = [
            { id: 'step_master', title: 'Step Master', description: 'Walk 100,000 steps in a week', icon: 'step_master.png', condition: (data) => data.weeklySteps >= 100000 },
            { id: 'early_bird', title: 'Early Bird', description: 'Wake up before 6 AM for 5 consecutive days', icon: 'early_bird.png', condition: (data) => data.earlyWakeups >= 5 },
            { id: 'zen_master', title: 'Zen Master', description: 'Maintain low stress levels for 10 days', icon: 'zen_master.png', condition: (data) => data.lowStressDays >= 10 }
        ];
        this.unlockedAchievements = new Set();
    }

    checkAchievements(data) {
        this.achievements.forEach(achievement => {
            if (!this.unlockedAchievements.has(achievement.id) && achievement.condition(data)) {
                this.unlockAchievement(achievement);
            }
        });
    }

    unlockAchievement(achievement) {
        this.unlockedAchievements.add(achievement.id);
        showNotification(`Achievement Unlocked: ${achievement.title}`, 'achievement');
    }

    getRecentAchievements() {
        return Array.from(this.unlockedAchievements)
            .map(id => this.achievements.find(a => a.id === id))
            .slice(-3);
    }
}

function checkAchievements(dailyEntry) {
    const achievementData = {
        weeklySteps: weeklyData.reduce((sum, day) => sum + day.steps, 0),
        earlyWakeups: dailyData.slice(-5).filter(day => new Date(day.date).getHours() < 6).length,
        lowStressDays: dailyData.slice(-10).filter(day => day.stress < 30).length
    };
    achievementSystem.checkAchievements(achievementData);
}

async function connectWearableDevice() {
    try {
        wearableDevice = await mockWearableConnection();
        showNotification('Wearable device connected successfully!', 'success');
    } catch (error) {
        console.error('Error connecting to wearable device:', error);
        showNotification('Failed to connect to wearable device. Using manual entry.', 'warning');
    }
}

function mockWearableConnection() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                getDailyData: () => Promise.resolve({
                    steps: Math.floor(Math.random() * 10000),
                    caloriesBurned: Math.floor(Math.random() * 500),
                    activeMinutes: Math.floor(Math.random() * 60),
                    sleepHours: 6 + Math.random() * 3,
                    averageHeartRate: 60 + Math.floor(Math.random() * 40)
                })
            });
        }, 1000);
    });
}

async function fetchWeatherData() {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${userProfile.city}&units=metric&appid=${API_KEY}`);
        const data = await response.json();
        return {
            temperature: data.main.temp,
            condition: data.weather[0].main,
            humidity: data.main.humidity
        };
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return null;
    }
}

async function initializePredictionModel() {
    try {
        predictionModel = await tf.loadLayersModel('path/to/model.json');
        console.log('Prediction model loaded successfully');
    } catch (error) {
        console.error('Error loading prediction model:', error);
    }
}

function makePredictions() {
    if (!predictionModel) {
        console.error('Prediction model not initialized');
        return;
    }

    const recentData = dailyData.slice(-7);
    const input = tf.tensor2d(recentData.map(entry => [
        entry.steps,
        entry.calories,
        entry.water,
        entry.sleep,
        entry.stress,
        entry.mood
    ]));

    const prediction = predictionModel.predict(input);
    const predictedValues = prediction.dataSync();

    console.log('Predictions for next week:', predictedValues);
    updatePredictionDisplay(predictedValues);
}

function updatePredictionDisplay(predictions) {
    const predictionElement = document.getElementById('predictions');
    predictionElement.innerHTML = '<h3>Predictions for Next Week</h3>';
    const metrics = ['Steps', 'Calories', 'Water', 'Sleep', 'Stress', 'Mood'];
    
    metrics.forEach((metric, index) => {
        const predictionItem = document.createElement('p');
        predictionItem.textContent = `${metric}: ${predictions[index].toFixed(2)}`;
        predictionElement.appendChild(predictionItem);
    });
}

function calculateSummary(data) {
    return data.reduce((acc, entry) => {
        acc.steps += entry.steps;
        acc.calories += entry.calories;
        acc.water += entry.water;
        acc.sleep += entry.sleep;
        acc.weight = entry.weight; // Latest weight
        acc.mood += entry.mood;
        acc.stress += entry.stress;
        return acc;
    }, { steps: 0, calories: 0, water: 0, sleep: 0, weight: 0, mood: 0, stress: 0 });
}

function formatSummary(summary) {
    const days = dailyData.length;
    return `
        <p>Total Steps: ${summary.steps.toLocaleString()} (Avg: ${(summary.steps / days).toFixed(0)})</p>
        <p>Total Calories Burned: ${summary.calories.toLocaleString()} (Avg: ${(summary.calories / days).toFixed(0)})</p>
        <p>Total Water Consumed: ${summary.water} glasses (Avg: ${(summary.water / days).toFixed(1)})</p>
        <p>Average Sleep: ${(summary.sleep / days).toFixed(2)} hours per day</p>
        <p>Latest Weight: ${summary.weight.toFixed(1)} kg</p>
        <p>Average Mood: ${(summary.mood / days).toFixed(2)}/10</p>
        <p>Average Stress Level: ${(summary.stress / days).toFixed(2)}/100</p>
    `;
}

function calculateStreaks() {
    let currentStreak = 0;
    let longestStreak = 0;
    let lastDate = null;

    dailyData.forEach((entry) => {
        if (lastDate && (entry.date - lastDate) / (1000 * 60 * 60 * 24) === 1) {
            currentStreak++;
        } else {
            currentStreak = 1;
        }
        longestStreak = Math.max(longestStreak, currentStreak);
        lastDate = entry.date;
    });

    return { currentStreak, longestStreak };
}

function generateRecommendations() {
    const latestEntry = dailyData[dailyData.length - 1];
    const recommendations = [];

    if (latestEntry.steps < goals.steps) {
        recommendations.push("Try to increase your daily steps. A short walk after dinner can help reach your goal.");
    }
    if (latestEntry.sleep < goals.sleep) {
        recommendations.push("Aim for more sleep. Consider setting a consistent bedtime routine.");
    }
    if (latestEntry.water < goals.water) {
        recommendations.push("Increase your water intake. Set reminders throughout the day to stay hydrated.");
    }
    if (latestEntry.activeMinutes < goals.activeMinutes) {
        recommendations.push("Try to be more active. Even short bursts of activity can help reach your goal.");
    }
    if (latestEntry.stress > 50) {
        recommendations.push("Your stress levels seem high. Consider practicing relaxation techniques or meditation.");
    }

    return recommendations;
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    document.getElementById('track-button').addEventListener('click', trackDaily);
    document.getElementById('update-goals-button').addEventListener('click', updateGoals);
});

function updateGoals() {
    const newGoals = {
        steps: parseInt(document.getElementById('goal-steps').value),
        calories: parseInt(document.getElementById('goal-calories').value),
        water: parseInt(document.getElementById('goal-water').value),
        sleep: parseInt(document.getElementById('goal-sleep').value),
        activeMinutes: parseInt(document.getElementById('goal-active-minutes').value)
    };

    if (Object.values(newGoals).some(isNaN)) {
        showNotification('Please enter valid numbers for all goals.', 'error');
        return;
    }

    goals = newGoals;
    saveData();
    updateDashboard();
    showNotification('Goals updated successfully!', 'success');
}

loadData();