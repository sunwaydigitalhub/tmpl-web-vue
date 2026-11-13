<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { exampleStatusLabels } from '@/schemas/example'
import type { ExampleItem, ExampleItemDraft, ExampleStatus } from '@/types/example'

const props = defineProps<{ item?: ExampleItem }>()
const emit = defineEmits<{ save: [draft: ExampleItemDraft] }>()
const visible = defineModel<boolean>('visible', { required: true })
const { t } = useI18n()

const statuses: ExampleStatus[] = ['Active', 'Draft', 'Inactive']
// Computed, so the labels follow a language switch.
const statusOptions = computed(() =>
  statuses.map((value) => ({ value, label: t(exampleStatusLabels[value]) })),
)

const form = ref<ExampleItemDraft>(toDraft())
const submitted = ref(false)
const codeInvalid = computed(() => submitted.value && !form.value.code.trim())
const nameInvalid = computed(() => submitted.value && !form.value.name.trim())

function toDraft(): ExampleItemDraft {
  return props.item ? { ...props.item } : { code: '', name: '', status: 'Draft', description: '' }
}

// Edit a fresh copy each time the dialog opens, so Cancel discards changes.
watch(visible, (open) => {
  if (!open) return
  form.value = toDraft()
  submitted.value = false
})

function save() {
  submitted.value = true
  if (codeInvalid.value || nameInvalid.value) return

  emit('save', { ...form.value, code: form.value.code.trim(), name: form.value.name.trim() })
  visible.value = false
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :header="item ? t('example.editRecord') : t('example.newRecord')"
    modal
    :style="{ width: '28rem' }"
    :breakpoints="{ '575px': '90vw' }"
  >
    <form id="example-item-form" class="form" @submit.prevent="save">
      <div class="field">
        <label for="example-code">{{ t('example.fields.code') }}</label>
        <InputText id="example-code" v-model="form.code" :invalid="codeInvalid" fluid />
        <Message v-if="codeInvalid" severity="error" size="small" variant="simple">
          {{ t('example.validation.codeRequired') }}
        </Message>
      </div>
      <div class="field">
        <label for="example-name">{{ t('example.fields.name') }}</label>
        <InputText id="example-name" v-model="form.name" :invalid="nameInvalid" fluid />
        <Message v-if="nameInvalid" severity="error" size="small" variant="simple">
          {{ t('example.validation.nameRequired') }}
        </Message>
      </div>
      <div class="field">
        <label for="example-status">{{ t('example.fields.status') }}</label>
        <Select
          v-model="form.status"
          inputId="example-status"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          fluid
        />
      </div>
      <div class="field">
        <label for="example-description">{{ t('example.fields.description') }}</label>
        <Textarea id="example-description" v-model="form.description" rows="3" autoResize fluid />
      </div>
    </form>

    <template #footer>
      <Button
        :label="t('common.actions.cancel')"
        severity="secondary"
        text
        @click="visible = false"
      />
      <Button :label="t('common.actions.save')" type="submit" form="example-item-form" />
    </template>
  </Dialog>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
