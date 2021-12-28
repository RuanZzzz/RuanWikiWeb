<template>
  <a-layout>
    <a-layout-content
        :style="{ background: '#fff', padding: '24px', margin: 0, minHeight: '280px' }"
    >

      <!-- 电子书表格 -->
      <a-table
        :columns = "columns"
        :row-key="record => record.id"
        :data-source="ebooks"
        :pagination="pagination"
        :loading="loading"
        @change="handleTableChange"
      >
        <template #cover="{text:cover}">
          <!--<img v-if="cover" :src="cover" alt="avatar">-->
          <img style="height: 50px;width: 50px" src="../../../public/image/cover1.png" alt="avatar">
        </template>
        <template v-slot:action="{text,record}">
          <a-space size="small">
            <a-button type="primary">
              编辑
            </a-button>
            <a-button type="danger">
              删除
            </a-button>
          </a-space>
        </template>
      </a-table>

    </a-layout-content>
  </a-layout>
</template>

<script lang="ts">
  import {defineComponent, onMounted, ref} from "vue";
  import axios from "axios";

  export default defineComponent({
    name: 'admin-ebook',
    setup() {
      const ebooks = ref();
      const pagination = ref({
        current: 1,
        pageSize: 3,
        total: 0
      });
      const loading = ref(false);

      const columns = [
        {
          title : '封面',
          dataIndex: 'cover',
          slots: { customRender: 'cover' }
        },
        {
          title: '名称',
          dataIndex: 'name' // 这是后端返回来的key，对应的value
        },
        {
          title: '分类一',
          key: 'category1Id',
          dataIndex: 'category1Id'
        },
        {
          title: '分类二',
          dataIndex: 'category2Id'
        },
        {
          title: '文档数',
          dataIndex: 'docCount'
        },
        {
          title: '阅读数',
          dataIndex: 'viewCount'
        },
        {
          title: '点赞数',
          dataIndex: 'voteCount'
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
        console.log(params);
        loading.value = true;
        axios.get("/ebook/list",{
          params: {
            page : params.page,
            pageSize : params.pageSize
          }
        }).then((response) => {
          console.log(params);
          loading.value = false;
          const data = response.data;
          ebooks.value = data.content.list;

          // 重置分页按钮
          pagination.value.current = params.page;
          pagination.value.total = data.content.total;
        })
      };

      /**
       * 表格点击页码时触发
       */
      const handleTableChange = (pagination: any) => {
        console.log("自带分页参数" + pagination);
        handleQuery({
          page: pagination.current,
          pageSize: pagination.pageSize
        });
      };

      onMounted(() => {
        handleQuery({
          page: 1,
          pageSize: pagination.value.pageSize
        });
      });

      return {
        ebooks,
        pagination,
        columns,
        loading,
        handleTableChange // 因为html需要，所以需要返回
      }
    }
  })

</script>