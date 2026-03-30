-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: smart_recruit
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `applications`
--

DROP TABLE IF EXISTS `applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `applications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `candidate_id` int(11) DEFAULT NULL,
  `job_offer_id` int(11) DEFAULT NULL,
  `cv_file` varchar(500) NOT NULL,
  `status` enum('pending','accepted','rejected') DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `interview_link` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `cv_score` float DEFAULT NULL,
  `parsed_skills` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `candidate_id` (`candidate_id`),
  KEY `job_offer_id` (`job_offer_id`),
  KEY `ix_applications_id` (`id`),
  CONSTRAINT `applications_ibfk_1` FOREIGN KEY (`candidate_id`) REFERENCES `users` (`id`),
  CONSTRAINT `applications_ibfk_2` FOREIGN KEY (`job_offer_id`) REFERENCES `job_offers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `applications`
--

LOCK TABLES `applications` WRITE;
/*!40000 ALTER TABLE `applications` DISABLE KEYS */;
INSERT INTO `applications` VALUES (1,1,1,'uploads\\1_1_dee14e4276f54ffca349e9bdd80ebe85.pdf','rejected','Éliminé par critère prioritaire caché : Le candidat n\'a pas mentionné s\'il pouvait se déplacer à Marrakech pour le poste, car la question n\'a pas été abordée dans la transcription de l\'entretien.','27e8f5c0-6016-4bd0-9dab-945ee901040c','2026-03-28 21:11:57',75,'[\"Python\", \"JavaScript\", \"Java\", \"Kotlin\", \"PHP\", \"LLM APIs\", \"AI agents\", \"prompt engineering\", \"AI workflow design\", \"ReactJS\", \"NodeJS\", \"Laravel\", \"Spring Boot\", \"REST APIs\", \"Flutter\", \"Kotlin (Android)\", \"JSON\", \"authentication systems\", \"webhooks\", \"MySQL\", \"Firebase\", \"Git\", \"GitHub\", \"GitLab\", \"Docker basics\", \"TCP/IP\", \"Linux systems\", \"server environments\", \"Agile (Scrum, Kanban)\", \"collaborative development\"]'),(2,3,1,'uploads\\3_1_a46d32bb8f7e4a6f8028decc3ba503f6.pdf','rejected','Éliminé par critère prioritaire caché : Le candidat n\'a pas mentionné sa capacité à se déplacer à Marrakech pour le poste, donc ce critère prioritaire n\'est pas respecté.','230aec7b-7ec5-4b28-8d8e-b5f1d2095ccb','2026-03-28 21:31:15',75,'[\"Python\", \"JavaScript\", \"Java\", \"Kotlin\", \"PHP\", \"LLM APIs\", \"AI agents\", \"prompt engineering\", \"AI workflow design\", \"ReactJS\", \"NodeJS\", \"Laravel\", \"Spring Boot\", \"REST APIs\", \"Flutter\", \"Kotlin (Android)\", \"JSON\", \"authentication systems\", \"webhooks\", \"MySQL\", \"Firebase\", \"Git\", \"GitHub\", \"GitLab\", \"Docker basics\", \"TCP/IP\", \"Linux systems\", \"server environments\", \"Agile (Scrum, Kanban)\", \"collaborative development\"]');
/*!40000 ALTER TABLE `applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `candidates`
--

DROP TABLE IF EXISTS `candidates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `candidates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `skills` text DEFAULT NULL,
  `experience` float DEFAULT NULL,
  `education` text DEFAULT NULL,
  `cv_file_path` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_candidates_email` (`email`),
  KEY `ix_candidates_name` (`name`),
  KEY `ix_candidates_id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `candidates`
--

