# AI Mock Interview

AI Mock Interview is a web application designed to help users practice technical interviews with AI-generated questions and feedback. The frontend is built with React, and the backend is a Node.js/Express application connected to MongoDB. The application is deployed on an AWS EC2 instance using Docker and Docker Compose.

## Project Overview

- **Frontend**: React application
- **Backend**: Node.js/Express API hosted 
- **Database**: MongoDB Atlas for storing job listings, questions, and user data.
- **Deployment**: AWS EC2 instance (`t2.micro`) with Docker containers managed by Docker Compose.
- **Hosted at**: http://54.90.228.139/80

## Features

- Browse job listings and select a role to practice.
- Answer AI-generated technical questions.
- Submit code for evaluation (e.g., via Judge0 API).
- Receive feedback on your performance.

## Prerequisites

To run this project locally or deploy it, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or later)
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (or a local MongoDB instance)
- [AWS CLI](https://aws.amazon.com/cli/) (for deployment)
- [Git](https://git-scm.com/)

## Setup Instructions

### 1. Clone the Repository
- docker compose up
