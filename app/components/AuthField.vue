<template>
  <div class="space-y-1.5">
    <label :for="id" class="text-sm font-medium">{{ label }}</label>
    <input
      :id="id"
      :value="modelValue"
      :type="type"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
      :aria-invalid="Boolean(error)"
      :aria-describedby="error ? `${id}-error` : undefined"
      :class="inputClass"
      @input="onInput"
      @blur="$emit('blur')"
    >
    <p v-if="error" :id="`${id}-error`" class="text-sm text-destructive">
      {{ error }}
    </p>
  </div>
</template>

<script setup>
import { cn } from '@/lib/utils'

const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  modelValue: { type: String, required: true },
  error: { type: String, default: null },
  type: { type: String, default: 'text' },
  autocomplete: { type: String, default: 'off' },
  placeholder: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'blur'])

const inputClass = computed(() => cn(
  'h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2',
  props.error
    ? 'border-destructive focus-visible:ring-destructive/40'
    : 'border-input focus-visible:ring-ring',
))

function onInput(event) {
  emit('update:modelValue', event.target.value)
}
</script>
