<?php
// Set headers first
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Include the database connection
require 'db.php';

// Check if the connection object was created successfully
if (!isset($pdo)) {
    http_response_code(500);
    echo json_encode(['message' => 'Database connection not established.']);
    exit();
}

 $method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        // Handle fetching all products or searching
        $search = isset($_GET['search']) ? '%' . $_GET['search'] . '%' : '%';
        
        $sql = "SELECT * FROM products WHERE name LIKE :search OR description LIKE :search ORDER BY created_at DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':search', $search, PDO::PARAM_STR);
        $stmt->execute();
        
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        http_response_code(200); // OK
        echo json_encode($products);

    } elseif ($method === 'POST') {
        // Handle adding a new product
        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->name) && isset($data->quantity)) {
            $sql = "INSERT INTO products (name, quantity, description, price) VALUES (:name, :quantity, :description, :price)";
            $stmt = $pdo->prepare($sql);

            // Sanitize and bind parameters
            $stmt->bindParam(':name', htmlspecialchars(strip_tags($data->name)));
            $stmt->bindParam(':quantity', htmlspecialchars(strip_tags($data->quantity)));
            $description = !empty($data->description) ? htmlspecialchars(strip_tags($data->description)) : null;
            $stmt->bindParam(':description', $description);
            $price = !empty($data->price) ? htmlspecialchars(strip_tags($data->price)) : null;
            $stmt->bindParam(':price', $price);

            if ($stmt->execute()) {
                http_response_code(201); // Created
                echo json_encode(['message' => 'Product created successfully.']);
            } else {
                http_response_code(500); // Internal Server Error
                echo json_encode(['message' => 'Product could not be created.']);
            }
        } else {
            http_response_code(400); // Bad Request
            echo json_encode(['message' => 'Data is incomplete. Name and quantity are required.']);
        }
    } else {
        // Handle unsupported methods
        http_response_code(405); // Method Not Allowed
        echo json_encode(['message' => 'Method not allowed.']);
    }
} catch (PDOException $e) {
    // This will catch any database errors
    http_response_code(500);
    echo json_encode(['message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    // This will catch any other errors
    http_response_code(500);
    echo json_encode(['message' => 'An error occurred: ' . $e->getMessage()]);
}
?>