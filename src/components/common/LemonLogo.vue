<template>
  <svg :width="size" :height="size" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" :fill="bgColor"/>
    <ellipse cx="50" cy="53" rx="22" ry="28" fill="#F9FBE7" transform="rotate(-15 50 53)"/>
    <ellipse cx="50" cy="53" rx="14" ry="20" fill="#F0F4C3" transform="rotate(-15 50 53)"/>
    <line x1="50" y1="26" x2="50" y2="80" stroke="#C5E1A5" stroke-width="1.5" transform="rotate(-15 50 53)"/>
    <line x1="28" y1="53" x2="72" y2="53" stroke="#C5E1A5" stroke-width="1.5" transform="rotate(-15 50 53)"/>
    <line x1="36" y1="36" x2="64" y2="70" stroke="#C5E1A5" stroke-width="1" transform="rotate(-15 50 53)"/>
    <line x1="64" y1="36" x2="36" y2="70" stroke="#C5E1A5" stroke-width="1" transform="rotate(-15 50 53)"/>
    <path d="M50 23 Q60 13 68 17 Q62 26 50 23Z" fill="#4CAF50"/>
  </svg>
</template>

<script setup>
defineProps({
  size: { type: Number, default: 40 },
  bgColor: { type: String, default: '#1B5E20' }
})
</script>
