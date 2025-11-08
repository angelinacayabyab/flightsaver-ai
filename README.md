
# ✈️ FlightSaver AI

An autonomous AI agent that monitors flights in real-time, detects delays/cancellations, and autonomously finds alternative flight routes.

A project for the **AI ATL 2025 Hackathon**, submitted to the **Google Agentic Intelligence Track**.

## The Problem

Flight delays and cancellations are a major source of stress for travelers. Over 20% of flights are delayed, and the manual process of finding and booking an alternative can take over 45 minutes, often involving long waits on customer service lines. This process is inefficient, frustrating, and time-consuming.

## The Solution

FlightSaver AI is an autonomous agent that acts as your personal travel assistant. It proactively monitors your flight, and the moment a significant delay or cancellation is detected, it springs into action. The agent autonomously searches for, compares, and ranks the best alternative flights, presenting you with a clear recommendation and its reasoning, all before you might even be aware of the disruption.

## Features

-   **Real-Time Flight Monitoring**: Continuously checks the status of your flight.
-   **Autonomous Delay Detection**: Intelligently identifies when a disruption requires action.
-   **Multi-Step Agent Reasoning**: The AI thinks step-by-step, planning and executing a search for alternatives.
-   **Function Calling for Flight Search**: Uses Gemini's function calling capabilities to interact with mock flight data APIs.
-   **Transparent AI Decision-Making**: The UI displays the agent's complete thought process, from detection to recommendation.
-   **Ranked Alternative Recommendations**: Provides a clear, ranked list of alternative flights with explanations for each.

## Tech Stack

-   **AI Agent**: Google Gemini 2.5 Flash
-   **Agent Capabilities**: Gemini Function Calling
-   **Backend**: Node.js + Express
-   **Frontend**: Vanilla JavaScript, HTML5, CSS3

## Installation

1.  Clone the repository.
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file from the example:
    ```bash
    cp .env.example .env
    ```
4.  Add your Google Gemini API key to the `.env` file.
5.  Start the server:
    ```bash
    npm start
    ```
6.  Open your browser and navigate to `http://localhost:3000`.

## Demo Flow

1.  Enter a flight number to monitor (e.g., **AA123** for a delayed flight or **DL456** for a cancelled one).
2.  Fill in the other details (date, departure, arrival) and click "Start Monitoring".
3.  Watch the status update from "On Time" to "Delayed" or "Cancelled".
4.  Observe the AI agent activate automatically and see its step-by-step reasoning process appear in the UI.
5.  Review the ranked list of alternative flight recommendations provided by the agent.

## How It Demonstrates Agentic Intelligence

FlightSaver AI is more than a simple chatbot; it's a demonstration of an agentic system:

-   **Autonomy**: The agent operates without direct human command. It monitors the environment (flight status) and decides *on its own* when to act.
-   **Reasoning & Planning**: When a delay is detected, the agent forms a multi-step plan: "The delay is significant. First, I will check for alternatives on the same airline. Then, I will broaden my search. Finally, I will compare and rank the options."
-   **Tool Use (Function Calling)**: The agent uses tools (`searchAlternativeFlights`, `comparePrices`, etc.) to interact with its environment and gather the information needed to complete its task.
-   **Execution**: It executes its plan by making a series of function calls in a logical sequence.
-   **Transparency**: The system makes its internal state and decision-making process visible to the user, building trust and providing insight.

## Future Enhancements

-   Integration with real flight data APIs (e.g., Amadeus, Sabre).
-   Real-world booking integration via airline APIs.
-   Proactive SMS and email alerts for status changes and recommendations.
-   User preferences for ranking (e.g., prioritize price over speed).
-   Handling of multi-flight and multi-passenger itineraries.

## License

This project is licensed under the MIT License.
