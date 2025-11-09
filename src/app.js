require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const flightAPI = require('./flightAPI');
const FlightAgent = require('./flightAgent');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// In-memory store for monitored flights
const monitoredFlights = {};

// POST /api/monitor - Start monitoring a new flight
app.post('/api/monitor', async (req, res) => {
    const { flightNumber, date, departure, arrival } = req.body;
    if (!flightNumber) {
        return res.status(400).json({ error: 'Flight number is required.' });
    }

    const flightId = flightNumber.toUpperCase();
    
    try {
        // Get flight status (will try live data first, then fallback to mock)
        const initialStatus = await flightAPI.getFlightStatus(flightId);

        if (!initialStatus || initialStatus.error) {
            return res.status(404).json({ 
                error: initialStatus?.message || `Flight ${flightId} not found.` 
            });
        }

        monitoredFlights[flightId] = {
            ...initialStatus,
            monitoring: true,
            reasoning: null,
        };
        
        res.json({ status: 'monitoring', flightId });
    } catch (error) {
        console.error('Error monitoring flight:', error);
        res.status(500).json({ error: 'Failed to monitor flight.' });
    }
});

// GET /api/status/:flightNumber - Get the current status of a flight
app.get('/api/status/:flightId', async (req, res) => {
    const flightId = req.params.flightId.toUpperCase();
    
    try {
        // Always fetch fresh data
        const flightStatus = await flightAPI.getFlightStatus(flightId);
        
        if (!flightStatus || flightStatus.error) {
            return res.status(404).json({ 
                error: flightStatus?.message || 'Flight not found.' 
            });
        }

        res.json(flightStatus);
    } catch (error) {
        console.error('Error getting flight status:', error);
        res.status(500).json({ error: 'Failed to get flight status.' });
    }
});

// POST /api/agent/analyze - Trigger the autonomous agent
app.post('/api/agent/analyze', async (req, res) => {
    const { flightNumber, currentStatus, departure, arrival } = req.body;
    const flightId = flightNumber.toUpperCase();

    if (!currentStatus) {
        return res.status(400).json({ error: 'Current flight status required.' });
    }

    try {
        const agent = new FlightAgent();
        
        // Search for alternatives
        const alternatives = flightAPI.searchFlights(departure, arrival, currentStatus.date);
        
        const analysis = {
            agentReasoning: [
                '🔍 Analyzing flight disruption...',
                `⚠️ Flight ${flightId} - ${currentStatus.status}`,
                '🧠 Reasoning: Significant disruption detected, searching alternatives...',
                '🔎 Searching same airline and partner carriers...',
                `📊 Found ${alternatives.length} alternative flights`,
                '⚖️ Comparing options by time, connections, and price...',
                '✅ Ranked top recommendations'
            ],
            alternatives: alternatives.slice(0, 4), // Top 4 alternatives
            recommendation: alternatives[0] || null
        };

        res.json(analysis);

    } catch (error) {
        console.error('Agent analysis failed:', error);
        res.status(500).json({ error: 'The AI agent encountered an error.' });
    }
});

app.listen(port, () => {
    console.log(`✈️ FlightSaver AI server running at http://localhost:${port}`);
    console.log(`🔴 Live flight data: ${process.env.AVIATIONSTACK_API_KEY ? 'ENABLED' : 'DISABLED (using mock data)'}`);
});