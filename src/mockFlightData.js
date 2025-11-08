// Mock flight data for demo purposes
const mockFlights = {
  // Scenario 1: Minor delay - no action needed
  'UA500': {
    flightNumber: 'UA500',
    airline: 'United Airlines',
    departure: { city: 'LAX', time: '10:00 AM', gate: 'B12' },
    arrival: { city: 'SFO', time: '11:30 AM', gate: 'A5' },
    date: '2025-11-08',
    status: 'DELAYED',
    delay: 45, // 45 minutes - minor delay
    aircraft: 'Boeing 737',
    price: 189
  },

  // Scenario 2: Major delay - needs alternatives
  'AA100': {
    flightNumber: 'AA100',
    airline: 'American Airlines',
    departure: { city: 'ATL', time: '2:00 PM', gate: 'C15' },
    arrival: { city: 'NYC', time: '4:30 PM', gate: 'D8' },
    date: '2025-11-08',
    status: 'DELAYED',
    delay: 180, // 3 hours - major delay
    aircraft: 'Airbus A321',
    price: 245
  },

  // Scenario 3: Cancelled flight - urgent rebooking
  'DL250': {
    flightNumber: 'DL250',
    airline: 'Delta Airlines',
    departure: { city: 'MIA', time: '8:00 AM', gate: 'E22' },
    arrival: { city: 'CHI', time: '11:00 AM', gate: 'F10' },
    date: '2025-11-08',
    status: 'CANCELLED',
    delay: 0,
    aircraft: 'Boeing 757',
    price: 310
  },

  // Scenario 4: International flight issue
  'UA777': {
    flightNumber: 'UA777',
    airline: 'United Airlines',
    departure: { city: 'JFK', time: '6:00 PM', gate: 'T4-A1' },
    arrival: { city: 'LHR', time: '6:00 AM+1', gate: 'T2-B5' },
    date: '2025-11-08',
    status: 'DELAYED',
    delay: 240, // 4 hours - serious delay
    aircraft: 'Boeing 777',
    price: 890
  },

  // Scenario 5: Connecting flight problem
  'SW150': {
    flightNumber: 'SW150',
    airline: 'Southwest Airlines',
    departure: { city: 'DEN', time: '1:00 PM', gate: 'B25' },
    arrival: { city: 'LAX', time: '3:30 PM', gate: 'Terminal 1' },
    date: '2025-11-08',
    status: 'DELAYED',
    delay: 90, // 1.5 hours - might miss connection
    aircraft: 'Boeing 737 MAX',
    price: 165
  }
};

