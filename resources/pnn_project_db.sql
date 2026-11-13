-- ========================================================
-- PNN Project Database Schema & Sample Records
-- Database: `pnn_project_db`
-- Table: `students`
-- ========================================================

CREATE DATABASE IF NOT EXISTS `pnn_project_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `pnn_project_db`;

-- --------------------------------------------------------

-- Table structure for table `students`
CREATE TABLE IF NOT EXISTS `students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `course` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

-- Dumping initial records for table `students`
INSERT INTO `students` (`id`, `name`, `email`, `course`) VALUES
(1, 'Cuizon Jhong', 'cuizon@gmail.com', 'BSIT'),
(2, 'Maria Santos', 'maria.santos@pnntech.edu.ph', 'BS Computer Science'),
(3, 'Juan Dela Cruz', 'juan.delacruz@pnntech.edu.ph', 'BS Information Systems')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `email`=VALUES(`email`), `course`=VALUES(`course`);
