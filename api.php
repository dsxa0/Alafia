<?php
include 'config.php';

header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");

try {
    $stmtCat = $pdo->query("SELECT * FROM categories ORDER BY id ASC");
    $categories = $stmtCat->fetchAll(PDO::FETCH_ASSOC);

    $stmtProducts = $pdo->query("
        SELECT products.*, categories.name as category_name 
        FROM products 
        LEFT JOIN categories ON products.category_id = categories.id 
        ORDER BY products.id DESC
    ");
    $products = $stmtProducts->fetchAll(PDO::FETCH_ASSOC);

    $stmtSettings = $pdo->query("SELECT setting_key, setting_value FROM settings");
    $settings = $stmtSettings->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'data' => [
            'categories' => $categories,
            'products' => $products,
            'settings' => $settings
        ]
    ]);

} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Service unavailable']);
}
?>
