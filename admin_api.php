<?php
session_start();
include 'config.php';

header('Content-Type: application/json; charset=utf-8');

$stmt = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'admin_password'");
if ($stmt->rowCount() == 0) {
    $default_hashed = password_hash('alafia123', PASSWORD_DEFAULT);
    $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('admin_password', ?)")->execute([$default_hashed]);
}

$action = $_POST['action'] ?? '';

if ($action === 'login') {
    $input_password = $_POST['password'] ?? '';
    $stmt = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'admin_password'");
    $hashed_password = $stmt->fetchColumn();

    if (password_verify($input_password, $hashed_password)) {
        $_SESSION['is_admin'] = true;
        echo json_encode(['status' => 'success']);
    } else { 
        echo json_encode(['status' => 'error', 'message' => 'Wrong password']); 
    }
    exit;
}

if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
    die(json_encode(['status' => 'error', 'message' => 'Unauthorized']));
}

if ($action === 'add_category') {
    $name = trim($_POST['name']);
    if(!empty($name)) {
        $pdo->prepare("INSERT INTO categories (name) VALUES (?)")->execute([$name]);
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Required field']);
    }
    exit;
}

if ($action === 'delete_category') {
    $pdo->prepare("DELETE FROM categories WHERE id = ?")->execute([$_POST['id']]);
    echo json_encode(['status' => 'success']);
    exit;
}

if ($action === 'add_product') {
    $name = $_POST['name'];
    $price = $_POST['price'];
    $category_id = $_POST['category_id'] ?: null;
    $image_url = '';

    if (isset($_FILES['image_file']) && $_FILES['image_file']['error'] === UPLOAD_ERR_OK) {
        $upload_dir = 'uploads/';
        if (!is_dir($upload_dir)) mkdir($upload_dir, 0777, true);
        
        $file_ext = strtolower(pathinfo($_FILES['image_file']['name'], PATHINFO_EXTENSION));
        if (in_array($file_ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
            $image_url = $upload_dir . uniqid('prod_', true) . '.' . $file_ext;
            move_uploaded_file($_FILES['image_file']['tmp_name'], $image_url);
        }
    }

    $pdo->prepare("INSERT INTO products (name, price, image_url, category_id) VALUES (?, ?, ?, ?)")
        ->execute([$name, $price, $image_url, $category_id]);
    
    echo json_encode(['status' => 'success']);
    exit;
}

if ($action === 'edit_product') {
    $id = $_POST['id'];
    $name = $_POST['name'];
    $price = $_POST['price'];
    $category_id = $_POST['category_id'] ?: null;

    if (isset($_FILES['image_file']) && $_FILES['image_file']['error'] === UPLOAD_ERR_OK) {
        $upload_dir = 'uploads/';
        $file_ext = strtolower(pathinfo($_FILES['image_file']['name'], PATHINFO_EXTENSION));
        $new_path = $upload_dir . uniqid('prod_', true) . '.' . $file_ext;
        
        if (move_uploaded_file($_FILES['image_file']['tmp_name'], $new_path)) {
            $stmt = $pdo->prepare("SELECT image_url FROM products WHERE id = ?");
            $stmt->execute([$id]);
            $old = $stmt->fetchColumn();
            if ($old && file_exists($old)) unlink($old);

            $pdo->prepare("UPDATE products SET name = ?, price = ?, category_id = ?, image_url = ? WHERE id = ?")
                ->execute([$name, $price, $category_id, $new_path, $id]);
        }
    } else {
        $pdo->prepare("UPDATE products SET name = ?, price = ?, category_id = ? WHERE id = ?")
            ->execute([$name, $price, $category_id, $id]);
    }
    echo json_encode(['status' => 'success']);
    exit;
}

if ($action === 'delete_product') {
    $stmt = $pdo->prepare("SELECT image_url FROM products WHERE id = ?");
    $stmt->execute([$_POST['id']]);
    $img = $stmt->fetchColumn();
    
    if ($img && file_exists($img)) unlink($img);
    $pdo->prepare("DELETE FROM products WHERE id = ?")->execute([$_POST['id']]);
    echo json_encode(['status' => 'success']);
    exit;
}

if ($action === 'change_password') {
    $stmt = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'admin_password'");
    if (password_verify($_POST['old_password'], $stmt->fetchColumn())) {
        $new_hash = password_hash($_POST['new_password'], PASSWORD_DEFAULT);
        $pdo->prepare("UPDATE settings SET setting_value = ? WHERE setting_key = 'admin_password'")->execute([$new_hash]);
        echo json_encode(['status' => 'success']);
    } else { 
        echo json_encode(['status' => 'error', 'message' => 'Wrong current password']); 
    }
    exit;
}

if ($action === 'update_settings') {
    $settings = ['phone', 'whatsapp', 'email', 'facebook', 'twitter'];
    foreach ($settings as $key) {
        $val = $_POST[$key] ?? '';
        $pdo->prepare("UPDATE settings SET setting_value = ? WHERE setting_key = ?")->execute([$val, $key]);
    }
    echo json_encode(['status' => 'success']);
    exit;
}
?>
