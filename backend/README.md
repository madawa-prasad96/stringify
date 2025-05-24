# Backend Setup

## Environment Setup

To set up the development environment:

1.  Navigate to the `backend` directory.
2.  Create a Python virtual environment:
    ```bash
    python -m venv venv
    ```
3.  Activate the virtual environment:
    *   On Windows:
        ```bash
        .\venv\Scripts\activate
        ```
    *   On macOS/Linux:
        ```bash
        source venv/bin/activate
        ```
4.  Install the required packages:
    ```bash
    pip install -r requirements.txt
    ```

## Running the Application

1.  Ensure your virtual environment is activated.
2.  Navigate to the `backend` directory.
3.  Run the Flask application:
    ```bash
    python app.py
    ```
The application will start on `http://127.0.0.1:5001`.