LOCK TABLES `candidates` WRITE;
/*!40000 ALTER TABLE `candidates` DISABLE KEYS */;
INSERT INTO `candidates` VALUES (1,'OUEDRAOGO Sayouba',NULL,'[\"Python\", \"JavaScript\", \"Java\", \"Kotlin\", \"PHP\", \"LLM APIs\", \"AI agents\", \"prompt engineering\", \"AI workflow design\", \"ReactJS\", \"NodeJS\", \"Laravel\", \"Spring Boot\", \"REST APIs\", \"Flutter\", \"Kotlin (Android)\", \"JSON\", \"authentication systems\", \"webhooks\", \"MySQL\", \"Firebase\", \"Git\", \"GitHub\", \"GitLab\", \"Docker basics\", \"TCP/IP\", \"Linux systems\", \"server environments\", \"Agile (Scrum, Kanban)\", \"collaborative development\"]',0,'Engineering Degree in Networks and Information Systems| Faculty of Sciences and Techniques, Marrakech | 2024 – Present','uploads/CV_OUEDRAOGO_SAYOUBA_DEV.pdf','2026-03-28 12:16:46'),(2,'OUEDRAOGO Sayouba',NULL,'[\"Python\", \"JavaScript\", \"Java\", \"Kotlin\", \"PHP\", \"LLM APIs\", \"AI agents\", \"prompt engineering\", \"AI workflow design\", \"ReactJS\", \"NodeJS\", \"Laravel\", \"Spring Boot\", \"REST APIs\", \"Flutter\", \"Kotlin (Android)\", \"JSON\", \"authentication systems\", \"webhooks\", \"MySQL\", \"Firebase\", \"Git\", \"GitHub\", \"GitLab\", \"Docker basics\", \"TCP/IP\", \"Linux systems\", \"server environments\", \"Agile (Scrum, Kanban)\", \"collaborative development\"]',0,'Engineering Degree in Networks and Information Systems| Faculty of Sciences and Techniques, Marrakech | 2024 – Present','uploads/CV_OUEDRAOGO_SAYOUBA_DEV.pdf','2026-03-28 12:20:21'),(3,'OUEDRAOGO Sayouba',NULL,'[\"Python\", \"JavaScript\", \"Java\", \"Kotlin\", \"PHP\", \"LLM APIs\", \"AI agents\", \"prompt engineering\", \"AI workflow design\", \"ReactJS\", \"NodeJS\", \"Laravel\", \"Spring Boot\", \"REST APIs\", \"Flutter\", \"Kotlin (Android)\", \"JSON\", \"authentication systems\", \"webhooks\", \"MySQL\", \"Firebase\", \"Git\", \"GitHub\", \"GitLab\", \"Docker basics\", \"TCP/IP\", \"Linux systems\", \"server environments\", \"Agile (Scrum, Kanban)\", \"collaborative development\"]',0,'Engineering Degree in Networks and Information Systems| Faculty of Sciences and Techniques, Marrakech | 2024 – Present','uploads/CV_OUEDRAOGO_SAYOUBA_DEV.pdf','2026-03-28 12:26:04'),(4,'OUEDRAOGO Sayouba',NULL,'[\"Python\", \"JavaScript\", \"Java\", \"Kotlin\", \"PHP\", \"LLM APIs\", \"AI agents\", \"prompt engineering\", \"AI workflow design\", \"ReactJS\", \"NodeJS\", \"Laravel\", \"Spring Boot\", \"REST APIs\", \"Flutter\", \"Kotlin (Android)\", \"JSON\", \"authentication systems\", \"webhooks\", \"MySQL\", \"Firebase\", \"Git\", \"GitHub\", \"GitLab\", \"Docker basics\", \"TCP/IP\", \"Linux systems\", \"server environments\", \"Agile (Scrum, Kanban)\", \"collaborative development\"]',0,'Engineering Degree in Networks and Information Systems| Faculty of Sciences and Techniques, Marrakech | 2024 – Present','uploads/CV_OUEDRAOGO_SAYOUBA_DEV.pdf','2026-03-28 14:07:00'),(5,'OUEDRAOGO Sayouba',NULL,'[\"Python\", \"JavaScript\", \"Java\", \"Kotlin\", \"PHP\", \"LLM APIs\", \"AI agents\", \"prompt engineering\", \"AI workflow design\", \"ReactJS\", \"NodeJS\", \"Laravel\", \"Spring Boot\", \"REST APIs\", \"Flutter\", \"Kotlin (Android)\", \"JSON\", \"authentication systems\", \"webhooks\", \"MySQL\", \"Firebase\", \"Git\", \"GitHub\", \"GitLab\", \"Docker basics\", \"TCP/IP\", \"Linux systems\", \"server environments\", \"Agile (Scrum, Kanban)\", \"collaborative development\"]',0,'Engineering Degree in Networks and Information Systems| Faculty of Sciences and Techniques, Marrakech | 2024 – Present','uploads/CV_OUEDRAOGO_SAYOUBA_DEV.pdf','2026-03-28 14:08:52'),(6,'OUEDRAOGO Sayouba',NULL,'[\"Python\", \"JavaScript\", \"Java\", \"Kotlin\", \"PHP\", \"LLM APIs\", \"AI agents\", \"prompt engineering\", \"AI workflow design\", \"ReactJS\", \"NodeJS\", \"Laravel\", \"Spring Boot\", \"REST APIs\", \"Flutter\", \"Kotlin (Android)\", \"JSON\", \"authentication systems\", \"webhooks\", \"MySQL\", \"Firebase\", \"Git\", \"GitHub\", \"GitLab\", \"Docker basics\", \"TCP/IP\", \"Linux systems\", \"server environments\", \"Agile (Scrum, Kanban)\", \"collaborative development\"]',0,'Engineering Degree in Networks and Information Systems| Faculty of Sciences and Techniques, Marrakech | 2024 – Present','uploads/CV_OUEDRAOGO_SAYOUBA_DEV.pdf','2026-03-28 14:28:18'),(7,'OUEDRAOGO Sayouba',NULL,'[\"Python\", \"JavaScript\", \"Java\", \"Kotlin\", \"PHP\", \"LLM APIs\", \"AI agents\", \"prompt engineering\", \"AI workflow design\", \"ReactJS\", \"NodeJS\", \"Laravel\", \"Spring Boot\", \"REST APIs\", \"Flutter\", \"Kotlin (Android)\", \"JSON\", \"authentication systems\", \"webhooks\", \"MySQL\", \"Firebase\", \"Git\", \"GitHub\", \"GitLab\", \"Docker basics\", \"TCP/IP\", \"Linux systems\", \"server environments\", \"Agile (Scrum, Kanban)\", \"collaborative development\"]',0,'Engineering Degree in Networks and Information Systems| Faculty of Sciences and Techniques, Marrakech | 2024 – Present','uploads/CV_OUEDRAOGO_SAYOUBA_DEV.pdf','2026-03-28 14:46:37');
/*!40000 ALTER TABLE `candidates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `interviews`
--

DROP TABLE IF EXISTS `interviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `interviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `application_id` int(11) DEFAULT NULL,
  `interview_score` float DEFAULT NULL,
  `ai_comments` text DEFAULT NULL,
  `interview_date` datetime DEFAULT NULL,
  `passed` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `application_id` (`application_id`),
  KEY `ix_interviews_id` (`id`),
  CONSTRAINT `interviews_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `interviews`
--

LOCK TABLES `interviews` WRITE;
/*!40000 ALTER TABLE `interviews` DISABLE KEYS */;
INSERT INTO `interviews` VALUES (1,1,0,'Le candidat semble avoir de bonnes compétences globales.',NULL,1),(2,2,0,'Le candidat semble avoir de bonnes compétences globales.',NULL,1);
/*!40000 ALTER TABLE `interviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_offers`
--

DROP TABLE IF EXISTS `job_offers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `job_offers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `domain` varchar(255) DEFAULT NULL,
  `priority_criteria` varchar(500) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `ix_job_offers_id` (`id`),
  CONSTRAINT `job_offers_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_offers`
--

LOCK TABLES `job_offers` WRITE;
/*!40000 ALTER TABLE `job_offers` DISABLE KEYS */;
INSERT INTO `job_offers` VALUES (1,'Développeur python senior ','Nous recherchons des candidats avec les critères suivants:\n- 10 ans d\'expériences\n- Maitrise de Django, Flask, Python\n- Fluent en anglais et français\n- Maitrise de Power BI','IT','Doit absolument pouvoir se déplacer à Marrakech pour le poste.',2,'2026-03-28 20:56:30');
/*!40000 ALTER TABLE `job_offers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `jobs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `skills_required` text DEFAULT NULL,
  `experience_required` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_jobs_title` (`title`),
  KEY `ix_jobs_id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
INSERT INTO `jobs` VALUES (1,'Senior python developper','We are looking for python and django developper with 3 years of expereince and fluent in english and french','[]',NULL,'2026-03-28 11:39:34'),(2,'Senior python developper','We are looking for python and django developper with 10 years of expereince and fluent in english and french','[]',NULL,'2026-03-28 11:42:33'),(3,'Senior python developper','We are looking for python and django developper with 3 years of expereince and fluent in english and french','[\"Python\", \"Django\"]',NULL,'2026-03-28 12:00:44'),(4,'Senior python developper','We are looking for python and django developper with 3 years of expereince and fluent in english and french','[\"Python\", \"Django\"]',NULL,'2026-03-28 12:03:10'),(5,'Senior python developper','We are looking for python and django developper with 3 years of expereince and fluent in english and french','[\"Python\", \"Django\"]',NULL,'2026-03-28 12:17:20'),(6,'Senior python developper','We are looking for python and django developper with 3 years of expereince and fluent in english and french','[\"Python\", \"Django\"]',NULL,'2026-03-28 12:19:06'),(7,'Senior python developper','We are looking for python and django developper with 3 years of expereince and fluent in english and french','[\"Python\", \"Django\", \"3 years\", \"English\", \"French\"]',NULL,'2026-03-28 12:19:58'),(8,'Senior python developper','We are looking for python and django developper with 3 years of expereince and fluent in english and french','[\"Python\", \"Django\", \"3 years\", \"English\", \"French\"]',NULL,'2026-03-28 12:25:42'),(9,'Senior python developper','We are looking for python and django developper with 3 years of expereince and fluent in english and french','[\"Python\", \"Django\", \"3 years\", \"English\", \"French\"]',NULL,'2026-03-28 14:06:40'),(10,'Senior python developper','We are looking for python and django developper with 3 years of expereince and fluent in english and french','[\"Python\", \"Django\", \"3 years\", \"English\", \"French\"]',NULL,'2026-03-28 14:08:37'),(11,'develloper full stack','un developpeur avec une exellente maitrise d\'outils comme laravel, react js, devops, et du BI avec minimum 2 ans d\'experience en etreprise','[\"laravel\", \"react js\", \"devops\", \"BI\", \"2 years\", \"French\", \"problem-solving\"]',NULL,'2026-03-28 14:26:47'),(12,'develloper full stack','un developpeur avec une exellente maitrise d\'outils comme laravel, react js, devops, et du BI avec minimum 2 ans d\'experience','[\"laravel\", \"react js\", \"devops\", \"BI\", \"2 years\", \"French\", \"problem-solving\"]',NULL,'2026-03-28 14:27:20'),(13,'develloper full stack','un developpeur avec une exellente maitrise d\'outils comme laravel, react js, devops, et du BI avec minimum 2 ans d\'experience','[\"laravel\", \"react js\", \"devops\", \"BI\", \"2 years\", \"French\", \"problem-solving\"]',NULL,'2026-03-28 14:27:49'),(14,'develloper full stack','un developpeur avec une exellente maitrise d\'outils laravel, react js, devops, et du Business Iteligent avec minimum 2 ans d\'experience','[\"Laravel\", \"React JS\", \"DevOps\", \"Business Intelligence\", \"2 years\", \"French\"]',NULL,'2026-03-28 14:46:13'),(15,'receptioniste','avec 5 ans d\'experience capable de se deplacer sur marrakech','[\"5 ans d\'experience\", \"marrakech\"]',NULL,'2026-03-28 15:24:28');
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('candidate','rh') NOT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_users_email` (`email`),
  KEY `ix_users_id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Bachir','bachir@gmail.com','$2b$12$02UyMzKk.ViqS1epLE6n3ey4xzDiXkLwbMm4q1lcmiyYUCEw4Lk8i','candidate','2026-03-28 20:40:26'),(2,'sayouba','sayouba@gmail.com','$2b$12$02UyMzKk.ViqS1epLE6n3ey4xzDiXkLwbMm4q1lcmiyYUCEw4Lk8i','rh','2026-03-28 21:50:12'),(3,'Fatin ','fatin@gmail.com','$2b$12$Z6GojnCobro5JdZ5QKpxDOTACoTZApAlwEWpJhZ2fmaKUbOXTBZp.','candidate','2026-03-28 21:30:34');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-29 11:08:55
