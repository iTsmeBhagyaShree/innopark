-- =====================================================
-- COMPREHENSIVE FIX FOR ACTIVITIES AND CUSTOM FIELDS
-- =====================================================

-- 1. ACTIVITIES TABLE FIX
-- Add missing columns required by ActivityTimeline and activityController
-- Note: Removing IF NOT EXISTS for compatibility with older MySQL versions
ALTER TABLE `activities` ADD COLUMN `title` VARCHAR(255) DEFAULT NULL AFTER `type`;
ALTER TABLE `activities` ADD COLUMN `assigned_to` INT(10) UNSIGNED DEFAULT NULL AFTER `created_by`;
ALTER TABLE `activities` ADD COLUMN `is_pinned` TINYINT(1) DEFAULT 0 AFTER `assigned_to`;
ALTER TABLE `activities` ADD COLUMN `follow_up_at` DATETIME DEFAULT NULL AFTER `is_pinned`;
ALTER TABLE `activities` ADD COLUMN `deadline` DATE DEFAULT NULL AFTER `follow_up_at`;
ALTER TABLE `activities` ADD COLUMN `meeting_date` DATE DEFAULT NULL AFTER `deadline`;
ALTER TABLE `activities` ADD COLUMN `meeting_time` TIME DEFAULT NULL AFTER `meeting_date`;
ALTER TABLE `activities` ADD COLUMN `participants` TEXT DEFAULT NULL AFTER `meeting_time`;
ALTER TABLE `activities` ADD COLUMN `meeting_link` VARCHAR(500) DEFAULT NULL AFTER `participants`;
ALTER TABLE `activities` ADD COLUMN `is_deleted` TINYINT(1) DEFAULT 0 AFTER `meeting_link`;

-- Ensure type ENUM is correct
ALTER TABLE `activities` 
MODIFY COLUMN `type` ENUM('call','meeting','note','email','task','comment') NOT NULL;

-- 2. CUSTOM FIELDS TABLES
-- Main custom fields definition table
CREATE TABLE IF NOT EXISTS `custom_fields` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INT(10) UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `label` VARCHAR(100) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `module` VARCHAR(50) NOT NULL,
  `required` TINYINT(1) DEFAULT 0,
  `placeholder` VARCHAR(255) DEFAULT NULL,
  `help_text` VARCHAR(255) DEFAULT NULL,
  `is_deleted` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cf_company_module` (`company_id`, `module`),
  KEY `idx_cf_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Custom field options (for select/multiselect)
CREATE TABLE IF NOT EXISTS `custom_field_options` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `custom_field_id` INT(10) UNSIGNED NOT NULL,
  `option_value` VARCHAR(255) NOT NULL,
  `display_order` INT(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`custom_field_id`) REFERENCES `custom_fields` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Custom field values (where data is stored)
CREATE TABLE IF NOT EXISTS `custom_field_values` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INT(10) UNSIGNED NOT NULL,
  `custom_field_id` INT(10) UNSIGNED NOT NULL,
  `record_id` INT(10) UNSIGNED NOT NULL,
  `module` VARCHAR(50) NOT NULL,
  `field_value` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cfv_record` (`record_id`, `module`),
  KEY `idx_cfv_field` (`custom_field_id`),
  FOREIGN KEY (`custom_field_id`) REFERENCES `custom_fields` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Custom field visibility (per role or specific users)
CREATE TABLE IF NOT EXISTS `custom_field_visibility` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `custom_field_id` INT(10) UNSIGNED NOT NULL,
  `visibility` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`custom_field_id`) REFERENCES `custom_fields` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Custom field enabled in (specific sub-modules or sections)
CREATE TABLE IF NOT EXISTS `custom_field_enabled_in` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `custom_field_id` INT(10) UNSIGNED NOT NULL,
  `enabled_in` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`custom_field_id`) REFERENCES `custom_fields` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. RESPONSIBLE PERSON FIX
-- Ensure owner_id/assigned_to columns exist in main modules
ALTER TABLE `deals` ADD COLUMN `owner_id` INT(10) UNSIGNED DEFAULT NULL AFTER `contact_id`;
ALTER TABLE `projects` ADD COLUMN `owner_id` INT(10) UNSIGNED DEFAULT NULL AFTER `company_id`;
ALTER TABLE `tasks` ADD COLUMN `owner_id` INT(10) UNSIGNED DEFAULT NULL AFTER `project_id`;
