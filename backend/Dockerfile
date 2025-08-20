# Use an official Python runtime as a parent image
# UPDATE: Changed from 3.11 to 3.13 to match pyproject.toml
FROM python:3.13-slim as builder

# Set environment variables for Poetry
# We don't need to manage PATH anymore when using pip
ENV POETRY_VIRTUALENVS_IN_PROJECT=true \
    POETRY_NO_INTERACTION=1

# Set the working directory in the container
WORKDIR /app

# Install poetry using pip, which is more Docker-friendly
RUN pip install poetry

# Copy the dependency files
COPY pyproject.toml poetry.lock ./

# Install dependencies, INCLUDING the "dev" group
# This command will now find poetry in the default PATH
RUN poetry install --no-root --with dev

# Copy the rest of your application's code
COPY . .

# --- Final Stage ---
# UPDATE: Changed from 3.11 to 3.13 to match the builder stage
FROM python:3.13-slim as final

# Set environment variables for Poetry in the final stage as well
ENV POETRY_VIRTUALENVS_IN_PROJECT=true

# Set the working directory
WORKDIR /app

# Install poetry in the final stage to make `poetry run` available
RUN pip install poetry

# Copy the virtual environment from the builder stage
COPY --from=builder /app/.venv .venv

# Copy the application code
COPY . .

# Make the entrypoint script executable
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expose the port the app runs on
EXPOSE 8000

# Set the entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]

# Command to run the application
# UPDATE: Use `poetry run` to start the application as well for consistency
CMD ["poetry", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
