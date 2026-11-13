<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import BaseDatatable from '@/components/common/BaseDatatable.vue'
import ExampleItemDialog from '@/components/example/ExampleItemDialog.vue'
import { useListingQuery } from '@/composables/common/useListingQuery'
import { exampleItemColumns } from '@/schemas/example'
import { useExampleItemsStore } from '@/stores/example/exampleItems'
import type { ExampleItem, ExampleItemDraft } from '@/types/example'

const store = useExampleItemsStore()
const confirm = useConfirm()
const toast = useToast()
const { t } = useI18n()

// Any change to the page, page size, sort or search fetches that page from the API. They're kept in
// the URL, so Back and the breadcrumb return to the list as it was left.
const query = useListingQuery<ExampleItem>({ page: 1, limit: 10, search: '' }, exampleItemColumns)
const load = () => store.fetchPage(query.value)
watch(query, load, { immediate: true })

const selectedItems = ref<ExampleItem[]>([])

const dialogVisible = ref(false)
const editingItem = ref<ExampleItem>()

function openDialog(item?: ExampleItem) {
  editingItem.value = item
  dialogVisible.value = true
}

async function save(draft: ExampleItemDraft) {
  await store.save(draft)
  toast.add({
    severity: 'success',
    summary: draft.id === undefined ? t('example.toast.created') : t('example.toast.updated'),
    detail: draft.name,
    life: 3000,
  })
  await load()
}

// One row from its Delete button, or every ticked row from the toolbar.
function confirmDelete(items: ExampleItem[]) {
  const single = items.length === 1 ? items[0] : undefined
  confirm.require({
    header: t('example.deleteConfirm.header'),
    message: single
      ? t('example.deleteConfirm.message', { code: single.code, name: single.name })
      : t('example.deleteConfirm.messageMany', { count: items.length }),
    defaultFocus: 'reject',
    rejectProps: { label: t('common.actions.cancel'), severity: 'secondary', outlined: true },
    acceptProps: { label: t('common.actions.delete'), severity: 'danger' },
    accept: async () => {
      const ids = items.map((item) => item.id)
      await store.remove(ids)
      selectedItems.value = selectedItems.value.filter((item) => !ids.includes(item.id))
      toast.add({
        severity: 'info',
        summary: t('example.toast.deleted'),
        detail: single ? single.name : t('example.recordCount', { count: items.length }),
        life: 3000,
      })
      await load()
    },
  })
}
</script>

<template>
  <main class="datatable-page">
    <div class="page-header">
      <h1>{{ t('example.title') }}</h1>
      <p>{{ t('example.intro') }}</p>
    </div>

    <BaseDatatable
      v-model:query="query"
      v-model:selection="selectedItems"
      class="listing"
      :value="store.items"
      :totalRecords="store.totalRecords"
      :loading="store.loading"
      :columns="exampleItemColumns"
      dataKey="id"
      selectable
      resizable
      scrollable
      scrollHeight="flex"
    >
      <template #toolbar>
        <Button
          :label="t('example.deleteSelected', { count: selectedItems.length })"
          size="small"
          severity="danger"
          outlined
          :disabled="!selectedItems.length"
          @click="confirmDelete(selectedItems)"
        />
        <Button :label="t('example.newRecord')" size="small" @click="openDialog()" />
      </template>
      <template #actions="{ data }">
        <Button
          :label="t('common.actions.edit')"
          text
          size="small"
          severity="secondary"
          @click="openDialog(data)"
        />
        <Button
          :label="t('common.actions.delete')"
          text
          size="small"
          severity="danger"
          @click="confirmDelete([data])"
        />
      </template>
    </BaseDatatable>

    <ExampleItemDialog v-model:visible="dialogVisible" :item="editingItem" @save="save" />
  </main>
</template>

<style scoped>
.datatable-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* With scrollHeight="flex", the table fills the space below the page header. */
.listing {
  flex: 1;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 500;
}
</style>
