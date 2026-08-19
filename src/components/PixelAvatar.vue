<script setup>
import { computed } from 'vue'
import { getAvatarById } from '@/assets/avatars'

const props = defineProps({
  avatarId: {
    type: String,
    default: 'shiba'
  },
  size: {
    type: [Number, String],
    default: 48
  },
  bordered: {
    type: Boolean,
    default: true
  },
  active: {
    type: Boolean,
    default: false
  }
})

const avatar = computed(() => getAvatarById(props.avatarId))
</script>

<template>
  <div 
    class="pixel-avatar-wrapper"
    :class="{ 
      'has-border': bordered, 
      'is-active': active 
    }"
    :style="{ 
      width: typeof size === 'number' ? `${size}px` : size, 
      height: typeof size === 'number' ? `${size}px` : size 
    }"
    v-html="avatar.svg"
  ></div>
</template>

<style scoped>
.pixel-avatar-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  image-rendering: pixelated;
  transition: transform 0.15s ease, border-color 0.15s ease;
  overflow: hidden;
}

.pixel-avatar-wrapper.has-border {
  border: 3px solid #000;
  box-shadow: 
    inset -2px -2px 0px 0px rgba(0,0,0,0.4),
    inset 2px 2px 0px 0px rgba(255,255,255,0.2),
    2px 2px 0px 0px #000;
}

.pixel-avatar-wrapper.is-active {
  border-color: var(--pixel-gold);
  box-shadow: 
    0 0 0 2px var(--pixel-gold),
    3px 3px 0px 0px #000;
  transform: translateY(-2px);
}
</style>
