<script setup lang="ts">
import { onDeleteVideos } from "./Settings.telefunc";
</script>

<template>
  <section>
    <details>
      <summary>Settings</summary>
      <div>
        <label>
          Receiver Aspect Ratio
          <select name="receiverRatio">
            <option value="16:9">16:9</option>
          </select>
        </label>
      </div>
      <div>
        <label>
          Display Aspect Ratio
          <select name="receiverRatio">
            <option value="16:9">16:9</option>
            <option value="4:3">4:3</option>
          </select>
        </label>
      </div>
      <div>
        <button @click="onDeleteVideos">Delete Videos</button>
      </div>
    </details>
  </section>
</template>
