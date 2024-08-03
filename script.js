let dailyData = [];
let weeklyData = [];
let monthlyData = [];

function trackDaily() {
    const steps = parseInt(document.getElementById('steps').value);
    const calories = parseInt(document.getElementById('calories').value);
    const water = parseInt(document.getElementById('water').value);
    const sleep = parseInt(document.getElementById('sleep').value);
    
    if (isNaN(steps) || isNaN(calories) || isNaN(water) || isNaN(sleep)) {
        document.getElementById('result').textContent = 'Please enter valid numbers for all fields.';
        return;
    }
    
    const dailyEntry = { date: new Date(), steps, calories, water, sleep };
    dailyData.push(dailyEntry);
    
    updateWeeklyData();
    updateMonthlyData();
    
    const message = `Great job! You've taken ${steps} steps, burned ${calories} calories, drank ${water} glasses of water, and slept for ${sleep} hours.`;
    document.getElementById('result').textContent = message;
    
    updateCharts();
}

function updateWeeklyData() {
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    weeklyData = dailyData.filter(entry => entry.date >= oneWeekAgo);
    
    const weeklySummary = calculateSummary(weeklyData);
    document.getElementById('weekly-summary').innerHTML = formatSummary(weeklySummary);
}

function updateMonthlyData() {
    const today = new Date();
    const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    monthlyData = dailyData.filter(entry => entry.date >= oneMonthAgo);
    
    const monthlySummary = calculateSummary(monthlyData);
    document.getElementById('monthly-summary').innerHTML = formatSummary(monthlySummary);
}

function calculateSummary(data) {
    return data.reduce((acc, entry) => {
        acc.steps += entry.steps;
        acc.calories += entry.calories;
        acc.water += entry.water;
        acc.sleep += entry.sleep;
        return acc;
    }, { steps: 0, calories: 0, water: 0, sleep: 0 });
}

function formatSummary(summary) {
    return `
        <p>Total Steps: ${summary.steps}</p>
        <p>Total Calories Burned: ${summary.calories}</p>
        <p>Total Water Consumed: ${summary.water} glasses</p>
        <p>Average Sleep: ${(summary.sleep / 7).toFixed(2)} hours per day</p>
    `;
}

function updateCharts() {
    const chartsContainer = document.getElementById('progress-charts');
    chartsContainer.innerHTML = '';
    
    const metrics = ['steps', 'calories', 'water', 'sleep'];
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
    
    return chartDiv;
}

document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(button.dataset.tab).classList.add('active');
    });
});

updateCharts();