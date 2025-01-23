import {createApp} from "vue";
// import {tokenKey} from "../commons/constants";
import 'element-plus/dist/index.css'
import DataManagementRouter from "./router/dataManagementRouter";
import UploadedDataManagement from "../pages/dataManagement/uploadedDataManagement.vue";
import DataManagement from "../pages/dataManagement.vue";

const app = createApp(UploadedDataManagement)
app.mount("#root")


