
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mockFlightData = require('./mockFlightData');
const FlightAgent = require('./flightAgent');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// In-memory store for monitored flights
// In a real app, this would be a database.
const monitoredFlights = {};

// POST /api/monitor - Start monitoring a new flight
app.post('/api/monitor', (req, res) => {
    const { flightNumber, date, departure, arrival } = req.body;
    if (!flightNumber) {
        return res.status(400).json({ error: 'Flight number is required.' });
    }

    const flightId = flightNumber.toUpperCase();
    const initialStatus = mockFlightData.getFlightStatus(flightId);

    if (!initialStatus) {
        return res.status(404).json({ error: `Flight ${flightId} not found in mock data.` });
    }

    // Simulate a future delay or cancellation for specific flights for demo purposes
    let disruption = { type: 'none', delay: 0, triggerTime: null };
    if (flightId === 'AA123') { // This flight will be delayed
        disruption = {
            type: 'Delayed',
            delay: 180, // 3 hours
            triggerTime: Date.now() + 5000 // Trigger in 5 seconds
        };
    } else if (flightId === 'DL456') { // This flight will be cancelled
         disruption = {
            type: 'Cancelled',
            delay: 0,
            triggerTime: Date.now() + 5000 // Trigger in 5 seconds
        };
    }

    monitoredFlights[flightId] = {
        ...initialStatus,
        monitoring: true,
        disruption,
        reasoning: null,
    };
    
    res.json({ status: 'monitoring', flightId });
});

// GET /api/status/:flightNumber - Get the current status of a flight
app.get('/api/status/:flightId', (req, res) => {
    const flightId = req.params.flightId.toUpperCase();
    const flight = monitoredFlights[flightId];

    if (!flight) {
        return res.status(404).json({ error: 'Flight not being monitored.' });
    }

    // Check if it's time to trigger the simulated disruption
    if (flight.disruption.triggerTime && Date.now() >= flight.disruption.triggerTime) {
        flight.status = flight.disruption.type;
        flight.delay = flight.disruption.delay;
        flight.disruption.triggerTime = null; // Prevent re-triggering
    }

    res.json({
        flightNumber: flight.flightNumber,
        status: flight.status,
        delay: flight.delay || 0,
        gate: flight.gate,
        departure: flight.departure,
        arrival: flight.arrival,
        airline: flight.airline,
        reasoning: flight.reasoning
    });
});

// POST /api/agent/analyze - Trigger the autonomous agent
app.post('/api/agent/analyze', async (req, res) => {
    const { flightNumber } = req.body;
    const flightId = flightNumber.toUpperCase();
    const currentStatus = monitoredFlights[flightId];

    if (!currentStatus) {
        return res.status(404).json({ error: 'Flight not being monitored.' });
    }

    try {
        const agent = new FlightAgent();
        const analysis = await agent.analyze(currentStatus);

        // Store the results
        monitoredFlights[flightId].reasoning = analysis.agentReasoning;
        monitoredFlights[flightId].alternatives = analysis.alternatives;
        monitoredFlights[flightId].recommendation = analysis.recommendation;
        
        res.json(analysis);

    } catch (error) {
        console.error('Agent analysis failed:', error);
        res.status(500).json({ error: 'The AI agent encountered an error.' });
    }
});


app.listen(port, () => {
    console.log(`FlightSaver AI server running at http://localhost:${port}`);
});
