<script setup lang="ts">
import { ref } from 'vue'

type Options = Partial<{ action?: any; label?: string; disabled?: boolean }>[]

const props = defineProps<{ options: Options }>()

const select = ref(null)

const onChange = (event: Event) => {
  const optionIndex = +(event.target as HTMLInputElement).value
  const option = props.options[optionIndex]
  option.action()
  // Reset select element value so nothing appears selected
  select.value.value = null
}
</script>

<template>
  <select value="null" @change="onChange" ref="select">
    <component
      v-for="(option, i) in props.options"
      :is="option.label ? 'option' : 'hr'"
      :disabled="option.disabled"
      :value="i"
    >
      {{ option.label }}
    </component>
  </select>
</template>

<style>
select {
  width: 1rem;
  font-size: 1rem;
}
</style>
