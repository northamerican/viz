<script setup lang="ts">
import { onMounted } from "vue";
import { store } from "../store";
import { onDeleteVideos, onSaveSettings } from "./Settings.telefunc";

onMounted(() => {
  store.updateSettings();
});
</script>

<template>
  <section>
    <details>
      <summary>Settings</summary>
      <label
        ><input
          type="checkbox"
          v-model="store.settings.downloadQueueItems"
          @change="() => onSaveSettings(store.settings)"
        />Download Queue Items</label
      >
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
