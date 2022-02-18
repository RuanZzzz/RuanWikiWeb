<template>
  <a-layout>
    <a-layout-sider width="200" style="background: #fff">
      <a-menu
          v-model:openKeys="openKeys"
          mode="inline"
          :style="{ height: '100%', borderRight: 0 }"
          @click="handleClick"
      >
        <a-menu-item key="welcome">
          <MailOutlined/>
          <span>欢迎</span>
        </a-menu-item>
        <a-sub-menu v-for="item in cateTree" :key="item.id">
          <template v-slot:title>
            <span><user-outlined />{{item.name}}</span>
          </template>
          <a-menu-item v-for="child in item.children" :key="child.id">
            <MailOutLined /><span>{{child.name}}</span>
          </a-menu-item>
        </a-sub-menu>
      </a-menu>
    </a-layout-sider>
    <a-layout-content
        :style="{ background: '#fff', padding: '24px', margin: 0, minHeight: '280px' }"
    >
      <div class="welcome" v-show="isShowWelcome">
        <h1>欢迎来到软烧香的wiki</h1>
      </div>
      <a-list v-show="!isShowWelcome" item-layout="vertical" size="large" :grid="{ gutter: 20,column: 3 }" :data-source="ebooks">
        <template #renderItem="{ item }">
          <a-list-item key="item.name">
            <template #actions>
              <span>
                <component v-bind:is="'FileOutlined'" style="margin-right: 8px" />
                {{ item.docCount  }}
              </span>
              <span>
                <component v-bind:is="'UserOutlined'" style="margin-right: 8px" />
                {{ item.viewCount  }}
              </span>
              <span>
                <component v-bind:is="'LikeOutlined'" style="margin-right: 8px" />
                {{ item.voteCount }}
              </span>
            </template>
            <a-list-item-meta :description="item.description">
              <template #title>
                <router-link :to="'/doc?ebookId=' + item.id" >
                  {{ item.name }}
                </router-link>
              </template>
              <template #avatar><a-avatar :src="item.cover" /></template>
            </a-list-item-meta>
          </a-list-item>
        </template>
      </a-list>

    </a-layout-content>
  </a-layout>
</template>

<script lang="ts">
import { defineComponent,onMounted,ref } from 'vue';
import axios from 'axios';
import {message} from "ant-design-vue";
import {Tool} from "@/util/tool";

const listData: Record<string, string>[] = [];

export default defineComponent({
  name: 'Home',
  setup() {

    // 让ebooks变成一个响应式的数据
    const ebooks = ref()
    // 用于显示欢迎还是电子书
    const isShowWelcome = ref(true);
    // 电子书分类2的id
    let categoryId2 = 0;

    const cateTree = ref();
    let categorys:any;

    const handleQueryCategory = () => {
      axios.get("/category/all").then((response) => {
        const data = response.data;
        if (data.success) {
          categorys = data.content;

          cateTree.value = [];
          cateTree.value = Tool.array2Tree(categorys,0);
        }else {
          message.error(data.message);
        }
      })
    };

    const handleQueryEbook = () => {
      axios.get("/ebook/list",{
        params: {
          page : 1,
          pageSize : 100,
          categoryId2 : categoryId2
        }
      }).then((response) => {
        const data = response.data;
        ebooks.value = data.content.list
      });
    };

    const handleClick = (value:any) => {
      if (value.key === 'welcome') {
        isShowWelcome.value = true;
      }else {
        categoryId2 = value.key;
        isShowWelcome.value = false;
        handleQueryEbook();
      }
      //isShowWelcome.value = value.key === 'welcome';
    };

    // 在onMounted里面就可以写一些初始化的逻辑
    onMounted(() => {
      handleQueryCategory();
      //handleQueryEbook();
    })

    // 在setup的方法最后要return出去，这样界面就可以拿到需要的变量
    return {
      ebooks,
      listData,
      pagination : {
        onChange : (page:any) => {
          //console.log(page);
        },
        pageSize: 3
      },
      // actions: [
      //   { type: 'StarOutlined', text: '156' },
      //   { type: 'LikeOutlined', text: '156' },
      //   { type: 'MessageOutlined', text: '2' },
      // ],

      handleClick,
      cateTree,

      isShowWelcome
    }
  }
});
</script>

<!-- scoped只在当前页面生效的样式 -->
<style scoped>
  .ant-avatar {
    width: 50px;
    height: 50px;
    line-height: 50px;
    border-radius: 8%;
    margin: 5px 0;
  }
</style>
