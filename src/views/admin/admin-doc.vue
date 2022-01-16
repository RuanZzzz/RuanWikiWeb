<template>
  <a-layout>
    <a-layout-content
        :style="{ background: '#fff', padding: '24px', margin: 0, minHeight: '280px' }"
    >
      <p>
        <a-form layout="inline" :model="param">
          <a-form-item>
            <a-button type="primary" @click="handleQuery()">
              刷新
            </a-button>
          </a-form-item>
          <a-form-item>
            <a-button type="primary" @click="add()" >
              新增
            </a-button>
          </a-form-item>
        </a-form>

      </p>
      <!-- 分类表格 -->
      <a-table
          :columns = "columns"
          :row-key="record => record.id"
          :data-source="docTree"
          :loading="loading"
          :pagination="false"
      >
        <template v-slot:action="{text,record}">
          <a-space size="small">
            <a-button type="primary" @click="edit(record)">
              编辑
            </a-button>
            <a-popconfirm
                title="删除后不可恢复，确认删除？"
                ok-text="是"
                cancel-text="否"
                @confirm="handleDelete(record.id)"
            >
              <a-button type="danger">
                删除
              </a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>

    </a-layout-content>
  </a-layout>

  <a-modal
      v-model:visible="modalVisible"
      title="文档表单"
      :confirm-loading="modalLoading"
      @ok="handleModalOk"
  >
    <a-form :model="doc" :label-col="{ span: 6 }" >
      <a-form-item label="名称">
        <a-input v-model:value="doc.name" />
      </a-form-item>
      <a-form-item label="父分类">
        <a-select
            ref="select"
            v-model:value="doc.parent"
        >
          <a-select-option value="0">
            无
          </a-select-option>
          <a-select-option v-for="item in docTree" :key="item.id" :value="item.id" :disabled="doc.id === item.id">
            {{item.name}}
          </a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="顺序">
        <a-input v-model:value="doc.sort" type="text"/>
      </a-form-item>
    </a-form>

  </a-modal>
</template>

<script lang="ts">
import {defineComponent, onMounted, ref} from "vue";
import axios from "axios";
import { message } from "ant-design-vue";
import {Tool} from "@/util/tool";

export default defineComponent({
  name: 'admin-category',
  setup() {
    const param = ref();  // 用在搜索框的赋值
    param.value = {};   // 搜索框的对象，目前用到的属性是param.name

    const docs = ref();
    const loading = ref(false);
    const docTree = ref();

    const columns = [
      {
        title: '名称',
        dataIndex: 'name' // 这是后端返回来的key，对应的value
      },
      {
        title: '父文档',
        key: 'parent',
        dataIndex: 'parent'
      },
      {
        title: '顺序',
        dataIndex: 'sort'
      },
      {
        title: '操作',
        key: 'action',
        slots: { customRender: 'action' }
      }
    ];

    /**
     * 数据查询
     */
    const handleQuery = () => {
      loading.value = true;
      axios.get("/doc/all").then((response) => {
        loading.value = false;
        const data = response.data;
        if (data.success) {
          docs.value = data.content;

          docTree.value = [];
          docTree.value = Tool.array2Tree(docs.value,0);
        }else {
          message.error(data.message);
        }
      })
    };

    // 表单
    const doc = ref({});
    const modalVisible = ref(false);
    const modalLoading = ref(false);
    const handleModalOk = () => {
      modalLoading.value = true;

      axios.post("/doc/save",doc.value).then((response) => {
        modalLoading.value = false;
        const data = response.data;

        if (data.success) {
          modalVisible.value = false;

          message.success('操作成功');

          // 重新加载列表
          handleQuery();
        }else {
          message.error(data.message);
        }
      })

    };

    // 编辑按钮
    const edit = (record: any) => {
      modalVisible.value = true;
      doc.value = Tool.copy(record);
    }

    // 新增按钮
    const add = () => {
      modalVisible.value = true;
      doc.value = {};
    }

    // 删除
    const handleDelete = (id: number) => {

      axios.delete("/doc/delete/" + id).then((response) => {
        const data = response.data;

        if (data.success) {
          message.success('删除成功');

          // 重新加载列表
          handleQuery();
        }
      })

    }

    onMounted(() => {
      handleQuery();
    });

    return {
      param,
      docs,
      docTree,
      columns,
      loading,

      edit,
      add,
      handleDelete,
      handleQuery,

      doc,
      modalVisible,
      modalLoading,
      handleModalOk

    }
  }
})



</script>