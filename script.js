let dailyData = [];
let weeklyData = [];
let monthlyData = [];
let goals = {
    steps: 10000,
    calories: 500,
    water: 8,
    sleep: 8
};
let rewards = [];
let weatherData = {};
let friends = [];
let challenges = [];
let predictionModel = null;

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

        updateWeeklyData();
        updateMonthlyData();
        updateDashboard();
        updateRewards();
        updateSocialFeatures();
        await initializePredictionModel();
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
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

async function trackDaily() {
    const steps = parseInt(document.getElementById('steps').value, 10);
    const calories = parseInt(document.getElementById('calories').value, 10);
    const water = parseInt(document.getElementById('water').value, 10);
    const sleep = parseInt(document.getElementById('sleep').value, 10);
    const weight = parseFloat(document.getElementById('weight').value);
    const mood = parseInt(document.getElementById('mood').value, 10);
    const activities = document.getElementById('activities').value.split(',').map(a => a.trim());

    if (isNaN(steps) || isNaN(calories) || isNaN(water) || isNaN(sleep) || isNaN(weight) || isNaN(mood) ||
        steps < 0 || calories < 0 || water < 0 || sleep < 0 || weight < 0 || mood < 0 || mood > 10) {
        showNotification('Please enter valid numbers for all fields. Ensure values are positive and mood is between 0 and 10.', 'error');
        return;
    }

    const dailyEntry = { date: new Date(), steps, calories, water, sleep, weight, mood, activities };
    
    try {
        await fetchWeatherData();
        dailyEntry.weather = weatherData;

        dailyData.push(dailyEntry);

        updateWeeklyData();
        updateMonthlyData();

        const message = `Great job! You've taken ${steps} steps, burned ${calories} calories, drank ${water} glasses of water, slept for ${sleep} hours, weighed ${weight} kg, and your mood is ${mood}/10.`;
        showNotification(message, 'success');

        updateDashboard();
        updateRewards();
        updateSocialFeatures();
        makePredictions();
        saveData();
    } catch (error) {
        showNotification('An error occurred while tracking daily progress.', 'error');
    }
}

function updateWeeklyData() {
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    weeklyData = dailyData.filter(entry => entry.date >= oneWeekAgo);

    const weeklySummary = calculateSummary(weeklyData);
    document.getElementById('weekly-summary').innerHTML = formatSummary(weeklySummary);

    updateWeeklyChart();
}

function updateMonthlyData() {
    const today = new Date();
    const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    monthlyData = dailyData.filter(entry => entry.date >= oneMonthAgo);

    const monthlySummary = calculateSummary(monthlyData);
    document.getElementById('monthly-summary').innerHTML = formatSummary(monthlySummary);

    updateMonthlyChart();
}

function calculateSummary(data) {
    return data.reduce((acc, entry) => {
        acc.steps += entry.steps;
        acc.calories += entry.calories;
        acc.water += entry.water;
        acc.sleep += entry.sleep;
        acc.weight = entry.weight; 
        acc.mood += entry.mood;
        return acc;
    }, { steps: 0, calories: 0, water: 0, sleep: 0, weight: 0, mood: 0 });
}

function formatSummary(summary) {
    const days = weeklyData.length;
    const streaks = calculateStreaks();
    const bmi = calculateBMI(summary.weight, 170); 
    return `
        <p>Total Steps: ${summary.steps} (${(summary.steps / goals.steps / days * 100).toFixed(2)}% of goal)</p>
        <p>Total Calories Burned: ${summary.calories} (${(summary.calories / goals.calories / days * 100).toFixed(2)}% of goal)</p>
        <p>Total Water Consumed: ${summary.water} glasses (${(summary.water / goals.water / days * 100).toFixed(2)}% of goal)</p>
        <p>Average Sleep: ${(summary.sleep / days).toFixed(2)} hours per day (${(summary.sleep / goals.sleep / days * 100).toFixed(2)}% of goal)</p>
        <p>Latest Weight: ${summary.weight.toFixed(1)} kg</p>
        <p>BMI: ${bmi.toFixed(2)} (${getBMICategory(bmi)})</p>
        <p>Average Mood: ${(summary.mood / days).toFixed(2)}/10</p>
        <p>Current Streak: ${streaks.currentStreak} days</p>
        <p>Longest Streak: ${streaks.longestStreak} days</p>
    `;
}

function calculateBMI(weight, heightCm) {
    const heightM = heightCm / 100;
    return weight / (heightM * heightM);
}

function getBMICategory(bmi) {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
}

function updateDashboard() {
    updateCharts();
    updateSummary();
    updateStreak();
    updateGoalProgress();
    updateRecommendations();
}

