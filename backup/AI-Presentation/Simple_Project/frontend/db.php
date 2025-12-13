<?php
// Database connection details for Docker
 $host = '127.0.0.1'; // Connects to your host machine, where Docker maps the port
 $dbname = 'simple_inventory';
 $username = 'root';
 $password = 'secure_password'; // The password from your docker command

// Create a new PDO instance
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    // Set the PDO error mode to exception
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    // This will now output a clean JSON error
    header("Content-Type: application/json");
    http_response_code(500); // Internal Server Error
    die(json_encode(['message' => 'Database connection failed: ' . $e->getMessage()]));
}
?>