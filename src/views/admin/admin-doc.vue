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
      <a-form-item label="父文档">
        <a-tree-select
            v-model:value="doc.parent"
            style="width: 100%"
            :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
            :tree-data="treeSelectData"
            placeholder="请选择父文档"
            tree-default-expand-all
            :fieldNames="{label: 'name', key: 'id', value: 'id' }"
        >
        </a-tree-select>
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
import {useRoute} from "vue-router";

export default defineComponent({
  name: 'admin-category',
  setup() {
    // route获取路由的各种信息
    const route = useRoute();
    console.log("路由" + route.query.ebookId);
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
      docTree.value = [];
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
    // 因为树选择组件的属性状态，会随当前编辑的节点而变化，所以单独声明一个响应式变量
    const treeSelectData = ref();
    treeSelectData.value = [];
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

    /**
      * 将某节点及其子孙节点全部置为disabled
      */
    const setDisable = (treeSelectData: any, id: any) => {
        // console.log(treeSelectData, id);
        // 遍历数组，即遍历某一层节点
          for (let i = 0; i < treeSelectData.length; i++) {
            const node = treeSelectData[i];
            if (node.id === id) {
                // 如果当前节点就是目标节点
                console.log("disabled", node);
                // 将目标节点设置为disabled
                node.disabled = true;

                // 遍历所有子节点，将所有子节点全部都加上disabled
                const children = node.children;
                if (Tool.isNotEmpty(children)) {
                    for (let j = 0; j < children.length; j++) {
                        setDisable(children, children[j].id)
                    }
                }
              } else {
                // 如果当前节点不是目标节点，则到其子节点再找找看。
                const children = node.children;
                if (Tool.isNotEmpty(children)) {
                    setDisable(children, id);
                }
              }
          }
      };

    // 编辑按钮
    const edit = (record: any) => {
      modalVisible.value = true;
      doc.value = Tool.copy(record);

      // 不能选择当前节点及其所有子孙节点，作为父节点，会使树断开
      treeSelectData.value = Tool.copy(docTree.value);
      setDisable(treeSelectData.value, record.id);

      // 为选择树添加一个"无"
      treeSelectData.value.unshift({id: 0, name: '无'});
    }

    // 新增按钮
    const add = () => {
      modalVisible.value = true;
      doc.value = {
        ebookId: route.query.ebookId
      };

      treeSelectData.value = Tool.copy(docTree.value);

      // 为选择树添加一个"无"
      treeSelectData.value.unshift({id: 0, name: '无', value: 0});
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
      handleModalOk,

      treeSelectData

    }
  }
})



</script>