# Poker Game Simulator

This project is a full-stack web application developed as a coding exercise. It allows users to play through a complete 6-player hand of No-Limit Texas Hold'em.

The application features a client-side game engine where all game logic is handled. Once a hand is complete, its history is sent to a backend API, which validates the hand using the `pokerkit` library, calculates the winner, and saves the results to a PostgreSQL database.

## Tech Stack

-   **Frontend:** Next.js, React, TypeScript, shadcn/ui
-   **Backend:** Python, FastAPI, Pokerkit
-   **Database:** PostgreSQL
-   **Containerization:** Docker, Docker Compose

## How to Run

This project is fully containerized and can be run with a single command.

**Prerequisites:**
-   Docker must be installed and running on your machine.

**Instructions:**

1.  Clone the repository to your local machine.
2.  Navigate to the root directory of the project in your terminal.
3.  Run the following command to build the images and start the services in the background:

    ```bash
    docker compose up -d
    ```

4.  Once the containers are up and running, open your web browser and navigate to the following URL:

    [http://localhost:3000](http://localhost:3000)

The application should now be fully accessible and ready to use.
