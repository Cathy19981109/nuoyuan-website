<template>
  <div class="upload-box" @dragover.prevent @drop.prevent="onDrop">
    <input type="file" :accept="accept" :disabled="uploading || disabled" @change="onSelect" />
    <div class="hint">{{ uploading ? '上传中...' : hintText }}</div>
    <img v-if="modelValue" :src="toPublicMediaUrl(modelValue)" class="preview" />
    <button
      v-if="showRemove && modelValue"
      type="button"
      class="btn btn-danger btn-sm"
      :disabled="uploading || disabled"
      @click="$emit('update:modelValue', '')"
    >
      删除重传
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { uploadImageFile } from '@/api'
import { toPublicMediaUrl } from '@/utils/media'

const props = defineProps({
  modelValue: { type: String, default: '' },
  accept: { type: String, default: '.png,.jpg,.jpeg,.webp' },
  allowedTypes: { type: Array, default: () => ['image/png', 'image/jpeg', 'image/webp'] },
  maxSizeMb: { type: Number, default: 50 },
  hintText: { type: String, default: '选择文件或拖拽上传' },
  disabled: { type: Boolean, default: false },
  showRemove: { type: Boolean, default: true },
  uploadFn: { type: Function, default: null },
})

const emit = defineEmits(['update:modelValue'])
const uploading = ref(false)

async function uploadByDefault(file) {
  const fd = new FormData()
  fd.append('file', file)
  const res = await uploadImageFile(fd)
  return res.url
}

async function doUpload(file) {
  if (!file) return
  if (!props.allowedTypes.includes(file.type)) {
    alert('仅支持 png/jpg/webp')
    return
  }
  if (file.size > props.maxSizeMb * 1024 * 1024) {
    alert(`图片不能超过${props.maxSizeMb}MB`)
    return
  }
  uploading.value = true
  try {
    const url = props.uploadFn ? await props.uploadFn(file) : await uploadByDefault(file)
    if (url) emit('update:modelValue', url)
  } catch (e) {
    alert(e.message || '上传失败，请重试')
  } finally {
    uploading.value = false
  }
}

async function onSelect(e) {
  const file = e.target.files?.[0]
  await doUpload(file)
  e.target.value = ''
}

async function onDrop(e) {
  const file = e.dataTransfer?.files?.[0]
  await doUpload(file)
}
</script>

<style scoped>
.upload-box { border: 1px dashed #cbd5e1; border-radius: 8px; padding: 10px; display: grid; gap: 8px; }
.preview { max-width: 120px; border-radius: 6px; display: block; }
</style>
