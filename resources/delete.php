<?php
/**
 * PNN Student Records - DELETE
 * Permanently remove student record from `pnn_project_db`
 */
require_once __DIR__ . '/connection.php';

// Only permit POST requests for safe deletion
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    $conn->close();
    header("Location: read.php");
    exit;
}

$id = filter_input(INPUT_POST, "id", FILTER_VALIDATE_INT);

if (!$id) {
    $conn->close();
    header("Location: read.php");
    exit;
}

// Prepared statement for secure deletion
$stmt = $conn->prepare("DELETE FROM students WHERE id = ?");
if ($stmt) {
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $stmt->close();
}

$conn->close();
header("Location: read.php?msg=deleted");
exit;
?>
