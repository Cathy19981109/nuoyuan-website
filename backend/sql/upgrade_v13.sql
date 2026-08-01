-- Remove legacy nav dropdown / submenu support
-- Keep column for compatibility; stop using parent_id != 0 and dropdown_banner in app code.

DELETE FROM `nuoyuan_nav` WHERE `parent_id` <> 0;

UPDATE `nuoyuan_nav` SET `dropdown_banner` = NULL WHERE `dropdown_banner` IS NOT NULL;
