<template>
  <a-layout>
    <a-layout-content
        :style="{ background: '#fff', padding: '24px', margin: 0, minHeight: '280px' }"
    >
      <a-row :gutter="24">
        <a-col :span="8">
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
              v-if="docTree.length > 0"
              :columns = "columns"
              :row-key="record => record.id"
              :data-source="docTree"
              :loading="loading"
              :pagination="false"
              size="small"
              :defaultExpandAllRows="true"
          >
            <template #name="{text,record}">
              {{record.sort}} {{text}}
            </template>
            <template v-slot:action="{text,record}">
              <a-space size="small">
                <a-button type="primary" @click="edit(record)" size="small">
                  编辑
                </a-button>
                <a-popconfirm
                    title="删除后不可恢复，确认删除？"
                    ok-text="是"
                    cancel-text="否"
                    @confirm="handleDelete(record.id)"
                    size="small"
                >
                  <a-button type="danger">
                    删除
                  </a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </a-table>
        </a-col>
        <a-col :span="16">
          <p>
            <a-form layout="inline" :modal="param">
              <a-form-item>
                <a-button type="primary" @click="handleSave()">
                  保存
                </a-button>
              </a-form-item>
            </a-form>
          </p>
          <a-form :model="doc" layout="vertical" >
            <a-form-item>
              <a-input v-model:value="doc.name" placeholder="名称" />
            </a-form-item>
            <a-form-item>
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
            <a-form-item>
              <a-input v-model:value="doc.sort" type="text" placeholder="顺序"/>
            </a-form-item>
            <a-form-item>
              <a-button type="primary" @click="handlePreviewContent">
                <EyeOutlined /> 内容预览
              </a-button>
            </a-form-item>
            <a-form-item>
              <div id="content"></div>
            </a-form-item>
          </a-form>
        </a-col>
      </a-row>

      <a-drawer width="900" placement="right" :closable="false" :visible="drawerVisible" @close="onDrawerClose">
        <div class="wangeditor" :innerHTML="previewHtml"></div>
      </a-drawer>

    </a-layout-content>
  </a-layout>

<!--  <a-modal-->
<!--      v-model:visible="modalVisible"-->
<!--      title="文档表单"-->
<!--      :confirm-loading="modalLoading"-->
<!--      @ok="handleModalOk"-->
<!--  >-->
<!--  </a-modal>-->
</template>

<script lang="ts">
import {defineComponent, onMounted, ref, createVNode} from "vue";
import axios from "axios";
import { message,Modal } from "ant-design-vue";
import {Tool} from "@/util/tool";
import {useRoute} from "vue-router";
import ExclamationCircleOutlined from "@ant-design/icons-vue/ExclamationCircleOutlined";
import E from 'wangeditor'
import hljs from 'highlight.js'

