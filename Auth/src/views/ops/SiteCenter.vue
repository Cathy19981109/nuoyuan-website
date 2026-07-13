<template>
  <div>
    <div class="page-header">
      <div>
        <h2>官网信息</h2>
        <p class="desc">统一维护品牌与联系方式配置</p>
      </div>
      <button class="btn btn-primary" :disabled="saving" @click="saveAll">{{ saving ? '保存中...' : '保存官网信息' }}</button>
    </div>

    <div class="card">
      <div v-if="loading" class="empty-state">加载中...</div>
      <template v-else>
        <div class="form-stack">
          <div class="form-group" v-for="item in allItems" :key="item.key">
            <label><span v-if="item.required" class="required">*</span>{{ item.label }}</label>
            <textarea
              v-if="item.inputType === 'textarea'"
              v-model="form[item.key]"
              class="form-control"
              rows="3"
              :maxlength="item.maxLength || undefined"
            />
            <input
              v-else-if="item.inputType !== 'image'"
              v-model="form[item.key]"
              class="form-control"
              :type="item.inputType === 'password' ? 'password' : item.inputType === 'number' ? 'number' : 'text'"
              :maxlength="item.maxLength || undefined"
            />
            <ImageUploadField
              v-else
              v-model="form[item.key]"
              :upload-fn="(file) => processImageForKey(file, item.key, true)"
            />
            <div class="hint" v-if="item.tips">{{ item.tips }}</div>
            <div class="hint" v-if="item.uploadRule">{{ item.uploadRule }}</div>
          </div>
        </div>
        <div style="margin-top: 10px">
          <button class="btn btn-secondary" @click="openPreview">前台预览</button>
        </div>
      </template>
    </div>
    <div v-if="imageEditorVisible" class="modal-overlay" @click.self="closeImageEditor">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>图片裁剪调整</h3>
          <button class="modal-close" @click="closeImageEditor">&times;</button>
        </div>
        <div class="modal-body">
          <div class="hint" style="margin-bottom:8px;color:#1d4ed8">当前图片不符合建议比例，将裁剪为 1:1 后上传</div>
          <div class="crop-stage">
            <img :src="imageEditorSourceUrl" class="crop-img" :style="cropImageStyle" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>缩放</label>
              <input v-model.number="imageEditorScale" type="range" min="1" max="3" step="0.01" class="form-control" />
            </div>
            <div class="form-group">
              <label>横向位置</label>
              <input v-model.number="imageEditorOffset.x" type="range" min="-1" max="1" step="0.01" class="form-control" />
            </div>
            <div class="form-group">
              <label>纵向位置</label>
              <input v-model.number="imageEditorOffset.y" type="range" min="-1" max="1" step="0.01" class="form-control" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeImageEditor">取消</button>
          <button class="btn btn-primary" @click="confirmImageEditor">确认裁剪并上传</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getSiteCenter, saveSiteCenter, uploadImageFile } from '@/api'
import ImageUploadField from '@/components/ImageUploadField.vue'

const loading = ref(false)
const saving = ref(false)
const groups = ref([])
const form = ref({})
const imageEditorVisible = ref(false)
const imageEditorKey = ref('')
const imageEditorSourceUrl = ref('')
const imageEditorNatural = ref({ width: 0, height: 0 })
const imageEditorScale = ref(1)
const imageEditorOffset = ref({ x: 0, y: 0 })
const imageEditorMime = ref('image/jpeg')
const imageEditorRatio = 1

const allItems = computed(() =>
  groups.value.flatMap((g) => (g.items || []).map((i) => ({ ...i, groupTitle: g.title })))
)
const cropImageStyle = computed(() => {
  const tx = imageEditorOffset.value.x * 120
  const ty = imageEditorOffset.value.y * 120
  return {
    transform: `translate(${tx}px, ${ty}px) scale(${imageEditorScale.value})`,
    transformOrigin: 'center center',
  }
})

async function loadData() {
  loading.value = true
  try {
    groups.value = await getSiteCenter()
    const data = {}
    groups.value.forEach((g) => {
      (g.items || []).forEach((item) => {
        data[item.key] = item.value || ''
      })
    })
    form.value = data
  } catch (e) {
    alert(e.message)
  } finally {
    loading.value = false
  }
}

async function saveAll() {
  if (!String(form.value.brand_title || '').trim()) {
    alert('品牌名为必填项')
    return
  }
  saving.value = true
  try {
    await saveSiteCenter(form.value)
    await loadData()
    alert('已保存')
  } catch (e) {
    alert(e.message)
  } finally {
    saving.value = false
  }
}

