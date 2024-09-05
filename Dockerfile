# Use Python 3.12.5 as the base image
FROM python:3.12.5-slim

# Set the working directory in the container
WORKDIR /

# Copy the requirements file into the container
COPY requirements.txt requirements.txt

# Install the Python dependencies
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy the rest of the application code
COPY app/ app/

# Run the application
ENTRYPOINT [ "gunicorn", "-b", "0.0.0.0:80", "app:create_app()" ]