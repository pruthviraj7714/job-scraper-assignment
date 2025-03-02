# Application Documentation

## Table of Contents
- [Getting Started](#getting-started)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Usage](#api-usage)
- [Scraper Usage](#scraper-usage)

## Getting Started

This application is built using Turborepo, a high-performance build system for JavaScript and TypeScript codebases. Follow these steps to set up and run the application.

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [pnpm](https://pnpm.io/) package manager
- [PostgreSQL](https://www.postgresql.org/) database

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

## Database Setup

1. Make sure PostgreSQL is running on your machine or accessible via network.

2. Navigate to the database package:
   ```bash
   cd packages/db
   ```

3. Create a `.env` file with your PostgreSQL connection string:
   ```
   DATABASE_URL="postgresql://postgres:password@localhost:5432/mydb"
   ```
   
   Replace the connection string values with your actual PostgreSQL credentials:
   - `postgres`: database username
   - `password`: database password
   - `localhost:5432`: host and port where PostgreSQL is running
   - `mydb`: name of your database

4. Initialize the database with Prisma:
   ```bash
   npx prisma migrate dev && npx prisma generate
   ```
   
   This command will:
   - Create necessary tables based on your Prisma schema
   - Generate Prisma client code for database access

## Running the Application

Once installation and database setup are complete, you can run the entire application:

```bash
# From the root directory
pnpm dev
```

This will start all packages defined in your Turborepo workspace, including:
- Frontend application (if applicable)
- API server
- Scraper service (if scheduled to run automatically)

## API Usage

The API provides endpoints for interacting with the application data.

### Base URL

When running locally, the API is typically available at `http://localhost:3000/jobs` 
### Authentication

[Document authentication method here - tokens, cookies, etc.]

### Endpoints

#### GET /jobs
Retrieves all jobs from the database.

**Query Parameters:**
- `location` (optional): Number of records to return (default: 20)
- `page` (optional): Number of records to return (default: 20)
- `postedOn` (optional): Number of records to return (default: 20)
- `company` (optional): Number of records to return (default: 20)

## Scraper Usage

The scraper is designed to collect data from specified sources and store it in the database.

### Manual Execution

To run the scraper manually:

```bash
# From the root directory
pnpm run scrape
```

Or navigate to the scraper package:

```bash
cd apps/scraper
pnpm run start
```


For additional help, please [contact the support team/open an issue].