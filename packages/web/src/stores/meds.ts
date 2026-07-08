import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Medication } from '../types'

export const useMedsStore = defineStore('meds', () => {
  const medications = ref<Medication[]>([])
  const loading = ref(false)

  async function fetchAll(): Promise<void> {
    // stub — will be implemented in Task 8
  }

  return { medications, loading, fetchAll }
})
