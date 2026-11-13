<?php
/**
 * PNN Student Records - READ (List & Search)
 * Complete PHP CRUD System connected to `pnn_project_db`
 */
require_once __DIR__ . '/connection.php';

// Handle optional search query
$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$records = [];

if ($search !== '') {
    $search_param = '%' . $search . '%';
    $stmt = $conn->prepare("SELECT * FROM students WHERE name LIKE ? OR email LIKE ? OR course LIKE ? ORDER BY id DESC");
    $stmt->bind_param("sss", $search_param, $search_param, $search_param);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $records[] = $row;
    }
    $stmt->close();
} else {
    $result = $conn->query("SELECT * FROM students ORDER BY id DESC");
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $records[] = $row;
        }
    }
}

// Success feedback messages
$msg = isset($_GET['msg']) ? $_GET['msg'] : '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Records Management | PNN Computer Shop</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../css/styles.css">
    <style>
        .crud-container {
            max-width: 1100px;
            margin: 2.5rem auto;
            padding: 0 1.5rem;
        }
        .crud-card {
            background: #ffffff;
            border-radius: var(--radius-lg, 16px);
            border: 1px solid var(--border-light, #e2e8f0);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
            overflow: hidden;
        }
        .crud-header {
            padding: 1.75rem 2rem;
            background: linear-gradient(135deg, #0b0c10 0%, #161b22 100%);
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 1rem;
        }
        .crud-header h2 {
            font-family: var(--font-heading, 'Poppins', sans-serif);
            font-size: 1.5rem;
            font-weight: 800;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        .crud-toolbar {
            padding: 1.5rem 2rem;
            background: #f8fafc;
            border-bottom: 1px solid var(--border-light, #e2e8f0);
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 1rem;
        }
        .crud-search-form {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            flex: 1;
            max-width: 450px;
        }
        .crud-search-input {
            flex: 1;
            padding: 0.65rem 1rem;
            border: 1px solid var(--border-light, #e2e8f0);
            border-radius: var(--radius-md, 10px);
            font-size: 0.9rem;
            background: #ffffff;
        }
        .crud-search-input:focus {
            outline: none;
            border-color: var(--primary, #0070f3);
            box-shadow: 0 0 0 3px rgba(0, 112, 243, 0.15);
        }
        .alert-banner {
            padding: 1rem 1.5rem;
            border-radius: var(--radius-md, 10px);
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-weight: 600;
            font-size: 0.95rem;
        }
        .alert-success {
            background: #dcfce7;
            color: #15803d;
            border: 1px solid #bbf7d0;
        }
        .alert-info {
            background: #e0f2fe;
            color: #0369a1;
            border: 1px solid #bae6fd;
        }
        .crud-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 0.9rem;
        }
        .crud-table th {
            background: #f1f5f9;
            padding: 1rem 1.5rem;
            font-weight: 700;
            color: #334155;
            border-bottom: 1px solid var(--border-light, #e2e8f0);
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.05em;
        }
        .crud-table td {
            padding: 1rem 1.5rem;
            border-bottom: 1px solid var(--border-light, #e2e8f0);
            color: #0f172a;
            vertical-align: middle;
        }
        .crud-table tr:hover {
            background-color: #f8fafc;
        }
        .btn-action-edit {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            background: #e0f2fe;
            color: #0284c7;
            padding: 0.45rem 0.85rem;
            border-radius: var(--radius-sm, 6px);
            font-size: 0.8rem;
            font-weight: 700;
            text-decoration: none;
            transition: all 0.2s ease;
        }
        .btn-action-edit:hover {
            background: #0284c7;
            color: #ffffff;
        }
        .btn-action-delete {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            background: #fee2e2;
            color: #dc2626;
            padding: 0.45rem 0.85rem;
            border-radius: var(--radius-sm, 6px);
            font-size: 0.8rem;
            font-weight: 700;
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .btn-action-delete:hover {
            background: #dc2626;
            color: #ffffff;
        }
        .course-badge {
            background: #ede9fe;
            color: #6d28d9;
            padding: 0.25rem 0.65rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 700;
        }
    </style>
</head>
<body style="background-color: #f8fafc; font-family: 'Inter', sans-serif;">

    <!-- Top Announcement Bar -->
    <aside class="top-announcement-bar" role="banner">
        <div class="container top-announcement-content">
            <span class="announcement-badge">PNN Database</span>
            <span>⚡ Connected to MySQL Database: <strong>pnn_project_db</strong></span>
            <a href="../index.html" style="color: #ffffff; text-decoration: underline; font-size: 0.8rem; margin-left: 0.5rem;">← Back to Storefront</a>
        </div>
    </aside>

    <div class="crud-container">

        <!-- Alert messages -->
        <?php if ($msg === 'created'): ?>
            <div class="alert-banner alert-success">
                <span>✓ New student record created successfully!</span>
            </div>
        <?php elseif ($msg === 'updated'): ?>
            <div class="alert-banner alert-success">
                <span>✓ Student record updated successfully!</span>
            </div>
        <?php elseif ($msg === 'deleted'): ?>
            <div class="alert-banner alert-info">
                <span>✓ Student record permanently removed.</span>
            </div>
        <?php endif; ?>

        <!-- Main Card Container -->
        <div class="crud-card">
            <div class="crud-header">
                <div>
                    <h2>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        Student Records Management
                    </h2>
                    <p style="color: #94a3b8; font-size: 0.85rem; margin: 0.35rem 0 0 0;">
                        Manage student profiles, enrollments, and academic course records.
                    </p>
                </div>
                <div>
                    <span style="background: rgba(0, 112, 243, 0.2); border: 1px solid rgba(0, 229, 255, 0.4); color: #00e5ff; padding: 0.35rem 0.85rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 700;">
                        Total Students: <?= count($records) ?>
                    </span>
                </div>
            </div>

            <!-- Toolbar: Search & Create -->
            <div class="crud-toolbar">
                <form method="GET" action="read.php" class="crud-search-form">
                    <input type="text" name="search" class="crud-search-input" placeholder="Search by name, email, or course..." value="<?= htmlspecialchars($search) ?>">
                    <button type="submit" class="btn-primary" style="padding: 0.65rem 1.25rem; font-size: 0.85rem;">Search</button>
                    <?php if ($search !== ''): ?>
                        <a href="read.php" class="btn-secondary" style="padding: 0.65rem 1rem; font-size: 0.85rem; color: #334155; border: 1px solid #cbd5e1;">Clear</a>
                    <?php endif; ?>
                </form>

                <a href="create.php" class="btn-primary" style="display: inline-flex; align-items: center; gap: 0.5rem; text-decoration: none;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    <span>Add New Student</span>
                </a>
            </div>

            <!-- Table View -->
            <div style="overflow-x: auto;">
                <table class="crud-table">
                    <thead>
                        <tr>
                            <th style="width: 80px;">ID</th>
                            <th>Student Name</th>
                            <th>Email Address</th>
                            <th>Course / Program</th>
                            <th style="text-align: right; width: 180px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (count($records) > 0): ?>
                            <?php foreach ($records as $student): ?>
                                <tr>
                                    <td><strong>#<?= (int) $student['id'] ?></strong></td>
                                    <td>
                                        <div style="font-weight: 700; color: #0f172a;"><?= htmlspecialchars($student['name']) ?></div>
                                    </td>
                                    <td>
                                        <a href="mailto:<?= htmlspecialchars($student['email']) ?>" style="color: var(--primary, #0070f3); text-decoration: none;">
                                            <?= htmlspecialchars($student['email']) ?>
                                        </a>
                                    </td>
                                    <td>
                                        <span class="course-badge"><?= htmlspecialchars($student['course']) ?></span>
                                    </td>
                                    <td style="text-align: right;">
                                        <div style="display: inline-flex; gap: 0.5rem; justify-content: flex-end;">
                                            <a href="update.php?id=<?= (int) $student['id'] ?>" class="btn-action-edit">
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                Edit
                                            </a>
                                            <form action="delete.php" method="POST" style="margin: 0; display: inline;" onsubmit="return confirm('Permanently delete student <?= htmlspecialchars($student['name'], ENT_QUOTES) ?> (ID #<?= (int)$student['id'] ?>)?');">
                                                <input type="hidden" name="id" value="<?= (int) $student['id'] ?>">
                                                <button type="submit" class="btn-action-delete">
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                    Delete
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <tr>
                                <td colspan="5" style="text-align: center; padding: 3rem 1.5rem; color: #64748b;">
                                    <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📂</div>
                                    <p style="font-size: 1.1rem; font-weight: 700; color: #1e293b; margin: 0 0 0.5rem 0;">No student records found</p>
                                    <p style="font-size: 0.9rem; margin: 0 0 1.5rem 0;">
                                        <?= $search !== '' ? 'No matches found for your search query "' . htmlspecialchars($search) . '".' : 'Start by adding your first student record to the MySQL database.' ?>
                                    </p>
                                    <?php if ($search !== ''): ?>
                                        <a href="read.php" class="btn-secondary" style="padding: 0.6rem 1.25rem;">View All Records</a>
                                    <?php else: ?>
                                        <a href="create.php" class="btn-primary" style="padding: 0.6rem 1.25rem;">+ Add New Student</a>
                                    <?php endif; ?>
                                </td>
                            </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>

            <!-- Footer summary -->
            <div style="padding: 1.25rem 2rem; background: #f8fafc; border-top: 1px solid var(--border-light, #e2e8f0); display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; color: #64748b;">
                <span>Database: <strong>pnn_project_db</strong> | Table: <strong>students</strong></span>
                <span>PNN Academic Systems © 2026</span>
            </div>
        </div>

    </div>

</body>
</html>
<?php
$conn->close();
?>
