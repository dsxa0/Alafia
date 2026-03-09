<?php
$host = 'localhost';
$db   = 'aafiya_store';
$user = 'root'; 
$pass = ''; 

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    header('Content-Type: application/json; charset=utf-8');
    die(json_encode(['status' => 'error', 'message' => 'Connection failed']));
}
