# SkillSwap X Project Setup

This document provides instructions for setting up the development environment for the SkillSwap X project. The project consists of three main components: a PHP backend, a Python AI microservice, and a React frontend.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **XAMPP**: Provides Apache and MySQL. Download from [Apache Friends](https://www.apachefriends.org/index.html).
- **PHP**: Included with XAMPP. Ensure it's added to your system's PATH.
- **Composer**: For PHP dependency management. Download from [getcomposer.org](https://getcomposer.org/download/).
- **Python**: Version 3.8 or higher. Download from [python.org](https://www.python.org/downloads/).
- **Node.js**: For the frontend. `bun` is recommended. Download from [bun.sh](https://bun.sh/).

## 1. Backend Setup (PHP)

The backend is a standard PHP application.

### 1.1. Database Setup

1.  **Start XAMPP**: Open the XAMPP Control Panel and start the **Apache** and **MySQL** modules.
2.  **Create Database**:
    -   Open your web browser and navigate to `http://localhost/phpmyadmin/`.
    -   Create a new database named `skillswapx`.
3.  **Import Schema**:
    -   Select the `skillswapx` database.
    -   Go to the "Import" tab.
    -   Import the schema files from the `migrations/` directory in the following order:
        1.  `002_schema.sql`
        2.  `003_social_auth.sql`
        3.  `final-schema.sql`

### 1.2. Environment Configuration

1.  **Copy Environment File**: In the project root, copy the `.env.example` file to a new file named `.env`.
2.  **Update `.env`**: Open the `.env` file and configure your database credentials and other settings. A typical local setup would look like this:

    ```env
    DB_HOST=127.0.0.1
    DB_PORT=3306
    DB_NAME=skillswapx
    DB_USER=root
    DB_PASS=
    ```

### 1.3. Web Server Configuration

Ensure the project root is served by your Apache web server. If you placed the project in the `htdocs` directory of your XAMPP installation, it should be accessible at `http://localhost/api/`.

## 2. AI Service Setup (Python)

The AI service is a Python application using FastAPI.

1.  **Navigate to AI Service Directory**:
    ```bash
    cd ai-service
    ```

2.  **Create a Virtual Environment**:
    ```bash
    python -m venv .venv
    ```

3.  **Activate the Virtual Environment**:
    -   **Windows**:
        ```bash
        .venv\Scripts\activate
        ```
    -   **macOS/Linux**:
        ```bash
        source .venv/bin/activate
        ```

4.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

5.  **Run the AI Service**:
    ```bash
    uvicorn main:app --reload
    ```
    The service will be running at `http://localhost:8000`.

## 3. Frontend Setup (React)

The frontend is a React application built with Vite.

1.  **Navigate to Frontend Directory**:
    ```bash
    cd frontend
    ```

2.  **Install Dependencies**:
    ```bash
    bun install
    ```
    (or `npm install` if you are not using bun)

3.  **Run the Development Server**:
    ```bash
    bun run dev
    ```
    (or `npm run dev`)

    The frontend will be running at `http://localhost:5173`.

## Summary of Running Services

-   **PHP Backend**: Accessible via Apache at `http://localhost/api/` (or your configured virtual host).
-   **Python AI Service**: Running at `http://localhost:8000`.
-   **React Frontend**: Running at `http://localhost:5173`.

You should now have the complete development environment up and running.