export default defineComponent({
  name: 'admin-category',
  setup() {
    // route获取路由的各种信息
    const route = useRoute();
    const param = ref();  // 用在搜索框的赋值
    param.value = {};   // 搜索框的对象，目前用到的属性是param.name

    const docs = ref();
    const loading = ref(false);
    const docTree = ref();
    docTree.value = [];
    // 因为树选择组件的属性状态，会随当前编辑的节点而变化，所以单独声明一个响应式变量
    const treeSelectData = ref();
    treeSelectData.value = [];

    // 初始化富文本
    let editor:any;
    const createEditor = () => {
      editor = new E('#content');
      editor.config.zIndex = 0;
      editor.highlight = hljs;
      editor.create();
    }

    const columns = [
      {
        title: '名称',
        dataIndex: 'name', // 这是后端返回来的key，对应的value
        slots: { customRender: 'name' }
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
      axios.get("/doc/all/" + route.query.ebookId).then((response) => {
        loading.value = false;
        const data = response.data;
        if (data.success) {
          docs.value = data.content;

          docTree.value = [];
          docTree.value = Tool.array2Tree(docs.value,0);

          // 父文档下拉框初始化，相当于之前点击新增
          treeSelectData.value = Tool.copy(docTree.value);
          // 为选择树添加一个”无“
          treeSelectData.value.unshift({id: '0', name: '无'});
        }else {
          message.error(data.message);
        }
      })
    };

    // 表单
    //const doc = ref({});
    const doc = ref();
    doc.value = {
      ebookId: route.query.ebookId
    };
    const modalVisible = ref(false);
    const modalLoading = ref(false);

    const handleSave = () => {
      modalLoading.value = true;
      doc.value.content =  editor.txt.html();
      axios.post("/doc/save",doc.value).then((response) => {
        modalLoading.value = false;
        const data = response.data;

        if (data.success) {
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

    // 组装需要删除的id
    const deleteIds: Array<string> = [];
    const deleteNames: Array<string> = [];
    const getDeleteIds = (treeSelectData: any, id: any) => {
      // console.log(treeSelectData, id);
      // 遍历数组，即遍历某一层节点
      for (let i = 0; i < treeSelectData.length; i++) {
        const node = treeSelectData[i];
        if (node.id === id) {
          // 将需要删除的id push进去ids中
          deleteIds.push(id);
          deleteNames.push(node.name);

          // 遍历所有子节点
          const children = node.children;
          if (Tool.isNotEmpty(children)) {
            for (let j = 0; j < children.length; j++) {
              getDeleteIds(children, children[j].id)
            }
          }
        } else {
          // 如果当前节点不是目标节点，则到其子节点再找找看。
          const children = node.children;
          if (Tool.isNotEmpty(children)) {
            getDeleteIds(children, id);
          }
        }
      }
    };

    // 内容查询
    const handleQueryContent = () => {
      axios.get("/doc/find-content/" + doc.value.id).then((response) => {
        const data = response.data;
        if (data.success) {
          editor.txt.html(data.content);
        }else {
          message.error(data.message);
        }
      })
    }

    // 编辑按钮
    const edit = (record: any) => {
      // 清空富文本框
      editor.txt.html("");
      doc.value = Tool.copy(record);
      handleQueryContent();

      // 不能选择当前节点及其所有子孙节点，作为父节点，会使树断开
      treeSelectData.value = Tool.copy(docTree.value);
      setDisable(treeSelectData.value, record.id);

      // 为选择树添加一个"无"
      treeSelectData.value.unshift({id: '0', name: '无'});
    }

    // 新增按钮
    const add = () => {
      // 清空富文本框
      editor.txt.html("");
      doc.value = {
        name : "",
        sort : "",
        ebookId: route.query.ebookId
      };

      treeSelectData.value = Tool.copy(docTree.value);

      // 为选择树添加一个"无"
      treeSelectData.value.unshift({id: '0', name: '无'});
    }

    // 删除
    const handleDelete = (id: number) => {
      // 清空数组，否则多次删除时，数组会一直增加
      deleteIds.length = 0;
      deleteNames.length = 0;
      getDeleteIds(docTree.value,id);
      Modal.confirm({
        title: '重要提醒',
        icon: createVNode(ExclamationCircleOutlined),
        content: '将删除: 【' + deleteNames.join(",") + '】删除后不可恢复，确认删除？',
        onOk() {
          axios.delete("/doc/delete/" + deleteIds.join(",")).then((response) => {
            const data = response.data;

            if (data.success) {
              message.success('删除成功');

              // 重新加载列表
              handleQuery();
            }
          });
        }
      })
    }

    // 富文本预览
    const drawerVisible = ref(false);
    const previewHtml = ref();
    const handlePreviewContent = () => {
      const html = editor.txt.html();
      previewHtml.value = html;
      drawerVisible.value = true;
    };
    const onDrawerClose = () => {
      drawerVisible.value = false;
    }

    onMounted(() => {
      handleQuery();
      createEditor();
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
      handleSave,

      treeSelectData,

      drawerVisible,
      previewHtml,
      handlePreviewContent,
      onDrawerClose

    }
  }
})



</script>