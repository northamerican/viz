<script setup lang="ts"></script>

<template>
  <div class="list-item">
    <slot />
  </div>
</template>

<style scoped>
.list-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  min-height: 64px;

  &.compact {
    min-height: 40px;
  }

  & .actions {
    display: none;
  }

  &:hover {
    background: rgba(0, 0, 0, 15%);

    & .actions {
      display: block;
    }
  }
}
</style>
