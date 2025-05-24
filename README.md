# String Art Generator Web Application

This project is a web application that allows users to upload an image, process it, and generate a string art representation based on that image. The nails for the string art are arranged in a circle, and the application provides the sequence of nail connections required to create the art. A live preview of the string art generation is also displayed.

## Features

*   **Image Upload**: Drag-and-drop or file selection for images.
*   **Image Processing**:
    *   Automatic conversion to grayscale.
    *   User-controlled image cropping (1:1 aspect ratio).
*   **String Art Configuration**:
    *   Input fields for specifying "Nail Count" and "Line Count".
*   **Art Generation**: Backend algorithm generates the optimal string path.
*   **Live Preview**: Frontend displays an animated, line-by-line preview of the string art being created, along with a completion percentage.
*   **Output**: Provides the numerical sequence of nail connections (e.g., "0-23-10-45...").

## Project Structure

The project is organized into two main directories:

*   `frontend/`: Contains the Vite + React single-page application.
*   `backend/`: Contains the Python Flask API server responsible for image processing and string art algorithm execution.

## Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js and npm** (or yarn): For running the frontend. (Node.js >= 16.x recommended)
*   **Python and pip**: For running the backend. (Python >= 3.8 recommended)

## Setup Instructions

1.  **Clone the repository** (if you haven't already):
    ```bash
    # git clone <repository-url>
    # cd <repository-directory>
    ```

2.  **Backend Setup**:
    *   Navigate to the `backend` directory:
        ```bash
        cd backend
        ```
    *   Create a Python virtual environment:
        ```bash
        python -m venv venv
        ```
    *   Activate the virtual environment:
        *   On Windows:
            ```bash
            .\venv\Scripts\activate
            ```
        *   On macOS/Linux:
            ```bash
            source venv/bin/activate
            ```
    *   Install the required Python packages:
        ```bash
        pip install -r requirements.txt
        ```

3.  **Frontend Setup**:
    *   Navigate to the `frontend` directory (from the root):
        ```bash
        cd ../frontend 
        ```
        (If you are already in the `backend` directory, use `cd ../frontend`. If in root, use `cd frontend`.)
    *   Install the required Node.js packages:
        ```bash
        npm install
        ```

## Running the Application

You need to run both the backend server and the frontend development server simultaneously.

1.  **Start the Backend Server**:
    *   Navigate to the `backend` directory.
    *   Ensure your Python virtual environment is activated.
    *   Run the Flask application:
        ```bash
        python app.py
        ```
    *   The backend will start on `http://localhost:5001` by default.

2.  **Start the Frontend Development Server**:
    *   Navigate to the `frontend` directory.
    *   Run the Vite development server:
        ```bash
        npm run dev
        ```
    *   The frontend will typically start on `http://localhost:5173` (or the next available port, check your terminal output).
    *   Open your web browser and navigate to the frontend URL to use the application. The `/create` route is where the main functionality resides (e.g., `http://localhost:5173/create`).

## API Endpoint

The primary API endpoint used by the application is:

*   **`POST /api/generate_string_art`**:
    *   Accepts `multipart/form-data` with:
        *   `image`: The cropped grayscale image file.
        *   `nail_count`: Integer, the number of nails in the circle.
        *   `line_count`: Integer, the desired number of lines in the string art.
    *   Returns a JSON response with the `nail_path` string and other information.

## Technologies Used

*   **Frontend**:
    *   React
    *   Vite
    *   Axios (for API calls)
    *   React Image Crop
    *   React Router DOM
*   **Backend**:
    *   Python
    *   Flask (web framework)
    *   Flask-CORS
    *   Pillow (PIL Fork for image processing)
    *   NumPy (for numerical operations)
