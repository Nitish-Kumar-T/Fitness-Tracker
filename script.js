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

// Load data from local storage
function loadData() {
    const storedDailyData = localStorage.getItem('dailyData');
    if (storedDailyData) {
        dailyData = JSON.parse(storedDailyData);
        dailyData.forEach(entry => entry.date = new Date(entry.date));
    }

    const storedGoals = localStorage.getItem('goals');
    if (storedGoals) {
        goals = JSON.parse(storedGoals);
    }

    const storedRewards = localStorage.getItem('rewards');
    if (storedRewards) {
        rewards = JSON.parse(storedRewards);
    }

    updateWeeklyData();
    updateMonthlyData();
    updateCharts();
    updateRewards();
}

// Save data to local storage
function saveData() {
    localStorage.setItem('dailyData', JSON.stringify(dailyData));
    localStorage.setItem('goals', JSON.stringify(goals));
    localStorage.setItem('rewards', JSON.stringify(rewards));
}

async function trackDaily() {
    const steps = parseInt(document.getElementById('steps').value);
    const calories = parseInt(document.getElementById('calories').value);
    const water = parseInt(document.getElementById('water').value);
    const sleep = parseInt(document.getElementById('sleep').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const mood = parseInt(document.getElementById('mood').value);

    if (isNaN(steps) || isNaN(calories) || isNaN(water) || isNaN(sleep) || isNaN(weight) || isNaN(mood)) {
        document.getElementById('result').textContent = 'Please enter valid numbers for all fields.';
        return;
    }

    const dailyEntry = { date: new Date(), steps, calories, water, sleep, weight, mood };
    
    // Fetch weather data
    await fetchWeatherData();
    dailyEntry.weather = weatherData;



    dailyData.push(dailyEntry);

    updateWeeklyData();
    updateMonthlyData();

    const message = `Great job! You've taken ${steps} steps, burned ${calories} calories, drank ${water} glasses of water, slept for ${sleep} hours, weigh ${weight} kg, and your mood is ${mood}/10.`;
    document.getElementById('result').textContent = message;

    updateCharts();
    updateRewards();
    saveData();
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
        acc.weight = entry.weight; // Only keep the latest weight
        acc.mood += entry.mood;
        return acc;
    }, { steps: 0, calories: 0, water: 0, sleep: 0, weight: 0, mood: 0 });
}

function formatSummary(summary) {
    const days = weeklyData.length;
    const streaks = calculateStreaks();
    const bmi = calculateBMI(summary.weight, 170); // Assuming height is 170cm
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

function updateCharts() {
    const chartsContainer = document.getElementById('progress-charts');
    chartsContainer.innerHTML = '';

    const metrics = ['steps', 'calories', 'water', 'sleep', 'weight', 'mood'];
    metrics.forEach(metric => {
        const chart = createChart(metric, dailyData.slice(-7));
        chartsContainer.appendChild(chart);
    });

    // Add correlation chart
    createCorrelationChart();
}

function createChart(metric, data) {
    const chartDiv = document.createElement('div');
    chartDiv.className = 'chart';

    const title = document.createElement('div');
    title.className = 'chart-title';
    title.textContent = `${metric.charAt(0).toUpperCase() + metric.slice(1)} - Last 7 Days`;
    chartDiv.appendChild(title);

    const maxValue = Math.max(...data.map(entry => entry[metric]));

    data.forEach(entry => {
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.width = `${(entry[metric] / maxValue) * 100}%`;
        bar.textContent = entry[metric];
        chartDiv.appendChild(bar);
    });

    if (['steps', 'calories', 'water', 'sleep'].includes(metric)) {
        const goalProgress = document.createElement('div');
        goalProgress.className = 'goal-progress';
        const average = data.reduce((sum, entry) => sum + entry[metric], 0) / data.length;
        const percentOfGoal = (average / goals[metric] * 100).toFixed(2);
        goalProgress.textContent = `${percentOfGoal}% of daily goal`;
        goalProgress.classList.toggle('not-met', average < goals[metric]);
        chartDiv.appendChild(goalProgress);
    }

    return chartDiv;
}

function createCorrelationChart() {
    const ctx = document.getElementById('correlation-chart').getContext('2d');
    const moodData = dailyData.map(entry => entry.mood);
    const sleepData = dailyData.map(entry => entry.sleep);

    new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Mood vs Sleep',
                data: dailyData.map(entry => ({x: entry.sleep, y: entry.mood})),
                backgroundColor: 'rgba(75, 192, 192, 0.6)'
            }]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Sleep (hours)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Mood (1-10)'
                    }
                }
            }
        }
    });
}

function updateWeeklyChart() {
    const ctx = document.getElementById('weekly-chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: weeklyData.map(entry => entry.date.toLocaleDateString()),
            datasets: [{
                label: 'Steps',
                data: weeklyData.map(entry => entry.steps),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateMonthlyChart() {
    const ctx = document.getElementById('monthly-chart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthlyData.map(entry => entry.date.toLocaleDateString()),
            datasets: [{
                label: 'Calories Burned',
                data: monthlyData.map(entry => entry.calories),
                backgroundColor: 'rgba(153, 102, 255, 0.6)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function calculateStreaks() {
    let currentStreak = 0;
    let longestStreak = 0;
    let previousDate = null;

    dailyData.forEach(entry => {
        if (previousDate) {
            const diff = (entry.date - previousDate) / (1000 * 60 * 60 * 24);
            if (diff === 1) {
                currentStreak++;
                if (currentStreak > longestStreak) {
                    longestStreak = currentStreak;
                }
            } else {
                currentStreak = 1;
            }
        } else {
            currentStreak = 1;
        }
        previousDate = entry.date;
    });

    return { currentStreak, longestStreak };
}

function updateGoals() {
    goals.steps = parseInt(document.getElementById('goal-steps').value);
    goals.calories = parseInt(document.getElementById('goal-calories').value);
    goals.water = parseInt(document.getElementById('goal-water').value);
    goals.sleep = parseInt(document.getElementById('goal-sleep').value);
    saveData();
    updateCharts();
}

function updateRewards() {
    rewards = [];

    const totalSteps = dailyData.reduce((sum, entry) => sum + entry.steps, 0);
    const totalCalories = dailyData.reduce((sum, entry) => sum + entry.calories, 0);
    const totalWater = dailyData.reduce((sum, entry) => sum + entry.water, 0);
    const totalSleep = dailyData.reduce((sum, entry) => sum + entry.sleep, 0);

    if (totalSteps >= 70000) {
        rewards.push('Free Movie Ticket');
    }
    if (totalCalories >= 3500) {
        rewards.push('Free Dessert');
    }
    if (totalWater >= 56) {
        rewards.push('Spa Day');
    }
    if (totalSleep >= 56) {
        rewards.push('New Book');
    }

    const rewardsContainer = document.getElementById('rewards');
    rewardsContainer.innerHTML = '';
    rewards.forEach(reward => {
        const rewardDiv = document.createElement('div');
        rewardDiv.className = 'reward';
        rewardDiv.textContent = reward;
        rewardsContainer.appendChild(rewardDiv);
    });

    saveData();
}

async function fetchWeatherData() {
    try {
        const response = await fetch('ttps://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}');
        const data = await response.json();
        weatherData = data.current;
    } catch (error) {
        console.error('Error fetching weather data:', error);
    }
}

document.getElementById('track-button').addEventListener('click', trackDaily);
document.getElementById('update-goals-button').addEventListener('click', updateGoals);

loadData();
