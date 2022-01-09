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
          <img v-if="cover" :src="cover" alt="avatar" style="width: 100px;height: 100px">
<!--          <img style="height: 50px;width: 50px" src="../../../public/image/cover1.png" alt="avatar">-->
        </template>
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
      title="电子书表单"
      :confirm-loading="modalLoading"
      @ok="handleModalOk"
  >
    <a-form :model="ebook" :label-col="{ span: 6 }" >
      <a-form-item label="封面">
        <a-upload
            v-model:file-list="fileList"
            name="file"
            list-type="picture-card"
            class="avatar-uploader"
            :show-upload-list="false"
            action="http://127.0.0.1:8084/common/uploadImg"
            :before-upload="beforeUpload"
            @change="handleChange"
        >
          <img v-if="imageUrl" :src="imageUrl" alt="avatar" style="width: 130px;height: 130px"/>
          <div v-else>
            <loading-outlined v-if="loading"></loading-outlined>
            <plus-outlined v-else></plus-outlined>
            <div class="ant-upload-text">Upload</div>
          </div>
        </a-upload>

      </a-form-item>
      <a-form-item label="名称">
        <a-input v-model:value="ebook.name" />
      </a-form-item>
<!--      <a-form-item label="分类一">-->
<!--        <a-input v-model:value="ebook.category1Id" />-->
<!--      </a-form-item>-->
<!--      <a-form-item label="分类二">-->
<!--        <a-input v-model:value="ebook.category2Id" />-->
<!--      </a-form-item>-->
      <a-form-item label="描述">
        <a-input v-model:value="ebook.description" type="text"/>
      </a-form-item>

      <a-input v-model:value="imgDirPath" type="hidden" ></a-input>
    </a-form>

  </a-modal>
</template>

<script lang="ts">
  import {defineComponent, onMounted, ref} from "vue";
  import axios from "axios";
  import { message } from "ant-design-vue";
  import {Tool} from "@/util/tool";
  import type { UploadChangeParam, UploadProps } from 'ant-design-vue';

  function getBase64(img: Blob, callback: (base64Url: string) => void) {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result as string));
    reader.readAsDataURL(img);
  }

  export default defineComponent({
    name: 'admin-ebook',
    setup() {
      // 图片上传
      const fileList = ref([]);
      const imageUrl = ref<string>('');
      const imgDirPath = ref<string>('');

      const param = ref();  // 用在搜索框的赋值
      param.value = {};   // 搜索框的对象，目前用到的属性是param.name

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
        loading.value = true;
        axios.get("/ebook/list",{
          params: {
            page : params.page,
            pageSize : params.pageSize,
            name : param.value.name
          }
        }).then((response) => {
          loading.value = false;
          const data = response.data;
          if (data.success) {
            ebooks.value = data.content.list;

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
      const ebook = ref({
        id: ref<string>(''),
        name: ref<string>(''),
        description: ref<string>('')
      });
      const modalVisible = ref(false);
      const modalLoading = ref(false);
      const handleModalOk = () => {
        modalLoading.value = true;

        axios.post("/ebook/save",{
          id : ebook.value.id,
          name : ebook.value.name,
          description : ebook.value.description,
          imgDirPath : imgDirPath.value
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
        console.log(record);
        modalVisible.value = true;
        ebook.value = Tool.copy(record);

        // 如果有图片，就回显在编辑里和存储图片的地址中
        if (record.cover != null) {
          // 赋值，用于存储至数据库
          imgDirPath.value = record.imgName;
          // 用来回显
          imageUrl.value = record.cover;
        }
      }
      
      // 新增按钮
      const add = () => {
        modalVisible.value = true;
        imageUrl.value = "";
        ebook.value = {
          id: "",
          name: "",
          description: ""
        };
        imgDirPath.value = "";
        imageUrl.value = "";
      }

      // 删除
      const handleDelete = (id: number) => {

        axios.delete("/ebook/delete/" + id).then((response) => {
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

      // 上传图片
      const handleChange = (info: UploadChangeParam) => {
        if (info.file.status === 'uploading') {
          loading.value = true;
          return;
        }
        if (info.file.status === 'done') {
          message.success('upload success');
          // 赋值，用于存储至数据库
          imgDirPath.value = info.file.response.imgName;
          // 用来回显
          imageUrl.value = info.file.response.imgUrl;
          loading.value = false;

        }
        if (info.file.status === 'error') {
          loading.value = false;
          message.error('upload error');
        }
      };

      const beforeUpload = (file: any) => {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpgOrPng) {
          message.error('You can only upload JPG file!');
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
          message.error('Image must smaller than 2MB!');
        }
        return isJpgOrPng && isLt2M;
      };

      onMounted(() => {
        handleQuery({
          page: 1,
          pageSize: pagination.value.pageSize
        });
      });

      return {
        param,
        ebooks,
        pagination,
        columns,
        loading,
        handleTableChange, // 因为html需要，所以需要返回
        
        edit,
        add,
        handleDelete,
        handleQuery,
        
        ebook,
        modalVisible,
        modalLoading,
        handleModalOk,

        fileList,
        imageUrl,
        imgDirPath,
        handleChange,
        beforeUpload,
      }
    }
  })

</script>

<style>
.avatar-uploader > .ant-upload {
  width: 128px;
  height: 128px;
}
.ant-upload-select-picture-card i {
  font-size: 32px;
  color: #999;
}

.ant-upload-select-picture-card .ant-upload-text {
  margin-top: 8px;
  color: #666;
}
</style>