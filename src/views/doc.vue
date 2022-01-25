<template>
  <a-layout>
    <a-layout-content :style="{background: '#fff', padding: '24px', margin: 0, minHeight: '280px'}">
      <a-row>
        <a-col :span="6">
          <a-tree
            v-if="docTree.length > 0"
            :tree-data="docTree"
            @select="onSelect"
            :fieldNames="{title: 'name', key: 'id', value: 'id'}"
            :defaultExpandAll="true"
          >
          </a-tree>
        </a-col>
        <a-col :span="18">

        </a-col>
      </a-row>
    </a-layout-content>
  </a-layout>
</template>

<script lang="ts">
  import {defineComponent, onMounted, ref, createVNode} from "vue";
  import axios from "axios";
  import { message,Modal } from "ant-design-vue";
  import {Tool} from "@/util/tool";
  import {useRoute} from "vue-router";

  export default defineComponent({
    name: 'Doc',
    setup() {
      const route = useRoute();
      const docs = ref();
      const docTree = ref();
      docTree.value = [];

      /**
       * 数据查询
       */
      const handleQuery = () => {
        axios.get("/doc/all").then((response) => {
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

      onMounted(() => {
        handleQuery();
      });

      return {
        docTree
      }

    }


  })

</script>