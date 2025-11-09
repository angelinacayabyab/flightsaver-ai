require('dotenv').config();
const fetch = require('node-fetch');
const mockFlightData = require('./mockFlightData');

const AVIATIONSTACK_API_KEY = process.env.AVIATIONSTACK_API_KEY;
const AVIATIONSTACK_BASE_URL = 'http://api.aviationstack.com/v1';

/**
 * Get real-time flight status from AviationStack API
 * Falls back to mock data if API fails or key is missing
 */
async function getFlightStatus(flightNumber) {
  // If no API key, use mock data
  if (!AVIATIONSTACK_API_KEY || AVIATIONSTACK_API_KEY === 'your_aviationstack_key_here') {
    console.log('📊 Using mock data - no AviationStack API key configured');
    return mockFlightData.getFlightStatus(flightNumber);
  }

  try {
    // Call AviationStack API
    const url = `${AVIATIONSTACK_BASE_URL}/flights?access_key=${AVIATIONSTACK_API_KEY}&flight_iata=${flightNumber}`;
    
    console.log(`🔍 Fetching live data for flight ${flightNumber}...`);
    const response = await fetch(url);
    const data = await response.json();

    // Check for API errors
    if (data.error) {
      console.error('❌ AviationStack API error:', data.error);
      console.log('📊 Falling back to mock data');
      return mockFlightData.getFlightStatus(flightNumber);
    }

    // Check if flight found
    if (!data.data || data.data.length === 0) {
      console.log(`📊 Flight ${flightNumber} not found in live data, using mock`);
      return mockFlightData.getFlightStatus(flightNumber);
    }

    // Parse real flight data
    const flight = data.data[0];
    
    // Calculate delay
    const scheduledDeparture = new Date(flight.departure.scheduled);
    const actualDeparture = flight.departure.actual ? new Date(flight.departure.actual) : null;
    const estimatedDeparture = flight.departure.estimated ? new Date(flight.departure.estimated) : null;
    
    let delay = 0;
    let status = 'ON_TIME';
    
    if (flight.flight_status === 'cancelled') {
      status = 'CANCELLED';
    } else if (actualDeparture) {
      delay = Math.floor((actualDeparture - scheduledDeparture) / 60000); // minutes
      if (delay > 15) status = 'DELAYED';
    } else if (estimatedDeparture) {
      delay = Math.floor((estimatedDeparture - scheduledDeparture) / 60000);
      if (delay > 15) status = 'DELAYED';
    }

    // Format the response
    const formattedFlight = {
      flightNumber: flight.flight.iata || flightNumber,
      airline: flight.airline.name,
      departure: {
        city: flight.departure.iata || flight.departure.airport,
        time: formatTime(flight.departure.scheduled),
        gate: flight.departure.gate || 'TBA'
      },
      arrival: {
        city: flight.arrival.iata || flight.arrival.airport,
        time: formatTime(flight.arrival.scheduled),
        gate: flight.arrival.gate || 'TBA'
      },
      date: flight.flight_date,
      status: status,
      delay: Math.max(0, delay),
      aircraft: flight.aircraft?.registration || 'Unknown',
      price: 0,
      timestamp: new Date().toISOString(),
      isLiveData: true
    };

    console.log('✅ Live flight data retrieved successfully!');
    return formattedFlight;

  } catch (error) {
    console.error('❌ Error fetching live flight data:', error.message);
    console.log('📊 Falling back to mock data');
    return mockFlightData.getFlightStatus(flightNumber);
  }
}

/**
 * Search for alternative flights (uses mock data)
 */
function searchFlights(departure, arrival, date, airline = null) {
  console.log(`🔎 Searching alternatives: ${departure} -> ${arrival}`);
  return mockFlightData.searchFlights(departure, arrival, date, airline);
}

/**
 * Format time from ISO string to readable format
 */
function formatTime(isoString) {
  if (!isoString) return 'TBA';
  
  const date = new Date(isoString);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes < 10 ? '0' + minutes : minutes;
  
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

module.exports = {
  getFlightStatus,
  searchFlights
};