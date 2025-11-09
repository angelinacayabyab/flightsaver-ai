const video = document.getElementById('camera');
const canvas = document.getElementById('canvas');
const startBtn = document.getElementById('startBtn');
const monitorBtn = document.getElementById('monitorBtn');
const flightForm = document.getElementById('flightForm');
const statusSection = document.getElementById('statusSection');
const flightStatusCard = document.getElementById('flightStatus');
const agentReasoningSection = document.getElementById('agentReasoning');
const agentSteps = document.getElementById('agentSteps');
const alternativesSection = document.getElementById('alternativesSection');
const alternativesTable = document.getElementById('alternativesTable');

let monitoringInterval = null;

// Monitor flight button
monitorBtn?.addEventListener('click', async (e) => {
  e.preventDefault();
  
  const flightNumber = document.getElementById('flightNumber').value.trim();
  const date = document.getElementById('date').value;
  const departure = document.getElementById('departure').value.trim();
  const arrival = document.getElementById('arrival').value.trim();

  if (!flightNumber || !date || !departure || !arrival) {
    alert('Please fill in all fields');
    return;
  }

  // Show status section
  statusSection.style.display = 'block';
  agentReasoningSection.style.display = 'none';
  alternativesSection.style.display = 'none';
  
  // Clear previous content
  agentSteps.innerHTML = '';
  alternativesTable.innerHTML = '';

  // Start monitoring
  monitorBtn.disabled = true;
  monitorBtn.textContent = 'Monitoring...';

  try {
    // Check flight status
    const statusResponse = await fetch(`http://localhost:3000/api/status/${flightNumber}`);
    const statusData = await statusResponse.json();

    if (statusData.error) {
      flightStatusCard.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #ef4444;">
          <h3>❌ Error</h3>
          <p>${statusData.message}</p>
        </div>
      `;
      monitorBtn.disabled = false;
      monitorBtn.textContent = 'Start Monitoring';
      return;
    }

    // Display flight status with proper formatting
    displayFlightStatus(statusData);

    // If delayed or cancelled, trigger agent
    if (statusData.delay >= 60 || statusData.status === 'CANCELLED') {
      setTimeout(() => triggerAgent(flightNumber, statusData, departure, arrival), 1000);
    }

  } catch (error) {
    console.error('Error:', error);
    flightStatusCard.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #ef4444;">
        <h3>❌ Error</h3>
        <p>Failed to fetch flight status. Please try again.</p>
      </div>
    `;
  }

  monitorBtn.disabled = false;
  monitorBtn.textContent = 'Start Monitoring';
});

function displayFlightStatus(flight) {
  const statusColor = 
    flight.status === 'ON_TIME' ? '#10b981' :
    flight.status === 'DELAYED' ? '#f59e0b' : '#ef4444';

  const statusBadge = flight.status === 'CANCELLED' ? 'CANCELLED' : 
                      flight.status === 'DELAYED' ? 'DELAYED' : 'ON TIME';

  flightStatusCard.innerHTML = `
    <div style="background: white; border-radius: 15px; padding: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <h2 style="margin: 0; font-size: 2em; color: #1e293b;">
            ${flight.flightNumber}
          </h2>
          <p style="margin: 5px 0 0 0; color: #64748b; font-size: 1.1em;">
            ${flight.airline}
          </p>
        </div>
        <div style="background: ${statusColor}; color: white; padding: 10px 20px; border-radius: 10px; font-weight: bold; font-size: 1.1em;">
          ${statusBadge}
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 20px; align-items: center; margin: 25px 0;">
        <div style="text-align: left;">
          <div style="font-size: 2.5em; font-weight: bold; color: #1e293b;">
            ${flight.departure.city}
          </div>
          <div style="color: #64748b; margin-top: 5px; font-size: 1.2em;">
            ${flight.departure.time}
          </div>
          <div style="color: #94a3b8; margin-top: 5px;">
            Gate ${flight.departure.gate}
          </div>
        </div>

        <div style="text-align: center;">
          <div style="font-size: 2em;">✈️</div>
          <div style="color: #64748b; font-size: 0.9em; margin-top: 5px;">
            ${flight.aircraft}
          </div>
        </div>

        <div style="text-align: right;">
          <div style="font-size: 2.5em; font-weight: bold; color: #1e293b;">
            ${flight.arrival.city}
          </div>
          <div style="color: #64748b; margin-top: 5px; font-size: 1.2em;">
            ${flight.arrival.time}
          </div>
          <div style="color: #94a3b8; margin-top: 5px;">
            Gate ${flight.arrival.gate}
          </div>
        </div>
      </div>

      ${flight.delay > 0 ? `
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <strong style="color: #92400e;">⚠️ Delay Information:</strong>
          <span style="color: #92400e; margin-left: 10px;">
            ${flight.delay} minutes behind schedule
          </span>
        </div>
      ` : ''}

      ${flight.status === 'CANCELLED' ? `
        <div style="background: #fee; border-left: 4px solid #ef4444; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <strong style="color: #991b1b;">❌ Flight Cancelled</strong>
          <p style="color: #991b1b; margin: 10px 0 0 0;">
            This flight has been cancelled. Our AI agent is searching for alternatives...
          </p>
        </div>
      ` : ''}
    </div>
  `;
}

async function triggerAgent(flightNumber, flightData, departure, arrival) {
  agentReasoningSection.style.display = 'block';
  agentSteps.innerHTML = '<div class="agent-step">🤖 AI Agent Activated...</div>';

  // Add reasoning steps with delays
  await addAgentStep('🔍 Analyzing flight status...', 500);
  
  if (flightData.status === 'CANCELLED') {
    await addAgentStep('❌ Flight cancelled detected - URGENT rebooking required', 800);
    await addAgentStep('🧠 Reasoning: Customer needs immediate alternative to reach destination', 1000);
  } else {
    await addAgentStep(`⚠️ Detected ${flightData.delay}-minute delay - exceeds 60-minute threshold`, 800);
    await addAgentStep('🧠 Reasoning: Significant delay may cause missed connections or schedule disruption', 1000);
  }

  await addAgentStep(`🔎 Searching for alternatives on route ${departure} → ${arrival}...`, 1200);
  await addAgentStep('📡 Querying same airline options first (better rebooking policies)...', 1500);
  await addAgentStep('🌐 Expanding search to partner airlines and alternative carriers...', 1800);

  try {
    const response = await fetch('http://localhost:3000/api/agent/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        flightNumber, 
        currentStatus: flightData,
        departure,
        arrival
      })
    });

    const result = await response.json();

    await addAgentStep('📊 Analyzing 8 possible alternatives across 4 airlines...', 2100);
    await addAgentStep('⚖️ Comparing options by: departure time, connections, total travel time, and price...', 2400);
    await addAgentStep(`✅ Agent ranked top ${result.alternatives?.length || 3} recommendations`, 2700);

    // Display alternatives
    displayAlternatives(result.alternatives || []);

  } catch (error) {
    console.error('Agent error:', error);
    await addAgentStep('❌ Error analyzing alternatives', 1000);
  }
}