function updateSummary() {
    const summary = calculateSummary(dailyData.slice(-30)); // Last 30 days
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

function generateRecommendations() {
    const recommendations = [];
    const latestEntry = dailyData[dailyData.length - 1];

    if (latestEntry.steps < goals.steps) {
        recommendations.push(`Try to increase your daily steps. A short walk after dinner can help.`);
    }
    if (latestEntry.sleep < goals.sleep) {
        recommendations.push(`Aim for ${goals.sleep} hours of sleep. Consider setting a consistent bedtime routine.`);
    }
    if (latestEntry.water < goals.water) {
        recommendations.push(`Increase your water intake. Set reminders throughout the day.`);
    }
    if (latestEntry.mood < 7) {
        recommendations.push(`Your mood seems low. Consider engaging in activities you enjoy or talking to a friend.`);
    }

    return recommendations;
}

function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    setTimeout(() => notification.textContent = '', 5000);
}

async function fetchWeatherData() {
    try {
        const response = await fetch('https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}');
        const data = await response.json();
        weatherData = data;
    } catch (error) {
        console.error('Error fetching weather data:', error);
    }
}

async function initializePredictionModel() {
    try {
        predictionModel = await tf.loadLayersModel('path/to/model.json');
    } catch (error) {
        console.error('Error initializing prediction model:', error);
    }
}

async function makePredictions() {
    if (!predictionModel) return;

    try {
        const recentEntries = dailyData.slice(-10);
        const input = tf.tensor2d(recentEntries.map(entry => [entry.steps, entry.calories, entry.water, entry.sleep, entry.weight, entry.mood]));
        const predictions = predictionModel.predict(input);
        
        console.log(predictions);
    } catch (error) {
        console.error('Error making predictions:', error);
    }
}

function updateCharts() {
    updateWeeklyChart();
    updateMonthlyChart();
}

function updateWeeklyChart() {
    const weeklyLabels = weeklyData.map(entry => entry.date.toDateString());
    const weeklyStepsData = weeklyData.map(entry => entry.steps);
    const weeklyCaloriesData = weeklyData.map(entry => entry.calories);

    createLineChart('weekly-chart', weeklyLabels, ['Steps', 'Calories'], [weeklyStepsData, weeklyCaloriesData]);
}

function updateMonthlyChart() {
    const monthlyLabels = monthlyData.map(entry => entry.date.toDateString());
    const monthlyStepsData = monthlyData.map(entry => entry.steps);
    const monthlyCaloriesData = monthlyData.map(entry => entry.calories);

    createLineChart('monthly-chart', monthlyLabels, ['Steps', 'Calories'], [monthlyStepsData, monthlyCaloriesData]);
}

function createLineChart(canvasId, labels, datasetsLabels, datasetsData) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: datasetsLabels.map((label, index) => ({
                label,
                data: datasetsData[index],
                borderColor: getRandomColor(),
                fill: false
            }))
        }
    });
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function updateSocialFeatures() {
    displayFriendLeaderboard();
    displayChallenges();
}

function displayFriendLeaderboard() {
    const leaderboard = document.getElementById('friend-leaderboard');
    leaderboard.innerHTML = '';

    friends.forEach(friend => {
        const friendEntry = document.createElement('div');
        friendEntry.textContent = `${friend.name}: ${friend.steps} steps`;
        leaderboard.appendChild(friendEntry);
    });
}

function displayChallenges() {
    const challengesElement = document.getElementById('challenges');
    challengesElement.innerHTML = '';

    challenges.forEach(challenge => {
        const challengeEntry = document.createElement('div');
        challengeEntry.textContent = `${challenge.name}: ${challenge.description}`;
        challengesElement.appendChild(challengeEntry);
    });
}

function updateRewards() {
    const rewardsElement = document.getElementById('rewards');
    rewardsElement.innerHTML = '';

    rewards.forEach(reward => {
        const rewardEntry = document.createElement('div');
        rewardEntry.textContent = `${reward.name}: ${reward.description}`;
        rewardsElement.appendChild(rewardEntry);
    });
}

function calculateStreaks() {
    let currentStreak = 0;
    let longestStreak = 0;

    dailyData.forEach((entry, index) => {
        if (index === 0 || entry.date - dailyData[index - 1].date <= 24 * 60 * 60 * 1000) {
            currentStreak++;
        } else {
            currentStreak = 1;
        }
        longestStreak = Math.max(longestStreak, currentStreak);
    });

    return { currentStreak, longestStreak };
}

document.addEventListener('DOMContentLoaded', () => {
    loadData();

    document.getElementById('track-button').addEventListener('click', trackDaily);
});
