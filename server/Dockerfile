# Use a base image with both Node.js and Python
FROM nikolaik/python-nodejs:python3.10-nodejs20

# Install system dependencies for face_recognition/dlib
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    g++ \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    libgtk-3-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Ensure the Faces directory exists for uploads
RUN mkdir -p Faces

# Copy package files and install Node.js dependencies
COPY package*.json ./
RUN npm install

# Copy requirements.txt and install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the port from .env (default to 1322 as used by user)
EXPOSE 1322

# Start the application
CMD ["node", "index.js"]
