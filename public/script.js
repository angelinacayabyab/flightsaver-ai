
document.addEventListener('DOMContentLoaded', () => {
    const monitorForm = document.getElementById('monitor-form');
    const monitorButton = document.getElementById('monitor-button');
    const buttonText = document.getElementById('button-text');
    const buttonLoader = document.getElementById('button-loader');
    
    // UI sections
    const resultsContainer = document.getElementById('results-container');
    const statusSection = document.getElementById('status-section');
    const agentSection = document.getElementById('agent-section');
    const alternativesSection = document.getElementById('alternatives-section');
    
    // Display elements
    const flightInfoEl = document.getElementById('flight-info');
    const statusBadgeEl = document.getElementById('status-badge');
    const gateInfoEl = document.getElementById('gate-info');
    const delayInfoEl = document.getElementById('delay-info');
    const agentLogEl = document.getElementById('agent-reasoning-log');
    const alternativesTbody = document.querySelector('#alternatives-table tbody');
    const recommendationSummaryEl = document.getElementById('recommendation-summary');

    // State
    let pollingInterval;
    let agentTriggered = false;

    // Set default date to today
    const dateInput = document.getElementById('date');
    dateInput.valueAsDate = new Date();


    monitorForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(monitorForm);
        const flightData = {
            flightNumber: formData.get('flight-number'),
            date: formData.get('date'),
            departure: formData.get('departure'),
            arrival: formData.get('arrival'),
        };
        startMonitoring(flightData);
    });

    function setLoadingState(isLoading) {
        monitorButton.disabled = isLoading;
        buttonText.textContent = isLoading ? 'Monitoring...' : 'Start Monitoring';
        buttonLoader.classList.toggle('hidden', !isLoading);
    }

    async function startMonitoring(flightData) {
        setLoadingState(true);
        agentTriggered = false;
        clearInterval(pollingInterval);
        resetUI();

        try {
            const response = await fetch('/api/monitor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(flightData),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to start monitoring.');
            }
            
            resultsContainer.classList.remove('hidden');
            updateStatusDisplay({ ...flightData, status: "Monitoring", delay: 0, gate: 'TBD' });
            
            pollFlightStatus(data.flightId);

        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            setLoadingState(false);
        }
    }

    function pollFlightStatus(flightId) {
        pollingInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/status/${flightId}`);
                if (!response.ok) {
                    clearInterval(pollingInterval);
                    return;
                }
                const status = await response.json();
                updateStatusDisplay(status);

                const isDisrupted = status.status === 'Delayed' && status.delay > 60;
                const isCancelled = status.status === 'Cancelled';

                if ((isDisrupted || isCancelled) && !agentTriggered) {
                    agentTriggered = true; // Prevent multiple triggers
                    clearInterval(pollingInterval);
                    triggerAgent(flightId, status);
                }

            } catch (error) {
                console.error('Polling failed:', error);
                clearInterval(pollingInterval);
            }
        }, 3000);
    }

    function updateStatusDisplay(status) {
        flightInfoEl.textContent = `${status.flightNumber} (${status.departure} → ${status.arrival})`;
        statusBadgeEl.textContent = status.status;
        statusBadgeEl.className = 'badge'; // Reset classes
        statusBadgeEl.classList.add(status.status.toLowerCase().replace(' ', '-'));
        gateInfoEl.textContent = status.gate || '--';
        delayInfoEl.textContent = status.delay > 0 ? `${status.delay} minutes` : 'None';
    }

    async function triggerAgent(flightId, status) {
        agentSection.classList.remove('hidden');
        addReasoningStep("⚠️ Disruption detected! Activating AI agent...");

        try {
            const response = await fetch('/api/agent/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ flightNumber: flightId, currentStatus: status }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Agent failed to analyze.');
            }

            const analysis = await response.json();
            
            displayAgentReasoning(analysis.agentReasoning);

            setTimeout(() => {
                 renderAlternatives(analysis.alternatives, analysis.recommendation);
                 alternativesSection.classList.remove('hidden');
            }, (analysis.agentReasoning.length + 1) * 700);


        } catch (error) {
             addReasoningStep(`❌ Agent Error: ${error.message}`);
        }
    }

    function displayAgentReasoning(steps) {
        steps.forEach((step, index) => {
            setTimeout(() => {
                addReasoningStep(step);
            }, index * 700); // Stagger the appearance
        });
    }

    function addReasoningStep(stepText) {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = stepText;
        agentLogEl.appendChild(entry);
        agentLogEl.scrollTop = agentLogEl.scrollHeight; // Auto-scroll
    }

    function renderAlternatives(alternatives, recommendation) {
        recommendationSummaryEl.textContent = recommendation;
        alternativesTbody.innerHTML = ''; // Clear previous results

        if (!alternatives || alternatives.length === 0) {
            alternativesTbody.innerHTML = '<tr><td colspan="7">No alternative flights found.</td></tr>';
            return;
        }

        const topRecommendationFlightNumber = (recommendation.match(/Flight (\w+\d+)/) || [])[1];
        
        alternatives.forEach(flight => {
            const tr = document.createElement('tr');
            
            const durationHours = Math.floor(flight.duration / 60);
            const durationMinutes = flight.duration % 60;
            const depTime = new Date(flight.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const arrTime = new Date(flight.arrivalTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

            tr.innerHTML = `
                <td>${flight.flightNumber}</td>
                <td>${flight.airlineName}</td>
                <td>${depTime}</td>
                <td>${arrTime}</td>
                <td>${flight.duration ? `${durationHours}h ${durationMinutes}m` : '--'}</td>
                <td>${flight.connections === 0 ? 'Direct' : flight.connections}</td>
                <td>$${flight.price}</td>
            `;

            if (flight.flightNumber === topRecommendationFlightNumber) {
                tr.classList.add('highlight');
            }

            alternativesTbody.appendChild(tr);
        });
    }

    function resetUI() {
        resultsContainer.classList.add('hidden');
        agentSection.classList.add('hidden');
        alternativesSection.classList.add('hidden');
        agentLogEl.innerHTML = '';
        alternativesTbody.innerHTML = '';
        recommendationSummaryEl.innerHTML = '';
    }
});
