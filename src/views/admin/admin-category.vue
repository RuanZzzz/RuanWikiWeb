<template>
  <a-layout>
    <a-layout-content
        :style="{ background: '#fff', padding: '24px', margin: 0, minHeight: '280px' }"
    >
      <p>
        <a-form layout="inline" :model="param">
          <a-form-item>
            <a-input v-model:value="param.name" placeholder="名称">
            </a-input>
          </a-form-item>
          <a-form-item>
            <a-button type="primary" @click="handleQuery({page:1,pageSize: pagination.pageSize})">
              查询
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
          :data-source="categorys"
          :pagination="pagination"
          :loading="loading"
          @change="handleTableChange"
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
      <a-form-item label="顺序">
        <a-input v-model:value="category.sort" type="text"/>
      </a-form-item>
      <a-form-item label="父分类">
        <a-input v-model:value="category.parent" type="text"/>
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

      const categorys = ref();
      const pagination = ref({
        current: 1,
        pageSize: 10,
        total: 0
      });
      const loading = ref(false);

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
      const handleQuery = (params: any) => {
        loading.value = true;
        axios.get("/category/list",{
          params: {
            page : params.page,
            pageSize : params.pageSize,
            name : param.value.name
          }
        }).then((response) => {
          loading.value = false;
          const data = response.data;
          if (data.success) {
            categorys.value = data.content.list;

            // 重置分页按钮
            pagination.value.current = params.page;
            pagination.value.total = data.content.total;
          }else {
            message.error(data.message);
          }
        })
      };

      /**
       * 表格点击页码时触发
       */
      const handleTableChange = (pagination: any) => {
        handleQuery({
          page: pagination.current,
          pageSize: pagination.pageSize
        });
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
            handleQuery({
              page : pagination.value.current,
              pageSize : pagination.value.pageSize
            })
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
            handleQuery({
              page : pagination.value.current,
              pageSize : pagination.value.pageSize
            })
          }
        })

      }

      onMounted(() => {
        handleQuery({
          page: 1,
          pageSize: pagination.value.pageSize
        });
      });

      return {
        param,
        categorys,
        pagination,
        columns,
        loading,
        handleTableChange, // 因为html需要，所以需要返回

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