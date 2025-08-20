#!/bin/bash
set -e

# Execute the command passed to the script.
# `poetry run` will handle the virtual environment activation.
exec "$@"