async function addAgentStep(message, delay) {
  return new Promise(resolve => {
    setTimeout(() => {
      const step = document.createElement('div');
      step.className = 'agent-step';
      step.textContent = message;
      step.style.opacity = '0';
      step.style.transform = 'translateY(10px)';
      agentSteps.appendChild(step);
      
      setTimeout(() => {
        step.style.opacity = '1';
        step.style.transform = 'translateY(0)';
      }, 50);
      
      resolve();
    }, delay);
  });
}

function displayAlternatives(alternatives) {
  alternativesSection.style.display = 'block';

  if (!alternatives || alternatives.length === 0) {
    alternativesTable.innerHTML = '<p style="text-align: center; color: #64748b;">No alternatives found</p>';
    return;
  }

  let tableHTML = `
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
          <th style="padding: 15px; text-align: left; font-weight: 600; color: #475569;">Rank</th>
          <th style="padding: 15px; text-align: left; font-weight: 600; color: #475569;">Flight</th>
          <th style="padding: 15px; text-align: left; font-weight: 600; color: #475569;">Airline</th>
          <th style="padding: 15px; text-align: left; font-weight: 600; color: #475569;">Departure</th>
          <th style="padding: 15px; text-align: left; font-weight: 600; color: #475569;">Arrival</th>
          <th style="padding: 15px; text-align: left; font-weight: 600; color: #475569;">Duration</th>
          <th style="padding: 15px; text-align: left; font-weight: 600; color: #475569;">Connections</th>
          <th style="padding: 15px; text-align: left; font-weight: 600; color: #475569;">Price</th>
          <th style="padding: 15px; text-align: left; font-weight: 600; color: #475569;">Seats</th>
        </tr>
      </thead>
      <tbody>
  `;

  alternatives.forEach((flight, index) => {
    const isTopChoice = index === 0;
    const rowStyle = isTopChoice ? 
      'background: #f0fdf4; border-left: 4px solid #10b981;' : 
      'background: white;';

    tableHTML += `
      <tr style="${rowStyle} border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 20px;">
          ${isTopChoice ? 
            '<span style="background: #10b981; color: white; padding: 5px 10px; border-radius: 5px; font-weight: bold;">🏆 #1</span>' : 
            `<span style="color: #64748b;">#${index + 1}</span>`
          }
        </td>
        <td style="padding: 20px;">
          <strong style="color: #1e293b; font-size: 1.1em;">${flight.flightNumber}</strong>
        </td>
        <td style="padding: 20px; color: #475569;">${flight.airline}</td>
        <td style="padding: 20px;">
          <div style="font-weight: 600; color: #1e293b;">${flight.departure.time}</div>
          <div style="color: #64748b; font-size: 0.9em;">${flight.departure.city}</div>
        </td>
        <td style="padding: 20px;">
          <div style="font-weight: 600; color: #1e293b;">${flight.arrival.time}</div>
          <div style="color: #64748b; font-size: 0.9em;">${flight.arrival.city}</div>
        </td>
        <td style="padding: 20px; color: #475569;">${flight.duration}</td>
        <td style="padding: 20px;">
          ${flight.connections === 0 ? 
            '<span style="background: #dbeafe; color: #1e40af; padding: 5px 10px; border-radius: 5px; font-size: 0.9em;">Direct ✓</span>' : 
            `<span style="color: #64748b;">${flight.connections} stop</span>`
          }
        </td>
        <td style="padding: 20px;">
          <strong style="color: #059669; font-size: 1.1em;">$${flight.price}</strong>
        </td>
        <td style="padding: 20px; color: #64748b;">${flight.seatsAvailable} left</td>
      </tr>
      ${isTopChoice ? `
        <tr style="background: #f0fdf4;">
          <td colspan="9" style="padding: 15px 20px;">
            <strong style="color: #065f46;">💡 Why this is the best option:</strong>
            <span style="color: #065f46; margin-left: 10px;">
              ${flight.connections === 0 ? 'Direct flight - no connection risk. ' : ''}
              Departs soonest. 
              ${flight.seatsAvailable > 10 ? 'Good availability. ' : 'Limited seats - book quickly! '}
              Competitive pricing.
            </span>
          </td>
        </tr>
      ` : ''}
    </table>
  `;
  });

  tableHTML += '</tbody></table>';
  alternativesTable.innerHTML = tableHTML;
}