Voting System

Overview

This is a secure voting system built using Node.js, Express, MySQL, and bcrypt for password encryption. The system allows users to register, log in, update their login credentials, and vote securely.

Features

Secure user authentication with bcrypt password hashing

User registration with unique voter ID

Secure login with encrypted password verification

Ability to update login credentials (username & password)

MySQL database integration

containerizing the application using docker

Technologies Used

Node.js (Server-side runtime)

Express.js (Web framework for Node.js)

MySQL (Relational database)

bcrypt (Password hashing for security)

Docker for containerization

Project Structure

/your-project
|-- /public
| |-- comments.html
|-- server.js
|-- package.json
|-- README.md

Installation & Setup

1. Clone the Repository

git clone https://github.com/sds/voting-system.git
cd voting-system

2. Install Dependencies

npm install

3. Configure Database

Create a MySQL database and update server.js with the correct credentials:

const db = mysql.createConnection({
host: "localhost",
user: "root",
password: "",
database: "dbt25_a1_pes2ug22cs648"
});

Run the following SQL query to create the voters table:

CREATE TABLE voters (
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(255) NOT NULL,
user VARCHAR(255) UNIQUE NOT NULL,
password VARCHAR(255) NOT NULL,
region VARCHAR(255) NOT NULL,
has_voted BOOLEAN DEFAULT 0
);

4. Run the Server

node server.js

The server will start on http://localhost:3000.

API Endpoints

1. User Registration

Endpoint: POST /signUp

{
"name": "John Doe",
"user": "johndoe",
"password": "securepassword",
"region": "Region A"
}

Response:

{
"success": true,
"message": "User registered successfully!"
}

2. User Login

Endpoint: POST /login

{
"voterId": 1,
"username": "johndoe",
"password": "securepassword"
}

Response:

{
"success": true,
"id": 1,
"name": "John Doe",
"region": "Region A",
"has_voted": false
}

3. Change Login Credentials

Endpoint: POST /change-login

{
"voterId": 1,
"username": "johndoe",
"password": "securepassword",
"newUsername": "john_updated",
"newPassword": "newsecurepassword"
}

Response:

{
"success": true,
"message": "Login details updated successfully!"
}

Security Enhancements

Password Encryption: All passwords are hashed using bcrypt before storing them in the database.

Secure Authentication: The login system verifies user credentials using bcrypt’s compare method.

Prevent SQL Injection: User inputs are passed as parameters in database queries.

Running the Password Migration Script

If you already have users with plain text passwords in the database, run the following script to hash them:

node hashPasswords.js

This will update all stored passwords with bcrypt-hashed versions.

License

This project is licensed under the MIT License.

Contributors

Varun Kedlaya - Developer

For any issues, please create a GitHub issue or contact me at kedlayav@gmail.com.
