<template>
  <div class="rec-card" :class="[card.cardType, { faded }]"
    :style="confirmed ? borderStyle : ''">
    <!-- Head -->
    <div class="card-head">
      <div class="card-icon">{{ card.icon || (isExercise ? '🏃' : '🍽️') }}</div>
      <div class="card-name">{{ card.name }}</div>
      <div v-if="isExercise && card.duration" class="card-duration">{{ card.duration }}</div>
      <div v-else-if="!isExercise && card.calories" class="card-cal">{{ card.calories }}</div>
    </div>

    <!-- Body -->
    <div class="card-body">
      <div class="card-desc">{{ card.desc }}</div>
      <div v-if="isExercise && card.burn" class="card-burn">🔥 消耗约 {{ card.burn }}</div>
      <div v-else-if="!isExercise && card.tags?.length" class="card-tags">
        <span v-for="t in card.tags" :key="t" class="card-tag">{{ t }}</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="card-footer">
      <button class="card-confirm-btn" :class="{ confirmed, exercise: isExercise }"
        :disabled="confirmed" @click="$emit('confirm')">
        {{ confirmed ? '已选 ✓' : '选这个 ✓' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  card: Object,
  confirmed: Boolean,
  faded: Boolean
})
defineEmits(['confirm'])

const isExercise = computed(() => props.card.cardType === 'exercise')
const borderStyle = computed(() =>
  isExercise.value ? 'box-shadow: 0 0 0 2px #52C07A' : 'box-shadow: 0 0 0 2px #FF6B35'
)
</script>

<style scoped>
.rec-card {
  background: white; border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  transition: opacity 0.3s, transform 0.3s, box-shadow 0.2s;
}
.rec-card.faded { opacity: 0; transform: translateX(12px); pointer-events: none; }

.card-head {
  padding: 11px 14px 9px;
  display: flex; align-items: center; gap: 8px;
}
.card-icon {
  width: 32px; height: 32px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; flex-shrink: 0;
}
.card-name { font-size: 14px; font-weight: 700; color: var(--brown); flex: 1; }
.card-body { padding: 8px 14px 0; }
.card-desc { font-size: 12px; color: var(--soft-brown); line-height: 1.55; }

/* Food */
.rec-card.food .card-head {
  background: linear-gradient(90deg, rgba(255,107,53,0.08), rgba(255,179,71,0.05));
  border-bottom: 1px solid rgba(255,107,53,0.1);
}
.rec-card.food .card-icon { background: linear-gradient(135deg, #FF6B35, #FFB347); }
.card-cal {
  font-size: 11px; font-weight: 700; color: #FF6B35;
  background: rgba(255,107,53,0.1); padding: 2px 8px; border-radius: 50px; white-space: nowrap;
}
.card-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
.card-tag {
  font-size: 11px; padding: 2px 8px; border-radius: 50px;
  background: #FFF3E0; color: var(--soft-brown); font-weight: 500;
}

/* Exercise */
.rec-card.exercise .card-head {
  background: linear-gradient(90deg, rgba(82,192,122,0.1), rgba(82,192,122,0.04));
  border-bottom: 1px solid rgba(82,192,122,0.15);
}
.rec-card.exercise .card-icon { background: linear-gradient(135deg, #52C07A, #34A85A); }
.card-duration {
  font-size: 11px; font-weight: 700; color: #34A85A;
  background: rgba(82,192,122,0.12); padding: 2px 8px; border-radius: 50px; white-space: nowrap;
}
.card-burn { margin-top: 6px; font-size: 11px; color: #34A85A; font-weight: 600; }

/* Footer */
.card-footer {
  padding: 8px 14px 12px;
  display: flex; justify-content: flex-end;
}
.card-confirm-btn {
  padding: 5px 14px; border-radius: 50px;
  background: linear-gradient(135deg, #FF6B35, #FFB347);
  color: white; font-size: 12px; font-weight: 700;
  border: none; cursor: pointer;
  font-family: 'Noto Sans SC', sans-serif;
  box-shadow: 0 3px 8px rgba(255,107,53,0.3);
  transition: all .18s ease;
  letter-spacing: .3px;
}
.card-confirm-btn.exercise {
  background: linear-gradient(135deg, #52C07A, #34A85A);
  box-shadow: 0 3px 8px rgba(52,168,90,0.3);
}
.card-confirm-btn:hover { transform: scale(1.05); }
.card-confirm-btn:active { transform: scale(0.97); }
.card-confirm-btn.confirmed {
  background: #E8F5E9; color: #34A85A;
  box-shadow: none; cursor: default;
}
</style>
