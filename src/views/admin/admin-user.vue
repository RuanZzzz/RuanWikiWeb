<template>
  <a-layout>
    <a-layout-content
        :style="{ background: '#fff', padding: '24px', margin: 0, minHeight: '280px' }"
    >
      <p>
        <a-form layout="inline" :model="param">
          <a-form-item>
            <a-input v-model:value="param.loginName" placeholder="登录名">
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
      <!-- 电子书表格 -->
      <a-table
          :columns = "columns"
          :row-key="record => record.id"
          :data-source="users"
          :pagination="pagination"
          :loading="loading"
          @change="handleTableChange"
      >
        <template v-slot:action="{text,record}">
          <a-space size="small">
            <a-button type="primary" @click="resetPassword(record)">
              重置密码
            </a-button>
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
      title="用户表单"
      :confirm-loading="modalLoading"
      @ok="handleModalOk"
  >
    <a-form :model="user" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
      <a-form-item label="登录名">
        <!-- 如果userid有值，就不允许修改登录名（仅用于编辑） -->
        <a-input v-model:value="user.loginName" :disabled="!!user.id" />
      </a-form-item>
      <a-form-item label="昵称">
        <a-input v-model:value="user.name" />
      </a-form-item>
      <a-form-item label="密码" v-show="!user.id" >
        <a-input v-model:value="user.password" />
      </a-form-item>
    </a-form>
  </a-modal>

  <a-modal
      v-model:visible="resetModalVisible"
      title="重置密码"
      :confirm-loading="resetModalLoading"
      @ok="handleResetModalOk"
  >
    <a-form :model="user" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
      <a-form-item label="新密码" >
        <a-input v-model:value="user.password" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts">
import {defineComponent, onMounted, ref} from "vue";
import axios from "axios";
import { message } from "ant-design-vue";
import {Tool} from "@/util/tool";
declare let hexMd5: any;
declare let KEY: any;

export default defineComponent({
  name: 'AdminUser',
  setup() {
    const param = ref();  // 用在搜索框的赋值
    param.value = {};   // 搜索框的对象，目前用到的属性是param.name
    const users = ref();
    const pagination = ref({
      current: 1,
      pageSize: 10,
      total: 0
    });
    const loading = ref(false);

    const columns = [
      {
        title: '登录名',
        dataIndex: 'loginName' // 这是后端返回来的key，对应的value
      },
      {
        title: '名称',
        dataIndex: 'name'
      },
      {
        title: '密码',
        dataIndex: 'password'
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
      // 如果不清空现有的数据，则可能导致编辑成功后回显旧数据
      users.value = [];
      axios.get("/user/list",{
        params: {
          page : params.page,
          pageSize : params.pageSize,
          loginName : param.value.loginName
        }
      }).then((response) => {
        loading.value = false;
        const data = response.data;
        if (data.success) {
          users.value = data.content.list;

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
    const user = ref({
      id: ref<string>(''),
      name: ref<string>(''),
      loginName: ref<string>(''),
      password: ref<string>('')
    });
    const modalVisible = ref(false);
    const modalLoading = ref(false);
    const handleModalOk = () => {
      modalLoading.value = true;

      axios.post("/user/save",{
        id : user.value.id,
        name : user.value.name,
        loginName : user.value.loginName,
        password : hexMd5(user.value.password + KEY)
      }).then((response) => {
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
      user.value = Tool.copy(record);
    }

    // 新增按钮
    const add = () => {
      modalVisible.value = true;
      user.value = {
        id: "",
        name: "",
        loginName: "",
        password: ""
      };
    }

    // 删除
    const handleDelete = (id: number) => {

      axios.delete("/user/delete/" + id).then((response) => {
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

    // 重置密码
    const resetModalVisible = ref(false);
    const resetModalLoading = ref(false);
    const handleResetModalOk = () => {
      resetModalLoading.value = true;

      axios.post("/user/reset-password",{
        id : user.value.id,
        name : user.value.name,
        loginName : user.value.loginName,
        password : hexMd5(user.value.password + KEY)
      }).then((response) => {
        resetModalLoading.value = false;
        const data = response.data;

        if (data.success) {
          resetModalVisible.value = false;

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

    // 重置密码按钮
    const resetPassword = (record: any) => {
      resetModalVisible.value = true;
      user.value = Tool.copy(record);
      user.value.password = "";
    }

    onMounted(() => {
      handleQuery({
        page : 1,
        pageSize : pagination.value.pageSize
      })
    });

    return {
      param,
      users,
      pagination,
      columns,
      loading,
      handleTableChange, // 因为html需要，所以需要返回
      handleQuery,

      edit,
      add,
      resetPassword,
      handleDelete,

      user,
      modalVisible,
      modalLoading,
      handleModalOk,

      resetModalVisible,
      resetModalLoading,
      handleResetModalOk
    }
  }
})

</script>

