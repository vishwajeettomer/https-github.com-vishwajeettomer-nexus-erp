# Nexus ERP - Production Ready Export

This project is a full-stack ERP application built with React (Frontend) and Express (Backend).

## Prerequisites

Before you begin, ensure you have the following installed on your local machine:

1. **Node.js** (v20 or higher recommended)
2. **npm** (comes bundled with Node.js)

## Installation & Setup

Follow these steps to get the application running locally:

### 1. Extract the ZIP
Extract the contents of the downloaded ZIP file into a folder on your computer.

### 2. Install Dependencies
Open a terminal (Command Prompt, PowerShell, or Terminal) in the project folder and run:
```bash
npm install
```
This will download all the necessary libraries into a `node_modules` folder.

### 3. Build the Frontend
Compile the React application for production:
```bash
npm run build
```

### 4. Start the Application
Launch the server:
```bash
npm start
```

The application will be running at: **http://localhost:3000**

## Project Structure

- `server.ts`: The Express backend server and API endpoints.
- `src/`: The React frontend source code.
- `erp.db`: The SQLite database file (contains your master data).
- `package.json`: Project configuration and dependency list.

## Features Included

- **Dashboard**: Real-time metrics and business overview.
- **Inventory**: Stock management and low-stock alerts.
- **Sales**: Order processing and customer management.
- **Production**: Production orders and status tracking.
- **Master Data**: 
  - Item Master & BOM
  - Accounts & Taxes
  - Units, Country, State, and City masters.
- **Authentication**: Secure login system with JWT.
