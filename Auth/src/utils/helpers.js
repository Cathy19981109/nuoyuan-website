export function flattenTree(items, depth = 0) {
  const result = []
  items.forEach((item) => {
    result.push({ ...item, depth })
    if (item.children?.length) {
      result.push(...flattenTree(item.children, depth + 1))
    }
  })
  return result
}

export function confirmAction(message) {
  return window.confirm(message)
}

export const STATUS_MAP = {
  1: { label: '启用', class: 'tag-success' },
  0: { label: '禁用', class: 'tag-danger' },
}

export const INQUIRY_STATUS = {
  0: { label: '未处理', class: 'tag-warning' },
  1: { label: '已处理', class: 'tag-info' },
  2: { label: '已跟进', class: 'tag-info' },
  3: { label: '已完成', class: 'tag-success' },
}
