let dailyData = [];
let weeklyData = [];
let monthlyData = [];
let goals = {
    steps: 10000,
    calories: 500,
    water: 8,
    sleep: 8
};

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

    updateWeeklyData();
    updateMonthlyData();
    updateCharts();
}

function saveData() {
    localStorage.setItem('dailyData', JSON.stringify(dailyData));
    localStorage.setItem('goals', JSON.stringify(goals));
}

function trackDaily() {
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
    dailyData.push(dailyEntry);

    updateWeeklyData();
    updateMonthlyData();

    const message = `Great job! You've taken ${steps} steps, burned ${calories} calories, drank ${water} glasses of water, slept for ${sleep} hours, weigh ${weight} kg, and your mood is ${mood}/10.`;
    document.getElementById('result').textContent = message;

    updateCharts();
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
    return `
        <p>Total Steps: ${summary.steps} (${(summary.steps / goals.steps / days * 100).toFixed(2)}% of goal)</p>
        <p>Total Calories Burned: ${summary.calories} (${(summary.calories / goals.calories / days * 100).toFixed(2)}% of goal)</p>
        <p>Total Water Consumed: ${summary.water} glasses (${(summary.water / goals.water / days * 100).toFixed(2)}% of goal)</p>
        <p>Average Sleep: ${(summary.sleep / days).toFixed(2)} hours per day (${(summary.sleep / goals.sleep / days * 100).toFixed(2)}% of goal)</p>
        <p>Latest Weight: ${summary.weight.toFixed(1)} kg</p>
        <p>Average Mood: ${(summary.mood / days).toFixed(2)}/10</p>
    `;
}

function updateCharts() {
    const chartsContainer = document.getElementById('progress-charts');
    chartsContainer.innerHTML = '';

    const metrics = ['steps', 'calories', 'water', 'sleep', 'weight', 'mood'];
    metrics.forEach(metric => {
        const chart = createChart(metric, dailyData.slice(-7));
        chartsContainer.appendChild(chart);
    });
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
                label: 'Weight',
                data: monthlyData.map(entry => entry.weight),
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}
function setGoals() {
    goals.steps = parseInt(document.getElementById('goal-steps').value) || goals.steps;
    goals.calories = parseInt(document.getElementById('goal-calories').value) || goals.calories;
    goals.water = parseInt(document.getElementById('goal-water').value) || goals.water;
    goals.sleep = parseInt(document.getElementById('goal-sleep').value) || goals.sleep;

    saveData();
    updateCharts();
    updateWeeklyData();
    updateMonthlyData();

    document.getElementById('result').textContent = 'Goals updated successfully!';
}

document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(button.dataset.tab).classList.add('active');
    });
});

function calculateStreaks() {
    let currentStreak = 0;
    let longestStreak = 0;
    let lastDate = null;

    dailyData.sort((a, b) => a.date - b.date).forEach(entry => {
        if (lastDate === null || (entry.date - lastDate) / (1000 * 60 * 60 * 24) === 1) {
            currentStreak++;
            if (currentStreak > longestStreak) {
                longestStreak = currentStreak;
            }
        } else {
            currentStreak = 1;
        }
        lastDate = entry.date;
    });

    return { currentStreak, longestStreak };
}

function formatSummary(summary) {
    const days = weeklyData.length;
    const streaks = calculateStreaks();
    return `
        <p>Total Steps: ${summary.steps} (${(summary.steps / goals.steps / days * 100).toFixed(2)}% of goal)</p>
        <p>Total Calories Burned: ${summary.calories} (${(summary.calories / goals.calories / days * 100).toFixed(2)}% of goal)</p>
        <p>Total Water Consumed: ${summary.water} glasses (${(summary.water / goals.water / days * 100).toFixed(2)}% of goal)</p>
        <p>Average Sleep: ${(summary.sleep / days).toFixed(2)} hours per day (${(summary.sleep / goals.sleep / days * 100).toFixed(2)}% of goal)</p>
        <p>Latest Weight: ${summary.weight.toFixed(1)} kg</p>
        <p>Average Mood: ${(summary.mood / days).toFixed(2)}/10</p>
        <p>Current Streak: ${streaks.currentStreak} days</p>
        <p>Longest Streak: ${streaks.longestStreak} days</p>
    `;
}

function exportData() {
    const dataStr = JSON.stringify(dailyData);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'fitness_data.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function importData(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const importedData = JSON.parse(e.target.result);
        dailyData = importedData.map(entry => ({...entry, date: new Date(entry.date)}));
        saveData();
        updateWeeklyData();
        updateMonthlyData();
        updateCharts();
        document.getElementById('result').textContent = 'Data imported successfully!';
    };

    reader.readAsText(file);
}

document.getElementById('exportBtn').addEventListener('click', exportData);
document.getElementById('importBtn').addEventListener('change', importData);

loadData();