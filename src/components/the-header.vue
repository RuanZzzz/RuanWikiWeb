<template>
  <a-layout-header class="header">
    <div id="components-layout-demo-top-side-2">
      <div class="logo" />
    </div>
    <a-popconfirm
        title="是否确认退出登录？"
        ok-text="是"
        cancel-text="否"
        @confirm="logout()"
    >
      <a class="login-menu" v-show="user.userId">
        <span>退出登录</span>
      </a>
    </a-popconfirm>
    <a class="login-menu" v-show="user.userId">
      <span>您好：{{user.userName}}</span>
    </a>
    <a class="login-menu" @click="showLoginModal" v-show="!user.userId">
      <span>登录</span>
    </a>
    <a-menu
        theme="dark"
        mode="horizontal"
        :style="{ lineHeight: '64px' }"
    >
      <a-menu-item key="/">
        <router-link to="/">首页</router-link>
      </a-menu-item>
      <a-menu-item key="/admin/user" v-if="user.userId">
        <router-link to="/admin/user">用户管理</router-link>
      </a-menu-item>
      <a-menu-item key="/admin/ebook" v-if="user.userId">
        <router-link to="/admin/ebook">电子书管理</router-link>
      </a-menu-item>
      <a-menu-item key="/admin/category" v-if="user.userId">
        <router-link to="/admin/category">分类管理</router-link>
      </a-menu-item>
      <a-menu-item key="/about">
        <router-link to="/about">关于我们</router-link>
      </a-menu-item>
    </a-menu>

    <a-modal
        v-model:visible="loginModalVisible"
        title="登录"
        :confirm-loading="loginModalLoading"
        @ok="login"
    >
      <a-form :model="loginUser" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="登录名" >
          <a-input v-model:value="loginUser.loginName" />
        </a-form-item>
        <a-form-item label="密码" >
          <a-input v-model:value="loginUser.password" type="password" />
        </a-form-item>
      </a-form>
    </a-modal>

  </a-layout-header>
</template>

<script lang="ts">
import {computed, defineComponent, ref} from 'vue';
import axios from "axios";
import {message, notification} from "ant-design-vue";
import store from "@/store";
import router from "@/router";
import {Tool} from "@/util/tool";

declare let hexMd5: any;
declare let KEY: any;

export default defineComponent({
  name: 'the-header',
  setup () {
    // 登录
    const loginUser = ref({
      loginName: "ruanshaoxiang",
      password: "test123"
    })
    // 登录后的用户信息
    const user = computed(() => store.state.user);

    const loginModalVisible = ref(false);
    const loginModalLoading = ref(false);
    const showLoginModal = () => {
      loginModalVisible.value = true;
    };

    // 登录
    const login = () => {
      //console.log("登录");
      loginModalLoading.value = true;
      loginUser.value.password = hexMd5(loginUser.value.password + KEY);
      axios.post('/user/login', loginUser.value).then((response) => {
        loginModalLoading.value = false;
        const data = response.data;
        if (data.success) {
          loginModalVisible.value = false;
          message.success("登录成功！");
          store.commit("setUser",data.content);

          // 开始建立websocket连接
          if ('WebSocket' in window) {
            // 连接地址：ws://127.0.0.1:8084/ws/xxx
            websocket = new WebSocket(process.env.VUE_APP_WS_SERVER + '/ws/' + user.value.token);
            initWebSocket();

            // 关闭
            // websocket.close();
          }else {
            alert("当前浏览器 不支持");
          }
        }else {
          message.error(data.message);
        }
      })
    };

    // 退出登录
    const logout = () => {
      axios.get('/user/logout/' + user.value.token).then((response) => {
        const data = response.data;
        if (data.success) {
          message.success("退出登录成功！");
          store.commit("setUser",{});
          // 关闭
          websocket.close()
          router.push("/");
        }else {
          message.error(data.message);
        }
      })
    };

    // websocket连接（登录后才会建立连接）
    let websocket: any;

    const onOpen = () => {
      console.log('WebSocket连接成功，状态码：', websocket.readyState);
    };
    const onMessage = (event: any) => {
      console.log('WebSocket收到消息：', event.data);
      notification['success']({
        message:'收到消息',
        description:event.data
      })
    }
    const onError = () => {
      console.log('WebSocket连接错误，状态码：', websocket.readyState)
    };
    const onClose = () => {
      console.log('WebSocket连接关闭，状态码：', websocket.readyState)
    };
    const initWebSocket = () => {
      // 连接成功
      websocket.onopen = onOpen;
      // 收到消息的回调
      websocket.onmessage = onMessage;
      // 连接错误
      websocket.onerror = onError;
      // 连接关闭的回调
      websocket.onclose = onClose;
    }

    return {
      loginModalVisible,
      loginModalLoading,
      loginUser,
      showLoginModal,
      login,
      logout,
      user
    }

  }

});
</script>

<style >
  .login-menu {
    float: right;
    color: white;
    padding-left: 10px;
  }
</style>