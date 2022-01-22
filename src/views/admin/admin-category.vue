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
          :data-source="cateTree"
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
      title="分类表单"
      :confirm-loading="modalLoading"
      @ok="handleModalOk"
  >
    <a-form :model="category" :label-col="{ span: 6 }" >
      <a-form-item label="名称">
        <a-input v-model:value="category.name" />
      </a-form-item>
      <a-form-item label="父分类">
        <a-select
            ref="select"
            v-model:value="category.parent"
        >
          <a-select-option value="0">
            无
          </a-select-option>
          <a-select-option v-for="cate in cateTree" :key="cate.id" :value="cate.id" :disabled="category.id === cate.id">
            {{cate.name}}
          </a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="顺序">
        <a-input v-model:value="category.sort" type="text"/>
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
    name: 'AdminCategory',
    setup() {
      const param = ref();  // 用在搜索框的赋值
      param.value = {};   // 搜索框的对象，目前用到的属性是param.name

      const categorys = ref();
      const loading = ref(false);
      const cateTree = ref();
      cateTree.value = [];

      const columns = [
        {
          title: '名称',
          dataIndex: 'name' // 这是后端返回来的key，对应的value
        },
        {
          title: '父分类',
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
        cateTree.value = [];
        axios.get("/category/all").then((response) => {
          loading.value = false;
          const data = response.data;
          if (data.success) {
            categorys.value = data.content;

            cateTree.value = [];
            cateTree.value = Tool.array2Tree(categorys.value,0);
          }else {
            message.error(data.message);
          }
        })
      };

      // 表单
      const category = ref({});
      const modalVisible = ref(false);
      const modalLoading = ref(false);
      const handleModalOk = () => {
        modalLoading.value = true;

        axios.post("/category/save",category.value).then((response) => {
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
        category.value = Tool.copy(record);
      }

      // 新增按钮
      const add = () => {
        modalVisible.value = true;
        category.value = {};
      }

      // 删除
      const handleDelete = (id: number) => {

        axios.delete("/category/delete/" + id).then((response) => {
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
        categorys,
        cateTree,
        columns,
        loading,

        edit,
        add,
        handleDelete,
        handleQuery,

        category,
        modalVisible,
        modalLoading,
        handleModalOk

      }
    }
  })



</script>