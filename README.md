# batch-script-generator

`batch-script-generator` is a project that helps in generating batch scripts through API calls. It uses Google Generative AI and OpenAI's ChatGPT API to generate short video scripts based on user inputs. 

## Project Structure

The project is divided into two parts:

1. **Backend (Express API)**: Handles API requests and generates batch scripts using external AI models.
2. **Frontend (Batch Generator)**: The user interface for interacting with the API and generating scripts.

## Setup Instructions

Follow these steps to set up both the **Backend** and **Frontend** locally.

### 1. **Backend Setup**

The backend is built with Node.js and Express. It exposes APIs to generate scripts using Google and OpenAI's generative models.

#### Steps to set up the backend:

1. **Navigate to the Backend folder**:
   ```bash
   cd backend
   ```
2. **Install dependencies**:
   ```bash
   npm install
  
3. **Run the backend in development mode**:
   ```bash
   npm run dev
   ```

### 2. **Frontend Setup**

The frontend is built with Next.js and TailwindCSS.

#### Steps to set up the frontend:

1. **Navigate to the Frontend folder**:
   ```bash
   cd batch-generator
   ```
2. **Install dependencies**:
   ```bash
   npm install
  
3. **Run the frontend in development mode**:
   ```bash
   npm run dev
   ```
