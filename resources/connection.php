<?php
/**
 * PNN Project - Database Connection
 * Configured for XAMPP MySQL
 * 
 * Host: localhost
 * Username: root
 * Password: (empty)
 * Database: pnn_project_db
 */

$host     = "localhost";
$username = "root";
$password = "";
$database = "pnn_project_db";

// Connect to MySQL server
$conn = @new mysqli($host, $username, $password, $database);

// Auto-initialize database if not yet created in phpMyAdmin
if ($conn->connect_error) {
    $server_conn = @new mysqli($host, $username, $password);
    if ($server_conn->connect_error) {
        die("<div style='font-family: sans-serif; padding: 2rem; background: #fee2e2; color: #b91c1c; border-radius: 8px; margin: 2rem;'>
            <h3 style='margin-top:0;'>⚠️ MySQL Connection Failed</h3>
            <p>Could not connect to MySQL at <code>{$host}</code>.</p>
            <p><strong>Please ensure MySQL is running in your XAMPP Control Panel.</strong></p>
            <p><small>Error details: " . htmlspecialchars($server_conn->connect_error) . "</small></p>
        </div>");
    }

    $server_conn->query("CREATE DATABASE IF NOT EXISTS `{$database}` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci");
    $server_conn->close();

    $conn = new mysqli($host, $username, $password, $database);
    if ($conn->connect_error) {
        die("Connection to {$database} failed: " . $conn->connect_error);
    }
}

// Set charset to utf8mb4 for unicode compatibility
$conn->set_charset("utf8mb4");

// Ensure the `students` table exists
$table_sql = "CREATE TABLE IF NOT EXISTS `students` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `name` varchar(100) NOT NULL,
    `email` varchar(100) NOT NULL,
    `course` varchar(100) NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";

$conn->query($table_sql);
?>
