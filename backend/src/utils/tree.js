function buildTree(items, parentId = 0, idKey = 'id', parentKey = 'parent_id') {
  return items
    .filter((item) => item[parentKey] === parentId)
    .sort((a, b) => a.sort - b.sort)
    .map((item) => ({
      ...item,
      children: buildTree(items, item[idKey], idKey, parentKey),
    }));
}

module.exports = { buildTree };
