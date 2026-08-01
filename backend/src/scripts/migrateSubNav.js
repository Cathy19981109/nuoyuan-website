/**
 * One-shot: ensure parent_id column exists and wrap flat news/applications
 * content modules into a sub_nav_group container.
 *
 * Usage: node src/scripts/migrateSubNav.js
 */
const pool = require('../config/db');
const moduleService = require('../services/moduleService');

const SECTION_PAGES = ['news', 'applications'];

async function migratePage(pageKey) {
  let modules = await moduleService.listModules(pageKey, true);
  const hasSubNav = modules.some(
    (m) => m.module_template === 'sub_nav_group' && Number(m.parent_id || 0) === 0
  );
  const orphans = modules.filter((m) => {
    if (Number(m.parent_id || 0) > 0) return false;
    if (m?.extra_json?.system_key) return false;
    if (m.module_template === 'sub_nav_group') return false;
    return true;
  });

  if (hasSubNav) {
    console.log(`[${pageKey}] already has sub_nav_group, skip (${modules.length} modules)`);
    return;
  }
  if (!orphans.length) {
    console.log(`[${pageKey}] no content orphans to migrate`);
    return;
  }

  const parent = await moduleService.createModule(
    {
      page_key: pageKey,
      module_name: '子导航模块',
      module_template: 'sub_nav_group',
      parent_id: 0,
      status: 1,
    },
    null
  );
  console.log(`[${pageKey}] created sub_nav_group #${parent.id}`);
  for (const row of orphans) {
    await moduleService.updateModule(row.id, { parent_id: parent.id }, null);
    console.log(`[${pageKey}] moved #${row.id} (${row.module_name}) under #${parent.id}`);
  }
}

async function main() {
  for (const pageKey of SECTION_PAGES) {
    await migratePage(pageKey);
  }
  await pool.end();
  console.log('done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
