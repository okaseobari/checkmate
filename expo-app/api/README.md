Checkmate (Backend)
This repository contains the backend code for Checkmate, a mobile application designed to help users maintain relationships through consistent and meaningful check-ins.

Features:

User Management: Secure user registration, login, profile management, and password reset functionality.
Contact Management: Users can add, delete, and update contact information, including relationship type, adjustable check-in frequency, and important dates.
Personalized Check-in Schedule: The app generates a dynamic check-in schedule based on user preferences and contact relationships, ensuring no two consecutive check-ins for the same contact.
Conversation Logging: Records check-in details and allows users to add notes about their conversations.
AI-Powered Insights (In Development): Leverages Large Language Models (LLMs) to provide insights from conversation logs, helping users understand relationship dynamics and improve communication.
Tech Stack:

Node.js & Express: Backend framework for API development.
MongoDB: NoSQL database for storing user data, contacts, schedules, and conversation logs.
JWT (JSON Web Token): Secure user authentication and authorization.
Xenova Transformers: Library for accessing and utilizing pre-trained LLMs for embedding generation and text analysis.
Babel: JavaScript compiler for modern syntax and compatibility.
API Endpoints:

The API documentation is still under development. For now, you can refer to the routes defined in the ./routes directory for a general overview of the available endpoints.

Installation & Setup:

Clone the repository: git clone https://github.com/your-username/checkmate-backend.git
Install dependencies: npm install
Configure environment variables: Create a .env file in the root directory and set the following:
PORT (e.g., 3000)
MONGO_URI (your MongoDB connection string)
JWT_SECRET (a secret key for signing JWTs)

Redis server
docker run -p 6379:6379 --name redis -d redis redis-server --appendonly yes --requirepass <password>

Start the server: npm run start
Future Enhancements:

Enhanced AI Insights: Implement sentiment analysis, topic extraction, and relationship advice generation using LLMs.
Notifications: Remind users about upcoming check-ins and important dates.
Gamification: Introduce elements of gamification to motivate consistent engagement.
Group Check-ins: Allow users to schedule and log check-ins with multiple contacts simultaneously.
Contributing:

Contributions are welcome! Please open an issue or submit a pull request if you'd like to contribute to the project.

License:

This project is licensed under the MIT License.