// Alternative flights database
const alternativeFlights = {
  'ATL-NYC': [
    {
      flightNumber: 'DL1050',
      airline: 'Delta Airlines',
      departure: { city: 'ATL', time: '3:15 PM', gate: 'A10' },
      arrival: { city: 'NYC', time: '5:45 PM', gate: 'Terminal 4' },
      status: 'ON_TIME',
      connections: 0,
      duration: '2h 30m',
      price: 275,
      seatsAvailable: 12
    },
    {
      flightNumber: 'UA305',
      airline: 'United Airlines',
      departure: { city: 'ATL', time: '4:00 PM', gate: 'C8' },
      arrival: { city: 'NYC', time: '6:30 PM', gate: 'Terminal 7' },
      status: 'ON_TIME',
      connections: 0,
      duration: '2h 30m',
      price: 290,
      seatsAvailable: 8
    },
    {
      flightNumber: 'AA450',
      airline: 'American Airlines',
      departure: { city: 'ATL', time: '5:30 PM', gate: 'D12' },
      arrival: { city: 'NYC', time: '8:00 PM', gate: 'Terminal 8' },
      status: 'ON_TIME',
      connections: 0,
      duration: '2h 30m',
      price: 260,
      seatsAvailable: 15
    },
    {
      flightNumber: 'B6200',
      airline: 'JetBlue',
      departure: { city: 'ATL', time: '6:00 PM', gate: 'E5' },
      arrival: { city: 'NYC', time: '8:30 PM', gate: 'Terminal 5' },
      status: 'ON_TIME',
      connections: 0,
      duration: '2h 30m',
      price: 245,
      seatsAvailable: 20
    }
  ],

  'MIA-CHI': [
    {
      flightNumber: 'AA850',
      airline: 'American Airlines',
      departure: { city: 'MIA', time: '10:00 AM', gate: 'D15' },
      arrival: { city: 'CHI', time: '12:30 PM', gate: 'Terminal 3' },
      status: 'ON_TIME',
      connections: 0,
      duration: '3h 30m',
      price: 340,
      seatsAvailable: 10
    },
    {
      flightNumber: 'UA625',
      airline: 'United Airlines',
      departure: { city: 'MIA', time: '11:30 AM', gate: 'E8' },
      arrival: { city: 'CHI', time: '2:00 PM', gate: 'Terminal 1' },
      status: 'ON_TIME',
      connections: 0,
      duration: '3h 30m',
      price: 355,
      seatsAvailable: 6
    },
    {
      flightNumber: 'DL400',
      airline: 'Delta Airlines',
      departure: { city: 'MIA', time: '1:00 PM', gate: 'F12' },
      arrival: { city: 'CHI', time: '3:30 PM', gate: 'Terminal 2' },
      status: 'ON_TIME',
      connections: 0,
      duration: '3h 30m',
      price: 330,
      seatsAvailable: 18
    }
  ],

  'JFK-LHR': [
    {
      flightNumber: 'BA112',
      airline: 'British Airways',
      departure: { city: 'JFK', time: '8:00 PM', gate: 'T7-A2' },
      arrival: { city: 'LHR', time: '8:00 AM+1', gate: 'T5-A10' },
      status: 'ON_TIME',
      connections: 0,
      duration: '7h',
      price: 920,
      seatsAvailable: 8
    },
    {
      flightNumber: 'AA106',
      airline: 'American Airlines',
      departure: { city: 'JFK', time: '9:00 PM', gate: 'T8-B5' },
      arrival: { city: 'LHR', time: '9:00 AM+1', gate: 'T3-B8' },
      status: 'ON_TIME',
      connections: 0,
      duration: '7h',
      price: 950,
      seatsAvailable: 5
    }
  ],

  'DEN-LAX': [
    {
      flightNumber: 'UA2100',
      airline: 'United Airlines',
      departure: { city: 'DEN', time: '2:30 PM', gate: 'B15' },
      arrival: { city: 'LAX', time: '4:30 PM', gate: 'Terminal 7' },
      status: 'ON_TIME',
      connections: 0,
      duration: '2h',
      price: 180,
      seatsAvailable: 25
    },
    {
      flightNumber: 'F9500',
      airline: 'Frontier Airlines',
      departure: { city: 'DEN', time: '3:00 PM', gate: 'A20' },
      arrival: { city: 'LAX', time: '5:00 PM', gate: 'Terminal 3' },
      status: 'ON_TIME',
      connections: 0,
      duration: '2h',
      price: 145,
      seatsAvailable: 30
    }
  ],

  'LAX-SFO': [
    {
      flightNumber: 'AA3200',
      airline: 'American Airlines',
      departure: { city: 'LAX', time: '11:00 AM', gate: 'Terminal 4' },
      arrival: { city: 'SFO', time: '12:25 PM', gate: 'Terminal 2' },
      status: 'ON_TIME',
      connections: 0,
      duration: '1h 25m',
      price: 150,
      seatsAvailable: 40
    },
    {
      flightNumber: 'DL1800',
      airline: 'Delta Airlines',
      departure: { city: 'LAX', time: '11:30 AM', gate: 'Terminal 5' },
      arrival: { city: 'SFO', time: '12:55 PM', gate: 'Terminal 1' },
      status: 'ON_TIME',
      connections: 0,
      duration: '1h 25m',
      price: 165,
      seatsAvailable: 35
    }
  ]
};

// Function to get flight status
export function getFlightStatus(flightNumber) {
  const flight = mockFlights[flightNumber];
  
  if (!flight) {
    return {
      error: true,
      message: `Flight ${flightNumber} not found in mock data.`
    };
  }

  return {
    ...flight,
    timestamp: new Date().toISOString()
  };
}

// Function to search alternative flights
export function searchFlights(departure, arrival, date, airline = null) {
  const routeKey = `${departure}-${arrival}`;
  let alternatives = alternativeFlights[routeKey] || [];

  // Filter by airline if specified
  if (airline) {
    alternatives = alternatives.filter(f => 
      f.airline.toLowerCase().includes(airline.toLowerCase())
    );
  }

  return alternatives;
}

// Function to get airline info
export function getAirlineInfo(code) {
  const airlines = {
    'AA': { name: 'American Airlines', code: 'AA', alliance: 'Oneworld' },
    'DL': { name: 'Delta Airlines', code: 'DL', alliance: 'SkyTeam' },
    'UA': { name: 'United Airlines', code: 'UA', alliance: 'Star Alliance' },
    'SW': { name: 'Southwest Airlines', code: 'SW', alliance: 'Independent' },
    'B6': { name: 'JetBlue', code: 'B6', alliance: 'Independent' },
    'F9': { name: 'Frontier Airlines', code: 'F9', alliance: 'Independent' },
    'BA': { name: 'British Airways', code: 'BA', alliance: 'Oneworld' }
  };

  return airlines[code] || { name: 'Unknown Airline', code, alliance: 'Unknown' };
}