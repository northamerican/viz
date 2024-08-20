<script setup lang="ts">
import {
  displayAspectRatios,
  maxQualityOptions,
  receiverAspectRatios,
} from "../consts";
import { store } from "../store";
import { onDeleteVideos, onSaveSettings } from "./Settings.telefunc";
import { onMounted } from "vue";

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
          Maximum video download quality
          <select
            name="maxQuality"
            v-model="store.settings.maxQuality"
            @change="() => onSaveSettings(store.settings)"
          >
            <option
              v-for="quality in maxQualityOptions"
              :value="quality.value"
              :key="quality.label"
            >
              {{ quality.label }}
            </option>
          </select>
        </label>
      </div>

      <div>
        <label>
          Receiver aspect ratio
          <select
            name="receiverRatio"
            v-model="store.settings.receiverAspectRatio"
            @change="() => onSaveSettings(store.settings)"
          >
            <option
              v-for="ratio in receiverAspectRatios"
              :value="ratio.value"
              :key="ratio.label"
            >
              {{ ratio.label }}
            </option>
          </select>
        </label>
      </div>
      <div>
        <label>
          Display aspect ratio
          <select
            name="displayRatio"
            v-model="store.settings.displayAspectRatio"
            @change="() => onSaveSettings(store.settings)"
          >
            <option
              v-for="ratio in displayAspectRatios"
              :value="ratio.value"
              :key="ratio.label"
            >
              {{ ratio.label }}
            </option>
          </select>
        </label>
      </div>
      <div>
        <button @click="onDeleteVideos">Delete Videos</button>
      </div>
    </details>
  </section>
</template>
