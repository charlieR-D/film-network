
CREATE DATABASE filmnetwork;
USE filmnetwork;

CREATE TABLE forum_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE USER 'appuser'@'localhost' IDENTIFIED WITH mysql_native_password BY 'app2027';
GRANT ALL PRIVILEGES ON filmnetwork.* TO 'appuser'@'localhost';
CREATE TABLE userdetails(id INT AUTO_INCREMENT PRIMARY KEY,username VARCHAR(50), first VARCHAR(50), last VARCHAR(50), email VARCHAR(100), hashedPassword VARCHAR(100));

CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT,  
    user_id INT, 
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