function openPreview() {
  window.open('http://localhost:5173/', '_blank')
}

onMounted(loadData)

async function processImageForKey(file, key, returnUrl = false) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    alert('仅支持 png/jpg/webp 格式')
    return ''
  }
  const size = await getImageSize(file)
  const ratio = size.width && size.height ? size.width / size.height : 0
  const needCrop = Math.abs(ratio - imageEditorRatio) > 0.12
  if (needCrop) {
    await openImageEditor(file, key, size)
    return ''
  }
  const uploadFile = file.size > 50 * 1024 * 1024 ? await compressToLimit(file, 50 * 1024 * 1024) : file
  const fd = new FormData()
  fd.append('file', uploadFile, file.name)
  const res = await uploadImageFile(fd)
  if (!returnUrl) form.value[key] = res.url
  return res.url
}

function getImageSize(file) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = () => resolve({ width: 0, height: 0 })
    img.src = URL.createObjectURL(file)
  })
}

function closeImageEditor() {
  imageEditorVisible.value = false
  imageEditorKey.value = ''
  imageEditorSourceUrl.value = ''
  imageEditorNatural.value = { width: 0, height: 0 }
  imageEditorScale.value = 1
  imageEditorOffset.value = { x: 0, y: 0 }
  imageEditorMime.value = 'image/jpeg'
}

async function openImageEditor(file, key, size) {
  imageEditorVisible.value = true
  imageEditorKey.value = key
  imageEditorSourceUrl.value = URL.createObjectURL(file)
  imageEditorNatural.value = { width: size.width, height: size.height }
  imageEditorScale.value = 1
  imageEditorOffset.value = { x: 0, y: 0 }
  imageEditorMime.value = file.type || 'image/jpeg'
}

function blobToImage(blobOrUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl)
  })
}

async function renderCroppedBlob() {
  const img = await blobToImage(imageEditorSourceUrl.value)
  const width = imageEditorNatural.value.width
  const height = imageEditorNatural.value.height
  const crop = Math.min(width, height)
  const canvas = document.createElement('canvas')
  canvas.width = crop
  canvas.height = crop
  const ctx = canvas.getContext('2d')
  const drawW = width * imageEditorScale.value
  const drawH = height * imageEditorScale.value
  const centerX = (canvas.width - drawW) / 2 + imageEditorOffset.value.x * 120
  const centerY = (canvas.height - drawH) / 2 + imageEditorOffset.value.y * 120
  ctx.drawImage(img, centerX, centerY, drawW, drawH)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('图片处理失败'))
      resolve(blob)
    }, imageEditorMime.value === 'image/png' ? 'image/png' : 'image/jpeg', 0.92)
  })
}

async function compressToLimit(file, maxSize) {
  if (file.size <= maxSize) return file
  const img = await blobToImage(file)
  let quality = 0.9
  let blob = await new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0, img.width, img.height)
    canvas.toBlob(resolve, 'image/jpeg', quality)
  })
  while (blob && blob.size > maxSize && quality > 0.4) {
    quality -= 0.1
    blob = await new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0, img.width, img.height)
      canvas.toBlob(resolve, 'image/jpeg', quality)
    })
  }
  if (!blob || blob.size > maxSize) throw new Error('图片压缩失败，请更换更小图片')
  return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
}

async function confirmImageEditor() {
  try {
    const blob = await renderCroppedBlob()
    const uploadBlob = blob.size > 50 * 1024 * 1024
      ? await compressToLimit(new File([blob], 'crop.jpg', { type: blob.type || 'image/jpeg' }), 50 * 1024 * 1024)
      : blob
    const fd = new FormData()
    fd.append('file', uploadBlob, 'crop.jpg')
    const res = await uploadImageFile(fd)
    form.value[imageEditorKey.value] = res.url
    closeImageEditor()
  } catch (e) {
    alert(e.message || '裁剪上传失败')
  }
}
</script>

<style scoped>
.required { color: #dc2626; margin-right: 4px; font-weight: 700; }
.form-stack { display: grid; gap: 12px; }
.upload-box { border: 1px dashed #cbd5e1; border-radius: 8px; padding: 10px; }
.preview { margin-top: 8px; max-width: 120px; border-radius: 6px; display: block; }
.crop-stage {
  width: 100%;
  max-width: 520px;
  aspect-ratio: 1 / 1;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  overflow: hidden;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
}
.crop-img {
  max-width: 100%;
  max-height: 100%;
  user-select: none;
  pointer-events: none;
}
</style>
