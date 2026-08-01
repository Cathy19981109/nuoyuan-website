/**
 * Seed demo content modules for about / contact pages (images + text).
 * Safe to re-run: skips when non-system content modules already exist.
 */
require('dotenv').config()
const moduleService = require('../services/moduleService')

const ABOUT_MODULES = [
  {
    module_name: '公司简介',
    module_template: 'image_text_split',
    main_title: '公司简介',
    body_text:
      '诺元智合（NUOYUAN BIOTECH）是一家专注于基因编辑核心服务与科研实验试剂的高新技术企业。我们致力于为生命科学研究机构、生物医药企业提供高品质的 RNA 合成、CRISPR/Cas9 技术服务、基因载体构建及分子生物学、细胞培养等科研试剂产品。',
    layout_mode: 'right',
    image_list_json: [{ name: 'about-intro', url: '/uploads/images/img-1785568646910-2bonui.jpg' }],
  },
  {
    module_name: '我们的使命',
    module_template: 'image_text_split',
    main_title: '我们的使命',
    body_text:
      '以技术创新驱动生命科学进步，为科研工作者提供可靠、高效的产品与服务。坚持批次稳定、纯度可控与全程技术跟进，帮助高校、研究所与生物医药企业缩短从课题到落地的路径。',
    layout_mode: 'left',
    image_list_json: [{ name: 'about-mission', url: '/uploads/images/img-1785568646929-0ttyln.jpg' }],
  },
  {
    module_name: '核心优势',
    module_template: 'image_text_split',
    main_title: '核心优势',
    body_text:
      '超长链 RNA 合成最高可达 266nt；CRISPR/Cas9 全套技术服务，编辑效率高、脱靶可控；严格质控体系，批次稳定；全程技术跟进，交付周期短，助力科研与产业落地。',
    layout_mode: 'bottom',
    image_list_json: [{ name: 'about-adv', url: '/uploads/images/img-1785568646947-pza92g.jpg' }],
  },
  {
    module_name: '研发与质控',
    module_template: 'multi_image_carousel',
    main_title: '研发与质控',
    body_text: '',
    layout_mode: 'bottom',
    image_list_json: [
      { name: 'about-rd-1', url: '/uploads/images/img-1785570131480-vuijdt.jpg' },
      { name: 'about-rd-2', url: '/uploads/images/img-1785570131496-z3wplp.jpg' },
      { name: 'about-rd-3', url: '/uploads/images/img-1785570131514-1wumnp.jpg' },
    ],
  },
  {
    module_name: '商务合作',
    module_template: 'image_text_split',
    main_title: '商务合作',
    body_text:
      '无论是产品采购、技术服务委托，还是长期战略合作，我们都欢迎与您沟通。请通过电话、邮箱或到访与我们联系，技术顾问将协助完成选型与方案确认。',
    layout_mode: 'right',
    image_list_json: [{ name: 'contact-biz', url: '/uploads/images/img-1785570131532-0pl2sc.jpg' }],
  },
  {
    module_name: '服务支持',
    module_template: 'image_text_split',
    main_title: '服务支持',
    body_text:
      '从实验方案咨询、产品规格对比到售后技术跟进，诺元智合提供一站式支持。工作日我们将尽快回复您的需求，并安排专人跟进项目进度。',
    layout_mode: 'left',
    image_list_json: [{ name: 'contact-support', url: '/uploads/images/img-1785568646910-2bonui.jpg' }],
  },
  {
    module_name: '到访接待',
    module_template: 'image_text_split',
    main_title: '到访与接待',
    body_text:
      '欢迎预约到访交流。实验室与办公环境支持样品核对、方案讨论与技术培训。请提前通过电话或邮箱预约，我们将为您安排接待与路线指引。',
    layout_mode: 'bottom',
    image_list_json: [{ name: 'contact-visit', url: '/uploads/images/img-1785568646929-0ttyln.jpg' }],
  },
  {
    module_name: '办公环境',
    module_template: 'multi_image_carousel',
    main_title: '办公与实验室环境',
    body_text: '',
    layout_mode: 'bottom',
    image_list_json: [
      { name: 'contact-env-1', url: '/uploads/images/img-1785568646947-pza92g.jpg' },
      { name: 'contact-env-2', url: '/uploads/images/img-1785570131480-vuijdt.jpg' },
      { name: 'contact-env-3', url: '/uploads/images/img-1785570131496-z3wplp.jpg' },
    ],
  },
]

const BANNERS = {
  about: {
    module_name: 'Banner模块',
    module_template: 'image_text_split',
    main_title: '关于我们',
    body_text: '诺元智合 · 专注基因编辑与生命科学研究',
    layout_mode: 'top',
    image_list_json: [{ name: 'about-banner', url: '/uploads/images/img-1785568646891-xal7uj.jpg' }],
    extra_json: { system_key: 'about_banner' },
  },
}

async function ensurePage(pageKey, contentRows, { force = false } = {}) {
  const rows = await moduleService.listModules(pageKey, true)
  const hasBanner = rows.some((m) => m?.extra_json?.system_key === `${pageKey}_banner`)
  if (!hasBanner && BANNERS[pageKey]) {
    await moduleService.createModule({ ...BANNERS[pageKey], page_key: pageKey, parent_id: 0, sort: 0 }, null)
    console.log(`[${pageKey}] created banner`)
  }
  const fresh = await moduleService.listModules(pageKey, true)
  const content = fresh.filter((m) => !m?.extra_json?.system_key && Number(m.parent_id || 0) === 0)
  if (content.length && !force) {
    console.log(`[${pageKey}] skip content, already has ${content.length} module(s)`)
    return
  }
  if (force && content.length) {
    for (const m of content) {
      await moduleService.deleteModule(m.id, null)
      console.log(`[${pageKey}] removed old ${m.module_name}`)
    }
  }
  let sort = 10
  for (const row of contentRows) {
    await moduleService.createModule({ ...row, page_key: pageKey, parent_id: 0, sort }, null)
    console.log(`[${pageKey}] created ${row.module_name}`)
    sort += 10
  }
}

async function main() {
  const force = process.argv.includes('--force')
  await ensurePage('about', ABOUT_MODULES, { force })
  console.log('done')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
