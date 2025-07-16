<template>
  <div class="table-container">
    <n-space vertical :size="16">
      <!-- Header with title and export button -->
      <n-space justify="space-between" align="center">
        <n-h2>User Management</n-h2>
        <n-button type="primary" @click="exportToPDF" :loading="exporting">
         
          Export to PDF
        </n-button>
      </n-space>

      <!-- Data Table -->
      <n-data-table
        :columns="columns"
        :data="tableData"
        :pagination="pagination"
        :summary="summary"
        bordered
        striped
        :loading="loading"
      />

      <!-- Summary Cards -->
      <n-space>
        <n-card title="Total Users" size="small" style="min-width: 150px">
          <n-statistic :value="tableData.length" />
        </n-card>
        <n-card title="Average Age" size="small" style="min-width: 150px">
          <n-statistic :value="averageAge" :precision="1" />
        </n-card>
        <n-card title="Countries" size="small" style="min-width: 150px">
          <n-statistic :value="uniqueCountries" />
        </n-card>
      </n-space>

      <!-- Refresh Data Button -->
      <n-space justify="center">
        <n-button @click="generateNewData" :loading="loading">
          Generate New Data
        </n-button>
      </n-space>
    </n-space>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue'
import {
  NDataTable,
  NButton,
  NSpace,
  NH2,
  NCard,
  NStatistic,
  NIcon,
  NTag,
} from 'naive-ui'
// Import your PDF export library
import { ExportPDFTable } from './index'


// Reactive data
const tableData = ref([])
const loading = ref(false)
const exporting = ref(false)

// Sample data arrays
const names = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Julia']
const countries = ['USA', 'Canada', 'UK', 'Australia', 'Germany', 'France', 'Japan', 'Brazil', 'Italy', 'Spain']

// Table columns configuration
const columns = [
  {
    title: 'Name',
    key: 'name',
    width: 150,
    sorter: (a, b) => a.name.localeCompare(b.name)
  },
  {
    title: 'Age',
    key: 'age',
    width: 100,
    sorter: (a, b) => a.age - b.age,
    render: (row) => h('span', { style: 'font-weight: bold' }, row.age)
  },
  {
    title: 'Country',
    key: 'country',
    width: 120,
    render: (row) => h(
      NTag,
      {
        type: getCountryTagType(row.country),
        bordered: false
      },
      { default: () => row.country }
    )
  },
  {
    title: 'Email',
    key: 'email',
    width: 200,
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: 'Status',
    key: 'status',
    width: 100,
    render: (row) => h(
      NTag,
      {
        type: row.status === 'Active' ? 'success' : 'warning',
        bordered: false
      },
      { default: () => row.status }
    )
  }
]

// Pagination configuration
const pagination = {
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [5, 10, 20, 50],
  showQuickJumper: true
}

// Summary function for the table
const summary = (pageData) => {
  const totalAge = pageData.reduce((sum, row) => sum + row.age, 0)
  const avgAge = pageData.length > 0 ? (totalAge / pageData.length).toFixed(1) : 0
  const activeUsers = pageData.filter(row => row.status === 'Active').length
  
  return {
    name: {
      value: `${pageData.length} users`,
      colSpan: 1
    },
    age: {
      value: `Avg: ${avgAge}`,
      colSpan: 1
    },
    country: {
      value: `${new Set(pageData.map(row => row.country)).size} countries`,
      colSpan: 1
    },
    email: {
      value: `${activeUsers} active`,
      colSpan: 1
    },
    status: {
      value: `${pageData.length - activeUsers} inactive`,
      colSpan: 1
    }
  }
}

// Computed properties for summary cards
const averageAge = computed(() => {
  if (tableData.value.length === 0) return 0
  const total = tableData.value.reduce((sum, user) => sum + user.age, 0)
  return total / tableData.value.length
})

const uniqueCountries = computed(() => {
  return new Set(tableData.value.map(user => user.country)).size
})

// Helper function for country tag colors
function getCountryTagType(country) {
  const types = {
    'USA': 'info',
    'Canada': 'success',
    'UK': 'warning',
    'Australia': 'error',
    'Germany': 'info',
    'France': 'success',
    'Japan': 'warning',
    'Brazil': 'error'
  }
  return types[country] || 'default'
}

// Generate random data
const generateRandomData = (count = 25) => {
  const data = []
  for (let i = 0; i < count; i++) {
    const name = names[Math.floor(Math.random() * names.length)]
    data.push({
      id: i + 1,
      name: name,
      age: Math.floor(Math.random() * 43) + 18,
      country: countries[Math.floor(Math.random() * countries.length)],
      email: `${name.toLowerCase()}@example.com`,
      status: Math.random() > 0.3 ? 'Active' : 'Inactive'
    })
  }
  return data
}

// Generate new data with loading state
const generateNewData = async () => {
  loading.value = true
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500))
    tableData.value = generateRandomData()
   
  } catch (error) {
   
  } finally {
    loading.value = false
  }
}

// Export to PDF function
const exportToPDF = async () => {
  exporting.value = true
  try {
    const content = {
      data: tableData.value,
      columns: ['name', 'age', 'country', 'email', 'status'],
      title: 'User Management Report',
      summary: {
        totalUsers: tableData.value.length,
        averageAge: averageAge.value,
        uniqueCountries: uniqueCountries.value,
        activeUsers: tableData.value.filter(u => u.status === 'Active').length
      }
    }
    
    await ExportPDFTable('user-management-report', content)
   
  } catch (error) {
    
    console.error('Export error:', error)
  } finally {
    exporting.value = false
  }
}

// Initialize data on component mount
onMounted(() => {
  generateNewData()
})
</script>

<style scoped>
.table-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Custom styling for better appearance */
:deep(.n-data-table-th) {
  background-color: #f8f9fa;
  font-weight: 600;
}

:deep(.n-data-table-td) {
  border-right: 1px solid #e0e0e0;
}

:deep(.n-data-table-summary) {
  background-color: #f0f2f5;
  font-weight: 600;
}

:deep(.n-statistic-value) {
  font-size: 24px;
  font-weight: bold;
}
</style>